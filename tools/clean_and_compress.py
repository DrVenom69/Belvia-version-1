import os
import json
from PIL import Image

def load_referenced_images():
    db_path = os.path.join("public", "data", "products.json")
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return set()

    with open(db_path, "r", encoding="utf-8") as f:
        products = json.load(f)

    referenced = set()
    for p in products:
        for img in p.get("images", []):
            # Normalise path: strip leading slash and resolve to project-root-relative
            path = img.lstrip("/")
            if not path.startswith("public/"):
                path = os.path.join("public", path)
            referenced.add(os.path.normpath(path).lower())

    return referenced

def compress_image(file_path):
    try:
        orig_size = os.path.getsize(file_path)
        ext = os.path.splitext(file_path)[1].lower()
        if ext not in ['.webp', '.jpg', '.jpeg', '.png']:
            return 0, 0

        with Image.open(file_path) as img:
            # Check dimensions
            w, h = img.size
            max_dim = 500
            if w > max_dim or h > max_dim:
                # Calculate new dimensions preserving aspect ratio
                if w > h:
                    new_w = max_dim
                    new_h = int(h * (max_dim / w))
                else:
                    new_h = max_dim
                    new_w = int(w * (max_dim / h))
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            # Save back with compression
            if ext == '.webp':
                img.save(file_path, 'WEBP', quality=60)
            elif ext in ['.jpg', '.jpeg']:
                if img.mode in ('RGBA', 'LA'):
                    img = img.convert('RGB')
                img.save(file_path, 'JPEG', quality=60)
            elif ext == '.png':
                # Convert to P mode (indexed color) to compress heavily (128 colors for extra savings)
                if img.mode in ('RGBA', 'LA'):
                    try:
                        img = img.quantize(colors=128)
                    except Exception:
                        img = img.convert('P', palette=Image.Palette.ADAPTIVE, colors=128)
                else:
                    img = img.convert('P', palette=Image.Palette.ADAPTIVE, colors=128)
                img.save(file_path, 'PNG', optimize=True)
                    
        new_size = os.path.getsize(file_path)
        saved = orig_size - new_size
        return orig_size, saved
    except Exception:
        return 0, 0

def main():
    referenced = load_referenced_images()
    print(f"Loaded {len(referenced)} referenced image paths from products.json.")

    target_dir = os.path.join("public", "images", "products")
    if not os.path.exists(target_dir):
        print(f"Target directory {target_dir} does not exist.")
        return

    deleted_count = 0
    compressed_count = 0
    total_orig = 0
    total_saved = 0

    print("Scanning images...")
    for root, _, files in os.walk(target_dir):
        for file in files:
            file_path = os.path.join(root, file)
            norm_path = os.path.normpath(file_path).lower()
            
            # Check if this image is referenced
            if norm_path not in referenced:
                # Unused image! Delete it
                try:
                    os.remove(file_path)
                    deleted_count += 1
                except Exception as e:
                    print(f"Failed to delete unused file {file_path}: {e}")
            else:
                # Referenced image! Compress it
                orig, saved = compress_image(file_path)
                if orig > 0:
                    total_orig += orig
                    total_saved += saved
                    compressed_count += 1
                    if compressed_count % 50 == 0:
                        print(f"Compressed {compressed_count} images... Saved {(total_saved / 1024 / 1024):.2f} MB so far.")

    print("\nOptimization finished!")
    print(f"Deleted {deleted_count} unused images.")
    print(f"Compressed {compressed_count} referenced images.")
    print(f"Original size before this run: {total_orig / 1024 / 1024:.2f} MB")
    print(f"Space saved: {total_saved / 1024 / 1024:.2f} MB ({(total_saved / total_orig * 100 if total_orig > 0 else 0):.2f}%)")
    print(f"New size of compressed files: {(total_orig - total_saved) / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    main()
