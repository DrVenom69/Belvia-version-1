import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Setting Matte Slate stock to 0 for bv-keychain-template...");
  const { data, error } = await supabase
    .from("products")
    .update({
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
    })
    .eq("id", "bv-keychain-template")
    .select();

  if (error) {
    console.error("Error updating stock:", error);
  } else {
    console.log("Successfully updated product. Result:", data);
  }
}

run();
