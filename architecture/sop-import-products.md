# SOP: Product Synchronisation & Scraper

This guide details how to sync and compile products from MakerWorld to Belvia's local catalog database.

## System Dependencies
* Python 3.10+
* Pillow library (`pip install Pillow`)
* BeautifulSoup4 (`pip install beautifulsoup4`)
* Requests library (`pip install requests`)

## Execution
Run the sync script from the project root:
```bash
python tools/import_products.py --url "https://makerworld.com/en/models/12345" --price 12.99 --category "Keychains"
```

The script fetches metadata, compiles optimized WebP thumbnails to `images/products/`, and updates `data/products.json` deterministically.
