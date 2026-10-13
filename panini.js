
async function init() {
    const input = document.getElementById('minisearch-input-top-search')
    const term = input.value
    if (!term) return

    const products = {}
    const ol_products = document.querySelectorAll('ol.products li')
    ol_products.forEach(li => {
        const link = li.querySelector('a.product-item-link').href
        const name = li.querySelector('a.product-item-link').textContent
        const image = li.querySelector('img.product-image-photo').srcset
        const str_price = li.querySelector('span[data-price-type="finalPrice"]').getAttribute('data-price-amount')
        const price = parseFloat(str_price)

        if (!price || !name || !link || !image) return

        products[link] = { name, link, image, price, source: "panini" }
    })

    const old_data = await browser.storage.local.get('panini-products') || {}
    const new_data = { ... old_data['panini-products'], ... products }
    await browser.storage.local.set({ 'panini-products': new_data })

    console.log(`🕵️‍♀️✅ spied ${Object.keys(new_data).length} new itens`)
}

if (document.body)
    init()
else
    document.addEventListener('DOMContentLoaded', init)