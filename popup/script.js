
const but_clear = document.getElementById('but-clear')
const inp_search = document.getElementById('inp-search')
const products_table_body = document.querySelector('#products-table tbody')

function render_product(product) {
    products_table_body.innerHTML += tr(
        td(img(product.src, product.name, [], product.srcset)) +
        td(a(product.name, product.link)) +
        td(render_real(product.price)) +
        td(render_source(product.source))
    )
}

function render_source(source) {
    switch (source) {
        case 'mercado_livre': return img('mercado_livre.svg', 'mercado livre logo', ["logo"])
        case 'amazon': return img('amazon.svg', 'amazon logo', ["logo"])
        case 'panini': return img('panini.png', 'panini logo', ["logo"])
        case 'shopee': return img('shopee.svg', 'shopee logo', ["logo"])
    }
}

async function search(term) {
    let filtered_products = []

    try {
        const panini_data = await browser.storage.local.get('panini')
        const mercado_livre_data = await browser.storage.local.get('mercado_livre')
        const amazon_data = await browser.storage.local.get('amazon')
        const shopee_data = await browser.storage.local.get('shopee')

        filtered_products = [
            ... Object.values(panini_data?.panini?.products || {}),
            ... Object.values(mercado_livre_data?.mercado_livre?.products || {}),
            ... Object.values(amazon_data?.amazon?.products || {}),
            ... Object.values(shopee_data?.shopee?.products || {}),
        ].filter(product => compare_str(product.name, term) > 60)
    }
    catch (err) {
        document.getElementById('a').textContent += err
    }

    filtered_products.sort((a, b) => a.price - b.price)
    products_table_body.innerHTML = ''
    filtered_products.forEach(render_product)
}

inp_search.addEventListener('keydown', (ev) => {
    if (ev.key == 'Enter')
        search(ev.target.value)
})

but_clear.addEventListener('click', async () => {
    await browser.storage.local.remove('panini')
    await browser.storage.local.remove('mercado-livre')
    await browser.storage.local.remove('amazon-products')
    await browser.storage.local.remove('shopee-products')
})