
function get_image(card) {
    const image = card.querySelector('picture img')
    if (!image) return null
    return {
        srcset: image.getAttribute('srcset'),
        src: image.getAttribute('src'),
        alt: image.getAttribute('alt'),
    }
}

function get_name(card) {
    return card.querySelector('div.whitespace-normal').innerText
}

function get_link(card) {
    return "https://shopee.com.br" + card.querySelector('a.contents').href
}

function get_price(card) {
    const div_price = card.querySelector('div.whitespace-normal').nextElementSibling
    if (!div_price) return null
    const str_price = div_price.innerText
    if (!str_price) return null
    return parseFloat(str_price.replace('R$', '').trim().replace(',', '.'))
}

function get_product_info(card) {
    const image = get_image(card) || {}
    const name = get_name(card)
    const link = get_link(card)
    const price = get_price(card)

    if (!price || !name || !link || !image) return null

    return {
        name, price, ... image, link,
        source: "shopee",
    }
}

async function save_data(term, time, products) {
    const { shopee: data = {} } = await browser.storage.local.get('shopee') || {}

    if (!data['searches'])
        data['searches'] = {}

    data['searches'][time] = term

    if (data['products'])
        data['products'] = { ... data['products'], ... products }
    else
        data['products'] = products

    await browser.storage.local.set({ shopee: data })
}

async function init() {
    const input = document.querySelector('input.shopee-searchbar-input__input')
    const term = input.value
    if (!term) return

    await wait_for_element('ul.shopee-search-item-result__items > li')

    const time = format_date_time()
    const products = {}
    const div_products = document.querySelectorAll('ul.shopee-search-item-result__items > li')
    div_products.forEach(card => {
        const product = get_product_info(card)
        if (product)
            products[product.link] = { ...product, time }
    })

    await save_data(term, time, products)
    log(`${Object.values(products).length} new items`)
}

boot(init)