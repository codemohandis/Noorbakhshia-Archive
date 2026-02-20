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

    # Log all console messages
    console_logs = []
    page.on('console', lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

    print("Navigating to http://localhost:3000...")
    page.goto('http://localhost:3000')

    # Wait for page to load
    print("Waiting for page to load...")
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Take screenshot of home page
    print("\nTaking screenshot of home page...")
    page.screenshot(path='test_home.png', full_page=True)

    # Print console logs
    if console_logs:
        print("\nConsole logs from home page:")
        for log in console_logs[:20]:
            print(f"  {log}")

    # Check what's currently on the page
    print("\nHome page content:")
    content = page.content()
    if 'Browse Chapters' in content:
        print("  - 'Browse Chapters' found on page")
    if 'creator' in content.lower():
        print("  - 'creator' found in content")
    if 'archive' in content.lower():
        print("  - 'archive' found in content")

    # Try clicking on a category in the sidebar (if any)
    print("\nLooking for category links...")
    categories = page.locator('button[style*="color"]').all()
    print(f"  Found {len(categories)} potential category buttons")

    if len(categories) > 0:
        for i, cat in enumerate(categories[:3]):
            text = cat.text_content()
            if text:
                print(f"    - Category {i}: {text}")

    # Now click on Home to make sure we're on the browser view
    print("\nClicking Home button...")
    home_btn = page.locator('text=Home').first
    if home_btn.count() > 0:
        home_btn.click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        print("Navigated to Home")

    # Take another screenshot
    print("Taking screenshot after Home click...")
    page.screenshot(path='test_home_after.png', full_page=True)

    # Check for items/collections
    all_text = page.text_content()
    print(f"\nPage text includes 'Creator': {'Creator' in all_text}")
    print(f"Page text includes 'Select a topic': {'Select a topic' in all_text}")

    browser.close()
    print("\nTest complete.")
