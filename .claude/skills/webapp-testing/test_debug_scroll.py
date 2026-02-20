# -*- coding: utf-8 -*-
from playwright.sync_api import sync_playwright
import time
import sys
import json

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
    home_btn = page.locator('text=Home').first
    if home_btn.count() > 0:
        home_btn.click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)

    # Click on Fiqh
    fiqh_btn = page.locator('text=Fiqh').first
    if fiqh_btn.count() > 0:
        fiqh_btn.click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)

    print("\nDEBUGGING SCROLL INFORMATION:")
    print("=" * 50)

    # Get detailed scroll information
    scroll_info = page.evaluate('''() => {
        const main = document.querySelector("main");
        const scrollDiv = main ? main.querySelector("div[style*='overflowY']") : null;
        const contentDiv = scrollDiv ? scrollDiv.firstChild : null;

        return {
            main: main ? {
                height: main.offsetHeight,
                clientHeight: main.clientHeight,
                scrollHeight: main.scrollHeight
            } : null,
            scrollDiv: scrollDiv ? {
                offsetHeight: scrollDiv.offsetHeight,
                clientHeight: scrollDiv.clientHeight,
                scrollHeight: scrollDiv.scrollHeight,
                overflowY: window.getComputedStyle(scrollDiv).overflowY,
                maxHeight: window.getComputedStyle(scrollDiv).maxHeight,
                height: window.getComputedStyle(scrollDiv).height
            } : null,
            contentDiv: contentDiv ? {
                offsetHeight: contentDiv.offsetHeight,
                scrollHeight: contentDiv.scrollHeight
            } : null,
            window: {
                innerHeight: window.innerHeight
            }
        };
    }''')

    print(json.dumps(scroll_info, indent=2))

    # Check if scroll is even possible
    if scroll_info['scrollDiv']:
        scroll_div = scroll_info['scrollDiv']
        if scroll_div['scrollHeight'] > scroll_div['offsetHeight']:
            print("\n[OK] Content SHOULD be scrollable (scrollHeight > offsetHeight)")
        else:
            print("\n[ERROR] Content NOT scrollable - scrollHeight <= offsetHeight")
            print(f"  scrollHeight: {scroll_div['scrollHeight']}")
            print(f"  offsetHeight: {scroll_div['offsetHeight']}")

    browser.close()
