
const DEBUG = true

const log = (...args) => DEBUG && console.log('🕵️‍♀️ [spy]', ...args)
const warn = (...args) => DEBUG && console.warn('🕵️‍♀️ [spy]', ...args)

function money_to_float(str) {
    if (!str) return null

    if (
        str.match(/(\d+ reais e \d+ centavos)/g) ||
        str.match(/(\d+ reais)/g)
    ) {
        const [reais, centavos = '0'] = str.match(/\d+\w/g)
        if (!reais) return null
        return parseFloat(reais + '.' + centavos)
    }

    if (str.match(/(R\$\s?[\d+\.]*\d+,\d+)/g)) {
        return parseFloat(str.replace('R$', '').trim().replace('.', '').replace(',', '.'))
    }

    if (str.match(/(R\$\s?\d+\.\d+)/g)) {
        return parseFloat(str.replace('R$', '').trim())
    }

    return parseFloat(str)
}

function wait_for_element(selector, interval = 100) {
    return new Promise(resolve => {
        const check = setInterval(() => {
            const el = document.querySelector(selector)
            if (el) { clearInterval(check); resolve(el) }
        }, interval)
    })
}

function boot(fn) {
    if (!window.indexedDB) {
        warn("Sorry! Your browser does not support IndexedDB")
        return
    }

    if (document.body)
        fn()
    else
        document.addEventListener('DOMContentLoaded', fn)
}

function format_date_time(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');

    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1); // months are 0-based
    const dd = pad(date.getDate());
    const HH = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());

    return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
}
