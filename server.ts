import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { Resend } from "resend";
import sharp from "sharp";
import { scrapeMakerWorldPage } from "./tools/makerworld_scraper.ts";
import { INITIAL_PRODUCTS } from "./src/data.ts";
import { uploadToR2, deleteFromR2 } from "./server/r2.ts";
import { calculateFloorPrice } from "./src/utils/pricingEngine.ts";
import { calculateKeychainSpecs } from "./src/utils/keychainCalculations.ts";

const execAsync = promisify(exec);

dotenv.config();

// ── Supabase Admin Client ──────────────────────────────────────────
// Uses the service_role key for server-side read/write of products & orders.
// The anon key (VITE_SUPABASE_ANON_KEY) is for the frontend only.
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";
const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const isSupabaseConfigured = supabaseAdmin !== null;
if (isSupabaseConfigured) {
  console.log("🗄️  Supabase admin client initialized (products & orders use PostgreSQL).");
} else {
  console.warn("⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_KEY not set — falling back to filesystem storage.");
}

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: "10mb" }));

// Protect private data directory from static/direct requests
app.use("/data", (req, res) => {
  res.status(404).send("Not Found");
});

// ── Admin API Key Authentication Middleware ──────────────────────────────
// Protects admin write endpoints. Clients must send x-admin-key header
// matching the ADMIN_SECRET_KEY environment variable.
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "";

// Warn on startup if the secret is still the default or empty
if (!ADMIN_SECRET_KEY) {
  console.warn("⚠️  ADMIN_SECRET_KEY is not set! Admin endpoints have no authentication.");
} else if (ADMIN_SECRET_KEY === "change-this-to-a-random-secret-key") {
  console.warn("⚠️  ADMIN_SECRET_KEY is still the default! Generate a strong random key.");
}

function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  // If no secret is configured, skip auth (dev/convenience mode)
  if (!ADMIN_SECRET_KEY) {
    next();
    return;
  }

  const providedKey = req.headers["x-admin-key"] as string | undefined;

  if (!providedKey) {
    res.status(401).json({ error: "Unauthorized. Missing x-admin-key header." });
    return;
  }

  if (providedKey !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Unauthorized. Invalid admin key." });
    return;
  }

  next();
}

// Lazy Gemini SDK client getter
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured or left as default in Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.post("/api/verify-admin-key", requireAdminAuth, (req, res) => {
  res.json({ success: true });
});

// GET /api/get-products — returns products from Supabase, falls back to seed data
app.get("/api/get-products", async (_req: express.Request, res: express.Response): Promise<void> => {
  try {
    // ── Supabase path ──
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin!
        .from("products")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw new Error(error.message);

      res.json(data || []);
      return;
    }

    // ── Fallback: filesystem ──
    const dbPath = path.join(process.cwd(), "data", "products.json");
    if (!fs.existsSync(dbPath)) {
      console.log("[Catalog] products.json not found — initializing from seed data.");
      await fs.promises.mkdir(path.dirname(dbPath), { recursive: true });
      const products = INITIAL_PRODUCTS.map((item: any) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        startingPrice: item.price,
        weightGrams: item.weightGrams || 0,
        filamentUsage: item.filamentUsage || 0,
        isPreOrder: item.isPreOrder || false,
        description: item.description || "",
        images: item.images || [],
        colors: item.colors || [],
        materials: item.materials || [],
        tags: item.tags || [],
        printTimeMinutes: item.printTimeMinutes || 0,
        rating: item.rating || 5.0,
        reviewCount: item.reviewsCount || 0,
        reviews: item.reviews || [],
        makerWorldUrl: item.makerWorldUrl || "",
        featured_carousel: item.featured_carousel || false,
        carousel_order: item.carousel_order || 0,
        resin_enabled: item.resin_enabled || false,
        resin_price: item.resin_price !== undefined && item.resin_price !== null ? (typeof item.resin_price === 'number' ? item.resin_price : parseFloat(item.resin_price) || 0) : null,
        specifications: {
          dimensions: item.dimensions || "",
          layerHeight: "0.16mm",
          infill: "15% Gyroid"
        }
      }));
      await fs.promises.writeFile(dbPath, JSON.stringify(products, null, 2), "utf-8");
      res.json(products);
      return;
    }
    const raw = await fs.promises.readFile(dbPath, "utf-8");
    res.json(JSON.parse(raw));
  } catch (err: any) {
    console.error("Failed to read products:", err);
    res.status(500).json({ error: "Failed to read product database: " + err.message });
  }
});

// GET /api/get-categories — returns categories list from Supabase
app.get("/api/get-categories", async (_req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin!
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);
      res.json(data || []);
      return;
    }

    // Local fallback: read from categories.json
    const dbPath = path.join(process.cwd(), "data", "categories.json");
    try {
      const raw = await fs.promises.readFile(dbPath, "utf-8");
      res.json(JSON.parse(raw));
    } catch (e) {
      const fallbackCategories = [
        { name: "Keychains", parent_group: "Accessories & Merch" },
        { name: "Home Decor", parent_group: "Art & Sculptures" },
        { name: "Desk Accessories", parent_group: "Desk & Organisation" },
        { name: "Gaming Accessories", parent_group: "Gaming & Spares" },
        { name: "Figures & Collectibles", parent_group: "Art & Sculptures" },
        { name: "Business Merchandise", parent_group: "Accessories & Merch" },
        { name: "Custom Orders", parent_group: "Custom & Other" },
        { name: "Functional Prints", parent_group: "Desk & Organisation" },
        { name: "3D Printers & Spares", parent_group: "Gaming & Spares" },
        { name: "Exotic Filaments", parent_group: "Custom & Other" },
        { name: "Premium Hardware", parent_group: "Custom & Other" },
        { name: "Imported Goods", parent_group: "Custom & Other" },
        { name: "A1 Mini Mods", parent_group: "Custom & Other" },
        { name: "Hotends", parent_group: "Custom & Other" }
      ];
      await fs.promises.writeFile(dbPath, JSON.stringify(fallbackCategories, null, 2), "utf-8");
      res.json(fallbackCategories);
    }
  } catch (err: any) {
    console.error("Failed to read categories:", err);
    res.status(500).json({ error: "Failed to read categories: " + err.message });
  }
});

// Save catalog database with validation check
app.post("/api/save-products", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const products = req.body;
    if (!Array.isArray(products)) {
      res.status(400).json({ error: "Invalid payload. Expected an array of products." });
      return;
    }

    // ── Supabase path: upsert all products ──
    if (isSupabaseConfigured) {
      // Extract unique categories from payload and insert any that don't exist yet
      try {
        const uniqueCategories = Array.from(new Set(
          products
            .map((item: any) => item.category)
            .filter((cat: any): cat is string => typeof cat === "string" && cat.trim().length > 0)
        ));

        if (isSupabaseConfigured) {
          for (const catName of uniqueCategories) {
            const { data: existingCat } = await supabaseAdmin!
              .from("categories")
              .select("id")
              .eq("name", catName)
              .maybeSingle();

            if (!existingCat) {
              let parent_group = "Custom & Other"; // fallback parent group
              if (["Keychains", "Business Merchandise"].includes(catName)) parent_group = "Accessories & Merch";
              else if (["Home Decor", "Figures & Collectibles"].includes(catName)) parent_group = "Art & Sculptures";
              else if (["Desk Accessories", "Functional Prints"].includes(catName)) parent_group = "Desk & Organisation";
              else if (["Gaming Accessories", "3D Printers & Spares"].includes(catName)) parent_group = "Gaming & Spares";

              console.log(`[Categories] Auto-creating missing category: "${catName}" under group "${parent_group}"`);
              await supabaseAdmin!
                .from("categories")
                .insert({ name: catName, parent_group });
            }
          }
        } else {
          const catDbPath = path.join(process.cwd(), "data", "categories.json");
          let currentCategories = [];
          try {
            const raw = await fs.promises.readFile(catDbPath, "utf-8");
            currentCategories = JSON.parse(raw);
          } catch (e) {
            currentCategories = [
              { name: "Keychains", parent_group: "Accessories & Merch" },
              { name: "Home Decor", parent_group: "Art & Sculptures" },
              { name: "Desk Accessories", parent_group: "Desk & Organisation" },
              { name: "Gaming Accessories", parent_group: "Gaming & Spares" },
              { name: "Figures & Collectibles", parent_group: "Art & Sculptures" },
              { name: "Business Merchandise", parent_group: "Accessories & Merch" },
              { name: "Custom Orders", parent_group: "Custom & Other" },
              { name: "Functional Prints", parent_group: "Desk & Organisation" },
              { name: "3D Printers & Spares", parent_group: "Gaming & Spares" },
              { name: "Exotic Filaments", parent_group: "Custom & Other" },
              { name: "Premium Hardware", parent_group: "Custom & Other" },
              { name: "Imported Goods", parent_group: "Custom & Other" },
              { name: "A1 Mini Mods", parent_group: "Custom & Other" },
              { name: "Hotends", parent_group: "Custom & Other" }
            ];
          }

          let updatedAny = false;
          for (const catName of uniqueCategories) {
            const exists = currentCategories.some((c: any) => c.name.toLowerCase() === catName.toLowerCase());
            if (!exists) {
              let parent_group = "Custom & Other";
              if (["Keychains", "Business Merchandise"].includes(catName)) parent_group = "Accessories & Merch";
              else if (["Home Decor", "Figures & Collectibles"].includes(catName)) parent_group = "Art & Sculptures";
              else if (["Desk Accessories", "Functional Prints"].includes(catName)) parent_group = "Desk & Organisation";
              else if (["Gaming Accessories", "3D Printers & Spares"].includes(catName)) parent_group = "Gaming & Spares";

              currentCategories.push({ name: catName, parent_group });
              updatedAny = true;
            }
          }
          if (updatedAny) {
            await fs.promises.writeFile(catDbPath, JSON.stringify(currentCategories, null, 2), "utf-8");
          }
        }
      } catch (catErr: any) {
        console.error("[Categories] Failed to auto-sync categories during product save:", catErr.message);
      }

      const rows = products.map((item: any) => {
        let printTimeMinutes = 0;
        if (item.printTime && typeof item.printTime === 'string') {
          const hMatch = item.printTime.match(/(\d+)\s*h/);
          const mMatch = item.printTime.match(/(\d+)\s*m/);
          const h = hMatch ? parseInt(hMatch[1]) : 0;
          const m = mMatch ? parseInt(mMatch[1]) : 0;
          printTimeMinutes = h * 60 + m;
        } else if (typeof item.printTimeMinutes === 'number') {
          printTimeMinutes = item.printTimeMinutes;
        }

        const images = Array.isArray(item.images)
          ? item.images.map((img: string) => { if (img.startsWith("/")) return img.substring(1); return img; })
          : [];

        return {
          id: item.id,
          title: item.title,
          description: item.description || "",
          category: item.category,
          startingPrice: item.price ?? item.startingPrice ?? 0,
          weightGrams: item.weightGrams || 0,
          filamentUsage: item.filamentUsage || parseFloat((item.weightGrams * 0.75).toFixed(1)) || 0,
          isPreOrder: item.isPreOrder || false,
          stockQuantity: item.stockQuantity !== undefined && item.stockQuantity !== null ? item.stockQuantity : -1,
          images: JSON.stringify(images),
          colors: JSON.stringify(item.colors || []),
          materials: JSON.stringify(item.materials || []),
          tags: JSON.stringify(item.tags || []),
          printTimeMinutes,
          rating: item.rating || 5.0,
          reviewCount: item.reviewCount ?? item.reviewsCount ?? 0,
          reviews: JSON.stringify(item.reviews || []),
          makerWorldUrl: item.makerWorldUrl || "",
          specifications: JSON.stringify({
            dimensions: item.dimensions || "",
            layerHeight: item.layerHeight || "0.16mm",
            infill: item.infill || "15% Gyroid"
          }),
          featured_carousel: item.featured_carousel || false,
          carousel_order: typeof item.carousel_order === 'number' ? item.carousel_order : parseInt(item.carousel_order) || 0,
          resin_enabled: item.resin_enabled || false,
          resin_price: item.resin_price !== undefined && item.resin_price !== null ? (typeof item.resin_price === 'number' ? item.resin_price : parseFloat(item.resin_price) || 0) : null,
          updated_at: new Date().toISOString()
        };
      });

      // Upsert: insert or replace on conflict by id
      const { error: upsertError } = await supabaseAdmin!
        .from("products")
        .upsert(rows, { onConflict: "id" });

      if (upsertError) throw new Error(upsertError.message);

      res.json({ success: true, message: `Catalog saved (${rows.length} products upserted to Supabase).` });
      return;
    }

    // ── Fallback: filesystem ──
    const dbPath = path.join(process.cwd(), "data", "products.json");
    const backupPath = path.join(process.cwd(), "data", "products.json.bak");

    if (fs.existsSync(dbPath)) {
      await fs.promises.copyFile(dbPath, backupPath);
    }

    const dbFormattedProducts = products.map((item: any) => {
      let printTimeMinutes = 0;
      if (item.printTime && typeof item.printTime === 'string') {
        const hMatch = item.printTime.match(/(\d+)\s*h/);
        const mMatch = item.printTime.match(/(\d+)\s*m/);
        const h = hMatch ? parseInt(hMatch[1]) : 0;
        const m = mMatch ? parseInt(mMatch[1]) : 0;
        printTimeMinutes = h * 60 + m;
      } else if (typeof item.printTimeMinutes === 'number') {
        printTimeMinutes = item.printTimeMinutes;
      }

      const images = Array.isArray(item.images)
        ? item.images.map((img: string) => { if (img.startsWith("/")) return img.substring(1); return img; })
        : [];

      return {
        id: item.id,
        title: item.title,
        category: item.category,
        startingPrice: item.price,
        weightGrams: item.weightGrams || 0,
        filamentUsage: item.filamentUsage || parseFloat((item.weightGrams * 0.75).toFixed(1)) || 0,
        isPreOrder: item.isPreOrder || false,
        description: item.description || "",
        images,
        colors: item.colors || [],
        materials: item.materials || [],
        tags: item.tags || [],
        printTimeMinutes,
        rating: item.rating || 5.0,
        reviewCount: item.reviewsCount || 0,
        reviews: item.reviews || [],
        makerWorldUrl: item.makerWorldUrl || "",
        featured_carousel: item.featured_carousel || false,
        carousel_order: typeof item.carousel_order === 'number' ? item.carousel_order : parseInt(item.carousel_order) || 0,
        resin_enabled: item.resin_enabled || false,
        resin_price: item.resin_price !== undefined && item.resin_price !== null ? (typeof item.resin_price === 'number' ? item.resin_price : parseFloat(item.resin_price) || 0) : null,
        specifications: {
          dimensions: item.dimensions || "",
          layerHeight: item.layerHeight || "0.16mm",
          infill: item.infill || "15% Gyroid"
        }
      };
    });

    await fs.promises.writeFile(dbPath, JSON.stringify(dbFormattedProducts, null, 2), "utf-8");

    try {
      await execAsync("python tools/validate_catalog.py");
      res.json({ success: true, message: "Catalog saved and validated successfully." });
    } catch (valError: any) {
      console.error("Catalog validation failed, rolling back:", valError.stdout || valError.message);
      if (fs.existsSync(backupPath)) {
        await fs.promises.copyFile(backupPath, dbPath);
      }
      res.status(400).json({
        success: false,
        error: "Validation failed: " + (valError.stdout || valError.message || "Invalid schema structure.")
      });
    }
  } catch (err: any) {
    console.error("Save catalog error:", err);
    res.status(500).json({ error: "Failed to save catalog: " + err.message });
  }
});

