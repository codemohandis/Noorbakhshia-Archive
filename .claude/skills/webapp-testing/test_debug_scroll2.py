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
    print("Clicking HOME...")
    home_btn = page.locator('text=Home').first
    if home_btn.count() > 0:
        home_btn.click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)

    # Click on Fiqh
    print("Clicking on Fiqh...")
    fiqh_btn = page.locator('text=Fiqh').first
    if fiqh_btn.count() > 0:
        fiqh_btn.click()
        page.wait_for_load_state('networkidle')
        time.sleep(3)

    print("\nDEBUGGING SCROLL INFORMATION:")
    print("=" * 50)

    # Get detailed scroll information
    scroll_info = page.evaluate('''() => {
        const main = document.querySelector("main");
        const contentDiv = main ? main.lastElementChild : null;

        const mainComputedStyle = main ? window.getComputedStyle(main) : {};
        const contentComputedStyle = contentDiv ? window.getComputedStyle(contentDiv) : {};

        return {
            main: main ? {
                offsetHeight: main.offsetHeight,
                clientHeight: main.clientHeight,
                scrollHeight: main.scrollHeight,
                display: mainComputedStyle.display,
                flexDirection: mainComputedStyle.flexDirection,
                overflow: mainComputedStyle.overflow,
                tag: main.tagName
            } : null,
            contentDiv: contentDiv ? {
                offsetHeight: contentDiv.offsetHeight,
                clientHeight: contentDiv.clientHeight,
                scrollHeight: contentDiv.scrollHeight,
                overflowY: contentComputedStyle.overflowY,
                flex: contentComputedStyle.flex,
                minHeight: contentComputedStyle.minHeight,
                tag: contentDiv.tagName,
                className: contentDiv.className
            } : null,
            viewport: {
                innerHeight: window.innerHeight
            }
        };
    }''')

    print(json.dumps(scroll_info, indent=2))

    # Check if scroll is even possible
    if scroll_info['contentDiv']:
        content = scroll_info['contentDiv']
        print(f"\nScroll Analysis:")
        print(f"  offsetHeight: {content['offsetHeight']}")
        print(f"  scrollHeight: {content['scrollHeight']}")
        print(f"  Can scroll: {content['scrollHeight'] > content['clientHeight']}")

    browser.close()
