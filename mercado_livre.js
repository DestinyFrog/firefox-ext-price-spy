
function handle_price(str) {
    if (!str) return null
    const [ reais, centavos ] = str.match(/\d+\w/g)
    if (!reais || !centavos) return null
    return parseFloat(reais+'.'+centavos)
}

async function init() {
    const input = document.querySelector('input#cb1-edit')
    const term = input.value
    if (!term) return

    const products = {}
    const ol_products = document.querySelectorAll('ol.ui-search-layout li')
    ol_products.forEach(li => {
        const img_product = li.querySelector('img.poly-component__picture')
        const image = img_product?.getAttribute('srcset') ||
            img_product?.getAttribute('src') || null

        const a_title = li.querySelector('h3.poly-component__title-wrapper a.poly-component__title')
        const name = a_title?.innerText
        const link = a_title?.getAttribute('href') || null

        const str_price = li.querySelector('div.poly-price__current span.andes-money-amount')?.getAttribute('aria-label')
        const price = handle_price(str_price)

        const seller = li.querySelector('.poly-component__seller')?.innerText
        const review = li.querySelector('.poly-component__review-compacted')?.innerText

        const tags = [
            ... li.querySelectorAll('.poly-rebates__pill'),
            ... li.querySelectorAll('.poly-shipping-v2__item'),
            ... li.querySelectorAll('.poly-component__poly-label'),
        ].map(el => el.innerText)

        if (!price || !link || !name || !image) return

        products[link] = { name, link, image, price, seller, review, tags, source: "mercado_livre" }
    })

    const old_data = await browser.storage.local.get('mercado-livre-products') || {}
    const new_data = { ... old_data['mercado-livre-products'], ... products }
    await browser.storage.local.set({ 'mercado-livre-products': new_data })

    console.log(`🕵️‍♀️✅ spied ${Object.keys(new_data).length} new itens`)
}

if (document.body)
    init()
else
    document.addEventListener('DOMContentLoaded', init)