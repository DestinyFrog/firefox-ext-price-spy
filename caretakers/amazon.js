
function get_image(card) {
    const image = card.querySelector('img')
    if (!image) return null
    return {
        srcset: image.getAttribute('srcset'),
        src: image.getAttribute('src'),
        alt: image.getAttribute('alt'),
    }
}

function get_name(card) {
    const h2_product_title = card.querySelector('h2')
    return h2_product_title?.innerText || null
}

function get_link(card) {
    const card_url = card.querySelector('span[data-component-type="s-product-image"] a')
    return card_url ? "https://www.amazon.com.br"+card_url.getAttribute('href') : null
}

function get_price(card) {
    const div_price = card.querySelector('span.a-offscreen')
    const str_price = div_price?.innerText || null
    if (!str_price) return null
    return parseFloat(str_price.replace('R$', '').trim().replace(',', '.'))
}

function get_extra(card) {
    const div_review = card.querySelector('div[data-cy="reviews-block"] span')
    const review = div_review?.innerText || null

    const tags = [
        ... card.querySelectorAll('div[data-cy="delivery-recipe"]'),
        ... card.querySelectorAll('div.a-color-secondary'),
        ... card.querySelectorAll('.a-link-normal.a-size-base'),
    ].map(el => el?.innerText || null)

    return { tags, review }
}

function get_product_info(card) {
    const image = get_image(card) || {}
    const name = get_name(card)
    const link = get_link(card)
    const price = get_price(card)
    const extra = get_extra(card)

    if (!price || !name || !link || !image) return

    return {
        name, price, ... image, link, extra,
        source: "amazon",
    }
}

async function save_data(term, time, products) {
    const { amazon: data = {} } = await browser.storage.local.get('amazon') || {}

    if (!data['searches'])
        data['searches'] = {}

    data['searches'][time] = term

    if (data['products'])
        data['products'] = { ... data['products'], ... products }
    else
        data['products'] = products

    await browser.storage.local.set({ amazon: data })
}

async function init() {
    const input = document.querySelector('input[placeholder="Pesquisar Amazon.com.br"]')
    const term = input.value
    if (!term) return

    const time = format_date_time()
    const products = {}
    const div_products = document.querySelectorAll('div.desktop-grid-content-view')
    div_products.forEach(card => {
        const product = get_product_info(card)
        if (product)
            products[product.link] = { ...product, time }
    })

    await save_data(term, time, products)
    log(`${Object.values(products).length} new items`)
}

boot(init)