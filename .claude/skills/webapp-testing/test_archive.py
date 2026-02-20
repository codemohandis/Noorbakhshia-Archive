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

    # Wait for page to load
    print("Waiting for page to load...")
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Check for navigation items
    print("\nLooking for navigation options...")
    nav_items = page.locator('nav a, nav button').all()
    print(f"Found {len(nav_items)} nav items")
    for item in nav_items:
        text = item.text_content()
        print(f"  - {text}")

    # Try to find and click "Your Library" button
    library_btn = page.locator('text=Your Library')
    if library_btn.count() > 0:
        print("\nFound 'Your Library' button, clicking...")
        library_btn.click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        print("Navigated to Your Library")
    else:
        print("'Your Library' button not found, trying to find Creator page...")
        # Try other navigation
        creator_link = page.locator('text=Creator')
        if creator_link.count() > 0:
            creator_link.click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)

    # Take screenshot of current page
    print("\nTaking screenshot of current page...")
    page.screenshot(path='test_result_after_nav.png', full_page=True)

    # Check content
    content = page.content()
    print(f"\nPage content includes 'Creator': {'Creator' in content}")
    print(f"Page content includes 'Collection': {'Collection' in content}")
    print(f"Page content includes 'archive': {'archive' in content.lower()}")

    # Get page title/heading
    title = page.locator('h1').first
    if title.count() > 0:
        print(f"\nPage heading: {title.text_content()}")

    # Check for any collection/item cards
    cards = page.locator('[class*="card"], [class*="item"], [class*="collection"]').all()
    print(f"\nFound {len(cards)} card/collection elements")

    print("\nTest complete. Screenshots saved.")
    browser.close()
