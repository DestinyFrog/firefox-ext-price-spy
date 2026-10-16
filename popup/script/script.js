
const inp_search = document.getElementById('inp-search')
inp_search.addEventListener('keydown', ev => ev.key == 'Enter' && search(ev.target.value))

// const but_clear = document.getElementById('but-clear')
// but_clear.addEventListener('click', clear_storage)

async function get_data_by_source(source) {
    const data = await browser.storage.local.get(source)
    return Object.values(data?.[source]?.products || {})
}

function search(term) {
    const products_table_body = document.querySelector('#products-table tbody')
    products_table_body.innerHTML = ''

    const sources = ['mercado_livre', 'panini', 'amazon', 'shopee']

    Promise.all(sources.map(get_data_by_source))
        .then(data => 
            data.flat()
                .filter(product => compare_str(product.name, term) > 60)
                .sort((a, b) => a.price - b.price)
                .map(product => render_product(product))
                .map(el => products_table_body.appendChild(el)))
        .catch(handle_error)
}

async function clear_storage() {
    await browser.storage.local.remove('panini')
    await browser.storage.local.remove('mercado-livre')
    await browser.storage.local.remove('amazon-products')
    await browser.storage.local.remove('shopee-products')
}

function render_product(product) {
    const td_cover = document.createElement('td')
    const img_cover = document.createElement('img')
    td_cover.appendChild(img_cover)
    img_cover.setAttribute('src', product.src)
    img_cover.setAttribute('srcset', product.srcset || null)
    img_cover.setAttribute('alt', product.alt || product.name)

    const td_name = document.createElement('td')
    const a_name = document.createElement('a')
    td_name.appendChild(a_name)
    a_name.innerText = product.name
    a_name.setAttribute('href', product.link)

    const td_money = document.createElement('td')
    td_money.innerText = render_real(product.price)

    const td_source = document.createElement('td')
    const img_source = document.createElement('img')
    td_source.appendChild(img_source)
    img_source.classList = ['logo']

    switch (product.source) {
        case 'mercado_livre':
            img_source.setAttribute('src', 'assets/mercado_livre.svg')
            img_source.setAttribute('alt', 'mercado livre logo')
            break
        case 'amazon':
            img_source.setAttribute('src', 'assets/amazon.svg')
            img_source.setAttribute('alt', 'amazon logo')
            break
        case 'panini':
            img_source.setAttribute('src', 'assets/panini.png')
            img_source.setAttribute('alt', 'panini logo')
            break
        case 'shopee':
            img_source.setAttribute('src', 'assets/shopee.svg')
            img_source.setAttribute('alt', 'shopee logo')
            break
    }
    
    const td_extra = document.createElement('td')
    const ul_extra = document.createElement('ul')
    td_extra.appendChild(ul_extra)

    if (product.extra) {
        if (product.extra.seller) {
            const li_seller = document.createElement('li')
            ul_extra.appendChild(li_seller)
            li_seller.textContent = `Vendedor: ${product.extra.seller}`
        }

        if (product.extra.review) {
            const li_review = document.createElement('li')
            ul_extra.appendChild(li_review)
            li_review.textContent = `Avaliação: ${product.extra.review}`
        }

        if (product.extra.tags) {
            product.extra.tags.forEach(tag => {
                const li_tag = document.createElement('li')
                ul_extra.appendChild(li_tag)
                li_tag.textContent = tag
            })
        }
    }

    const tr = document.createElement('tr')
    tr.appendChild(td_cover)
    tr.appendChild(td_name)
    tr.appendChild(td_money)
    tr.appendChild(td_source)
    tr.appendChild(td_extra)
    return tr
}

function render_real(real) {
    return 'R$ ' + real.toFixed(2).replace('.', ',')
}

function compare_str(str2, str1) {
    str1 = str1.toLowerCase()
    str2 = str2.toLowerCase()

    const str1_words = str1.split(' ')
    const str1_word_similarity = str1_words.reduce((prev, word) => str2.includes(word) ? prev + word.length : prev, 0)
    const str1_words_len = str1_words.reduce((prev, curr) => prev + curr.length, 0)
    const str1_score = parseInt(str1_word_similarity / str1_words_len * 100)
    
    const str2_words = str2.split(' ')
    const str2_word_similarity = str2_words.reduce((prev, word) => str1.includes(word) ? prev + word.length : prev, 0)
    const str2_words_len = str2_words.reduce((prev, curr) => prev + curr.length, 0)
    const str2_score = parseInt(str2_word_similarity / str2_words_len * 100)

    return parseInt((str1_score + str2_score) / 2)
}

function handle_error(err) {
    document.getElementById('error').textContent += err
    console.error(err)
}