// CREATE category endpoint
app.post("/api/admin/create-category", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { name, parent_group } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Category name is required" });
      return;
    }
    const cleanName = name.trim();
    const resolvedParentGroup = parent_group && typeof parent_group === "string" ? parent_group.trim() : "Custom & Other";

    if (isSupabaseConfigured) {
      const { data: existing } = await supabaseAdmin!
        .from("categories")
        .select("id, name")
        .eq("name", cleanName)
        .maybeSingle();

      if (existing) {
        res.json({ success: true, category: existing, message: "Category already exists" });
        return;
      }

      const { data, error } = await supabaseAdmin!
        .from("categories")
        .insert({ name: cleanName, parent_group: resolvedParentGroup })
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json({ success: true, category: data });
      return;
    }

    // Local fallback: read data/categories.json, add if missing, and save
    const dbPath = path.join(process.cwd(), "data", "categories.json");
    let currentCategories = [];
    try {
      const raw = await fs.promises.readFile(dbPath, "utf-8");
      currentCategories = JSON.parse(raw);
    } catch (e) {
      currentCategories = [
        { name: "Keychains", parent_group: "Accessories & Merch" },
        { name: "Home Decor", parent_group: "Art & Sculptures" },
        { name: "Desk Accessories", parent_group: "Desk & Organisation" },
        { name: "Gaming Accessories", parent_group: "Gaming & Spares" },
        { name: "Figures & Collectibles", parent_group: "Art & Sculptures" },
        { name: "Business Merchandise", parent_group: "Accessories & Merch" },
        { name: "Custom Orders", parent_group: "Custom & Other" },
        { name: "Functional Prints", parent_group: "Desk & Organisation" },
        { name: "3D Printers & Spares", parent_group: "Gaming & Spares" },
        { name: "Exotic Filaments", parent_group: "Custom & Other" },
        { name: "Premium Hardware", parent_group: "Custom & Other" },
        { name: "Imported Goods", parent_group: "Custom & Other" },
        { name: "A1 Mini Mods", parent_group: "Custom & Other" },
        { name: "Hotends", parent_group: "Custom & Other" }
      ];
    }

    const exists = currentCategories.some((c: any) => c.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      const match = currentCategories.find((c: any) => c.name.toLowerCase() === cleanName.toLowerCase());
      res.json({ success: true, category: match, message: "Category already exists" });
      return;
    }

    const newCat = { name: cleanName, parent_group: resolvedParentGroup };
    currentCategories.push(newCat);
    await fs.promises.writeFile(dbPath, JSON.stringify(currentCategories, null, 2), "utf-8");
    res.json({ success: true, category: newCat });
  } catch (err: any) {
    console.error("Failed to create category:", err);
    res.status(500).json({ error: "Failed to create category: " + err.message });
  }
});

// DELETE single product and its associated R2 images
app.delete("/api/products/:id", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  const { id } = req.params;
  try {
    console.log(`[Delete] Received request to delete product: ${id}`);
    
    // 1. Fetch images from Supabase to clean up R2, and verify product exists
    if (isSupabaseConfigured) {
      try {
        const { data: product, error: fetchError } = await supabaseAdmin!
          .from("products")
          .select("images")
          .eq("id", id)
          .single();

        if (fetchError) {
          if (fetchError.code === "PGRST116") {
            // Product not found in Supabase — return 404
            console.warn(`[Delete] Product ${id} not found in Supabase.`);
            res.status(404).json({ error: `Product ${id} not found.` });
            return;
          }
          // Other fetch errors — log but proceed with deletion attempt
          console.warn(`[Delete] Failed to fetch product ${id} images from Supabase (proceeding with delete):`, fetchError.message);
        } else if (product) {
          let imagesArray: string[] = [];
          if (typeof product.images === "string") {
            try {
              imagesArray = JSON.parse(product.images);
            } catch (e) {
              imagesArray = [];
            }
          } else if (Array.isArray(product.images)) {
            imagesArray = product.images;
          }

          console.log(`[Delete] Found ${imagesArray.length} image(s) for product ${id}`);
          for (const url of imagesArray) {
            if (url && (url.includes("r2.dev") || url.includes("cloudflarestorage.com") || url.startsWith("http"))) {
              const filename = url.substring(url.lastIndexOf("/") + 1);
              const key = `images/products/${filename}`;
              try {
                console.log(`[Delete] Deleting R2 object: ${key}`);
                await deleteFromR2(key);
              } catch (r2Err: any) {
                console.error(`[Delete] Failed to delete image ${key} from R2 (continuing deletion):`, r2Err.message);
              }
            }
          }
        }
      } catch (dbErr: any) {
        console.error(`[Delete] Error during R2 cleanup precheck:`, dbErr.message);
      }

      // Delete the product row from Supabase
      const { error: deleteError } = await supabaseAdmin!
        .from("products")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw new Error(`Supabase deletion failed: ${deleteError.message}`);
      }
      console.log(`[Delete] Deleted product ${id} from Supabase.`);
    }

    // 2. Fallback / Sync: Remove from local products.json file if it exists
    const dbPath = path.join(process.cwd(), "data", "products.json");
    if (fs.existsSync(dbPath)) {
      try {
        const raw = await fs.promises.readFile(dbPath, "utf-8");
        const products: any[] = JSON.parse(raw);
        
        // If Supabase was not configured, we do the R2 cleanup based on products.json images
        if (!isSupabaseConfigured) {
          const product = products.find((p) => p.id === id);
          if (product && Array.isArray(product.images)) {
            console.log(`[Delete] Fallback: Found ${product.images.length} image(s) for product ${id}`);
            for (const url of product.images) {
              if (url && (url.includes("r2.dev") || url.includes("cloudflarestorage.com") || url.startsWith("http"))) {
                const filename = url.substring(url.lastIndexOf("/") + 1);
                const key = `images/products/${filename}`;
                try {
                  console.log(`[Delete] Fallback R2 delete: ${key}`);
                  await deleteFromR2(key);
                } catch (r2Err: any) {
                  console.error(`[Delete] Fallback: Failed to delete image ${key} from R2:`, r2Err.message);
                }
              }
            }
          }
        }

        const filtered = products.filter((p) => p.id !== id);
        await fs.promises.writeFile(dbPath, JSON.stringify(filtered, null, 2), "utf-8");
        console.log(`[Delete] Removed product ${id} from products.json`);
      } catch (e: any) {
        console.error("[Delete] Failed to update products.json:", e.message);
      }
    }

    res.json({ success: true, message: `Product ${id} and associated images deleted.` });
  } catch (err: any) {
    console.error("Delete product error:", err);
    res.status(500).json({ error: "Failed to delete product: " + err.message });
  }
});

// Upload dynamic image base64 directly to server public assets
app.post("/api/upload-image", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { fileName, base64Data, directory } = req.body;
    if (!fileName || !base64Data) {
      res.status(400).json({ error: "Missing filename or base64 data." });
      return;
    }

    // ── MIME type validation ──
    const ALLOWED_MIME_PREFIXES = ["data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,", "data:image/gif;base64,"];
    const hasValidPrefix = ALLOWED_MIME_PREFIXES.some((prefix) => base64Data.startsWith(prefix));
    if (!hasValidPrefix) {
      const allowedList = ALLOWED_MIME_PREFIXES.map((p) => p.replace(";base64,", "")).join(", ");
      res.status(400).json({ error: `Invalid image format. Allowed: ${allowedList}` });
      return;
    }

    // Extract base64 content
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");

    // ── File size validation (5 MB limit) ──
    const decodedLength = Buffer.byteLength(base64Content, "base64");
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    if (decodedLength > MAX_SIZE_BYTES) {
      const sizeMB = (decodedLength / (1024 * 1024)).toFixed(2);
      res.status(400).json({ error: `Image too large (${sizeMB} MB). Maximum is 5 MB.` });
      return;
    }

    const buffer = Buffer.from(base64Content, "base64");
    const originalSize = buffer.length;

    // Sanitize filename to prevent directory traversal
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();

    const targetSubDir = directory === "payments" ? "payments" : "products";
    const key = `images/${targetSubDir}/${cleanFileName}`;

    // Determine content type from base64 prefix
    let contentType = "image/png";
    if (base64Data.startsWith("data:image/jpeg;base64,")) {
      contentType = "image/jpeg";
    } else if (base64Data.startsWith("data:image/webp;base64,")) {
      contentType = "image/webp";
    } else if (base64Data.startsWith("data:image/gif;base64,")) {
      contentType = "image/gif";
    }

    // ── Image compression via sharp (skip GIFs to preserve animation) ──
    let finalBuffer = buffer;
    if (contentType !== "image/gif") {
      try {
        const image = sharp(buffer);
        const metadata = await image.metadata();
        let pipeline = image;
        if (metadata.width && metadata.width > 1200) {
          pipeline = pipeline.resize({ width: 1200, withoutEnlargement: true });
        }
        if (contentType === "image/png") {
          finalBuffer = await pipeline.png({ quality: 80, compressionLevel: 9 }).toBuffer();
        } else if (contentType === "image/jpeg") {
          finalBuffer = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
        } else {
          finalBuffer = await pipeline.webp({ quality: 80 }).toBuffer();
          contentType = "image/webp";
        }
        const saving = (((originalSize - finalBuffer.length) / originalSize) * 100).toFixed(1);
        console.log(`[Upload] Compressed ${cleanFileName}: ${originalSize} → ${finalBuffer.length} bytes (${saving}% saved)`);
      } catch (compressErr: any) {
        console.warn(`[Upload] Compression failed for ${cleanFileName}, uploading original:`, compressErr.message);
        finalBuffer = buffer;
      }
    } else {
      console.log(`[Upload] GIF detected — skipping compression: ${cleanFileName} (${originalSize} bytes)`);
    }

    const publicUrl = await uploadToR2(finalBuffer, key, contentType);

    res.json({ success: true, imagePath: publicUrl });
  } catch (err: any) {
    console.error("Image upload error:", err);
    res.status(500).json({ error: "Failed to save image: " + err.message });
  }
});

