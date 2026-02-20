# -*- coding: utf-8 -*-
from playwright.sync_api import sync_playwright
import time
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    # Create page with realistic viewport (1280x720 - common resolution)
    page = browser.new_page(viewport={'width': 1280, 'height': 720})

    print("Navigating with proper viewport...")
    page.goto('http://localhost:3000', wait_until='networkidle')
    time.sleep(2)

    # Navigate to Fiqh
    print("Clicking HOME...")
    home_btn = page.locator('text=Home').first
    if home_btn.count() > 0:
        home_btn.click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)

    print("Clicking Fiqh...")
    fiqh_btn = page.locator('text=Fiqh').first
    if fiqh_btn.count() > 0:
        fiqh_btn.click()
        page.wait_for_load_state('networkidle')
        time.sleep(3)

    # Get dimensions with proper viewport
    dims = page.evaluate('''() => {
        const scrollDiv = document.querySelector("main > div:nth-child(2)");
        return {
            scrollHeight: scrollDiv?.scrollHeight,
            clientHeight: scrollDiv?.clientHeight,
            offsetHeight: scrollDiv?.offsetHeight,
            scrollTop: scrollDiv?.scrollTop
        };
    }''')

    print(f"\nDimensions with proper viewport:")
    print(f"  scrollHeight: {dims['scrollHeight']}")
    print(f"  clientHeight: {dims['clientHeight']}")
    print(f"  offsetHeight: {dims['offsetHeight']}")
    print(f"  Can scroll: {dims['scrollHeight'] > dims['clientHeight']}")

    # Try scrolling
    print("\nTrying to scroll...")
    initial = page.evaluate('() => document.querySelector("main > div:nth-child(2)")?.scrollTop || 0')
    print(f"Initial scroll: {initial}")

    # Use wheel event
    page.locator("main > div:nth-child(2)").first.focus()
    page.mouse.wheel(0, 500)
    time.sleep(1)

    after = page.evaluate('() => document.querySelector("main > div:nth-child(2)")?.scrollTop || 0')
    print(f"After mouse wheel: {after}")

    if after > initial:
        print("[SUCCESS] Scrolling works!")
    else:
        print("[INFO] No scroll needed or content fits in viewport")

    browser.close()
