import os
import sys
import json
import argparse
import urllib.request
from bs4 import BeautifulSoup
from PIL import Image

def get_product_data_from_makerworld(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read()
    except Exception as e:
        print(f"Error fetching MakerWorld: {e}")
        return None

    soup = BeautifulSoup(html, 'html.parser')
    
    # Extract Title (Mock fallback if structure changes)
    title_tag = soup.find('h1')
    title = title_tag.text.strip() if title_tag else "MakerWorld Product"
    
    # Extract Image URL (First matching high res image)
    img_url = None
    img_tags = soup.find_all('img')
    for img in img_tags:
        src = img.get('src', '')
        if 'image' in src and 'makerworld' in src:
            img_url = src
            break
            
    # Default values for mockup simulation
    return {
        "title": title,
        "raw_image_url": img_url,
        "description": "Scraped product details from MakerWorld source files. Made with high efficiency components."
    }

def optimize_image(raw_url, product_id):
    out_dir = "public/images/products"
    os.makedirs(out_dir, exist_ok=True)
    
    # Check if raw_url points to a GIF
    is_gif = False
    if raw_url:
        import urllib.parse
        parsed = urllib.parse.urlparse(raw_url)
        if parsed.path.lower().endswith('.gif'):
            is_gif = True

    out_path = f"{out_dir}/{product_id}.gif" if is_gif else f"{out_dir}/{product_id}.webp"
    
    # Fallback to local mockup generation if URL fails to download
    if not raw_url:
        print("No image URL found. Generating local mockup visual...")
        img = Image.new('RGB', (800, 800), color=(15, 20, 34))
        img.save(out_path, "WEBP", quality=80)
        return out_path

    try:
        urllib.request.urlretrieve(raw_url, "temp_img")
        with Image.open("temp_img") as img:
            # Check format in PIL as a second check
            if img.format == 'GIF' or is_gif:
                gif_path = f"{out_dir}/{product_id}.gif"
                import shutil
                shutil.copyfile("temp_img", gif_path)
                if os.path.exists("temp_img"):
                    os.remove("temp_img")
                return gif_path
            
            img.thumbnail((800, 800))
            img.save(out_path, "WEBP", quality=80)
        
        if os.path.exists("temp_img"):
            os.remove("temp_img")
        return out_path
    except Exception as e:
        print(f"Failed to optimize image, generating placeholder: {e}")
        if os.path.exists("temp_img"):
            os.remove("temp_img")
        img = Image.new('RGB', (800, 800), color=(15, 20, 34))
        img.save(out_path, "WEBP", quality=80)
        return out_path

def add_product(url, price, category, database_path):
    # Load catalog first to check for duplicates
    if os.path.exists(database_path):
        try:
            with open(database_path, "r", encoding="utf-8") as f:
                catalog = json.load(f)
        except Exception as e:
            print(f"Error loading catalog: {e}")
            catalog = []
    else:
        catalog = []

    # Prevent duplicate imports by URL
    for p in catalog:
        if p.get("makerWorldUrl") == url:
            print(f"Product with MakerWorld URL '{url}' already exists in catalog. Skipping import to prevent duplicates.")
            return

    # Deterministic fallback details if makerworld scrape returns minimal info
    data = get_product_data_from_makerworld(url)
    if not data:
        data = {
            "title": "Configured Keychain",
            "raw_image_url": None,
            "description": "Precision printed customization project."
        }

    clean_title = data["title"].split('|')[0].strip()
    product_id = "belvia-" + clean_title.lower().replace(" ", "-")
    
    # Prevent duplicate imports by computed ID
    for p in catalog:
        if p["id"] == product_id:
            print(f"Product with ID '{product_id}' already exists in catalog. Skipping import to prevent duplicates.")
            return

    img_rel_path = optimize_image(data["raw_image_url"], product_id)

    new_prod = {
        "id": product_id,
        "title": clean_title,
        "category": category,
        "startingPrice": price,
        "weightGrams": 24,
        "filamentUsage": 18.2,
        "isPreOrder": False,
        "is_trendy": False,
        "description": data["description"],
        "images": [img_rel_path],
        "colors": ["matte-black", "belvia-gold", "white"],
        "materials": ["PLA", "TPU"],
        "printTimeMinutes": 50,
        "rating": 5.0,
        "reviewCount": 1,
        "reviews": [],
        "makerWorldUrl": url,
        "specifications": {
            "dimensions": "80mm x 30mm x 4mm",
            "layerHeight": "0.16mm"
        }
    }

    catalog.append(new_prod)

    with open(database_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)

    print(f"Successfully sync'd product {product_id} to database.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--price", type=int, default=1200)
    parser.add_argument("--category", default="Keychains")
    parser.add_argument("--database", default="public/data/products.json")
    args = parser.parse_args()
    add_product(args.url, args.price, args.category, args.database)
