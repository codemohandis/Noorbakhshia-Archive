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

    print("Navigating and doing hard refresh...")
    page.goto('http://localhost:3000', wait_until='networkidle')
    page.evaluate('() => location.reload(true)')  # Hard refresh
    page.wait_for_load_state('networkidle')
    time.sleep(3)

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

    # Try scrolling
    print("\nTesting scroll...")
    initial_scroll = page.evaluate('() => window.document.querySelector("main > div:nth-child(2)")?.scrollTop || 0')
    print(f"Initial scroll: {initial_scroll}")

    page.evaluate('() => window.document.querySelector("main > div:nth-child(2)")?.scrollBy(0, 500)')
    time.sleep(1)

    new_scroll = page.evaluate('() => window.document.querySelector("main > div:nth-child(2)")?.scrollTop || 0')
    print(f"After scrolling: {new_scroll}")

    if new_scroll > initial_scroll:
        print("[SUCCESS] Scrolling works!")
    else:
        print("[FAILED] Scrolling not working")

    # Also try using keyboard
    print("\nTrying keyboard arrow down...")
    page.locator('main').focus()
    page.keyboard.press('ArrowDown')
    page.keyboard.press('ArrowDown')
    page.keyboard.press('ArrowDown')
    time.sleep(1)

    keyboard_scroll = page.evaluate('() => window.document.querySelector("main > div:nth-child(2)")?.scrollTop || 0')
    print(f"After keyboard: {keyboard_scroll}")

    browser.close()
