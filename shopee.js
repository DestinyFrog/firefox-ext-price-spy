'use strict';

const STORAGE_KEY = 'shopee-products';
const DEBUG = true;

const log = (...args) => DEBUG && console.log('🕵️‍♀️ [shopee-spy]', ...args);
const warn = (...args) => DEBUG && console.warn('🕵️‍♀️ [shopee-spy]', ...args);

/* ------------------------------------------------------------------ *
 * Price parsing
 * ------------------------------------------------------------------ */

/**
 * Parse a Brazilian-formatted price string into a number.
 * Handles: "R$ 1.234,56", "R$ 12,90", "1.234,56", "12.90", "R$ 1.234"
 * Returns null if it can't parse.
 */
function handle_price(str) {
    if (!str || typeof str !== 'string') return null;

    // Strip currency symbol, non-breaking spaces, and everything except digits/./,
    let cleaned = str
        .replace(/R\$/gi, '')
        .replace(/\u00a0/g, ' ')     // nbsp
        .replace(/[^\d.,]/g, '')
        .trim();

    if (!cleaned) return null;

    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');

    if (hasComma && hasDot) {
        // BR format: 1.234,56 -> dot is thousands, comma is decimal
        // US format: 1,234.56 -> comma is thousands, dot is decimal
        // Decide by which separator comes last.
        if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
            cleaned = cleaned.replace(/,/g, '');
        }
    } else if (hasComma) {
        // Only comma: could be decimal (12,90) or thousands (1,234)
        // Treat as decimal if there are exactly 1-2 digits after it.
        const parts = cleaned.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
            cleaned = parts[0] + '.' + parts[1];
        } else {
            cleaned = cleaned.replace(/,/g, '');
        }
    } else if (hasDot) {
        // Only dot: "1.234" (thousands) vs "12.90" (decimal)
        const parts = cleaned.split('.');
        if (parts.length === 2 && parts[1].length <= 2) {
            // decimal — leave as is
        } else {
            cleaned = cleaned.replace(/\./g, '');
        }
    }

    const value = parseFloat(cleaned);
    return Number.isFinite(value) ? value : null;
}

/* ------------------------------------------------------------------ *
 * Extraction helpers
 * ------------------------------------------------------------------ */

function absoluteUrl(href) {
    if (!href) return null;
    try {
        return new URL(href, location.origin).href;
    } catch {
        return null;
    }
}

/**
 * Normalize a product URL by stripping tracking/query params so the same
 * product doesn't get stored multiple times under different URLs.
 */
function normalizeLink(url) {
    if (!url) return null;
    try {
        const u = new URL(url);
        // Shopee product pages: /product/<shopid>/<itemid>
        const m = u.pathname.match(/\/product\/(\d+)\/(\d+)/);
        if (m) return `${u.origin}/product/${m[1]}/${m[2]}`;
        // Fallback: strip query/hash
        u.search = '';
        u.hash = '';
        return u.href;
    } catch {
        return url;
    }
}

function pickImage(img) {
    if (!img) return null;
    // Prefer the largest srcset entry if present
    const srcset = img.getAttribute('srcset');
    if (srcset) {
        // srcset entries: "url1 1x, url2 2x" or "url1 100w, url2 200w"
        const entries = srcset
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .map(entry => {
                const [url, descriptor] = entry.split(/\s+/);
                const value = descriptor ? parseFloat(descriptor) : 0;
                return { url, value };
            })
            .filter(e => e.url);

        if (entries.length) {
            entries.sort((a, b) => b.value - a.value);
            return entries[0].url;
        }
    }
    return img.getAttribute('src') || img.getAttribute('data-src') || null;
}

function cleanText(str) {
    return str ? str.replace(/\s+/g, ' ').trim() : null;
}

/* ------------------------------------------------------------------ *
 * Card parsing
 * ------------------------------------------------------------------ */

/**
 * Try multiple selector strategies so we're resilient to Shopee changing
 * their markup. Each returns the first non-null value.
 */
function firstMatch(root, selectors, getter) {
    for (const sel of selectors) {
        try {
            const el = root.querySelector(sel);
            if (el) {
                const v = getter(el);
                if (v != null && v !== '') return v;
            }
        } catch {
            // invalid selector; skip
        }
    }
    return null;
}

