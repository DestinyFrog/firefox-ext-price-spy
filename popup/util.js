
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
