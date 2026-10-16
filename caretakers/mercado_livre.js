
function get_image(card) {
    const image = card.querySelector('img.poly-component__picture')
    if (!image) return null
    return {
        srcset: image.getAttribute('srcset'),
        src: image.getAttribute('src'),
        alt: image.getAttribute('alt'),
    }
}

function get_name(card) {
    const a = card.querySelector('h3.poly-component__title-wrapper a.poly-component__title')
    if (!a) return null
    return a.innerText
}

function get_link(card) {
    const a = card.querySelector('h3.poly-component__title-wrapper a.poly-component__title')
    if (!a) return null
    return a.getAttribute('href') || null
}

function get_price(card) {
    const str_price = card.querySelector('div.poly-price__current span.andes-money-amount')?.getAttribute('aria-label')
    if (!str_price) return null
    const [reais, centavos = '0'] = str_price.match(/\d+\w/g)
    if (!reais) return null
    return parseFloat(reais + '.' + centavos)
}

function get_extra(card) {
    const seller = card.querySelector('.poly-component__seller')?.innerText || null
    const review = card.querySelector('.poly-component__review-compacted')?.innerText || null
    const tags = [
        ... card.querySelectorAll('.poly-rebates__pill'),
        ... card.querySelectorAll('.poly-shipping-v2__item'),
        ... card.querySelectorAll('.poly-component__poly-label'),
    ].map(el => el.innerText)
    return { seller, review, tags }
}

function get_product_info(card) {
    const image = get_image(card) || {}
    const name = get_name(card)
    const link = get_link(card)
    const price = get_price(card)
    const extra = get_extra(card)

    if (!image || !name || !link || !price)
        return null

    return {
        name, link, ... image, price, extra,
        source: "mercado_livre",
    }
}

async function save_data(term, time, products) {
    const { mercado_livre: data = {} } = await browser.storage.local.get('mercado_livre') || {}

    if (!data['searches'])
        data['searches'] = {}

    data['searches'][time] = term

    if (data['products'])
        data['products'] = { ... data['products'] , ... products }
    else
        data['products'] = products

    await browser.storage.local.set({ mercado_livre: data })
}

async function init() {
    const input = document.querySelector('input#cb1-edit')
    const term = input.value
    if (!term) return

    await wait_for_element('ol.ui-search-layout')

    const time = format_date_time()
    const products = {}
    document.querySelectorAll('ol.ui-search-layout li').forEach(card => {
        const product = get_product_info(card)
        if (product)
            products[product.link] = { ...product, time }
    })

    await save_data(term, time, products)
    log(`${Object.values(products).length} new items`)
}

boot(init)