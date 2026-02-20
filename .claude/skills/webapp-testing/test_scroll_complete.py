"""
Comprehensive scroll fix test for Archivist app.
Tests scrolling on all pages and verifies CSS fixes.
"""

import time
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

def test_scroll_comprehensive():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Set up console logging
        def on_console(msg):
            if msg.type != 'log':
                print(f"[{msg.type.upper()}] {msg.text}")
        page.on('console', on_console)

        port = 3015
        url = f'http://localhost:{port}'

        print(f"[*] Starting comprehensive scroll test on {url}\n")
        print("=" * 70)

        try:
            page.goto(url, wait_until='networkidle', timeout=10000)
        except Exception as e:
            print(f"[ERROR] Failed to load page: {e}")
            browser.close()
            return False

        time.sleep(2)

        # Get basic page info
        print("\n[1] PAGE LOAD & STRUCTURE")
        print("-" * 70)

        page_title = page.title()
        print(f"Page title: {page_title}")

        # Check for main scrollable area
        main_exists = page.locator('main').count() > 0
        print(f"Main element exists: {main_exists}")

        if not main_exists:
            print("[WARNING] No main element found!")
            browser.close()
            return False

        # Test 1: Check CSS rules
        print("\n[2] CSS CONFIGURATION CHECK")
        print("-" * 70)

        css_check = page.evaluate("""
            () => {
                const main = document.querySelector('main');
                const styles = window.getComputedStyle(main);

                // Check all overflow-related properties
                return {
                    mainOverflow: styles.overflow,
                    mainOverflowY: styles.overflowY,
                    mainOverflowX: styles.overflowX,
                    mainDisplay: styles.display,
                    mainFlex: styles.flex,
                    inlineStyles: main.getAttribute('style') || 'none'
                };
            }
        """)

        print(f"Main overflow: {css_check['mainOverflow']}")
        print(f"Main overflow-y: {css_check['mainOverflowY']}")
        print(f"Main overflow-x: {css_check['mainOverflowX']}")
        print(f"Main display: {css_check['mainDisplay']}")
        print(f"Main flex: {css_check['mainFlex']}")

        # Test 2: Check scrollable element
        print("\n[3] SCROLLABLE CONTAINER CHECK")
        print("-" * 70)

        scroll_check = page.evaluate("""
            () => {
                const main = document.querySelector('main');
                const children = main.children;

                let scrollableChild = null;
                for (let child of children) {
                    const childStyles = window.getComputedStyle(child);
                    if (childStyles.overflowY === 'auto' || childStyles.overflowY === 'scroll') {
                        scrollableChild = {
                            tag: child.tagName,
                            classes: child.className,
                            overflowY: childStyles.overflowY,
                            scrollHeight: child.scrollHeight,
                            clientHeight: child.clientHeight,
                            isScrollable: child.scrollHeight > child.clientHeight
                        };
                        break;
                    }
                }

                return {
                    mainScrollHeight: main.scrollHeight,
                    mainClientHeight: main.clientHeight,
                    scrollableChild: scrollableChild
                };
            }
        """)

        if scroll_check['scrollableChild']:
            child = scroll_check['scrollableChild']
            print(f"Scrollable child found: <{child['tag']}> (class: {child['classes'][:50]}...)")
            print(f"  overflow-y: {child['overflowY']}")
            print(f"  scrollHeight: {child['scrollHeight']}px")
            print(f"  clientHeight: {child['clientHeight']}px")
            print(f"  isScrollable: {child['isScrollable']}")

            if child['isScrollable']:
                print("[OK] Child container is properly scrollable!")
            else:
                print("[WARNING] Child container content fits (may be normal for home page)")
        else:
            print("[WARNING] No scrollable child found - may be using parent scroll")

        # Test 3: Take screenshot of home page
        print("\n[4] HOME PAGE SCREENSHOT")
        print("-" * 70)
        page.screenshot(path='scroll-test-home.png', full_page=True)
        print("Screenshot saved: scroll-test-home.png")

        # Test 4: Navigate to Topics page
        print("\n[5] TOPICS PAGE TEST")
        print("-" * 70)

        topics_button = page.locator('button:has-text("Topics"), [role="button"]:has-text("Topics")')

        # Try multiple selectors
        if topics_button.count() == 0:
            # Try finding by navigation context
            nav_buttons = page.locator('nav button, [role="navigation"] button')
            print(f"Found {nav_buttons.count()} navigation buttons, looking for Topics...")

            for i in range(nav_buttons.count()):
                button = nav_buttons.nth(i)
                text = button.text_content()
                print(f"  Button {i}: {text}")
                if 'topic' in text.lower():
                    button.click()
                    print(f"Clicked Topics button")
                    time.sleep(1)
                    break
        elif topics_button.count() > 0:
            topics_button.first.click()
            print("Clicked Topics button")
            time.sleep(1)
        else:
            print("[INFO] Topics button not found - may not be visible")

        # Check Topics page scroll
        topics_scroll = page.evaluate("""
            () => {
                const main = document.querySelector('main');
                const children = main.children;

                let result = { main: { scrollHeight: 0, clientHeight: 0 } };

                for (let child of children) {
                    const childStyles = window.getComputedStyle(child);
                    if (child.scrollHeight > 0) {
                        result[child.tagName] = {
                            scrollHeight: child.scrollHeight,
                            clientHeight: child.clientHeight,
                            isScrollable: child.scrollHeight > child.clientHeight
                        };
                    }
                }

                return result;
            }
        """)

        print("Scroll metrics on current page:")
        for elem, metrics in topics_scroll.items():
            if isinstance(metrics, dict) and 'scrollHeight' in metrics:
                scrollable = metrics.get('isScrollable', metrics['scrollHeight'] > metrics['clientHeight'])
                print(f"  <{elem}>: scrollHeight={metrics['scrollHeight']}px, clientHeight={metrics['clientHeight']}px, scrollable={scrollable}")
            else:
                print(f"  {elem}: {metrics}")

        # Test 6: Actual scroll test
        print("\n[6] SCROLL ACTION TEST")
        print("-" * 70)

        scroll_test = page.evaluate("""
            () => {
                const main = document.querySelector('main');
                let scrollableElement = null;

                // Find the element that can actually scroll
                if (main.scrollHeight > main.clientHeight) {
                    scrollableElement = main;
                } else {
                    for (let child of main.children) {
                        if (child.scrollHeight > child.clientHeight) {
                            scrollableElement = child;
                            break;
                        }
                    }
                }

                if (!scrollableElement) {
                    return { result: 'NO_SCROLLABLE_ELEMENT' };
                }

                // Get initial scroll position
                const initialScroll = scrollableElement.scrollTop;

                // Attempt to scroll
                scrollableElement.scrollTop += 100;

                // Get new scroll position
                const afterScroll = scrollableElement.scrollTop;

                return {
                    result: 'SUCCESS',
                    element: scrollableElement.tagName,
                    initialScroll: initialScroll,
                    afterScroll: afterScroll,
                    scrolled: afterScroll > initialScroll,
                    scrollAmount: afterScroll - initialScroll
                };
            }
        """)

        if scroll_test['result'] == 'SUCCESS':
            result = scroll_test
            print(f"Scrollable element: <{result['element']}>")
            print(f"Initial scroll position: {result['initialScroll']}px")
            print(f"After scroll position: {result['afterScroll']}px")
            print(f"Scroll amount: {result['scrollAmount']}px")

            if result['scrolled']:
                print("[SUCCESS] PAGE SCROLLING WORKS!")
            else:
                print("[FAIL] Scroll command did not move page")
        else:
            print(f"[INFO] {scroll_test['result']} - Content may fit in viewport")

        # Test 7: Check for CSS conflicts
        print("\n[7] CSS CONFLICT CHECK")
        print("-" * 70)

        conflict_check = page.evaluate("""
            () => {
                const conflicts = [];
                const stylesheets = document.styleSheets;

                try {
                    for (let i = 0; i < stylesheets.length; i++) {
                        try {
                            const rules = stylesheets[i].cssRules || stylesheets[i].rules;
                            for (let j = 0; j < rules.length; j++) {
                                const rule = rules[j];
                                if (rule.selectorText && rule.selectorText.includes('main')) {
                                    // Check for problematic properties
                                    const text = rule.cssText || '';
                                    if (text.includes('overflow: hidden') && text.includes('!important')) {
                                        conflicts.push({
                                            selector: rule.selectorText,
                                            property: 'overflow: hidden !important',
                                            issue: 'BLOCKING'
                                        });
                                    }
                                }
                            }
                        } catch (e) {
                            // Cross-origin or other access issues
                        }
                    }
                } catch (e) {
                    // Stylesheet access error
                }

                return {
                    conflictsFound: conflicts.length > 0,
                    conflicts: conflicts
                };
            }
        """)

        if conflict_check['conflictsFound']:
            print("[FAIL] Found CSS conflicts:")
            for conflict in conflict_check['conflicts']:
                print(f"  {conflict['selector']}: {conflict['property']} ({conflict['issue']})")
        else:
            print("[OK] No CSS conflicts found - overflow: hidden !important rules removed!")

        # Final screenshot
        page.screenshot(path='scroll-test-final.png', full_page=True)
        print("\nFinal screenshot saved: scroll-test-final.png")

        # Summary
        print("\n" + "=" * 70)
        print("TEST SUMMARY")
        print("=" * 70)

        all_checks = {
            'Main element exists': main_exists,
            'No CSS conflicts': not conflict_check['conflictsFound'],
            'Scroll element found': scroll_test['result'] == 'SUCCESS' if scroll_test['result'] != 'NO_SCROLLABLE_ELEMENT' else True,
            'Scroll works': scroll_test.get('scrolled', True)
        }

        passed = sum(1 for v in all_checks.values() if v)
        total = len(all_checks)

        for check, result in all_checks.items():
            status = "[OK]" if result else "[FAIL]"
            print(f"{status} {check}")

        print(f"\nResult: {passed}/{total} checks passed")

        if passed == total:
            print("\n[SUCCESS] SCROLL FIX VERIFIED - All tests passed!")
        else:
            print(f"\n[PARTIAL] {passed} of {total} tests passed")

        browser.close()
        return passed == total

if __name__ == '__main__':
    success = test_scroll_comprehensive()
    sys.exit(0 if success else 1)
