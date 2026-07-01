import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const keychainProduct = {
  id: 'bv-keychain-template',
  title: 'Custom Name Keychain',
  description: 'Dynamic custom 3D printed keychain. Configured with custom text, font, size, and multi-color profiles.',
  category: 'Keychains',
  startingPrice: 150,
  weightGrams: 10,
  filamentUsage: 10.0,
  isPreOrder: false,
  stockQuantity: -1,
  images: ["https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=800"],
  colors: ['Matte Slate', 'Chalk White', 'Emerald Green', 'Burnt Orange', 'Obsidian Black', 'Jade Green', 'Silk Copper', 'Neon Nebula'],
  materials: ['PLA (Matte)', 'PETG (Durable)', 'TPU (Flexible)'],
  printTimeMinutes: 20,
  rating: 5.0,
  reviewCount: 0,
  specifications: { dimensions: "80mm x 25mm x 4mm", layerHeight: "0.16mm" },
  resin_enabled: true,
  resin_price: 50,
  colorStock: {
    "Matte Slate": 0,
    "Chalk White": -1,
    "Emerald Green": -1,
    "Burnt Orange": -1,
    "Obsidian Black": -1,
    "Jade Green": -1,
    "Silk Copper": -1,
    "Neon Nebula": -1
  }
};

async function run() {
  console.log("Seeding bv-keychain-template into Supabase (without color_picker_count)...");
  const { data, error } = await supabase
    .from("products")
    .upsert(keychainProduct, { onConflict: "id" })
    .select();

  if (error) {
    console.error("Error seeding:", error);
  } else {
    console.log("Successfully seeded product:", data);
  }
}

run();