function parseCard(li) {
    const link = normalizeLink(
        firstMatch(
            li,
            [
                'a.contents',
                'a[href*="/product/"]',
                'a[data-sqe="link"]',
                'a',
            ],
            el => absoluteUrl(el.getAttribute('href'))
        )
    );

    const image = firstMatch(
        li,
        [
            'picture img',
            'img[srcset]',
            'img[src]',
            'img[data-src]',
        ],
        pickImage
    );

    const name = firstMatch(
        li,
        [
            '.whitespace-normal',
            '[data-sqe="name"]',
            'div[class*="line-clamp"]',
            'div[class*="name"]',
        ],
        el => cleanText(el.innerText || el.textContent)
    );

    const priceStr = firstMatch(
        li,
        [
            '[class*="font-medium"]',
            '[class*="price"]',
            'span[aria-label*="R$"]',
        ],
        el => cleanText(el.innerText || el.textContent)
    );

    const price = handle_price(priceStr);

    if (!link || !image || !name || price == null) {
        return null;
    }

    return { name, link, image, price, source: 'shopee' };
}

/* ------------------------------------------------------------------ *
 * Storage
 * ------------------------------------------------------------------ */

async function loadStored() {
    try {
        const data = await browser.storage.local.get(STORAGE_KEY);
        return data?.[STORAGE_KEY] || {};
    } catch (e) {
        warn('failed to read storage:', e);
        return {};
    }
}

async function saveStored(products) {
    try {
        await browser.storage.local.set({ [STORAGE_KEY]: products });
    } catch (e) {
        warn('failed to write storage:', e);
    }
}

/* ------------------------------------------------------------------ *
 * Main scrape
 * ------------------------------------------------------------------ */

function getSearchTerm() {
    // Prefer the input value; fall back to the URL's keyword param.
    const input = document.querySelector(
        'input.shopee-searchbar-input__input, input[name="keyword"], input[type="search"]'
    );
    const fromInput = cleanText(input?.value);
    if (fromInput) return fromInput;

    try {
        const url = new URL(location.href);
        const kw = url.searchParams.get('keyword');
        return kw ? decodeURIComponent(kw) : null;
    } catch {
        return null;
    }
}

async function scrapeOnce() {
    const term = getSearchTerm();
    const cards = document.querySelectorAll(
        'ul.shopee-search-item-result__items > li, [data-sqe="item"]'
    );

    if (!cards.length) return 0;

    const found = {};
    for (const li of cards) {
        const product = parseCard(li);
        if (product) {
            product.term = term || product.term || null;
            product.scrapedAt = Date.now();
            found[product.link] = product;
        }
    }

    const stored = await loadStored();

    // Determine which of `found` are actually new
    let newCount = 0;
    for (const link of Object.keys(found)) {
        if (!stored[link]) newCount++;
    }

    const merged = { ...stored, ...found };
    await saveStored(merged);

    return { newCount, total: Object.keys(merged).length, seen: Object.keys(found).length };
}

/* ------------------------------------------------------------------ *
 * Infinite-scroll observer
 * ------------------------------------------------------------------ */

let scrapeTimer = null;
function scheduleScrape(delay = 400) {
    if (scrapeTimer) clearTimeout(scrapeTimer);
    scrapeTimer = setTimeout(async () => {
        scrapeTimer = null;
        try {
            const res = await scrapeOnce();
            if (res === 0) return;
            const { newCount, total, seen } = res;
            if (newCount > 0) {
                log(`✅ ${newCount} new item(s) — ${seen} on page, ${total} total`);
            } else {
                log(`seen ${seen} item(s), no new ones (${total} total)`);
            }
        } catch (e) {
            warn('scrape failed:', e);
        }
    }, delay);
}

function startObserver() {
    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            if (m.addedNodes && m.addedNodes.length) {
                scheduleScrape();
                return;
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Also react to SPA navigations (search term changes without full reload)
    let lastUrl = location.href;
    setInterval(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            log('URL changed, rescanning');
            scheduleScrape(600);
        }
    }, 1000);
}

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

function boot() {
    log('booting on', location.href);
    scheduleScrape(0);
    startObserver();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
    boot();
}