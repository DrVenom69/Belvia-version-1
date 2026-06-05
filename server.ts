import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

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

// MakerWorld AI parsing agent endpoint
app.post("/api/import-makerworld", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { rawText } = req.body;
    if (!rawText || rawText.trim().length === 0) {
      res.status(400).json({ error: "Missing MakerWorld content to parse." });
      return;
    }

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
    const data = JSON.parse(parsedJsonText);

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
    res.json({ success: false, error: "AI model key not configured, falling back to local print manager." });
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
