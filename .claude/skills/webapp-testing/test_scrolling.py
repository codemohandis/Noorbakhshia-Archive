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

    # Click on Fiqh
    print("Clicking on Fiqh category...")
    fiqh_btn = page.locator('text=Fiqh').first
    if fiqh_btn.count() > 0:
        fiqh_btn.click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)

    # Try to scroll
    print("\nTesting scroll functionality...")

    # Get the main scrollable container
    main_container = page.locator('main > div:nth-child(2)')

    print(f"Found main container: {main_container.count() > 0}")

    # Get current scroll position
    initial_scroll = page.evaluate('() => window.document.querySelector("main > div:nth-child(2)")?.scrollTop || 0')
    print(f"Initial scroll position: {initial_scroll}")

    # Try to scroll down
    page.evaluate('() => window.document.querySelector("main > div:nth-child(2)")?.scrollBy(0, 300)')
    time.sleep(1)

    # Get new scroll position
    new_scroll = page.evaluate('() => window.document.querySelector("main > div:nth-child(2)")?.scrollTop || 0')
    print(f"After scrolling: {new_scroll}")

    if new_scroll > initial_scroll:
        print("[OK] Scrolling works! Scrolled from {initial_scroll} to {new_scroll}")
    else:
        print("[ERROR] Scrolling not working. Position unchanged.")

    # Take screenshot
    page.screenshot(path='test_scroll.png', full_page=False)

    print("\nScreenshot saved to test_scroll.png")
    browser.close()
