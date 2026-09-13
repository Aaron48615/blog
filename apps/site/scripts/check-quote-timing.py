"""Run against the production preview: python3 scripts/check-quote-timing.py [url].
Requires the separately installed Python Playwright and Chromium (no app dependency).
"""
import sys
from playwright.sync_api import sync_playwright

url = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4325/'
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto(url)
    page.wait_for_timeout(2200)
    page.mouse.move(8, 8)
    index = lambda: page.locator('.quote-slide.is-active').get_attribute('data-index')
    outside = index()
    page.wait_for_timeout(5700)
    assert index() != outside, 'Carousel stopped even with pointer outside quote'
    page.locator('#quote-carousel').hover()
    hovered = index()
    page.wait_for_timeout(5700)
    assert index() != hovered, 'FAIL: quote remains unchanged while pointer rests on the quote'
    print('PASS: carousel advances with pointer outside and inside the quote')
    browser.close()
