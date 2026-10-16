
function get_image(card) {
    const image = card.querySelector('img.product-image-photo')
    if (!image) return null
    return {
        srcset: image.getAttribute('srcset'),
        src: image.getAttribute('src'),
        alt: image.getAttribute('alt'),
    }
}

function get_name(card) {
    return card.querySelector('a.product-item-link').textContent
}

function get_link(card) {
    return card.querySelector('a.product-item-link').href
}

function get_price(card) {
    const str_price = card.querySelector('span[data-price-type="finalPrice"]').getAttribute('data-price-amount')
    return parseFloat(str_price)
}

function get_extra(card) {
    return Array.from(card.querySelectorAll<HTMLDivElement>('.infobase-label-presale'))
        .map(el => el?.innerText || null)
}

function get_product_info(card) {
    const link = get_link(card)
    const name = get_name(card)
    const image = get_image(card) || {}
    const price = get_price(card)
    const extra = get_extra(card)

    if (!price || !name || !link || !image)
        return null

    return {
        name, link, ... image, price, extra,
        source: "panini",
    }
}

async function save_data(term, time, products) {
    const { panini: data = {} } = await browser.storage.local.get('panini') || {}

    if (!data['searches'])
        data['searches'] = {}
    
    data['searches'][time] = term

    if (data['products'])
        data['products'] = { ... data['products'] , ... products }
    else
        data['products'] = products

    await browser.storage.local.set({ 'panini': data })
}

async function init() {
    const input = document.getElementById('minisearch-input-top-search')
    const term = input.value
    if (!term) return

    const time = format_date_time()
    const products = {}
    const ol_products = document.querySelectorAll('ol.products li')
    ol_products.forEach(card => {
        const product = get_product_info(card)
        if (product)
            products[product.link] = { ...product, time }
    })

    await save_data(term, time, products)
    log(`${Object.values(products).length} new items`)
}

boot(init)