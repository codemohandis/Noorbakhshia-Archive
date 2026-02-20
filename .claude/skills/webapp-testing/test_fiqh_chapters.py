# -*- coding: utf-8 -*-
from playwright.sync_api import sync_playwright
import time
import sys

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("Navigating to http://localhost:3000...")
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Click HOME
    print("Clicking HOME...")
    home_btn = page.locator('text=Home').first
    if home_btn.count() > 0:
        home_btn.click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)

    # Click on the Fiqh category card or button
    print("Clicking on Fiqh category...")
    fiqh_btn = page.locator('text=Fiqh').first
    if fiqh_btn.count() > 0:
        fiqh_btn.click()
        page.wait_for_load_state('networkidle')
        time.sleep(3)

    # Take screenshot showing all chapters
    print("Taking screenshot of Fiqh chapters...")
    page.screenshot(path='test_fiqh_chapters.png', full_page=True)

    # Count items displayed
    print("\nLooking for chapter items...")
    items = page.locator('[class*="item"], [class*="card"], li').all()
    print(f"Found {len(items)} potential items/chapters")

    # Look for text content with chapter names
    body_text = page.locator('body')
    all_text = body_text.text_content() if body_text.count() > 0 else ""

    # Count how many "Bab" chapters are visible
    bab_count = all_text.count('Bab')
    print(f"Found {bab_count} occurrences of 'Bab' in content")

    # Show some chapter titles if found
    chapters = page.locator('div, li, span').filter(has_text='Bab').all()
    print(f"\nFound {len(chapters)} elements containing 'Bab'")

    if len(chapters) > 0:
        print("\nFirst 10 chapters visible:")
        for i, ch in enumerate(chapters[:10]):
            text = ch.text_content()
            if text and len(text) < 100:
                print(f"  {i+1}. {text.strip()}")

    print("\nTest complete!")
    browser.close()
