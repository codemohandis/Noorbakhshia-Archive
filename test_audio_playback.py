#!/usr/bin/env python3
"""
Test audio playback from Archive.org collections in the Dars-e-Noorbakhshia PWA
"""

import time
import sys
from pathlib import Path

# Add scripts to path
scripts_path = Path(__file__).parent / '.claude' / 'skills' / 'webapp-testing' / 'scripts'
sys.path.insert(0, str(scripts_path))

from playwright.sync_api import sync_playwright, Page
from with_server import ServerManager

def test_audio_playback():
    """Test audio playback functionality"""

    # Use the with_server helper to manage dev server
    manager = ServerManager()
    manager.add_server('npm run dev', port=5175, cwd='.')
    manager.add_server('npm run preview', port=4173, cwd='.', conditional=False)

    with manager.run():
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)  # Show browser for testing
            page = browser.new_page()

            try:
                print("🌐 Navigating to app...")
                page.goto('http://localhost:5175')
                page.wait_for_load_state('networkidle')
                print("✅ App loaded")

                # Take screenshot of home
                print("\n📸 Taking screenshot of home...")
                page.screenshot(path='/tmp/home.png', full_page=True)
                print("✅ Screenshot saved to /tmp/home.png")

                # Wait for collections to load
                print("\n⏳ Waiting for collections to load...")
                page.wait_for_timeout(2000)

                # Find and click on first collection
                print("\n🔍 Looking for collections...")
                collection_buttons = page.locator('[role="button"]:has-text("Bāb al-Ṭahārah")').all()

                if not collection_buttons:
                    print("❌ No collections found, trying alternative selector...")
                    collection_buttons = page.locator('a:has-text("Bāb al-Ṭahārah")').all()

                if collection_buttons:
                    print(f"✅ Found {len(collection_buttons)} collection buttons")
                    print("🎯 Clicking first collection...")
                    collection_buttons[0].click()
                    page.wait_for_load_state('networkidle')
                    print("✅ Collection page loaded")

                    page.screenshot(path='/tmp/collection.png', full_page=True)

                    # Find and click on first lecture
                    print("\n🎵 Looking for lectures...")
                    lecture_buttons = page.locator('[role="button"][class*="lecture"], a[class*="lecture"]').all()

                    if lecture_buttons:
                        print(f"✅ Found {len(lecture_buttons)} lectures")
                        print("▶️  Clicking first lecture to play...")
                        lecture_buttons[0].click()
                        page.wait_for_load_state('networkidle')
                        page.wait_for_timeout(3000)  # Wait for audio to start loading

                        print("✅ Lecture page loaded")
                        page.screenshot(path='/tmp/player.png', full_page=True)

                        # Check player state
                        print("\n🎮 Checking player state...")
                        player_state = page.evaluate('''
                            () => {
                                const audio = document.querySelector('audio');
                                if (!audio) return { exists: false };
                                return {
                                    exists: true,
                                    src: audio.src,
                                    duration: audio.duration,
                                    currentTime: audio.currentTime,
                                    paused: audio.paused,
                                    networkState: audio.networkState,
                                    readyState: audio.readyState,
                                    error: audio.error ? audio.error.message : null
                                };
                            }
                        ''')

                        print(f"📊 Audio element state:")
                        for key, value in player_state.items():
                            print(f"   {key}: {value}")

                        if player_state.get('exists'):
                            # Try clicking play button
                            print("\n⏯️  Looking for play button...")
                            play_buttons = page.locator('button[aria-label*="Play"], button[aria-label*="play"]').all()

                            if play_buttons:
                                print(f"✅ Found play button(s)")
                                print("▶️  Clicking play...")
                                play_buttons[0].click()
                                page.wait_for_timeout(2000)

                                # Check if playing
                                is_playing = page.evaluate('''
                                    () => {
                                        const audio = document.querySelector('audio');
                                        return audio ? !audio.paused : false;
                                    }
                                ''')

                                if is_playing:
                                    print("✅ Audio is playing!")

                                    # Check for any console errors
                                    print("\n📋 Checking for console errors...")
                                    page.on("console", lambda msg: print(f"   Console: {msg.text}"))

                                    # Wait a bit to let audio play
                                    page.wait_for_timeout(3000)

                                    final_state = page.evaluate('''
                                        () => {
                                            const audio = document.querySelector('audio');
                                            if (!audio) return { error: 'audio not found' };
                                            return {
                                                currentTime: audio.currentTime,
                                                duration: audio.duration,
                                                paused: audio.paused,
                                                buffered: audio.buffered.length > 0 ? `${audio.buffered.end(0)}s buffered` : 'nothing'
                                            };
                                        }
                                    ''')

                                    print(f"\n✅ Final state after 3s playback:")
                                    for key, value in final_state.items():
                                        print(f"   {key}: {value}")

                                    if final_state.get('currentTime', 0) > 0:
                                        print("\n🎉 SUCCESS: Audio playback is working!")
                                    else:
                                        print("\n⚠️  Audio loaded but didn't play")
                                else:
                                    print("❌ Audio not playing after clicking play")
                            else:
                                print("❌ No play button found")
                        else:
                            print("❌ No audio element found")
                    else:
                        print("❌ No lectures found")
                else:
                    print("❌ No collections found to test")

                # Final screenshot
                page.screenshot(path='/tmp/final.png', full_page=True)
                print("\n📸 Final screenshot saved to /tmp/final.png")

            finally:
                browser.close()

if __name__ == '__main__':
    test_audio_playback()
