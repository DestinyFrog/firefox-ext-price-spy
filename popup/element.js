
function tr(content = '') {
    return `<tr>${content}</tr>`
}

function td(content = '') {
    return `<td>${content}</td>`
}

function img(src, alt, classes = [], srcset = null) {
    const classes_str = classes.length ? `class="${classes.join(' ')}"` : ''
    const srcset_str = srcset ? `srcset="${srcset}"` : ''
    return `<img src="${src}" alt="${alt}" ${classes_str} ${srcset_str} />`
}

function a(content = '', href = '') {
    return `<a href="${href}">${content}</a>`
}
