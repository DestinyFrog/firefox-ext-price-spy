
function handle_price(str) {
    if (!str) return null
    return parseFloat(str.replace('R$', '').trim().replace(',', '.'))
}

async function init() {
    const input = document.querySelector('input[placeholder="Pesquisar Amazon.com.br"]')
    const term = input.value
    if (!term) return

    const products = {}
    const div_products = document.querySelectorAll('div.desktop-grid-content-view')
    div_products.forEach(li => {
        const img_product = li.querySelector('img')
        const image = img_product.getAttribute('srcset') ||
                img_product?.getAttribute('src') || null

        const card_url = li.querySelector('span[data-component-type="s-product-image"] a')
        const link = card_url ? "https://www.amazon.com.br"+card_url.getAttribute('href') : null

        const h2_product_title = li.querySelector('h2')
        const name = h2_product_title?.innerText || null

        const div_price = li.querySelector('span.a-offscreen')
        const str_price = div_price?.innerText || null
        const price = handle_price(str_price)

        const div_review = li.querySelector('div[data-cy="reviews-block"] span')
        const review = div_review?.innerText || null

        const tags = [
            ... li.querySelectorAll('div[data-cy="delivery-recipe"]'),
            ... li.querySelectorAll('div.a-color-secondary'),
            ... li.querySelectorAll('.a-link-normal.a-size-base'),
        ].map(el => el?.innerText || null)

        if (!price || !name || !link || !image) return

        products[link] = { name, price, image, review, tags, link, source: "amazon" }
    })

    const old_data = await browser.storage.local.get('amazon-products') || {}
    const new_data = { ... old_data['amazon-products'], ... products }
    await browser.storage.local.set({ 'amazon-products': new_data })

    console.log(`🕵️‍♀️✅ spied ${Object.keys(new_data).length} new itens`)
}

if (document.body)
    init()
else
    document.addEventListener('DOMContentLoaded', init)