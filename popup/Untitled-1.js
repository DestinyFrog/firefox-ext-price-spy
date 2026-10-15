
function comp_str(str2, str1) {
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
    
    const str1_weight = str1_words_len / (str1.length + str2.length)
    const str2_weight = str2_words_len / (str1.length + str2.length)
    console.log(str1_score * str1_weight)

    return parseInt(str1_score * str1_weight + str2_score * str2_weight)
}

const term = 'absolute batman'

console.log(comp_str("Absolute Batman 6", "absolute batman 6"))
console.log(comp_str("Whisky Americano", "absolute batman"))
console.log(comp_str("Absolute cacador de marte", "absolute batman"))
console.log(comp_str("Absolute batman", "batman"))
console.log(comp_str("batman Absolute", "absolute batman"))