// GET orders database
app.get("/api/get-orders", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    // ── Supabase path ──
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin!
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      res.json(data || []);
      return;
    }

    // ── Fallback: filesystem ──
    const dbPath = path.join(process.cwd(), "data", "orders.json");
    if (!fs.existsSync(dbPath)) {
      await fs.promises.writeFile(dbPath, "[]", "utf-8");
      res.json([]);
      return;
    }
    const data = await fs.promises.readFile(dbPath, "utf-8");
    res.json(JSON.parse(data));
  } catch (err: any) {
    console.error("Get orders error:", err);
    res.status(500).json({ error: "Failed to get orders: " + err.message });
  }
});

// ── Analytics Endpoint ───────────────────────────────────────────────
app.get("/api/get-analytics", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    let orders: any[] = [];

    // ── Supabase path ──
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin!
        .from("orders")
        .select("*");

      if (error) throw new Error(error.message);
      orders = data || [];
    } else {
      // ── Fallback: filesystem ──
      const dbPath = path.join(process.cwd(), "data", "orders.json");
      if (!fs.existsSync(dbPath)) {
        res.json({
          totalRevenue: 0,
          revenueByMonth: [],
          topProducts: [],
          ordersByStatus: { Pending: 0, "Pending Verification": 0, Processing: 0, Shipped: 0, Completed: 0 },
          totalOrders: 0,
        });
        return;
      }
      const raw = await fs.promises.readFile(dbPath, "utf-8");
      orders = JSON.parse(raw);
    }

    // ── Total revenue (only Completed = fulfilled) ──
    let totalRevenue = 0;
    for (const o of orders) {
      if (o.status === 'Completed' || o.status === 'Shipped') {
        totalRevenue += o.totalCost || 0;
      }
    }

    // ── Revenue by month (last 6 months) ──
    const now = new Date();
    const monthMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = 0;
    }
    for (const o of orders) {
      if ((o.status === 'Completed' || o.status === 'Shipped') && o.createdAt) {
        const d = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key in monthMap) {
          monthMap[key] += o.totalCost || 0;
        }
      }
    }
    const revenueByMonth = Object.entries(monthMap).map(([month, revenue]) => ({ month, revenue }));

    // ── Top 5 products by order count ──
    const productCount: Record<string, { title: string; count: number; revenue: number }> = {};
    for (const o of orders) {
      if (o.items && Array.isArray(o.items)) {
        for (const item of o.items) {
          const pid = item.product?.id || 'unknown';
          if (!productCount[pid]) {
            productCount[pid] = { title: item.product?.title || `Product ${pid}`, count: 0, revenue: 0 };
          }
          productCount[pid].count += item.quantity || 1;
          productCount[pid].revenue += (item.calculatedPrice ?? item.product?.price ?? 0) * (item.quantity || 1);
        }
      }
    }
    const topProducts = Object.entries(productCount)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ── Orders by status ──
    const ordersByStatus: Record<string, number> = {
      Pending: 0,
      "Pending Verification": 0,
      Processing: 0,
      Shipped: 0,
      Completed: 0,
    };
    for (const o of orders) {
      const s = o.status || 'Pending';
      ordersByStatus[s] = (ordersByStatus[s] || 0) + 1;
    }

    res.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      revenueByMonth,
      topProducts,
      ordersByStatus,
      totalOrders: orders.length,
    });
  } catch (err: any) {
    console.error("Get analytics error:", err);
    res.status(500).json({ error: "Failed to get analytics: " + err.message });
  }
});

// ── Settings Persistence ─────────────────────────────────────────────

const SETTINGS_DEFAULTS = {
  bkashNumber: "01712511193",
  nagadNumber: "01712511193",
  storeName: "Belvia 3D Precision Labs",
  alertEmail: "",
  currency: "BDT",
  accentColor: "#f97316",
  default_target_margin: "50",
  electricity_cost_per_hour: "3",
  depreciation_cost_per_hour: "20",
  packaging_cost_flat: "40",
  platform_fee_percent: "3"
};

function getSettingsPath(): string {
  return path.join(process.cwd(), "data", "settings.json");
}

async function loadSettings(): Promise<Record<string, string>> {
  const sp = getSettingsPath();
  if (!fs.existsSync(sp)) {
    await fs.promises.writeFile(sp, JSON.stringify(SETTINGS_DEFAULTS, null, 2), "utf-8");
    return { ...SETTINGS_DEFAULTS };
  }
  const raw = await fs.promises.readFile(sp, "utf-8");
  return { ...SETTINGS_DEFAULTS, ...JSON.parse(raw) };
}

// Public — CartDrawer reads payment numbers from here
app.get("/api/get-settings", async (_req: express.Request, res: express.Response): Promise<void> => {
  try {
    const settings = await loadSettings();
    res.json({ success: true, settings });
  } catch (err: any) {
    console.error("Get settings error:", err);
    res.status(500).json({ error: "Failed to get settings: " + err.message });
  }
});

// Admin-protected — SellerHub writes settings here
app.post("/api/save-settings", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== "object") {
      res.status(400).json({ error: "Invalid payload. Expected a settings object." });
      return;
    }

    const current = await loadSettings();
    const merged = { ...current, ...incoming };

    // Validate phone number length
    for (const key of ["bkashNumber", "nagadNumber"]) {
      if (merged[key] && typeof merged[key] === "string" && merged[key].replace(/[-\s]/g, "").length < 10) {
        res.status(400).json({ error: `${key} looks too short. Enter a valid 11-digit phone number.` });
        return;
      }
    }

    const sp = getSettingsPath();
    await fs.promises.writeFile(sp, JSON.stringify(merged, null, 2), "utf-8");
    res.json({ success: true, message: "Settings saved successfully.", settings: merged });
  } catch (err: any) {
    console.error("Save settings error:", err);
    res.status(500).json({ error: "Failed to save settings: " + err.message });
  }
});

// ── SMART PRICING & INVENTORY API ENDPOINTS ─────────────────────────

function getFilamentsPath() {
  return path.join(process.cwd(), "data", "filaments.json");
}
function getAccessoriesPath() {
  return path.join(process.cwd(), "data", "accessories.json");
}

