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

    console_logs = []
    page.on('console', lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

    print("Navigating to http://localhost:3000...")
    page.goto('http://localhost:3000')

    # Wait for page to load
    print("Waiting for page to load...")
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Click HOME button to go to collections/chapters view
    print("\nClicking HOME to view collections...")
    home_btn = page.locator('text=Home').first
    if home_btn.count() > 0:
        home_btn.click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)

    # Take screenshot
    print("Taking screenshot of collections page...")
    page.screenshot(path='test_collections.png', full_page=True)

    # Look for collection items
    print("\nSearching for collection/chapter items...")

    # Try finding cards with titles
    h2_elements = page.locator('h2').all()
    h3_elements = page.locator('h3').all()

    print(f"Found {len(h2_elements)} h2 elements")
    print(f"Found {len(h3_elements)} h3 elements")

    if len(h2_elements) > 0:
        print("\nh2 Titles:")
        for i, elem in enumerate(h2_elements[:10]):
            text = elem.text_content()
            if text:
                print(f"  {i+1}. {text}")

    # Check for any text with chapter/bab keywords
    page_text = page.locator('body').text_content() if page.locator('body').count() > 0 else ""
    print(f"\nPage contains 'Bab': {'Bab' in page_text}")
    print(f"Page contains 'Chapter': {'Chapter' in page_text}")
    print(f"Page contains 'Browse': {'Browse' in page_text}")

    # Print console logs
    if console_logs:
        print("\nRecent console messages:")
        for log in console_logs[-15:]:
            print(f"  {log}")

    print("\nTest complete. Screenshot saved to test_collections.png")
    browser.close()
