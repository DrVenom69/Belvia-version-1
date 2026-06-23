import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const MAP_PATH = path.join(process.cwd(), "tools", "image-url-map.json");
const DB_PATH = path.join(process.cwd(), "public", "data", "products.json");

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

async function run() {
  try {
    // 1. Read image-url-map.json
    if (!fs.existsSync(MAP_PATH)) {
      console.error(`Mapping file not found: ${MAP_PATH}`);
      console.error("Please run bulk-upload-images.ts first.");
      process.exit(1);
    }
    const mapRaw = fs.readFileSync(MAP_PATH, "utf-8");
    const urlMap: Record<string, string> = JSON.parse(mapRaw);

    console.log(`Loaded ${Object.keys(urlMap).length} image URL mappings.`);

    // 2. Initialize Supabase Client
    let supabase: any = null;
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      console.log("🗄️ Initialized Supabase admin client.");
    } else {
      console.warn("⚠️ Supabase environment variables missing. Skipping Supabase updates.");
    }

    // 3. Update Supabase
    if (supabase) {
      console.log("\nFetching products from Supabase...");
      let { data: products, error: fetchError } = await supabase
        .from("products")
        .select("*");

      if (fetchError) {
        throw new Error(`Failed to fetch products from Supabase: ${fetchError.message}`);
      }

      // If Supabase table is empty, seed it from products.json first
      if (!products || products.length === 0) {
        console.log("Supabase products table is empty. Seeding from local products.json first...");
        if (fs.existsSync(DB_PATH)) {
          const localRaw = fs.readFileSync(DB_PATH, "utf-8");
          const localProducts = JSON.parse(localRaw);
          const seedRows = localProducts.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description || "",
            category: item.category,
            startingPrice: item.startingPrice || item.price || 0.0,
            weightGrams: item.weightGrams || 0,
            filamentUsage: item.filamentUsage || 0.0,
            isPreOrder: item.isPreOrder || false,
            stockQuantity: item.stockQuantity !== undefined && item.stockQuantity !== null ? item.stockQuantity : -1,
            images: item.images || [], // JSONB accepts array
            colors: item.colors || [],
            materials: item.materials || [],
            tags: item.tags || [],
            printTimeMinutes: item.printTimeMinutes || 0,
            rating: item.rating || 5.0,
            reviewCount: item.reviewCount || item.reviewsCount || 0,
            reviews: item.reviews || [],
            makerWorldUrl: item.makerWorldUrl || "",
            specifications: item.specifications || {}
          }));

          const { error: insertError } = await supabase
            .from("products")
            .insert(seedRows);

          if (insertError) {
            throw new Error(`Failed to seed products into Supabase: ${insertError.message}`);
          }
          console.log(`Successfully seeded ${seedRows.length} products into Supabase.`);

          // Refetch
          const { data: refetched, error: refetchError } = await supabase
            .from("products")
            .select("*");
          if (refetchError) {
            throw new Error(`Failed to refetch after seed: ${refetchError.message}`);
          }
          products = refetched;
        } else {
          console.warn("Local products.json fallback not found. Cannot seed Supabase.");
        }
      }

      console.log(`Fetched ${products?.length || 0} products from Supabase.`);

      let updateCount = 0;
      for (const product of products || []) {
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

        let updated = false;
        const newImages = imagesArray.map((img: string) => {
          if (img.startsWith("http://") || img.startsWith("https://")) {
            return img;
          }
          const filename = path.basename(img);
          if (urlMap[filename]) {
            updated = true;
            return urlMap[filename];
          }
          return img;
        });

        if (updated) {
          // Since the database column is jsonb, pass the new array directly
          const { error: updateError } = await supabase
            .from("products")
            .update({
              images: newImages,
              updated_at: new Date().toISOString()
            })
            .eq("id", product.id);

          if (updateError) {
            console.error(`❌ Failed to update product ${product.title}:`, updateError.message);
          } else {
            console.log(`Updated: ${product.title} -> ${newImages.join(", ")}`);
            updateCount++;
          }
        }
      }
      console.log(`\nSupabase updates complete. Total products updated: ${updateCount}`);
    }

    // 4. Update local fallback products.json if it exists
    if (fs.existsSync(DB_PATH)) {
      console.log(`\nUpdating local database fallback at ${DB_PATH}...`);
      const localRaw = fs.readFileSync(DB_PATH, "utf-8");
      const localProducts = JSON.parse(localRaw);

      let localUpdateCount = 0;
      const updatedLocalProducts = localProducts.map((product: any) => {
        let imagesArray: string[] = [];
        if (Array.isArray(product.images)) {
          imagesArray = product.images;
        }

        let updated = false;
        const newImages = imagesArray.map((img: string) => {
          if (img.startsWith("http://") || img.startsWith("https://")) {
            return img;
          }
          const filename = path.basename(img);
          if (urlMap[filename]) {
            updated = true;
            return urlMap[filename];
          }
          return img;
        });

        if (updated) {
          localUpdateCount++;
          return {
            ...product,
            images: newImages
          };
        }
        return product;
      });

      if (localUpdateCount > 0) {
        fs.writeFileSync(DB_PATH, JSON.stringify(updatedLocalProducts, null, 2), "utf-8");
        console.log(`Successfully updated ${localUpdateCount} products in local products.json`);
      } else {
        console.log("No local products required updating.");
      }
    }

  } catch (error) {
    console.error("Product image update failed:", error);
    process.exit(1);
  }
}

run();
