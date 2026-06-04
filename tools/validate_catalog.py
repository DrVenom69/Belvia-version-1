import json
import os
import sys

def validate():
    db_path = "data/products.json"
    if not os.path.exists(db_path):
        print(f"Error: Database {db_path} does not exist.")
        sys.exit(1)
        
    try:
        with open(db_path, "r", encoding="utf-8") as f:
            catalog = json.load(f)
    except Exception as e:
        print(f"Error: Failed to parse JSON database: {e}")
        sys.exit(1)

    required_keys = ["id", "title", "category", "startingPrice", "weightGrams", "filamentUsage", "images", "colors", "materials", "printTimeMinutes", "isPreOrder", "reviews"]
    valid_categories = ["Keychains", "Home Decor", "Desk Accessories", "Gaming Accessories", "Figures & Collectibles", "Business Merchandise", "Custom Orders", "Functional Prints", "Imported Goods", "A1 Mini Mods", "Hotends"]

    for idx, product in enumerate(catalog):
        for key in required_keys:
            if key not in product:
                print(f"Validation Error in item {idx}: Missing key '{key}'")
                sys.exit(1)
        if product["category"] not in valid_categories:
            print(f"Validation Error in item {idx}: Invalid category '{product['category']}'")
            sys.exit(1)

    print("SUCCESS: Products database matches schema constitution rules.")

if __name__ == "__main__":
    validate()
