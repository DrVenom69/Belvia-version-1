import fs from "fs";
import path from "path";
import { uploadToR2 } from "../server/r2";

const PRODUCTS_DIR = path.join(process.cwd(), "public", "images", "products");
const MAP_OUTPUT_PATH = path.join(process.cwd(), "tools", "image-url-map.json");

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

async function run() {
  try {
    if (!fs.existsSync(PRODUCTS_DIR)) {
      console.error(`Directory not found: ${PRODUCTS_DIR}`);
      process.exit(1);
    }

    const files = fs.readdirSync(PRODUCTS_DIR);
    const imageFiles = files.filter(file => {
      const stat = fs.statSync(path.join(PRODUCTS_DIR, file));
      if (!stat.isFile()) return false;
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext);
    });

    console.log(`Found ${imageFiles.length} image files to upload.`);

    const urlMap: Record<string, string> = {};

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const filePath = path.join(PRODUCTS_DIR, file);
      const buffer = fs.readFileSync(filePath);
      const contentType = getContentType(file);
      
      console.log(`[${i + 1}/${imageFiles.length}] Uploading ${file} (${contentType})...`);
      
      // Upload using original filename as the key
      const publicUrl = await uploadToR2(buffer, file, contentType);
      
      urlMap[file] = publicUrl;
      console.log(`Uploaded: ${file} -> ${publicUrl}`);
    }

    // Save mapping to tools/image-url-map.json
    fs.mkdirSync(path.dirname(MAP_OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(MAP_OUTPUT_PATH, JSON.stringify(urlMap, null, 2), "utf-8");
    console.log(`\nMapping successfully saved to ${MAP_OUTPUT_PATH}`);

    // Print mapping table
    console.log("\nMAPPING TABLE:");
    console.log("================================================================================");
    Object.entries(urlMap).forEach(([filename, url]) => {
      console.log(`${filename} => ${url}`);
    });
    console.log("================================================================================");

  } catch (error) {
    console.error("Bulk upload failed:", error);
    process.exit(1);
  }
}

run();
