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

    print("Navigating...")
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Navigate to Fiqh
    home_btn = page.locator('text=Home').first
    if home_btn.count() > 0:
        home_btn.click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)

    fiqh_btn = page.locator('text=Fiqh').first
    if fiqh_btn.count() > 0:
        fiqh_btn.click()
        page.wait_for_load_state('networkidle')
        time.sleep(3)

    print("\nDIV TREE ANALYSIS:")
    print("=" * 70)

    # Analyze the entire hierarchy
    tree_info = page.evaluate('''() => {
        const root = document.querySelector("div.h-\\\\[100dvh\\\\]");
        const flexContainer = root ? root.children[0] : null;
        const main = flexContainer ? flexContainer.querySelector("main") : null;
        const scrollDiv = main ? main.lastElementChild : null;
        const browserWrapper = scrollDiv ? scrollDiv.firstElementChild : null;
        const contentDiv = browserWrapper ? browserWrapper.children[0] : null;

        const getInfo = (el) => {
            if (!el) return null;
            return {
                tag: el.tagName,
                class: el.className?.substring(0, 50),
                height: el.offsetHeight,
                clientHeight: el.clientHeight,
                scrollHeight: el.scrollHeight,
                overflowY: window.getComputedStyle(el).overflowY,
                minHeight: window.getComputedStyle(el).minHeight
            };
        };

        return {
            root: getInfo(root),
            flexContainer: getInfo(flexContainer),
            main: getInfo(main),
            scrollDiv: getInfo(scrollDiv),
            browserWrapper: getInfo(browserWrapper),
            contentDiv: getInfo(contentDiv)
        };
    }''')

    print(json.dumps(tree_info, indent=2))

    browser.close()
