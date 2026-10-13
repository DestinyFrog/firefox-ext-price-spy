
const but_clear = document.getElementById('but-clear')
const inp_search = document.getElementById('inp-search')
const products_table_body = document.querySelector('#products-table tbody')

function tr(content = '') {
    return `<tr>${content}</tr>`
}

function td(content = '') {
    return `<td>${content}</td>`
}

function img(srcset, alt, classes = '') {
    return `<img srcset="${srcset}" alt="${alt}" ${classes} />`
}

function a(content = '', href = '') {
    return `<a href="${href}">${content}</a>`
}

function render_product(product) {
    const content = tr(
        td(img(product.image, product.name)) +
        td(a(product.name, product.link)) +
        td(render_real(product.price)) +
        td(render_source(product.source))
    )

    products_table_body.innerHTML += content
}

function render_real(real) {
    return 'R$ ' + real.toFixed(2).replace('.', ',')
}

function render_source(source) {
    switch (source) {
        case 'mercado_livre': return img('mercado_livre.svg', 'mercado livre logo', 'class="logo"')
        case 'amazon': return img('amazon.svg', 'amazon logo', 'class="logo"')
        case 'panini': return img('panini.png', 'panini logo', 'class="logo"')
        case 'shopee': return img('shopee.svg', 'shopee logo', 'class="logo"')
    }
}

function compare_str(str1, str2) {
    return str1.toLowerCase().includes(str2.toLowerCase())
}

async function search(term) {
    let filtered_products = []

    try {
        const { 'panini-products': panini_products } = await browser.storage.local.get('panini-products')
        filtered_products = [
            ... filtered_products,
            ... Object.values(panini_products)
                .filter(product => compare_str(product.name, term))
        ]

        const { 'mercado-livre-products': mercado_livre_products } = await browser.storage.local.get('mercado-livre-products')
        filtered_products = [
            ... filtered_products,
            ... Object.values(mercado_livre_products)
                .filter(product => compare_str(product.name, term))
        ]

        const { 'amazon-products': amazon_products } = await browser.storage.local.get('amazon-products')
        filtered_products = [
            ... filtered_products,
            ... Object.values(amazon_products)
                .filter(product => compare_str(product.name, term))
        ]

        const { 'shopee-products': shopee_products } = await browser.storage.local.get('shopee-products')
        filtered_products = [
            ... filtered_products,
            ... Object.values(shopee_products)
                .filter(product => compare_str(product.name, term))
        ]
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
    await browser.storage.local.set({ 'panini-products': [] })
    await browser.storage.local.set({ 'mercado-livre-products': [] })
    await browser.storage.local.set({ 'amazon-products': [] })
    await browser.storage.local.set({ 'shopee-products': [] })
})