async function loadFilaments(): Promise<any[]> {
  const fp = getFilamentsPath();
  if (!fs.existsSync(fp)) {
    await fs.promises.mkdir(path.dirname(fp), { recursive: true });
    await fs.promises.writeFile(fp, "[]", "utf-8");
    return [];
  }
  const raw = await fs.promises.readFile(fp, "utf-8");
  try {
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

async function saveFilaments(data: any[]) {
  const fp = getFilamentsPath();
  await fs.promises.writeFile(fp, JSON.stringify(data, null, 2), "utf-8");
}

async function loadAccessoriesFallback(): Promise<any[]> {
  const fp = getAccessoriesPath();
  if (!fs.existsSync(fp)) {
    await fs.promises.mkdir(path.dirname(fp), { recursive: true });
    const seed = [
      { id: "acc-1", name: "Keychain Ring", unit: "piece", cost_per_unit_bdt: 10, stock_count: 100 },
      { id: "acc-2", name: "UV Resin", unit: "gram", cost_per_unit_bdt: 10, stock_count: 200 },
      { id: "acc-3", name: "Packaging Box Small", unit: "piece", cost_per_unit_bdt: 30, stock_count: 50 },
      { id: "acc-4", name: "Packaging Box Large", unit: "piece", cost_per_unit_bdt: 50, stock_count: 20 }
    ];
    await fs.promises.writeFile(fp, JSON.stringify(seed, null, 2), "utf-8");
    return seed;
  }
  const raw = await fs.promises.readFile(fp, "utf-8");
  try {
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

async function saveAccessoriesFallback(data: any[]) {
  const fp = getAccessoriesPath();
  await fs.promises.writeFile(fp, JSON.stringify(data, null, 2), "utf-8");
}

// Scoped Recalculation Loop
async function recalculatePricesForFilament(filamentName: string): Promise<void> {
  console.log(`[Recalc] Triggered price review for products using filament: "${filamentName}"`);
  
  // 1. Load active settings
  const settingsRaw = await loadSettings();
  const settings = {
    default_target_margin: parseFloat(settingsRaw.default_target_margin) || 50,
    electricity_cost_per_hour: parseFloat(settingsRaw.electricity_cost_per_hour) || 3,
    depreciation_cost_per_hour: parseFloat(settingsRaw.depreciation_cost_per_hour) || 20,
    packaging_cost_flat: parseFloat(settingsRaw.packaging_cost_flat) || 40,
    platform_fee_percent: parseFloat(settingsRaw.platform_fee_percent) || 3
  };

  // 2. Load active spools and calculate weighted average cost per gram
  let weightedCostPerGram = 0;
  if (isSupabaseConfigured) {
    const { data: spools, error: spoolsError } = await supabaseAdmin!
      .from("filaments")
      .select("purchase_price_bdt, spool_weight_grams")
      .eq("name", filamentName)
      .eq("is_empty", false);

    if (spoolsError) {
      console.error(`[Recalc] Error fetching spools from Supabase:`, spoolsError);
    } else if (spools && spools.length > 0) {
      let totalCost = 0;
      let totalWeight = 0;
      spools.forEach(s => {
        totalCost += parseFloat(s.purchase_price_bdt) || 0;
        totalWeight += parseFloat(s.spool_weight_grams) || 0;
      });
      weightedCostPerGram = totalWeight > 0 ? (totalCost / totalWeight) : 0;
    }
  } else {
    const spools = await loadFilaments();
    const activeSpools = spools.filter(s => s.name === filamentName && !s.is_empty);
    let totalCost = 0;
    let totalWeight = 0;
    activeSpools.forEach(s => {
      totalCost += parseFloat(s.purchase_price_bdt) || 0;
      totalWeight += parseFloat(s.spool_weight_grams) || 0;
    });
    weightedCostPerGram = totalWeight > 0 ? (totalCost / totalWeight) : 0;
  }

  // 3. Load active accessories
  const accessoryCosts: Record<string, number> = {};
  let resinCostPerGram = 10; // Default
  if (isSupabaseConfigured) {
    const { data: accs, error: accsError } = await supabaseAdmin!
      .from("accessories")
      .select("name, cost_per_unit_bdt");
    if (accsError) {
      console.error(`[Recalc] Error fetching accessories:`, accsError);
    } else if (accs) {
      accs.forEach(a => {
        accessoryCosts[a.name] = parseFloat(a.cost_per_unit_bdt) || 0;
        if (a.name === "UV Resin") {
          resinCostPerGram = parseFloat(a.cost_per_unit_bdt) || 10;
        }
      });
    }
  } else {
    const accs = await loadAccessoriesFallback();
    accs.forEach(a => {
      accessoryCosts[a.name] = parseFloat(a.cost_per_unit_bdt) || 0;
      if (a.name === "UV Resin") {
        resinCostPerGram = parseFloat(a.cost_per_unit_bdt) || 10;
      }
    });
  }

  // 4. Fetch products, filter by recipe.filament_name, and recalculate
  let products: any[] = [];
  if (isSupabaseConfigured) {
    const { data, error } = await supabaseAdmin!
      .from("products")
      .select("*");
    if (error) {
      console.error(`[Recalc] Error fetching products:`, error);
      return;
    }
    products = data || [];
  } else {
    const dbPath = path.join(process.cwd(), "data", "products.json");
    if (fs.existsSync(dbPath)) {
      const raw = await fs.promises.readFile(dbPath, "utf-8");
      try {
        products = JSON.parse(raw) || [];
      } catch {
        products = [];
      }
    }
  }

  const affectedProducts = products.filter(p => {
    let recipe = p.material_recipe;
    if (typeof recipe === "string") {
      try { recipe = JSON.parse(recipe); } catch { return false; }
    }
    return recipe && recipe.filament_name === filamentName;
  });

  console.log(`[Recalc] Recalculating floor prices for ${affectedProducts.length} products using "${filamentName}".`);

  for (const product of affectedProducts) {
    let recipe = product.material_recipe;
    if (typeof recipe === "string") {
      try { recipe = JSON.parse(recipe); } catch { continue; }
    }

    const { floor_price_bdt } = calculateFloorPrice(
      recipe,
      weightedCostPerGram,
      resinCostPerGram,
      accessoryCosts,
      settings
    );

    const sellingPrice = parseFloat(product.startingPrice || product.price) || 0;
    const needsReview = sellingPrice < floor_price_bdt;

    if (isSupabaseConfigured) {
      await supabaseAdmin!
        .from("products")
        .update({
          floor_price_bdt,
          needs_price_review: needsReview
        })
        .eq("id", product.id);
    } else {
      products = products.map(p => {
        if (p.id === product.id) {
          return {
            ...p,
            floor_price_bdt,
            needs_price_review: needsReview
          };
        }
        return p;
      });
    }
  }

  if (!isSupabaseConfigured) {
    const dbPath = path.join(process.cwd(), "data", "products.json");
    await fs.promises.writeFile(dbPath, JSON.stringify(products, null, 2), "utf-8");
  }
}

// GET /api/filaments — Public
app.get("/api/filaments", async (_req, res) => {
  try {
    let filamentsList: any[] = [];
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin!
        .from("filaments")
        .select("*")
        .order("purchased_at", { ascending: false });
      if (error) throw error;
      filamentsList = data || [];
    } else {
      filamentsList = await loadFilaments();
      filamentsList.sort((a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime());
    }
    res.json({ success: true, filaments: filamentsList });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get filaments: " + err.message });
  }
});

// POST /api/admin/filaments — Admin
app.post("/api/admin/filaments", requireAdminAuth, async (req, res) => {
  try {
    const { name, type, color, brand, spool_weight_grams, purchase_price_bdt, notes } = req.body;
    if (!name || !type || !purchase_price_bdt) {
      res.status(400).json({ error: "Name, type, and purchase price are required." });
      return;
    }

    const spoolWeight = parseInt(spool_weight_grams) || 1000;
    const price = parseFloat(purchase_price_bdt);
    
    const newSpool = {
      name,
      type,
      color: color || "",
      brand: brand || "",
      spool_weight_grams: spoolWeight,
      purchase_price_bdt: price,
      grams_remaining: spoolWeight,
      is_empty: false,
      notes: notes || "",
      purchased_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let savedSpool: any = null;
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin!
        .from("filaments")
        .insert([newSpool])
        .select();
      if (error) throw error;
      savedSpool = data?.[0];
    } else {
      const current = await loadFilaments();
      const id = "fil-" + Math.random().toString(36).substr(2, 9);
      savedSpool = { id, ...newSpool };
      current.push(savedSpool);
      await saveFilaments(current);
    }

    await recalculatePricesForFilament(name);

    res.json({ success: true, filament: savedSpool });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create filament: " + err.message });
  }
});

// PATCH /api/admin/filaments/:id — Admin
app.patch("/api/admin/filaments/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, color, brand, spool_weight_grams, purchase_price_bdt, grams_remaining, is_empty, notes } = req.body;

    let updatedSpool: any = null;
    let oldFilamentName = "";

    if (isSupabaseConfigured) {
      const { data: oldData } = await supabaseAdmin!
        .from("filaments")
        .select("name")
        .eq("id", id)
        .single();
      if (oldData) oldFilamentName = oldData.name;

      const updateFields: any = {};
      if (name !== undefined) updateFields.name = name;
      if (type !== undefined) updateFields.type = type;
      if (color !== undefined) updateFields.color = color;
      if (brand !== undefined) updateFields.brand = brand;
      if (spool_weight_grams !== undefined) updateFields.spool_weight_grams = parseInt(spool_weight_grams);
      if (purchase_price_bdt !== undefined) updateFields.purchase_price_bdt = parseFloat(purchase_price_bdt);
      
      if (is_empty !== undefined) {
        updateFields.is_empty = is_empty;
        if (is_empty) {
          updateFields.grams_remaining = 0;
        }
      }
      if (grams_remaining !== undefined && !updateFields.is_empty) {
        updateFields.grams_remaining = parseFloat(grams_remaining);
      }
      
      if (notes !== undefined) updateFields.notes = notes;
      updateFields.updated_at = new Date().toISOString();

      const { data, error } = await supabaseAdmin!
        .from("filaments")
        .update(updateFields)
        .eq("id", id)
        .select();

      if (error) throw error;
      updatedSpool = data?.[0];
    } else {
      const current = await loadFilaments();
      const spoolIndex = current.findIndex(s => s.id === id);
      if (spoolIndex === -1) {
        res.status(404).json({ error: "Spool not found." });
        return;
      }
      oldFilamentName = current[spoolIndex].name;
      
      const updated = { ...current[spoolIndex] };
      if (name !== undefined) updated.name = name;
      if (type !== undefined) updated.type = type;
      if (color !== undefined) updated.color = color;
      if (brand !== undefined) updated.brand = brand;
      if (spool_weight_grams !== undefined) updated.spool_weight_grams = parseInt(spool_weight_grams);
      if (purchase_price_bdt !== undefined) updated.purchase_price_bdt = parseFloat(purchase_price_bdt);
      
      if (is_empty !== undefined) {
        updated.is_empty = is_empty;
        if (is_empty) updated.grams_remaining = 0;
      }
      if (grams_remaining !== undefined && !updated.is_empty) {
        updated.grams_remaining = parseFloat(grams_remaining);
      }
      
      if (notes !== undefined) updated.notes = notes;
      updated.updated_at = new Date().toISOString();

      current[spoolIndex] = updated;
      await saveFilaments(current);
      updatedSpool = updated;
    }

    await recalculatePricesForFilament(oldFilamentName);
    if (name && name !== oldFilamentName) {
      await recalculatePricesForFilament(name);
    }

    res.json({ success: true, filament: updatedSpool });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update filament: " + err.message });
  }
});

// DELETE /api/admin/filaments/:id — Admin
app.delete("/api/admin/filaments/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let filamentName = "";

    if (isSupabaseConfigured) {
      const { data: oldData } = await supabaseAdmin!
        .from("filaments")
        .select("name")
        .eq("id", id)
        .single();
      if (oldData) filamentName = oldData.name;

      const { error } = await supabaseAdmin!
        .from("filaments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    } else {
      const current = await loadFilaments();
      const spool = current.find(s => s.id === id);
      if (spool) {
        filamentName = spool.name;
        const filtered = current.filter(s => s.id !== id);
        await saveFilaments(filtered);
      }
    }

    if (filamentName) {
      await recalculatePricesForFilament(filamentName);
    }

    res.json({ success: true, message: "Filament spool deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete filament: " + err.message });
  }
});

// GET /api/accessories — Public
app.get("/api/accessories", async (_req, res) => {
  try {
    let accList: any[] = [];
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin!
        .from("accessories")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      accList = data || [];
    } else {
      accList = await loadAccessoriesFallback();
    }
    res.json({ success: true, accessories: accList });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get accessories: " + err.message });
  }
});

// POST /api/admin/accessories — Admin (Add or Update)
app.post("/api/admin/accessories", requireAdminAuth, async (req, res) => {
  try {
    const { name, unit, cost_per_unit_bdt, stock_count } = req.body;
    if (!name || !unit || cost_per_unit_bdt === undefined) {
      res.status(400).json({ error: "Name, unit, and cost per unit are required." });
      return;
    }

    const price = parseFloat(cost_per_unit_bdt);
    const stock = parseInt(stock_count) || 0;

    let savedAcc: any = null;
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin!
        .from("accessories")
        .upsert([
          { name, unit, cost_per_unit_bdt: price, stock_count: stock }
        ], { onConflict: "name" })
        .select();
      if (error) throw error;
      savedAcc = data?.[0];
    } else {
      const current = await loadAccessoriesFallback();
      const idx = current.findIndex(a => a.name.toLowerCase() === name.toLowerCase());
      if (idx !== -1) {
        current[idx] = { ...current[idx], unit, cost_per_unit_bdt: price, stock_count: stock };
        savedAcc = current[idx];
      } else {
        const id = "acc-" + Math.random().toString(36).substr(2, 9);
        savedAcc = { id, name, unit, cost_per_unit_bdt: price, stock_count: stock };
        current.push(savedAcc);
      }
      await saveAccessoriesFallback(current);
    }

    res.json({ success: true, accessory: savedAcc });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save accessory: " + err.message });
  }
});

// POST /api/admin/recalculate-prices — Admin (Manual Recalc Trigger)
app.post("/api/admin/recalculate-prices", requireAdminAuth, async (req, res) => {
  try {
    const { filamentName } = req.body;
    if (!filamentName) {
      res.status(400).json({ error: "filamentName is required." });
      return;
    }
    await recalculatePricesForFilament(filamentName);
    res.json({ success: true, message: `Recalculated prices successfully for ${filamentName}.` });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to recalculate prices: " + err.message });
  }
});

// ── Resend Email Notifications ────────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
let resendClient: Resend | null = null;
if (RESEND_API_KEY) {
  resendClient = new Resend(RESEND_API_KEY);
  console.log("📧 Resend email client initialized");
} else {
  console.warn("⚠️  RESEND_API_KEY not set — order confirmation emails disabled.");
}

const STORE_EMAIL = "onboarding@resend.dev"; // Change to your verified Resend domain

