const fileSystem = require('fs')
const LetterFrequency = require('./LetterFreqProcessor');
const WordFrequency = require('./WordFreqProcessor');
const Words = require('./words');
let lfm = new LetterFrequency();
let wfm = new WordFrequency();
let wordMap = null;
let canLog = false;

(function(){
    
    // one time only
    updateAllFrequencies()

    // after benchmarcking using the word 'plumb' gave the highest accuracy of 76%
    let firstguess = 'plumb', destinationWord = process.argv[2] === '' ? 'stare' : process.argv[2]
    canLog = process.argv[3] === 'true' ? true : false
    console.log('Test destination word: ' + destinationWord)
    if(canLog){
        for(var i=0;i<process.argv.length;i++){
            console.log(process.argv[i]);
        }
    }
    

    if(destinationWord === ''){
        console.log("INVALID DESTINATION WORD: Input empty. Please input a valid word to test.")
    } else if(destinationWord.length != 5 ){
        console.log("INVALID DESTINATION WORD: Input less/more than 5 letters. Please input a valid word to test.")
    }else{
        console.log("----------WORDLE-SOLVER-TEST-MODE---------------\n")
        let maxGuesses = 6, guessCount = 1
        let greenAplhabetPosMap = new Map(), blackAplhabetPosMap = new Map(), yellowAplhabetPosMap = new Map()
        let usedWords = new Set()

        
        wordMap = new Map(wfm.wordFrequencyMap);
        while(guessCount <= maxGuesses){
            let guess = getNextGuess(wordMap, greenAplhabetPosMap, yellowAplhabetPosMap, blackAplhabetPosMap, usedWords, firstguess)
            if(guess[0] === destinationWord){
                consoleLog('----- guess ' + guessCount + ' -> ' + guess[0])
                break;
            } else if(guess[1].size <= 0){
                console.log('Hard luck! Could not reach ' + destinationWord + '!!!')
                break;
            }
            consoleLog('----- guess ' + guessCount + ' -> ' + guess[0])            
            wordMap = guess[1]
            guessCount++
            greenAplhabetPosMap = getGreenMap(guess[0], destinationWord)
            yellowAplhabetPosMap = getYellowMap(guess[0], destinationWord)
            blackAplhabetPosMap = getBlackMap(guess[0], destinationWord)
            usedWords.add(guess[0])
        }
        if(guessCount > maxGuesses){
            console.log('Out of guesses! Better luck next time...')
        } else {
            console.log('Result in ' + guessCount + ' guesses')
        } 
    }
})();

function updateAllFrequencies(){
    // 1. update/get letter frequencies   
    if(!fileSystem.existsSync('./data/letterFrequencies.json')){       
        lfm.beginProcess()
        consoleLog('Calculating letter frequencies for the first time...')
    } else { 
        let letterjson = fileSystem.readFileSync('./data/letterFrequencies.json', 'utf8', function readFileCallback(err, data, letterFrequenciesObj){
            if (err){
                consoleLog(err);
            } 
            });
        lfm.setLetterFreqMap(new Map(JSON.parse(letterjson)))
        consoleLog('Letter frequencies fetched from json file...')
    }  
    
    // 2. update/get word frequencies
    if(!fileSystem.existsSync('./data/wordFrequencies.json')){       
       wfm.beginProcess(lfm.letterFrequencyMap)
       consoleLog('Calculating word frequencies for the first time...')
    } else {
        let wordjson = fileSystem.readFileSync('./data/wordFrequencies.json', 'utf8', function readFileCallback(err, data, letterFrequenciesObj){
            if (err){
                consoleLog(err);
            } 
        }) 
        wfm.setWordFreqMap(new Map(JSON.parse(wordjson)));
        consoleLog('Word frequencies fetched from json file...')
    } 
}

function getNextGuess(wordMap, green, yellow, black, usedWord){
    let highestProbableWord = ''
    if((green === undefined || green === null || green.size === 0) && (yellow === undefined || yellow === null || yellow.size === 0) && (black === undefined || black === null || black.size === 0)){
        return ['plumb', wordMap]
    } else {
        let filteredGreenResults = green.size === 0 ? wordMap : filterForGreen(green, wordMap)
        consoleLog('after green filter... ' + filteredGreenResults.size + ' possibilities')
        if(filteredGreenResults.size === 1){
            highestProbableWord = getHighestProbableWord(filteredGreenResults, usedWord)
            return [highestProbableWord, filteredGreenResults]
        }

        let filteredBlackResults = black.size === 0 ? filteredGreenResults : filterForBlack(black, filteredGreenResults)
        consoleLog('after black filter... ' + filteredBlackResults.size + ' possibilities')
        if(filteredBlackResults.size === 1){
            highestProbableWord = getHighestProbableWord(filteredBlackResults, usedWord)
            return [highestProbableWord, filteredBlackResults]
        }

        let filteredResults = yellow.size === 0 ? filteredBlackResults : filterForYellow(yellow, filteredBlackResults)
        consoleLog('after yellow filter... ' + filteredResults.size + ' possibilities')
        if(filteredResults.size === 1){
            highestProbableWord = getHighestProbableWord(filteredResults, usedWord)
            return [highestProbableWord, filteredResults]
        }

        highestProbableWord = getHighestProbableWord(filteredResults, usedWord)
        return [highestProbableWord, filteredResults]
    }   
}


function getGreenMap(guess, destinationWord){
    let greenResult = new Map()
    for(let index = 0; index < 5; index++){
        if(guess[index] === destinationWord[index]){
            greenResult.set(destinationWord[index], index)
        }
    }
    return greenResult
}
function getYellowMap(guess, destinationWord){
    let yellowResult = new Map()
    for(let index = 0; index < 5; index++){
        if(destinationWord.includes(guess[index]) && destinationWord[index] != guess[index]){
            yellowResult.set(guess[index], index)
        }
    }
    return yellowResult
}
function getBlackMap(guess, destinationWord){
    let blackResult = new Map()
    for(let index = 0; index < 5; index++){
        if(!destinationWord.includes(guess[index])){
            blackResult.set(guess[index], index)
        }
    }
    return blackResult
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

function consoleLog(logMessage){
    if(canLog){
        console.log(logMessage)
    }
}