import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { scrapeMakerWorldPage } from "./tools/makerworld_scraper.ts";

const execAsync = promisify(exec);

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: "10mb" }));

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

// Save catalog database with validation check
app.post("/api/save-products", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const products = req.body;
    if (!Array.isArray(products)) {
      res.status(400).json({ error: "Invalid payload. Expected an array of products." });
      return;
    }

    const dbPath = path.join(process.cwd(), "public", "data", "products.json");
    const backupPath = path.join(process.cwd(), "public", "data", "products.json.bak");

    // 1. Back up existing file if it exists
    if (fs.existsSync(dbPath)) {
      await fs.promises.copyFile(dbPath, backupPath);
    }

    // 2. Format catalog items back to products.json schema
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

      // Convert images: strip leading slash if it exists
      const images = Array.isArray(item.images)
        ? item.images.map((img: string) => {
            if (img.startsWith("/")) return img.substring(1);
            return img;
          })
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
        specifications: {
          dimensions: item.dimensions || "",
          layerHeight: item.layerHeight || "0.16mm",
          infill: item.infill || "15% Gyroid"
        }
      };
    });

    // 3. Write new file
    await fs.promises.writeFile(dbPath, JSON.stringify(dbFormattedProducts, null, 2), "utf-8");

    // 4. Validate with tools/validate_catalog.py
    try {
      await execAsync("python tools/validate_catalog.py");
      res.json({ success: true, message: "Catalog saved and validated successfully." });
    } catch (valError: any) {
      console.error("Catalog validation failed, rolling back:", valError.stdout || valError.message);
      
      // Rollback
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

// Upload dynamic image base64 directly to server public assets
app.post("/api/upload-image", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { fileName, base64Data, directory } = req.body;
    if (!fileName || !base64Data) {
      res.status(400).json({ error: "Missing filename or base64 data." });
      return;
    }

    // Sanitize filename to prevent directory traversal
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
    
    // Extract base64 content
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Content, "base64");

    const targetSubDir = directory === "payments" ? "payments" : "products";
    const outDir = path.join(process.cwd(), "public", "images", targetSubDir);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const filePath = path.join(outDir, cleanFileName);
    await fs.promises.writeFile(filePath, buffer);

    res.json({ success: true, imagePath: `/images/${targetSubDir}/${cleanFileName}` });
  } catch (err: any) {
    console.error("Image upload error:", err);
    res.status(500).json({ error: "Failed to save image: " + err.message });
  }
});

// GET orders database
app.get("/api/get-orders", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const dbPath = path.join(process.cwd(), "public", "data", "orders.json");
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

// POST save orders database
app.post("/api/save-orders", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const orders = req.body;
    if (!Array.isArray(orders)) {
      res.status(400).json({ error: "Invalid payload. Expected an array of orders." });
      return;
    }
    const dbPath = path.join(process.cwd(), "public", "data", "orders.json");
    await fs.promises.writeFile(dbPath, JSON.stringify(orders, null, 2), "utf-8");
    res.json({ success: true, message: "Orders saved successfully." });
  } catch (err: any) {
    console.error("Save orders error:", err);
    res.status(500).json({ error: "Failed to save orders: " + err.message });
  }
});



