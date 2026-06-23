import os
from PIL import Image

def compress_image(file_path):
    try:
        orig_size = os.path.getsize(file_path)
        ext = os.path.splitext(file_path)[1].lower()
        if ext not in ['.webp', '.jpg', '.jpeg', '.png']:
            return 0, 0

        with Image.open(file_path) as img:
            # Check dimensions
            w, h = img.size
            max_dim = 800
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
                img.save(file_path, 'WEBP', quality=70)
            elif ext in ['.jpg', '.jpeg']:
                if img.mode in ('RGBA', 'LA'):
                    img = img.convert('RGB')
                img.save(file_path, 'JPEG', quality=70)
            elif ext == '.png':
                # Convert to P mode (indexed color) to compress heavily (similar to TinyPNG)
                if img.mode in ('RGBA', 'LA'):
                    try:
                        # In Pillow, quantizing RGBA directly handles transparency
                        img = img.quantize(colors=256)
                    except Exception:
                        img = img.convert('P', palette=Image.Palette.ADAPTIVE, colors=128)
                else:
                    img = img.convert('P', palette=Image.Palette.ADAPTIVE, colors=256)
                img.save(file_path, 'PNG', optimize=True)
                    
        new_size = os.path.getsize(file_path)
        saved = orig_size - new_size
        return orig_size, saved
    except Exception as e:
        return 0, 0

def main():
    target_dir = os.path.join("public", "images")
    if not os.path.exists(target_dir):
        print(f"Target directory {target_dir} does not exist.")
        return

    total_orig = 0
    total_saved = 0
    file_count = 0

    print("Starting deep image compression (including PNG color quantization)...")
    for root, _, files in os.walk(target_dir):
        for file in files:
            file_path = os.path.join(root, file)
            orig, saved = compress_image(file_path)
            if orig > 0:
                total_orig += orig
                total_saved += saved
                file_count += 1
                if file_count % 50 == 0:
                    print(f"Processed {file_count} images... Saved {(total_saved / 1024 / 1024):.2f} MB so far.")

    print("\nCompression finished!")
    print(f"Total images processed: {file_count}")
    print(f"Original size: {total_orig / 1024 / 1024:.2f} MB")
    print(f"Space saved: {total_saved / 1024 / 1024:.2f} MB ({(total_saved / total_orig * 100 if total_orig > 0 else 0):.2f}%)")
    print(f"New size: {(total_orig - total_saved) / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    main()
