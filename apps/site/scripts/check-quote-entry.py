"""Production preview regression: python3 scripts/check-quote-entry.py [url].
Requires separately installed Python Playwright and Chromium.
"""
import sys
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.add_init_script('Math.random = () => 0.4')
    page.goto(sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4325/')
    def assert_entry():
        page.wait_for_timeout(250)
        result = page.evaluate('''() => {
          const stage = getComputedStyle(document.querySelector('.quote-stage'));
          const slide = document.querySelector('.quote-slide.is-active');
          const chars = [...slide.querySelectorAll('.quote-char')];
          return {stageFade: stage.transitionDuration,
            wrapperOpacity: getComputedStyle(slide).opacity,
            letters: chars.map(e => ({opacity: +getComputedStyle(e).opacity,
              transform: getComputedStyle(e).transform}))};
        }''')
        assert result['stageFade'] == '0s', result
        assert result['wrapperOpacity'] == '1', result
        letters = result['letters']
        assert 0 < letters[0]['opacity'] < 1, result
        assert letters[0]['opacity'] > letters[-1]['opacity'], result
        assert letters[0]['transform'] != 'none', result
        print('PASS: no wrapper fade; staggered letters caught mid-transition')
    page.wait_for_function('!document.documentElement.classList.contains("hero-quote-loading")')
    assert_entry()
    first = page.locator('.quote-slide.is-active').get_attribute('data-index')
    page.wait_for_function('(first)=>document.querySelector(".quote-slide.is-active").dataset.index!==first', arg=first)
    assert_entry()
    page.reload()
    page.wait_for_function('!document.documentElement.classList.contains("hero-quote-loading")')
    assert_entry()
    page.emulate_media(reduced_motion='reduce')
    page.reload()
    assert page.locator('.is-active .quote-char').evaluate_all('(es)=>es.every(e=>getComputedStyle(e).opacity==="1")')
    assert page.locator('.quote-stage').is_visible()
    print('PASS: reduced motion visible')
    browser.close()