/** Build the HTML email body for order confirmation */
function buildConfirmationHtml(order: any): string {
  const itemsHtml = (order.items || [])
    .map(
      (item: any) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.product?.title || item.customization?.name || 'Item'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.selectedMaterial || '—'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.selectedColor || '—'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">৳${Math.round((item.calculatedPrice ?? item.product?.price ?? 0) * (item.quantity || 1)).toLocaleString('en-US')}</td>
        </tr>`
    )
    .join("");

  const paymentInfo = order.payment || {};
  const depositNote = order.orderType === 'pre-order' && order.depositPercentage
    ? `<p style="color:#f97316;font-size:13px;"><strong>⏳ Pre-order deposit:</strong> ${order.depositPercentage}% deposit required. Balance due on arrival.</p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">✅ Order Confirmed</h1>
      <p style="color:#fff3e0;margin:4px 0 0;font-size:14px;">Belvia 3D Precision Labs</p>
    </div>
    <div style="padding:24px;">
      <p style="font-size:14px;color:#333;">Thank you for your order! Here's a summary:</p>

      <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
        <tr><td style="padding:6px 0;color:#666;"><strong>Order ID:</strong></td><td style="padding:6px 0;text-align:right;font-weight:700;">${order.id}</td></tr>
        <tr><td style="padding:6px 0;color:#666;"><strong>Status:</strong></td><td style="padding:6px 0;text-align:right;color:#ea580c;">Pending Verification</td></tr>
        <tr><td style="padding:6px 0;color:#666;"><strong>Date:</strong></td><td style="padding:6px 0;text-align:right;">${new Date(order.createdAt).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}</td></tr>
      </table>

      <h3 style="font-size:14px;border-bottom:2px solid #f97316;padding-bottom:6px;">Items Ordered</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#fafafa;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;">Product</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;">Material</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;">Color</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;color:#666;text-transform:uppercase;">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;color:#666;text-transform:uppercase;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
        <tr><td style="padding:8px 12px;text-align:right;font-weight:700;border-top:2px solid #333;font-size:16px;">Total</td><td style="padding:8px 12px;text-align:right;font-weight:700;border-top:2px solid #333;font-size:16px;">৳${Math.round(order.totalCost || 0).toLocaleString('en-US')}</td></tr>
      </table>

      ${depositNote}

      <div style="background:#fff8f0;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:16px 0;">
        <h4 style="margin:0 0 6px;font-size:13px;color:#c2410c;">💳 Payment Instructions</h4>
        <p style="margin:0;font-size:13px;color:#666;">
          Your order is <strong>pending verification</strong> until we confirm your payment.<br>
          Send the exact amount to:
        </p>
        <table style="font-size:13px;margin:8px 0;">
          <tr><td style="padding:2px 8px 2px 0;color:#666;">bKash:</td><td style="font-weight:700;">01712511193</td></tr>
          <tr><td style="padding:2px 8px 2px 0;color:#666;">Nagad:</td><td style="font-weight:700;">01712511193</td></tr>
        </table>
        <p style="margin:6px 0 0;font-size:12px;color:#999;">Include your Order ID (<strong>${order.id}</strong>) as the transaction reference.</p>
      </div>

      <h3 style="font-size:14px;border-bottom:2px solid #333;padding-bottom:6px;">Shipping To</h3>
      <p style="font-size:13px;color:#333;margin:4px 0;">${order.shippingInfo?.name || '—'}<br>${order.shippingInfo?.phone || '—'}<br>${order.shippingInfo?.address || '—'}</p>

      <p style="font-size:12px;color:#999;margin-top:20px;text-align:center;border-top:1px solid #eee;padding-top:16px;">
        Belvia 3D Precision Labs — Bangladesh<br>
        <a href="mailto:${STORE_EMAIL}" style="color:#f97316;">${STORE_EMAIL}</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/** Build the HTML email body for status update notification */
function buildStatusUpdateHtml(order: any): string {
  const statusColor = order.status === 'Shipped' || order.status === 'Fulfilled' ? '#10b981' : '#f97316';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,${statusColor},#059669);padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">📦 Order Update</h1>
      <p style="color:#fff3e0;margin:4px 0 0;font-size:14px;">Belvia 3D Precision Labs</p>
    </div>
    <div style="padding:24px;">
      <p style="font-size:14px;color:#333;">Your order status has been updated:</p>
      <div style="text-align:center;margin:20px 0;padding:20px;background:#f9fafb;border-radius:8px;">
        <p style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Order</p>
        <p style="font-size:18px;font-weight:700;margin:0;">${order.id}</p>
        <p style="font-size:14px;color:${statusColor};font-weight:700;margin:8px 0 0;">Status: ${order.status}</p>
      </div>
      ${order.trackingCode ? `<p style="font-size:13px;color:#333;text-align:center;">📮 Tracking Code: <strong>${order.trackingCode}</strong></p>` : ''}
      <p style="font-size:13px;color:#666;text-align:center;">Thank you for choosing Belvia 3D!</p>
      <p style="font-size:12px;color:#999;margin-top:20px;text-align:center;border-top:1px solid #eee;padding-top:16px;">
        Belvia 3D Precision Labs — Bangladesh<br>
        <a href="mailto:${STORE_EMAIL}" style="color:#f97316;">${STORE_EMAIL}</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send an order confirmation email via Resend.
 * Logs a warning (does not throw) so a failed email never crashes the order save.
 */
async function sendOrderConfirmationEmail(order: any): Promise<void> {
  if (!resendClient) {
    console.warn(`📧 Skipping confirmation email for ${order.id} — Resend not configured.`);
    return;
  }
  const recipient = order.shippingInfo?.email;
  if (!recipient) {
    console.warn(`📧 Skipping confirmation email for ${order.id} — no customer email provided.`);
    return;
  }
  try {
    await resendClient.emails.send({
      from: `Belvia 3D <${STORE_EMAIL}>`,
      to: recipient,
      subject: `✅ Order Confirmed — ${order.id}`,
      html: buildConfirmationHtml(order),
    });
    console.log(`📧 Confirmation email sent to ${recipient} for order ${order.id}`);
  } catch (err: any) {
    console.error(`📧 Failed to send confirmation email for ${order.id}:`, err.message);
  }
}

/**
 * Send a status-update email to the customer via Resend.
 */
async function sendStatusUpdateEmail(order: any): Promise<void> {
  if (!resendClient) {
    console.warn(`📧 Skipping status email for ${order.id} — Resend not configured.`);
    return;
  }
  const recipient = order.shippingInfo?.email;
  if (!recipient) {
    console.warn(`📧 Skipping status email for ${order.id} — no customer email provided.`);
    return;
  }
  try {
    await resendClient.emails.send({
      from: `Belvia 3D <${STORE_EMAIL}>`,
      to: recipient,
      subject: `📦 Order ${order.status} — ${order.id}`,
      html: buildStatusUpdateHtml(order),
    });
    console.log(`📧 Status email sent to ${recipient} for order ${order.id} (${order.status})`);
  } catch (err: any) {
    console.error(`📧 Failed to send status email for ${order.id}:`, err.message);
  }
}

// ── Order Endpoints ────────────────────────────────────────────────────

// ── Multi-Tier Discount System Endpoints ─────────────────────────────────────

// GET /api/active-festival — Public. Returns the current active festival (if any).
// Only returns public-safe fields (no internal admin data).
app.get("/api/active-festival", async (req: express.Request, res: express.Response): Promise<void> => {
  if (!isSupabaseConfigured) {
    res.json({ festival: null });
    return;
  }
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin!
      .from("festival_discounts")
      .select("id, name, percent, category, end_date")
      .eq("is_active", true)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("percent", { ascending: false }) // highest discount first
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    res.json({ festival: data || null });
  } catch (err: any) {
    console.error("active-festival error:", err);
    res.status(500).json({ festival: null });
  }
});

// POST /api/get-discount — Public. Resolves the winning discount for a given cart state.
// Accepts { userId?, cartItems[], couponCode? }
// Returns a DiscountResult so the CartDrawer can preview the discount in real time.
// Now delegates to the shared resolveDiscount() helper used by /api/save-order.
app.post("/api/get-discount", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { userId, cartItems, couponCode, subtotal } = req.body;
    if (subtotal == null || !Array.isArray(cartItems)) {
      res.status(400).json({ error: "subtotal and cartItems are required." });
      return;
    }

    const result = await resolveDiscount({ userId, couponCode, subtotal: Number(subtotal), cartItems });
    res.json({ discount: result, festival: null });
  } catch (err: any) {
    console.error("get-discount error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/festival-discounts — Admin-only.
app.get("/api/admin/festival-discounts", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  if (!isSupabaseConfigured) { res.status(503).json({ error: "Not available." }); return; }
  try {
    const { data, error } = await supabaseAdmin!
      .from("festival_discounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ festivals: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/festival-discounts — Admin-only. Create.
app.post("/api/admin/festival-discounts", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  if (!isSupabaseConfigured) { res.status(503).json({ error: "Not available." }); return; }
  try {
    const { name, percent, category, start_date, end_date } = req.body;
    if (!name || percent == null || !start_date || !end_date) {
      res.status(400).json({ error: "name, percent, start_date, end_date are required." });
      return;
    }
    const { data, error } = await supabaseAdmin!
      .from("festival_discounts")
      .insert({ name, percent: Number(percent), category: category || null, start_date, end_date, is_active: true })
      .select().single();
    if (error) throw error;
    res.json({ festival: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/festival-discounts/:id — Admin-only. Update / toggle.
app.patch("/api/admin/festival-discounts/:id", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  if (!isSupabaseConfigured) { res.status(503).json({ error: "Not available." }); return; }
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin!
      .from("festival_discounts")
      .update(req.body)
      .eq("id", id)
      .select().single();
    if (error) throw error;
    res.json({ festival: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/festival-discounts/:id — Admin-only.
app.delete("/api/admin/festival-discounts/:id", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  if (!isSupabaseConfigured) { res.status(503).json({ error: "Not available." }); return; }
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin!.from("festival_discounts").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Coupon System Endpoints ───────────────────────────────────────────────────


// POST /api/validate-coupon — Public endpoint. Accepts { code }, returns
// { valid, type, value, message } only. Never exposes internal fields.
app.post("/api/validate-coupon", async (req: express.Request, res: express.Response): Promise<void> => {
  if (!isSupabaseConfigured) {
    res.status(503).json({ valid: false, message: "Coupon service not available." });
    return;
  }
  try {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      res.status(400).json({ valid: false, message: "Coupon code is required." });
      return;
    }
    const upperCode = code.trim().toUpperCase();
    const { data, error } = await supabaseAdmin!
      .from("coupons")
      .select("type, value, max_uses, uses_count, valid_from, valid_until, is_active")
      .filter("code", "ilike", upperCode)
      .single();

    if (error || !data) {
      res.json({ valid: false, message: "Invalid coupon code." });
      return;
    }
    if (!data.is_active) {
      res.json({ valid: false, message: "This coupon is no longer active." });
      return;
    }
    const now = new Date();
    if (data.valid_from && new Date(data.valid_from) > now) {
      res.json({ valid: false, message: "This coupon is not valid yet." });
      return;
    }
    if (data.valid_until && new Date(data.valid_until) < now) {
      res.json({ valid: false, message: "This coupon has expired." });
      return;
    }
    if (data.max_uses !== null && data.uses_count >= data.max_uses) {
      res.json({ valid: false, message: "This coupon has reached its maximum uses." });
      return;
    }
    res.json({
      valid: true,
      type: data.type,
      value: data.value,
      message: data.type === "percent"
        ? `${data.value}% off applied!`
        : `৳${data.value} off applied!`
    });
  } catch (err: any) {
    console.error("validate-coupon error:", err);
    res.status(500).json({ valid: false, message: "Server error while validating coupon." });
  }
});

// POST /api/apply-coupon — Called after a successful order save.
// Re-validates then atomically increments uses_count.
app.post("/api/apply-coupon", async (req: express.Request, res: express.Response): Promise<void> => {
  if (!isSupabaseConfigured) {
    res.status(503).json({ success: false, message: "Coupon service not available." });
    return;
  }
  try {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      res.status(400).json({ success: false, message: "Coupon code is required." });
      return;
    }
    const upperCode = code.trim().toUpperCase();
    // Re-validate before incrementing (prevent race condition on last slot)
    const { data, error } = await supabaseAdmin!
      .from("coupons")
      .select("id, max_uses, uses_count, is_active, valid_until")
      .filter("code", "ilike", upperCode)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, message: "Coupon not found." });
      return;
    }
    if (!data.is_active) {
      res.json({ success: false, message: "Coupon is no longer active." });
      return;
    }
    if (data.valid_until && new Date(data.valid_until) < new Date()) {
      res.json({ success: false, message: "Coupon has expired." });
      return;
    }
    if (data.max_uses !== null && data.uses_count >= data.max_uses) {
      res.json({ success: false, message: "Coupon max uses reached." });
      return;
    }
    // Atomic increment
    const { error: updateErr } = await supabaseAdmin!
      .from("coupons")
      .update({ uses_count: data.uses_count + 1 })
      .eq("id", data.id);

    if (updateErr) throw updateErr;
    res.json({ success: true });
  } catch (err: any) {
    console.error("apply-coupon error:", err);
    res.status(500).json({ success: false, message: "Server error while applying coupon." });
  }
});

// GET /api/admin/coupons — Admin-only. Returns all coupon records.
app.get("/api/admin/coupons", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  if (!isSupabaseConfigured) {
    res.status(503).json({ error: "Coupon service not available." });
    return;
  }
  try {
    const { data, error } = await supabaseAdmin!
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ coupons: data || [] });
  } catch (err: any) {
    console.error("admin/coupons GET error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/coupons — Admin-only. Create a new coupon.
app.post("/api/admin/coupons", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  if (!isSupabaseConfigured) {
    res.status(503).json({ error: "Coupon service not available." });
    return;
  }
  try {
    const { code, type, value, max_uses, valid_until, created_by } = req.body;
    if (!code || !type || value === undefined) {
      res.status(400).json({ error: "code, type, and value are required." });
      return;
    }
    if (!["percent", "flat"].includes(type)) {
      res.status(400).json({ error: "type must be 'percent' or 'flat'." });
      return;
    }
    const { data, error } = await supabaseAdmin!
      .from("coupons")
      .insert({
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        max_uses: max_uses ? Number(max_uses) : null,
        valid_until: valid_until || null,
        created_by: created_by || null,
        is_active: true
      })
      .select()
      .single();
    if (error) throw error;
    res.json({ coupon: data });
  } catch (err: any) {
    console.error("admin/coupons POST error:", err);
    res.status(500).json({ error: err.message || "Failed to create coupon." });
  }
});

// PATCH /api/admin/coupons/:id — Admin-only. Update is_active toggle (or any fields).
app.patch("/api/admin/coupons/:id", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  if (!isSupabaseConfigured) {
    res.status(503).json({ error: "Coupon service not available." });
    return;
  }
  try {
    const { id } = req.params;
    const updates = req.body; // accept partial updates: is_active, max_uses, valid_until, etc.
    const { data, error } = await supabaseAdmin!
      .from("coupons")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    res.json({ coupon: data });
  } catch (err: any) {
    console.error("admin/coupons PATCH error:", err);
    res.status(500).json({ error: err.message || "Failed to update coupon." });
  }
});

// DELETE /api/admin/coupons/:id — Admin-only. Delete a coupon permanently.
app.delete("/api/admin/coupons/:id", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  if (!isSupabaseConfigured) {
    res.status(503).json({ error: "Coupon service not available." });
    return;
  }
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin!
      .from("coupons")
      .delete()
      .eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("admin/coupons DELETE error:", err);
    res.status(500).json({ error: err.message || "Failed to delete coupon." });
  }
});

// ──────────────────────────────────────────────────────────────
// Shared helpers: discount resolution & order total verification
// ──────────────────────────────────────────────────────────────

/**
 * Resolve the winning discount for a given cart state — extracted so both
 * /api/get-discount and /api/save-order use identical logic.
 *
 * Returns { type, percent, discountAmount, label, couponCode? } or
 * { type: null, ...zero } when no discount applies.
 */
async function resolveDiscount(opts: {
  userId?: string;
  couponCode?: string;
  subtotal: number;
  cartItems: any[];
}): Promise<{
  type: string | null;
  percent: number;
  discountAmount: number;
  label: string;
  couponCode?: string;
}> {
  const { userId, couponCode, subtotal, cartItems } = opts;

  // --- Gather festival ---
  let festival = null;
  if (isSupabaseConfigured) {
    const now = new Date().toISOString();
    const { data } = await supabaseAdmin!
      .from("festival_discounts")
      .select("id, name, percent, category, end_date")
      .eq("is_active", true)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("percent", { ascending: false })
      .limit(1)
      .maybeSingle();
    festival = data || null;
  }

  // --- Validate coupon (if provided) ---
  let coupon: { code: string; type: string; value: number; discountAmount: number } | null = null;
  if (couponCode && typeof couponCode === "string" && isSupabaseConfigured) {
    const upperCode = couponCode.trim().toUpperCase();
    const now = new Date();
    const { data } = await supabaseAdmin!
      .from("coupons")
      .select("type, value, max_uses, uses_count, valid_from, valid_until, is_active")
      .filter("code", "ilike", upperCode)
      .single();

    if (
      data &&
      data.is_active &&
      (!data.valid_from || new Date(data.valid_from) <= now) &&
      (!data.valid_until || new Date(data.valid_until) > now) &&
      (data.max_uses === null || data.uses_count < data.max_uses)
    ) {
      const discAmt = data.type === "percent"
        ? Math.round(Number(subtotal) * (data.value / 100))
        : Math.round(data.value);
      coupon = { code: upperCode, type: data.type, value: data.value, discountAmount: discAmt };
    }
  }

  // --- Count completed orders for loyalty + new-user ---
  let completedOrderCount = 0;
  let isFirstOrder = true;
  if (userId && isSupabaseConfigured) {
    const { data: userOrders } = await supabaseAdmin!
      .from("orders")
      .select("status")
      .eq("user_id", userId);

    if (userOrders && userOrders.length > 0) {
      completedOrderCount = userOrders.filter((o: any) => o.status === "Completed").length;
      isFirstOrder = false;
    }
  }

  // --- Resolve discount ---
  const cartCategories: string[] = (cartItems as any[]).map((item: any) => item.product?.category || "");
  let festivalSubtotal = Number(subtotal);
  if (festival && festival.category) {
    const matchingItems = (cartItems as any[]).filter(
      (item: any) => (item.product?.category || "").toLowerCase() === festival.category.toLowerCase()
    );
    festivalSubtotal = matchingItems.reduce(
      (acc: number, item: any) => acc + (item.calculatedPrice ?? item.product?.price ?? 0) * (item.quantity ?? 1),
      0
    );
  }

  let result = { type: null as string | null, percent: 0, discountAmount: 0, label: "", couponCode: undefined as string | undefined };

  if (coupon) {
    result = {
      type: "coupon",
      percent: coupon.type === "percent" ? coupon.value : Math.round((coupon.value / Number(subtotal)) * 100),
      discountAmount: coupon.discountAmount,
      label: coupon.type === "percent" ? `Coupon ${coupon.code} — ${coupon.value}% off` : `Coupon ${coupon.code} — ৳${coupon.value} off`,
      couponCode: coupon.code,
    };
  } else if (festival && festival.percent > 0 && (!festival.category || cartCategories.some((c: string) => c.toLowerCase() === festival.category.toLowerCase()))) {
    const discAmt = Math.round(festivalSubtotal * (festival.percent / 100));
    result = {
      type: "festival",
      percent: festival.percent,
      discountAmount: discAmt,
      label: `${festival.name} — ${festival.percent}% off${festival.category ? ` (${festival.category})` : " (Site-wide)"}`,
      couponCode: undefined,
    };
  } else {
    const TIERS = [
      { name: "Bronze",   minOrders: 0,  percent: 0 },
      { name: "Silver",   minOrders: 3,  percent: 5 },
      { name: "Gold",     minOrders: 7,  percent: 10 },
      { name: "Platinum", minOrders: 15, percent: 15 },
    ];
    let loyaltyTier = TIERS[0];
    for (const tier of TIERS) {
      if (completedOrderCount >= tier.minOrders) loyaltyTier = tier;
    }

    if (loyaltyTier.percent > 0) {
      result = {
        type: "loyalty",
        percent: loyaltyTier.percent,
        discountAmount: Math.round(Number(subtotal) * (loyaltyTier.percent / 100)),
        label: `Loyalty ${loyaltyTier.name} — ${loyaltyTier.percent}% off`,
        couponCode: undefined,
      };
    } else if (isFirstOrder) {
      result = {
        type: "new_user",
        percent: 10,
        discountAmount: Math.round(Number(subtotal) * 0.1),
        label: "First Order — 10% off",
        couponCode: undefined,
      };
    }
  }

  return result;
}

/**
 * Loads authoritative product data for a set of IDs.
 * Works with both Supabase and filesystem fallback.
 */
async function loadProductsForValidation(productIds: string[]): Promise<Map<string, any>> {
  const productMap = new Map<string, any>();

  if (isSupabaseConfigured) {
    // Batched Supabase lookup
    const batchSize = 50;
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const { data } = await supabaseAdmin!
        .from("products")
        .select("id, title, price, resin_price, resin_enabled, depositPercentage, weightGrams, isPreOrder, basePrice")
        .in("id", batch);
      if (data) {
        for (const p of data) {
          productMap.set(p.id, p);
        }
      }
    }
  } else {
    // Filesystem fallback
    try {
      const dbPath = path.join(process.cwd(), "data", "products.json");
      if (fs.existsSync(dbPath)) {
        const raw = await fs.promises.readFile(dbPath, "utf-8");
        const products = JSON.parse(raw);
        if (Array.isArray(products)) {
          for (const p of products) {
            productMap.set(p.id, p);
          }
        }
      }
    } catch (e: any) {
      console.warn("[Order validation] Failed to load products from filesystem:", e.message);
    }
  }

  return productMap;
}

/**
 * Server-side order total re-calculation.
 *
 * Computes the expected per-unit price for each item, re-resolves discounts,
 * and returns { valid, errors[], expectedTotal, serverSubtotal, serverDiscount }.
 *
 * - Returns { valid: false } with error messages for hard rejects
 *   (unknown product, resin claim on non-resin product, invalid coupon).
 * - Returns { valid: true, expectedTotal } with the computed totals,
 *   tolerating rounding differences of up to 1 BDT per item.
 */
async function verifyOrderTotals(order: any): Promise<{
  valid: boolean;
  errors: string[];
  expectedTotal: number;
  serverSubtotal: number;
  serverDiscount: number;
  corrected: boolean;
  productMap: Map<string, any>;
}> {
  const errors: string[] = [];
  const productIds: string[] = [];

  for (const item of (order.items || [])) {
    const pid = item.product?.id;
    if (pid) productIds.push(pid);
  }

  const productMap = await loadProductsForValidation([...new Set(productIds)]);

  // --- Per-item recalculation ---
  let serverSubtotal = 0;
  let serverWeight = 0;
  let serverDepositPercentage: number | undefined;

  for (const item of (order.items || [])) {
    const pid = item.product?.id;
    const dbProduct = productMap.get(pid);

    if (!dbProduct) {
      errors.push(`Product not found: ${pid || "(missing id)"}`);
      continue;
    }

    const qty = item.quantity || 1;

    // Detect keychain items via customization field
    const isKeychain = !!(item.customization);
    const isPreOrder = !!(item.isPreOrder || dbProduct.isPreOrder);

    let unitPrice: number;

    if (isKeychain) {
      // Keychain: recalculate from the customization config using the same pure function the client uses
      const specs = calculateKeychainSpecs(item.customization);
      unitPrice = specs.price;
      serverWeight += (specs.weightGrams || 0) * qty;
    } else if (isPreOrder) {
      // Pre-order: raw product.price (deposit-based pricing)
      unitPrice = Math.round(dbProduct.price);
      const depositPct = dbProduct.depositPercentage || 50;
      if (!serverDepositPercentage || depositPct > serverDepositPercentage) {
        serverDepositPercentage = depositPct;
      }
    } else {
      // Standard product: apply the 12% royalty removal
      unitPrice = Math.round(dbProduct.price - Math.round(dbProduct.price * 0.12));
    }

    // Resin surcharge
    if (item.selectedResin) {
      if (!dbProduct.resin_enabled) {
        errors.push(`Resin coating is not available for product "${dbProduct.title || dbProduct.id}".`);
        continue;
      }
      unitPrice += Math.round(dbProduct.resin_price || 0);
    }

    if (!isKeychain && !isPreOrder) {
      serverWeight += (dbProduct.weightGrams || 0) * qty;
    }

    serverSubtotal += unitPrice * qty;
  }

  // If there were unknown products, reject outright
  if (errors.length > 0) {
    return { valid: false, errors, expectedTotal: 0, serverSubtotal: 0, serverDiscount: 0, corrected: false, productMap };
  }

  // --- Re-resolve discount from server-side data ---
  const discountResult = await resolveDiscount({
    userId: order.userId,
    couponCode: order.couponCode,
    subtotal: serverSubtotal,
    cartItems: order.items || [],
  });

  const serverDiscount = discountResult.discountAmount || 0;
  const expectedTotal = Math.max(0, serverSubtotal - serverDiscount);

  // --- Compare against client-submitted total ---
  const clientTotal = Math.round(order.totalCost || 0);
  const diff = Math.abs(clientTotal - expectedTotal);

  // Tolerance: up to 1 BDT per item (accounts for rounding across different calculation paths)
  const itemCount = (order.items || []).length;
  const tolerance = Math.max(1, itemCount);
  const corrected = diff > tolerance;

  return {
    valid: true,
    errors: [],
    expectedTotal: corrected ? expectedTotal : clientTotal,
    serverSubtotal,
    serverDiscount,
    corrected,
    productMap,
  };
}

// POST save single order — public, no admin auth required
// Validates required fields server-side and appends the new order (avoids
// the insecure pattern of accepting a full array from the client to overwrite).
app.post("/api/save-order", async (req: express.Request, res: express.Response): Promise<void> => {

  try {
    const order = req.body;
    if (!order || typeof order !== "object" || Array.isArray(order)) {
      res.status(400).json({ error: "Invalid payload. Expected a single order object." });
      return;
    }

    // ── Server-side required field validation ──
    const missing: string[] = [];
    if (!order.shippingInfo?.name?.trim()) missing.push("customerName");
    if (!order.shippingInfo?.phone?.trim()) missing.push("phone");
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) missing.push("items");
    if (order.totalCost == null || isNaN(order.totalCost)) missing.push("totalAmount");

    if (missing.length > 0) {
      res.status(400).json({ error: `Order validation failed. Missing or invalid fields: ${missing.join(", ")}` });
      return;
    }

    // ── Server-side price-tampering verification ──
    // Independently re-compute every monetary value from authoritative data.
    const verification = await verifyOrderTotals(order);

    if (!verification.valid) {
      res.status(400).json({
        error: `Order validation failed. ${verification.errors.join("; ")}`,
        details: verification.errors,
      });
      return;
    }

    // Silently correct the total if the client-submitted value is off
    if (verification.corrected) {
      console.warn(
        `[Price mismatch] Order ${order.id}: client submitted ৳${order.totalCost}, server computes ৳${verification.expectedTotal}. Corrected silently.`,
        { clientTotal: order.totalCost, serverTotal: verification.expectedTotal, serverSubtotal: verification.serverSubtotal, serverDiscount: verification.serverDiscount }
      );
      order.totalCost = verification.expectedTotal;
      // Also correct the discount fields so they reflect what the server resolved
      order.discountType = order.discountType || null;
      order.discountAmount = verification.serverDiscount;
    }

    // ── Supabase path ──
    if (isSupabaseConfigured) {
      const row = {
        id: order.id,
        items: JSON.stringify(order.items || []),
        totalCost: order.totalCost || 0,
        originalCost: order.originalCost ?? order.totalCost ?? 0,
        discountAmount: order.discountAmount || 0,
        discountType: order.discountType || null,
        discountPercent: order.discountPercent || null,
        couponCode: order.couponCode || null,
        user_id: order.userId || null,
        totalWeight: order.totalWeight || 0,
        shippingInfo: JSON.stringify(order.shippingInfo || {}),
        payment: JSON.stringify(order.payment || {}),
        status: order.status || 'Pending',
        createdAt: order.createdAt || new Date().toISOString(),
        orderType: order.orderType || 'standard',
        depositPercentage: order.depositPercentage || null,
        trackingCode: order.trackingCode || '',
        _confirmationSent: !!order._confirmationSent,
        updated_at: new Date().toISOString(),
        design_credit_enabled: order.design_credit_enabled || false,
        design_credit_amount: order.design_credit_amount !== undefined ? order.design_credit_amount : null
      };

      const { error: insertError } = await supabaseAdmin!
        .from("orders")
        .insert(row);

      if (insertError) throw new Error(insertError.message);

      // ── Decrement stock_quantity for each ordered item ──
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          const productId = item.product?.id;
          const qty = item.quantity || 1;
          if (!productId) continue;

          const { data: currentProduct } = await supabaseAdmin!
            .from("products")
            .select("stockQuantity")
            .eq("id", productId)
            .single();

          const currentStock = currentProduct?.stockQuantity;
          if (currentStock !== undefined && currentStock !== null && currentStock > 0) {
            const newStock = Math.max(0, currentStock - qty);
            await supabaseAdmin!
              .from("products")
              .update({ stockQuantity: newStock, updated_at: new Date().toISOString() })
              .eq("id", productId);
            console.log(`[Stock] Decremented ${productId}: ${currentStock} → ${newStock}`);
          }
        }
      }

      // Fire-and-forget confirmation email
      if (order && !order._confirmationSent) {
        sendOrderConfirmationEmail(order);
      }

      res.json({ success: true, message: "Order saved to Supabase." });
      return;
    }

    // ── Fallback: filesystem (read-then-append with simple lock) ──
    const dbPath = path.join(process.cwd(), "data", "orders.json");
    let existingOrders: any[] = [];
    if (fs.existsSync(dbPath)) {
      const raw = await fs.promises.readFile(dbPath, "utf-8");
      existingOrders = JSON.parse(raw);
      if (!Array.isArray(existingOrders)) existingOrders = [];
    }
    existingOrders.unshift(order);
    await fs.promises.writeFile(dbPath, JSON.stringify(existingOrders, null, 2), "utf-8");

    if (!order._confirmationSent) {
      sendOrderConfirmationEmail(order);
    }

    res.json({ success: true, message: "Order saved to filesystem." });
  } catch (err: any) {
    console.error("Save order error:", err);
    res.status(500).json({ error: "Failed to save order: " + err.message });
  }
});

// POST update a single order's status + optionally send notification
app.post("/api/update-order-status", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { orderId, status, trackingCode, design_credit_enabled, design_credit_amount } = req.body;
    if (!orderId || !status) {
      res.status(400).json({ error: "Missing required fields: orderId, status" });
      return;
    }

    // ── Supabase path ──
    if (isSupabaseConfigured) {
      const { data: currentOrder, error: getErr } = await supabaseAdmin!
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (getErr || !currentOrder) {
        res.status(404).json({ error: `Order ${orderId} not found in database.` });
        return;
      }

      const oEnabled = design_credit_enabled !== undefined ? design_credit_enabled : !!currentOrder.design_credit_enabled;
      const oAmount = design_credit_amount !== undefined ? design_credit_amount : (currentOrder.design_credit_amount || 0);

      const originalCost = currentOrder.originalCost ?? currentOrder.totalCost ?? 0;
      const discountAmount = currentOrder.discountAmount ?? 0;
      const recalculatedTotal = Math.max(0, originalCost - discountAmount + (oEnabled ? oAmount : 0));

      const updates: Record<string, any> = {
        status,
        design_credit_enabled: oEnabled,
        design_credit_amount: oEnabled ? oAmount : null,
        totalCost: recalculatedTotal,
        updated_at: new Date().toISOString()
      };
      if (trackingCode) updates.trackingCode = trackingCode;

      const { error: updateError } = await supabaseAdmin!
        .from("orders")
        .update(updates)
        .eq("id", orderId);

      if (updateError) throw new Error(updateError.message);

      // Fetch the updated order for the email + response
      const { data: updated, error: fetchError } = await supabaseAdmin!
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      // Fire-and-forget status update email
      sendStatusUpdateEmail(updated);
      res.json({ success: true, message: `Order ${orderId} updated.`, order: updated });
      return;
    }

    // ── Fallback: filesystem ──
    const dbPath = path.join(process.cwd(), "data", "orders.json");
    if (!fs.existsSync(dbPath)) {
      res.status(455).json({ error: "No orders database found." });
      return;
    }

    const raw = await fs.promises.readFile(dbPath, "utf-8");
    const orders: any[] = JSON.parse(raw);

    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) {
      res.status(404).json({ error: `Order ${orderId} not found.` });
      return;
    }

    orders[idx].status = status;
    if (trackingCode) {
      orders[idx].trackingCode = trackingCode;
    }

    const oEnabled = design_credit_enabled !== undefined ? design_credit_enabled : !!orders[idx].design_credit_enabled;
    const oAmount = design_credit_amount !== undefined ? design_credit_amount : (orders[idx].design_credit_amount || 0);

    orders[idx].design_credit_enabled = oEnabled;
    orders[idx].design_credit_amount = oEnabled ? oAmount : null;

    const originalCost = orders[idx].originalCost ?? orders[idx].totalCost ?? 0;
    const discountAmount = orders[idx].discountAmount ?? 0;
    orders[idx].totalCost = Math.max(0, originalCost - discountAmount + (oEnabled ? oAmount : 0));

    await fs.promises.writeFile(dbPath, JSON.stringify(orders, null, 2), "utf-8");
    sendStatusUpdateEmail(orders[idx]);

    res.json({ success: true, message: `Order ${orderId} updated.`, order: orders[idx] });
  } catch (err: any) {
    console.error("Update order status error:", err);
    res.status(500).json({ error: "Failed to update order: " + err.message });
  }
});