// ============================================================
// MAKERWORLD PLAYWRIGHT SCRAPER ENDPOINT
// Uses a real headless Chromium browser to bypass Cloudflare and
// extract real product data: title, description, tags, images, specs
// No AI required — pure DOM extraction.
// ============================================================
app.post("/api/import-makerworld-by-url", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url || !url.trim().startsWith("http")) {
      res.status(400).json({ error: "Missing or invalid MakerWorld URL." });
      return;
    }

    const cleanUrl = url.trim();

    // 1. Check for duplicates in public/data/products.json
    const dbPath = path.join(process.cwd(), "public", "data", "products.json");
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
    let estimatedPrice = 24.99;
    if (resolvedCategory === "Keychains") estimatedPrice = 9.99;
    else if (resolvedCategory === "Figures & Collectibles") estimatedPrice = 29.99;
    else if (resolvedCategory === "Home Decor") estimatedPrice = 34.99;
    else if (resolvedCategory === "Desk Accessories") estimatedPrice = 22.99;
    else if (resolvedCategory === "Gaming Accessories") estimatedPrice = 19.99;
    else if (resolvedCategory === "Functional Prints") estimatedPrice = 14.99;

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
app.post("/api/import-makerworld", async (req: express.Request, res: express.Response): Promise<void> => {
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
        4. Price: A recommended selling price in USD (e.g. between 9.99 and 149.99 depending on the complexity of the print). Output as a float number like 24.99.
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
              price: { type: Type.NUMBER, description: "Recommended retail price in USD (float)" },
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
        price: titleLower.includes("keychain") ? 7.49 : 14.99,
        colors: ["Matte Slate", "Obsidian Black", "Chalk White", "Emerald Green"],
        materials: ["PLA (Matte)", "PLA (Silk Pearl)"],
        printTime: "1h 40m",
        weightGrams: 45,
        infill: "15% Gyroid",
        dimensions: "80 x 45 x 60 mm",
        isCustomizable: true
      };
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
app.post("/api/support-chat", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { message, history } = req.body;
    if (!message || message.trim().length === 0) {
      res.status(400).json({ error: "Missing support message query." });
      return;
    }

    const ai = getGeminiClient();
    
    // Support history mapping to Gemini SDK formats
    const chatHistory = (history || []).slice(-8).map((h: any) => ({
      role: h.role === "bot" || h.role === "model" ? "model" : "user",
      parts: [{ text: h.text }]
    }));
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...chatHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are the friendly, expert, and professional customer support assistant for Belvia 3D Precision Labs (or Belvia 3D). We coordinate a top-tier physical print farm utilizing Bambu Lab P1S and X1-Carbon machines to print high-quality ready prints, pre-orders, and custom .stl slice files.

Guide the client with the following specialized site sections:
1. CUSTOM STL FILMS: Tell them to head over to the "STL Print Studio" tab where they can drag-and-drop downloaded .stl files and get a calculated custom manufacturing quotation instantly!
2. COURIER LOGISTICS & SHIP TIMELISTS: If they ask about orders, deliveries, or cargo status, guide them to use "Track Order" tab in our navigation. Ask them to input order reference keys. E.g., they can click preloaded ones to test: BLV-SHIP-99120 (Lithophane Lamp - Air Transit), BLV-SHIP-00812 (Obsidian Rift Dragon - out for local courier today!), BLV-SHIP-71510 (Helix Desk Organizer - actively printing at layer 1640/2250, nozzle heat: 218°C).
3. FAVOURITES & WISHLIST: Mention they can click the heart icon on any design to pin it to their local Wishlist, viewable from the floating red heart envelope at the top header actions.
4. IMPORTED GOODS PRE-ORDERS: Any imported specialty filaments or Bambu AMS hubs are [Pre-order Only]. We collect secure deposits (25% - 50%) to reserve manufacturing batches.
5. MATERIAL SPECS: Graded PLA is beautiful/fast, PETG is water-tight durable (perfect for origami self-watering planters), TPU is flexible rubber, ABS is robust.

Answer concisely within 3-4 structural, friendly sentences. Avoid developer jargon, and maintain highly visual human composure!`,
        temperature: 0.6
      }
    });

    const replyText = response.text ? response.text.trim() : "I am processing your inquiry. Let me know if you want help with files, materials, pre-orders, or tracking!";
    res.json({ success: true, reply: replyText });
  } catch (error: any) {
    console.error("Gemini support chat error, using local fallback helper:", error.message);
    res.json({ 
      success: true, 
      reply: "Hi there! I am running in local backup mode because the Google Gemini AI key is not currently configured. For custom STL slice designs, please head to the 'STL Print Studio' tab. For order tracking, you can use the 'Track Order' tab and input order reference keys like BLV-SHIP-99120." 
    });
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
