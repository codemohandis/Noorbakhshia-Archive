#!/usr/bin/env python3
"""
Verify that the Modern UI/UX design is being applied to the app.
Takes a screenshot and checks for the new color scheme.
"""

from playwright.sync_api import sync_playwright
import sys

def verify_modern_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("🔍 Navigating to http://localhost:3000...")
            page.goto('http://localhost:3000', wait_until='networkidle')
            print("✅ Page loaded successfully")

            # Take screenshot
            screenshot_path = '/tmp/modern_ui_screenshot.png'
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"📸 Screenshot saved to: {screenshot_path}")

            # Check for CSS variables being applied
            computed_bg = page.evaluate("""
                () => window.getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()
            """)

            computed_text = page.evaluate("""
                () => window.getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary').trim()
            """)

            computed_primary = page.evaluate("""
                () => window.getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500').trim()
            """)

            print(f"\n📋 CSS Variables Applied:")
            print(f"  --color-bg: {computed_bg}")
            print(f"  --color-text-primary: {computed_text}")
            print(f"  --color-primary-500: {computed_primary}")

            # Check actual body background color
            body_style = page.evaluate("""
                () => window.getComputedStyle(document.body).backgroundColor
            """)

            print(f"\n🎨 Actual Rendered Colors:")
            print(f"  Body background: {body_style}")

            # Check for emerald color (should be #10b981 or similar in light mode)
            if '#10b981' in computed_primary or '#faf7f2' in computed_bg:
                print("\n✅ Modern UI/UX color scheme DETECTED!")
                print("   The new emerald/navy/gold design system is being applied.")
                return True
            else:
                print("\n⚠️  Modern UI/UX colors not clearly detected.")
                print("   Check the screenshot to verify visual appearance.")
                return False

        finally:
            browser.close()

if __name__ == '__main__':
    success = verify_modern_ui()
    sys.exit(0 if success else 1)
