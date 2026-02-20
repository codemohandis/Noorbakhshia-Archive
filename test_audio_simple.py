#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple test for audio playback - designed to work with with_server.py
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright

def test_audio():
    """Test audio playback functionality"""

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        try:
            print("🌐 Navigating to app...")
            page.goto('http://localhost:5176')
            page.wait_for_load_state('networkidle')
            print("✅ App loaded")

            # Take screenshot
            page.screenshot(path='C:\\tmp\\app_home.png', full_page=True)

            # Get available collections from the page
            print("\n📚 Checking page content...")

            # Navigate to library to find collections
            library_link = page.locator('a[href*="/library"], button:has-text("Library")').first
            if library_link.is_visible():
                print("📖 Clicking library link...")
                library_link.click()
                page.wait_for_load_state('networkidle')
                page.screenshot(path='C:\\tmp\\library.png', full_page=True)

            # Wait a moment for content to load
            page.wait_for_timeout(2000)

            # Look for any collection or lecture items
            print("\n🔍 Scanning for interactive elements...")

            # Find clickable items that might be collections/lectures
            clickable_items = page.locator('[role="button"], a[href]').all()
            print(f"Found {len(clickable_items)} clickable items")

            # Try to find and click on something that looks like a lecture
            for idx, item in enumerate(clickable_items[:10]):
                text = item.text_content()
                if text and len(text.strip()) > 0:
                    print(f"  {idx}: {text[:50]}")

            # Try clicking the first link that's not in the header
            print("\n🎯 Attempting to click first collection/lecture...")

            # Look for collection links in the main content
            collection_links = page.locator('main a, main [role="button"]').all()

            if collection_links:
                print(f"✅ Found {len(collection_links)} items in main content")
                first_link = collection_links[0]
                text = first_link.text_content()
                print(f"🎯 Clicking: {text[:50]}")
                first_link.click()
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(2000)
                page.screenshot(path='C:\\tmp\\collection_view.png', full_page=True)

                # Now look for audio player
                print("\n🎵 Checking for audio player...")
                audio_elem = page.query_selector('audio')
                if audio_elem:
                    print("✅ Audio element found!")

                    audio_state = page.evaluate('''
                        () => {
                            const audio = document.querySelector('audio');
                            return {
                                src: audio.src.substring(0, 100),
                                duration: audio.duration,
                                currentTime: audio.currentTime,
                                readyState: audio.readyState,
                                networkState: audio.networkState
                            };
                        }
                    ''')
                    print(f"   Audio state: {audio_state}")
                else:
                    print("❌ No audio element found")

        finally:
            browser.close()

if __name__ == '__main__':
    test_audio()
