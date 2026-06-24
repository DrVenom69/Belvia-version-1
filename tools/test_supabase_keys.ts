import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Checking Supabase connection and keys...");
console.log("URL:", supabaseUrl);
console.log("Anon Key present:", !!supabaseAnonKey);
console.log("Service Key present:", !!serviceKey);

async function testKeys() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing URL or Anon Key");
    return;
  }

  // 1. Test Anon Client
  try {
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await anonClient.auth.getSession();
    if (error) {
      console.error("❌ Anon key test failed (auth.getSession):", error.message);
    } else {
      console.log("✅ Anon key test succeeded (auth.getSession reached)");
    }
  } catch (err: any) {
    console.error("❌ Anon key exception:", err.message);
  }

  // 2. Test Service Role Client (can it read/write to some table, e.g., orders?)
  if (serviceKey) {
    try {
      const serviceClient = createClient(supabaseUrl, serviceKey);
      const { data, error } = await serviceClient.from("orders").select("id").limit(1);
      if (error) {
        console.error("❌ Service Role key test failed:", error.message);
      } else {
        console.log("✅ Service Role key test succeeded. Found orders count:", data?.length);
      }
    } catch (err: any) {
      console.error("❌ Service Role key exception:", err.message);
    }
  }
}

testKeys();
