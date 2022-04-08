const letterJson = require('./data/letterFrequencies.json')
const wordJson = require('./data/wordFrequencies.json')
const LetterFrequency = require('./LetterFreqProcessor');
const WordFrequency = require('./WordFreqProcessor');
const Words = require('./words');
let lfm = new LetterFrequency();
let wfm = new WordFrequency();
let wordMap = null;

module.exports = {
    getAllWordFrequencies: function(){
        wfm.setWordFreqMap(new Map(wordJson))
        return wfm.wordFrequencyMap
    },

    getNextGuessWord: function(wordMap, green, yellow, black, usedWord){
        return getNextGuess(wordMap, green, yellow, black, usedWord)
    }
}

function updateAllFrequencies(){
    lfm.setLetterFreqMap(new Map(letterJson))
    wfm.setWordFreqMap(new Map(wordJson))
}

function getNextGuess(wordMap, green, yellow, black, usedWord){
    let highestProbableWord = ''
    if((green === undefined || green === null || green.size === 0) && (yellow === undefined || yellow === null || yellow.size === 0) && (black === undefined || black === null || black.size === 0)){
        return ['plumb', wordMap]
    } else {
        let filteredGreenResults = green.size === 0 ? wordMap : filterForGreen(green, wordMap)
        console.log('after green filter... ' + filteredGreenResults.size + ' possibilities')
        if(filteredGreenResults.size === 1){
            highestProbableWord = getHighestProbableWord(filteredGreenResults, usedWord)
            return [highestProbableWord, filteredGreenResults]
        }

        let filteredBlackResults = black.size === 0 ? filteredGreenResults : filterForBlack(black, filteredGreenResults)
        console.log('after black filter... ' + filteredBlackResults.size + ' possibilities')
        if(filteredBlackResults.size === 1){
            highestProbableWord = getHighestProbableWord(filteredBlackResults, usedWord)
            return [highestProbableWord, filteredBlackResults]
        }

        let filteredResults = yellow.size === 0 ? filteredBlackResults : filterForYellow(yellow, filteredBlackResults)
        console.log('after yellow filter... ' + filteredResults.size + ' possibilities')
        if(filteredResults.size === 1){
            highestProbableWord = getHighestProbableWord(filteredResults, usedWord)
            return [highestProbableWord, filteredResults]
        }

        highestProbableWord = getHighestProbableWord(filteredResults, usedWord)
        return [highestProbableWord, filteredResults]
    }   
}

function getHighestProbableWord(wordMap, usedWord){
    let maxFreq = 0;
    let maxWord = ''
    wordMap.forEach(function(value, key){
        if(!usedWord.has(key) && value > maxFreq){
            maxFreq = value
            maxWord = key
        }
    })
    return maxWord
}

// return the list of words with the letters at the specified position
function filterForGreen(greenAplhabetPosMap, wordMap){
    let result = new Map()
    let applyGreenFilter = getGreenFilterToExecute(greenAplhabetPosMap)
    wordMap.forEach(function(value, key){
        // key is the word and value its frequency
        if(applyGreenFilter(key) == true){
            result.set(key, value)
        }
    })

    return result
}

function getGreenFilterToExecute(greenAplhabetPosMap){
    let result = null
    let comparisonStatement = '', functionBody = ''
    // build the compare statement based on input
    // as a function... 
    // here key is alphabet and value is position
    greenAplhabetPosMap.forEach(function(value, key){
        if(comparisonStatement !== ''){
            comparisonStatement += ' && '
        }
        comparisonStatement += 'word[' + value + '] === "' + key + '"';
    })

    functionBody = 'if(' + comparisonStatement + '){return true}else{return false}'
    result = new Function('word', functionBody)
    return result
}

// return the list of words with the letters NOT present at the specified position
function filterForBlack(blackAplhabetPosMap, wordMap){
    let result = new Map()
    let applyBlackFilter = getBlackFilterToExecute(blackAplhabetPosMap)
    wordMap.forEach(function(value, key){
        // key is the word and value its frequency
        if(applyBlackFilter(key) == true){
            result.set(key, value)
        }
    })

    return result
}

function getBlackFilterToExecute(blackAplhabetPosMap){
    let result = null
    let comparisonStatement = '', functionBody = ''

    // build the compare statement based on input
    // as a function... 
    // here key is alphabet and value is position
    blackAplhabetPosMap.forEach(function(value, key){
        if(comparisonStatement !== ''){
            comparisonStatement += ' && '
        }
        comparisonStatement += '!word.includes("' + key + '")';
    })

    functionBody = 'if(' + comparisonStatement + '){return true}else{return false}'
    result = new Function('word', functionBody)
    return result
}

// return the list of words with the letters present in the word but not at that position
function filterForYellow(yellowAplhabetPosMap, wordMap){
    let result = new Map()
    let applyYellowFilter = getYellowFilterToExecute(yellowAplhabetPosMap)
    wordMap.forEach(function(value, key){
        // key is the word and value its frequency
        if(applyYellowFilter(key) == true){
            result.set(key, value)
        }
    })

    return result
}

function getYellowFilterToExecute(yellowAplhabetPosMap){
    let result = null
    let comparisonStatement = '', functionBody = ''

    // build the compare statement based on input
    // as a function... 
    // here key is alphabet and value is position
    yellowAplhabetPosMap.forEach(function(value, key){
        if(comparisonStatement !== ''){
            comparisonStatement += ' && '
        }
        comparisonStatement += 'word.includes("' + key + '") && word[' + value + '] !== "'+ key +'"';
    })

    functionBody = 'if(' + comparisonStatement + '){return true}else{return false}'
    result = new Function('word', functionBody)
    return result
}
