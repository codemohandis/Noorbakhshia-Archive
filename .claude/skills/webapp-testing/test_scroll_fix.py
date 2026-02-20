"""
Test script to verify scrolling functionality after CSS fix.
Tests that the main element scrolls properly and nested containers don't block scrolling.
"""

from playwright.sync_api import sync_playwright
import time
import sys
import io

# Set UTF-8 output for better compatibility
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_scroll_functionality():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("[*] Loading application at http://localhost:3013...")
        page.goto('http://localhost:3013', wait_until='networkidle')

        # Take initial screenshot
        page.screenshot(path='scroll-test-initial.png', full_page=True)
        print("[+] Saved initial screenshot: scroll-test-initial.png")

        # Wait for page to be fully loaded
        time.sleep(2)

        # Get main element's computed styles
        main_element = page.locator('main').first

        print("\n[CHECK] Main element styles:")

        # Check overflow-y property
        overflow_y = page.evaluate('window.getComputedStyle(document.querySelector("main")).overflowY')
        print(f"  - overflow-y: {overflow_y}")

        # Check overflow-x property
        overflow_x = page.evaluate('window.getComputedStyle(document.querySelector("main")).overflowX')
        print(f"  - overflow-x: {overflow_x}")

        # Check if main element is scrollable
        is_scrollable = page.evaluate('''
            () => {
                const main = document.querySelector('main');
                return {
                    scrollHeight: main.scrollHeight,
                    clientHeight: main.clientHeight,
                    isScrollable: main.scrollHeight > main.clientHeight
                };
            }
        ''')

        print(f"  - scrollHeight: {is_scrollable['scrollHeight']}px")
        print(f"  - clientHeight: {is_scrollable['clientHeight']}px")
        print(f"  - isScrollable: {is_scrollable['isScrollable']}")

        # Test scrolling capability
        if is_scrollable['isScrollable']:
            print("\n[OK] Main element IS scrollable (scrollHeight > clientHeight)")

            # Try to scroll and check if scroll works
            initial_scroll = page.evaluate('document.querySelector("main").scrollTop')
            print(f"\n[TEST] Testing scroll action:")
            print(f"  - Initial scrollTop: {initial_scroll}")

            # Perform scroll
            page.evaluate('document.querySelector("main").scrollTop = 100')
            time.sleep(0.5)

            after_scroll = page.evaluate('document.querySelector("main").scrollTop')
            print(f"  - After scroll command: {after_scroll}px")

            if after_scroll > initial_scroll:
                print("  [SUCCESS] Scroll works - Main element successfully scrolled!")
            else:
                print("  [FAIL] Scroll failed - Main element did not scroll")
        else:
            print("\n[WARN] Main element is NOT scrollable (content fits in viewport)")
            print("  This is expected if page content is short")

        # Check for CSS conflicts
        print("\n[CHECK] Looking for CSS conflicts:")

        has_important_rules = page.evaluate('''
            () => {
                const main = document.querySelector('main');
                const styles = window.getComputedStyle(main);
                const computed = {
                    overflowY: styles.overflowY,
                    overflowX: styles.overflowX,
                    display: styles.display,
                    flex: styles.flex
                };

                // Check if styles are being overridden by !important rules
                const stylesheets = document.styleSheets;
                let hasOverflowHidden = false;

                try {
                    for (let i = 0; i < stylesheets.length; i++) {
                        try {
                            const rules = stylesheets[i].cssRules || stylesheets[i].rules;
                            for (let j = 0; j < rules.length; j++) {
                                const rule = rules[j];
                                if (rule.selectorText && rule.selectorText.includes('main')) {
                                    if (rule.style.overflow === 'hidden' && rule.style.getPropertyPriority('overflow') === 'important') {
                                        hasOverflowHidden = true;
                                    }
                                }
                            }
                        } catch (e) {
                            // Cross-origin stylesheets can't be accessed
                        }
                    }
                } catch (e) {
                    console.error('Error checking stylesheets:', e);
                }

                return {
                    computed,
                    hasOverflowHidden
                };
            }
        ''')

        print(f"  - overflow-y is: {has_important_rules['computed']['overflowY']}")
        print(f"  - overflow-x is: {has_important_rules['computed']['overflowX']}")

        if has_important_rules['hasOverflowHidden']:
            print("  [FAIL] Found 'overflow: hidden !important' on main (BLOCKS SCROLLING)")
        else:
            print("  [OK] No conflicting 'overflow: hidden !important' on main")

        # Check for nested scroll containers
        print("\n[CHECK] Looking for nested scroll containers:")

        nested_scrolls = page.evaluate('''
            () => {
                const main = document.querySelector('main');
                if (!main) return [];

                const children = main.querySelectorAll('[style*="overflow"]');
                const results = [];

                children.forEach((child, index) => {
                    const overflow = window.getComputedStyle(child).overflow;
                    const overflowY = window.getComputedStyle(child).overflowY;
                    if (overflow.includes('auto') || overflow.includes('scroll') || overflowY.includes('auto') || overflowY.includes('scroll')) {
                        results.push({
                            index,
                            tag: child.tagName,
                            className: child.className,
                            overflowY,
                            overflow
                        });
                    }
                });

                return results;
            }
        ''')

        if nested_scrolls:
            print(f"  [INFO] Found {len(nested_scrolls)} nested scrollable container(s):")
            for scroll in nested_scrolls:
                print(f"    - <{scroll['tag']}> class='{scroll['className']}' (overflow-y: {scroll['overflowY']})")
        else:
            print("  [OK] No nested scrollable containers found (good!)")

        # Check fixed elements
        print("\n[CHECK] Checking fixed elements:")

        fixed_elements = page.locator('main *:not(main) >> css=[style*="position: fixed"]').count()
        print(f"  - Fixed elements inside main: {fixed_elements} (should be 0)")

        # Look for MiniPlayer and BottomNav outside main
        miniplayer = page.locator('[data-testid="mini-player"]').count()
        bottomnav = page.locator('nav[aria-label="Bottom navigation"]').count()

        print(f"  - MiniPlayer found: {miniplayer > 0}")
        print(f"  - BottomNav found: {bottomnav > 0}")

        # Navigation test
        print("\n[TEST] Testing navigation:")

        # Try to click Topics in bottom nav
        topics_button = page.locator('nav[aria-label="Bottom navigation"] button:has-text("Topics")')
        if topics_button.count() > 0:
            print("  - Topics button found, clicking...")
            topics_button.first.click()
            time.sleep(1)

            page.screenshot(path='scroll-test-topics.png', full_page=True)
            print("  [OK] Topics page loaded - Screenshot: scroll-test-topics.png")

            # Check if scrollable on topics page
            topics_scrollable = page.evaluate('''
                () => {
                    const main = document.querySelector('main');
                    return {
                        scrollHeight: main.scrollHeight,
                        clientHeight: main.clientHeight,
                        isScrollable: main.scrollHeight > main.clientHeight
                    };
                }
            ''')

            print(f"  - Topics page scrollable: {topics_scrollable['isScrollable']}")
            if topics_scrollable['isScrollable']:
                print(f"    - scrollHeight: {topics_scrollable['scrollHeight']}px")
                print(f"    - clientHeight: {topics_scrollable['clientHeight']}px")
        else:
            print("  [WARN] Topics button not found in bottom navigation")

        print("\n" + "="*60)
        print("[COMPLETE] Scroll fix verification completed")
        print("="*60)

        browser.close()

if __name__ == '__main__':
    test_scroll_functionality()
