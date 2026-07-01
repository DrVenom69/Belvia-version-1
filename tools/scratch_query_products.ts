import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from("products")
    .select("id, title, colorStock");
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Products in database:");
    data.forEach(p => console.log(`- ${p.id}: ${p.title} (colorStock: ${JSON.stringify(p.colorStock)})`));
  }
}

run();