// ============================================================
// MAKERWORLD PLAYWRIGHT SCRAPER ENDPOINT
// Uses a real headless Chromium browser to bypass Cloudflare and
// extract real product data: title, description, tags, images, specs
// No AI required — pure DOM extraction.
// ============================================================
app.post("/api/import-makerworld-by-url", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url || !url.trim().startsWith("http")) {
      res.status(400).json({ error: "Missing or invalid MakerWorld URL." });
      return;
    }

    const cleanUrl = url.trim();

    // 1. Check for duplicates in data/products.json
    const dbPath = path.join(process.cwd(), "data", "products.json");
    if (fs.existsSync(dbPath)) {
      try {
        const dbContent = await fs.promises.readFile(dbPath, "utf-8");
        const catalog = JSON.parse(dbContent);
        if (Array.isArray(catalog)) {
          const duplicate = catalog.find((p: any) => p.makerWorldUrl === cleanUrl);
          if (duplicate) {
            res.status(400).json({
              success: false,
              error: `Product already exists in store catalog (ID: ${duplicate.id}, Title: ${duplicate.title}).`
            });
            return;
          }
        }
      } catch (e: any) {
        console.warn("Duplicate check parse error:", e.message);
      }
    }

    // 2. Run the Playwright scraper — real browser, bypasses Cloudflare
    console.log(`[Scraper] Starting Playwright browser scrape for: ${cleanUrl}`);
    const outputDir = path.join(process.cwd(), "public", "images", "products");

    const scraped = await scrapeMakerWorldPage(cleanUrl, outputDir);

    console.log(`[Scraper] ✅ Scraped: "${scraped.title}" — ${scraped.localImages.length} images saved`);

    // 3. Estimate a sensible starting price based on category
    const CONTROLLED_CATEGORIES = [
      "Keychains",
      "Home Decor",
      "Desk Accessories",
      "Gaming Accessories",
      "Figures & Collectibles",
      "Business Merchandise",
      "Custom Orders",
      "Functional Prints"
    ];
    const resolvedCategory = CONTROLLED_CATEGORIES.includes(scraped.category)
      ? scraped.category
      : "Figures & Collectibles";

    const titleLower = scraped.title.toLowerCase();
    let estimatedPrice = 2500;
    if (resolvedCategory === "Keychains") estimatedPrice = 1000;
    else if (resolvedCategory === "Figures & Collectibles") estimatedPrice = 3000;
    else if (resolvedCategory === "Home Decor") estimatedPrice = 3500;
    else if (resolvedCategory === "Desk Accessories") estimatedPrice = 2300;
    else if (resolvedCategory === "Gaming Accessories") estimatedPrice = 2000;
    else if (resolvedCategory === "Functional Prints") estimatedPrice = 1500;

    // 4. Build standard product shape for the UI
    const product = {
      title: scraped.title,
      description: scraped.description,
      category: resolvedCategory,
      price: estimatedPrice,
      colors: ["Matte Slate", "Obsidian Black", "Chalk White", "Silk Pearl Gold"],
      materials: scraped.printProfile.material
        ? scraped.printProfile.material.split(",").map((m: string) => m.trim())
        : ["PLA (Matte)"],
      printTime: scraped.printProfile.printTime || "3h 15m",
      weightGrams: (() => {
        const w = parseFloat(scraped.printProfile.weight) || 0;
        if (w > 0) return Math.round(w);
        if (scraped.printProfile.printTime) {
          const hMatch = scraped.printProfile.printTime.match(/(\d+)\s*h/);
          const mMatch = scraped.printProfile.printTime.match(/(\d+)\s*m/);
          const hours = (hMatch ? parseInt(hMatch[1]) : 0) + (mMatch ? parseInt(mMatch[1]) / 60 : 0);
          const est = Math.round(hours * 12);
          if (est > 0) return est;
        }
        return 50;
      })(),
      infill: scraped.printProfile.infill || "15%",
      dimensions: scraped.dimensions || "120 × 120 × 140 mm",
      isCustomizable: true,
      makerWorldUrl: cleanUrl,
      images: scraped.localImages.length > 0
        ? scraped.localImages
        : scraped.images.slice(0, 3),
      tags: scraped.tags,
      designerName: scraped.designerName,
      likes: scraped.likes,
      downloads: scraped.downloads,
      resin_enabled: false,
      resin_price: null
    };

    res.json({
      success: true,
      product,
      suggestedImages: scraped.images, // remote CDN URLs also returned for UI
      localImages: scraped.localImages,
      scrapedAt: scraped.scrapedAt
    });

  } catch (error: any) {
    console.error("[Scraper] Playwright scrape failed:", error);
    res.status(500).json({
      success: false,
      error: `Scraper error: ${error.message || "Unknown error during browser scrape."}`
    });
  }
});



// MakerWorld AI parsing agent endpoint
app.post("/api/import-makerworld", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { rawText } = req.body;
    if (!rawText || rawText.trim().length === 0) {
      res.status(400).json({ error: "Missing MakerWorld content to parse." });
      return;
    }

    let data;
    try {
      const ai = getGeminiClient();
      const prompt = `
        You are the Belvia 3D Catalog Agent. Settle arguments, estimate logical dimensions, filament weights, and printing specifications, and parse the following raw dump, description, or copy-pasted content from a MakerWorld.com model page into our premium e-commerce structure.
        
        From the content, extract or intelligently deduce:
        1. Title: The descriptive name of the product.
        2. Description: Clean, persuasive marketing description of what it does and why it is great to buy (2-3 sentences).
        3. Category: Choose of the following EXACT words: "Keychains", "Home Decor", "Desk Accessories", "Gaming Accessories", "Figures & Collectibles", "Business Merchandise", "Custom Orders", "Functional Prints". Deduce the absolute best category.
        4. Price: A recommended selling price in BDT (Bangladeshi Taka) (e.g. between 500 and 15000 depending on the complexity of the print). Output as an integer number like 2500.
        5. Colors: A list of 3-4 stylish consumer color names that would suit this model (e.g., "Matte Slate", "Stealth Grey", "Silk Pearl Gold", "Chalk White").
        6. Materials: A list of recommended materials (choose from: "PLA (Matte)", "PLA (Silk Pearl)", "PETG (Durable)", "ABS (High-Impact)", "TPU (Flexible)").
        7. PrintTime: Grammatically short estimate print duration (e.g. "3h 40m", "5h 15m").
        8. WeightGrams: Logically estimated weight of plastic consumed in grams (e.g. between 15 and 600). Returns an integer number like 85.
        9. Infill: Suggested optimal infill pattern and percentage (e.g. "15% Gyroid", "20% Grid").
        10. Dimensions: Logically estimated 3D bounding dimensions in mm (e.g. "120 x 80 x 140 mm").
        11. IsCustomizable: Boolean on whether initials, sizes, logo offsets or engraving can be customized for customers.

        Raw MakerWorld text to parse:
        ---
        ${rawText}
        ---
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Direct descriptive name" },
              description: { type: Type.STRING, description: "Persuasive sales pitch (2-3 sentences)" },
              category: { 
                type: Type.STRING, 
                description: "Must be EXACTLY one of: Keychains, Home Decor, Desk Accessories, Gaming Accessories, Figures & Collectibles, Business Merchandise, Custom Orders, Functional Prints" 
              },
              price: { type: Type.INTEGER, description: "Recommended retail price in BDT (integer)" },
              colors: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "Array of 3-4 appealing consumer color names" 
              },
              materials: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "Array of recommended 3D print filaments" 
              },
              printTime: { type: Type.STRING, description: "Short print time estimate e.g. 3h 15m" },
              weightGrams: { type: Type.INTEGER, description: "Simulated infill filament weight in grams" },
              infill: { type: Type.STRING, description: "Optimal infill setup e.g. 15% Gyroid" },
              dimensions: { type: Type.STRING, description: "Estimative bounding size in mm e.g. 120 x 120 x 140 mm" },
              isCustomizable: { type: Type.BOOLEAN, description: "True if customization fits this product type" }
            },
            required: ["title", "description", "category", "price", "colors", "materials", "printTime", "weightGrams", "infill", "dimensions", "isCustomizable"]
          },
          systemInstruction: "You are a professional 3D print pricing consultant. Fill missing values with logical, realistic engineering guesses based on typical 3D prints.",
          temperature: 0.2
        }
      });

      const parsedJsonText = response.text ? response.text.trim() : "{}";
      data = JSON.parse(parsedJsonText);
    } catch (aiErr: any) {
      console.warn("Parser: Gemini API call failed or not configured, utilizing local fallback text parser:", aiErr.message);
      
      // Attempt to extract title from text
      let title = "Cute Articulated Flexi-Cat";
      const lines = rawText.split('\n');
      for (const line of lines) {
        const matchName = line.match(/(?:Model Name|Title|Name)\s*:\s*(.+)$/i);
        if (matchName) {
          title = matchName[1].trim();
          break;
        }
      }
      if (title === "Cute Articulated Flexi-Cat" && lines[0] && lines[0].length < 60) {
        const firstLineClean = lines[0].replace(/Model Name:|Title:|Name:/i, '').trim();
        if (firstLineClean) title = firstLineClean;
      }

      const titleLower = title.toLowerCase();
      let category: "Keychains" | "Home Decor" | "Desk Accessories" | "Gaming Accessories" | "Figures & Collectibles" | "Business Merchandise" | "Custom Orders" | "Functional Prints" = "Desk Accessories";
      if (titleLower.includes("keychain") || titleLower.includes("tag")) {
        category = "Keychains";
      } else if (titleLower.includes("decor") || titleLower.includes("cat") || titleLower.includes("figurine") || titleLower.includes("vase")) {
        category = "Home Decor";
      } else if (titleLower.includes("game") || titleLower.includes("play") || titleLower.includes("spares")) {
        category = "Gaming Accessories";
      }

      data = {
        title: title,
        description: `Cute articulated 3d printed desk toy or collectible model. Prints in place, with no support required. Built with high-precision layers.`,
        category: category,
        price: titleLower.includes("keychain") ? 750 : 1500,
        colors: ["Matte Slate", "Obsidian Black", "Chalk White", "Emerald Green"],
        materials: ["PLA (Matte)", "PLA (Silk Pearl)"],
        printTime: "1h 40m",
        weightGrams: 45,
        infill: "15% Gyroid",
        dimensions: "80 x 45 x 60 mm",
        isCustomizable: true
      };
    }

    if (data) {
      data.resin_enabled = false;
      data.resin_price = null;
    }

    res.json({ success: true, product: data });
  } catch (error: any) {
    console.error("Gemini MakerWorld parsing failed:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "An error occurred while communicating with the Gemini extractor agent." 
    });
  }
});

// Interactive AI Customer Support chat bubble route
interface MatchRule {
  keywords: string[];
  response: string;
}

app.post("/api/support-chat", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      res.status(400).json({ error: "Missing support message query." });
      return;
    }

    const text = message.toLowerCase();

    const rules: MatchRule[] = [
      {
        keywords: ["hi", "hello", "hey", "greetings", "sup", "yo", "hola", "how are you", "who are you", "about yourself"],
        response: "Hello! Welcome to Belvia 3D Precision Labs. I am your automated assistant. Ask me about materials, order tracking, shipping times, or custom printing!"
      },
      {
        keywords: ["track", "status", "order", "package", "shipment", "blv-ship"],
        response: "To track your physical print order, navigate to the [Track Order] tab in the main header navigation menu. Paste your Tracking Code (e.g. BLV-SHIP-99120) to view real-time nozzle temperatures, cargo timeline status, and flight plans!"
      },
      {
        keywords: ["price", "cost", "how much", "rate", "pricing", "bdt", "taka", "৳", "markup", "fee"],
        response: "Our prices are calculated dynamically based on material weight, printbed duration, and QC markup. You can view full price breakdowns for catalog items on their details page, or upload files in the [STL Print Studio] for a real-time slicing cost estimate!"
      },
      {
        keywords: ["material", "filament", "pla", "petg", "tpu", "abs", "plastic", "resin", "polymer"],
        response: "We print with premium graded filaments:\n• PLA (Matte & Silk) – Vibrant colors, fine details.\n• PETG – Water-resistant & durable (perfect for pots).\n• TPU – Rubber-flexible & shockproof.\n• ABS – High-temperature impact resistant.\n• Premium Resin – Ultra-high detail SLA prints."
      },
      {
        keywords: ["custom", "stl", "upload", "own model", "print my", "thingiverse", "printables", "makerworld"],
        response: "Want to print your own STL or custom design? Head to the [STL Print Studio] tab. Drag-and-drop your .stl CAD file, select infill density, polymer materials, and instantly receive a computed manufacturing price estimate before submitting to the print queue!"
      },
      {
        keywords: ["ship", "delivery", "courier", "dhaka", "transit", "air cargo", "address"],
        response: "We deliver nationwide via Pathao & Steadfast. Shipping in Dhaka takes 1-2 days (৳80), and outside Dhaka takes 2-3 days (৳150). Pre-order imported wares arrive via air cargo in 2-3 weeks."
      },
      {
        keywords: ["payment", "bkash", "nagad", "pay", "send money", "transaction", "trxid", "wallet"],
        response: "We accept bKash and Nagad. When checking out, select your wallet, send the deposit or full amount to our merchant number, and input the transaction ID (TrxID) plus payment screenshot in the checkout drawer."
      },
      {
        keywords: ["return", "refund", "cancel", "damaged", "broke", "warranty"],
        response: "Since custom prints are made to order, refunds are only issued if the item arrives severely warped or damaged. If you face dimensional issues, contact support with pictures within 48 hours of delivery and we will reprint it for free!"
      },
      {
        keywords: ["production", "turnaround", "how long", "ready time", "duration", "time to make", "time to print"],
        response: "Most standard catalog prints are processed and ready for dispatch within 24-48 hours. Extremely large batches or custom models requiring engineering reviews may take 3-5 business days."
      },
      {
        keywords: ["care", "wash", "clean", "heat", "temperature", "sunlight", "dishwasher", "hot"],
        response: "To care for your 3D prints:\n• Keep PLA away from direct summer sunlight or hot cars (>55°C) to prevent warping.\n• Clean with warm soapy water (do NOT put in dishwasher).\n• Resin prints should be kept out of prolonged strong UV light to prevent brittleness."
      }
    ];

    let matchedResponse: string | null = null;
    for (const rule of rules) {
      if (rule.keywords.some(keyword => text.includes(keyword))) {
        matchedResponse = rule.response;
        break;
      }
    }

    if (matchedResponse) {
      res.json({ success: true, reply: matchedResponse, unmatched: false });
      return;
    }

    // Logging unmatched question to root data/unmatched_questions.json
    const unmatchedDbPath = path.join(process.cwd(), "data", "unmatched_questions.json");
    let unmatchedList: any[] = [];

    // Ensure directory exists
    await fs.promises.mkdir(path.dirname(unmatchedDbPath), { recursive: true });

    if (fs.existsSync(unmatchedDbPath)) {
      try {
        const raw = await fs.promises.readFile(unmatchedDbPath, "utf-8");
        unmatchedList = JSON.parse(raw);
        if (!Array.isArray(unmatchedList)) unmatchedList = [];
      } catch (e) {
        unmatchedList = [];
      }
    }

    unmatchedList.push({
      id: `uq-${Date.now()}`,
      message: message,
      timestamp: new Date().toISOString()
    });

    await fs.promises.writeFile(unmatchedDbPath, JSON.stringify(unmatchedList, null, 2), "utf-8");

    const fallbackReply = "I apologize, but that is a specific question I don't have pre-programmed answers for. You can reach out directly to Rylan (owner/operator) for personal assistance via WhatsApp.";
    res.json({ success: true, reply: fallbackReply, unmatched: true });
  } catch (err: any) {
    console.error("Support chat local matching error:", err.message);
    res.status(500).json({ error: "Failed to process support request: " + err.message });
  }
});

// GET unmatched questions
app.get("/api/admin/unmatched-questions", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const unmatchedDbPath = path.join(process.cwd(), "data", "unmatched_questions.json");
    let questions: any[] = [];
    if (fs.existsSync(unmatchedDbPath)) {
      const raw = await fs.promises.readFile(unmatchedDbPath, "utf-8");
      questions = JSON.parse(raw);
    }
    res.json({ success: true, questions });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch unmatched questions: " + err.message });
  }
});

// POST clear unmatched questions
app.post("/api/admin/unmatched-questions/clear", requireAdminAuth, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const unmatchedDbPath = path.join(process.cwd(), "data", "unmatched_questions.json");
    await fs.promises.mkdir(path.dirname(unmatchedDbPath), { recursive: true });
    await fs.promises.writeFile(unmatchedDbPath, JSON.stringify([], null, 2), "utf-8");
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to clear unmatched questions: " + err.message });
  }
});

// Configure Vite dynamic compiler middleware or assets server
const setupVite = async () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up development server with dynamic Vite compilation...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up production server with pre-compiled assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n======================================================`);
    console.log(`🚀 BELVIA 3D Server running at http://0.0.0.0:${PORT}`);
    console.log(`🌱 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`======================================================\n`);
  });
};

setupVite().catch((err) => {
  console.error("Failed to bootstrap Belvia Express server:", err);
});
