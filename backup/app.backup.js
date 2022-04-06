const fileSystem = require('fs');
const LetterFrequency = require('../LetterFreqProcessor');
const WordFrequency = require('../WordFreqProcessor');
const Words = require('../words');
let lfm = new LetterFrequency();
let wfm = new WordFrequency();

class AccuracyInfo{
    constructor(firstGuess, totalWords, correctGuessCount, wrongGuessCount, accuracy, wronglyGuessedWords, distribution){
        this.firstGuess = firstGuess, 
        this.totalWords = totalWords, 
        this.correctGuessCount = correctGuessCount, 
        this.wrongGuessCount = wrongGuessCount,
        this.accuracy = accuracy,
        this.wrongGuessCount = [...wronglyGuessedWords]
        this.distribution = [...distribution]
    }
}
(function(){ 
    // one time only
    updateAllFrequencies()

    let maxGuesses = 6
    let totalWords = 0, correctGuessCount = 0, wrongGuessCount = 0
    let wronglyGuessedWords = []
    let guessDistribution  = new Array(maxGuesses).fill(0)
    let fullReport = []
    let accuracyReport = []
    let highestAccuracy = 0, leastAccuracy = 100
    let highestAccuracyFirstWord = '', leastAccuracyFirstWord = ''

    for(let firstguess of Words.GetSortedRawWords){
        totalWords = 0, correctGuessCount = 0, wrongGuessCount = 0
        guessDistribution  = new Array(maxGuesses).fill(0)
        wronglyGuessedWords = []
        for(var rawWord of Words.GetRawWords){
            let usedWord = new Set()
            let destinationWord = rawWord
            let guessCount = 1
            let greenAplhabetPosMap = null
            let blackAplhabetPosMap = null
            let yellowAplhabetPosMap = null
            let wordMap = new Map(wfm.wordFrequencyMap)
    
            totalWords++;
            while(guessCount <= maxGuesses){
                let guess = getNextGuess(wordMap, greenAplhabetPosMap, yellowAplhabetPosMap, blackAplhabetPosMap, usedWord, firstguess)
                if(guess[0] === destinationWord){
                    //console.log('----- guess ' + guessCount + ' -> ' + guess[0])
                    //console.log('DESTINATION REACHED IN ' + guessCount + ' guesses!')
                    correctGuessCount++;
                    guessDistribution[guessCount - 1]++
                    break;
                } else if(guess[1].size <= 0){
                    //console.log('Hard luck! Could not reach your destination!!!')
                    wrongGuessCount++;
                    wronglyGuessedWords.push(rawWord)
                    break;
                }
                //console.log('----- guess ' + guessCount + ' -> ' + guess[0])
                wordMap = guess[1]
                guessCount++
    
                greenAplhabetPosMap = getGreenMap(guess[0], destinationWord)
                yellowAplhabetPosMap = getYellowMap(guess[0], destinationWord)
                blackAplhabetPosMap = getBlackMap(guess[0], destinationWord)
                usedWord.add(guess[0])
            }
            if(guessCount > maxGuesses){
                //console.log('Out of guesses! Better luck next time...')
                wrongGuessCount++;
                wronglyGuessedWords.push(rawWord)
            }    
        }
        // console.log('---------------------------------------------')
        let accuracy = Math.round((correctGuessCount*100)/totalWords).toPrecision(3)
        if(accuracy > highestAccuracy){
            highestAccuracy = accuracy
            highestAccuracyFirstWord = firstguess
        }
        if(accuracy < leastAccuracy){
            leastAccuracy = accuracy
            leastAccuracyFirstWord = firstguess
        }
        fullReport.push(new AccuracyInfo(firstguess, totalWords, correctGuessCount, wrongGuessCount, accuracy, wronglyGuessedWords, guessDistribution))
        accuracyReport.push([firstguess, accuracy])
        console.log('First guess: ' + firstguess + ' -> Accuracy: ' + accuracy)
        // console.log('Benchmarking Results:')
        // console.log('Total words: ' + totalWords)
        // console.log('Correct guesses: ' + correctGuessCount + ', Wrong guesses: ' + wrongGuessCount)
        // console.log('Guess Distribution...')
        // console.log(guessDistribution)       
    }
    accuracyReport.unshift([highestAccuracyFirstWord, highestAccuracy])
    accuracyReport.unshift([leastAccuracy, leastAccuracyFirstWord])
    // print report to json file
    let json = JSON.stringify(fullReport);
    fileSystem.writeFileSync('.\\Benchmarking\\report.json', json, 'utf8', (err) => {
        if (err) throw err;
        console.log('report file has been saved!');
    });
    json = JSON.stringify(accuracyReport);
    fileSystem.writeFileSync('.\\Benchmarking\\accuracyReport.json', json, 'utf8', (err) => {
        if (err) throw err;
        console.log('accuracy report file has been saved!');
    });
})();

function getNextGuess(wordMap, green, yellow, black, usedWord, firstGuess){
    let highestProbableWord = ''
    if(green === null && yellow === null && black === null){
        highestProbableWord = getHighestProbableWord(wordMap, usedWord)
        return [firstGuess, wordMap]
    } else {
        let filteredGreenResults = green.size === 0 ? wordMap : filterForGreen(green)
        //console.log('after green filter... ' + filteredGreenResults.size + ' possibilities')
        if(filteredGreenResults.size === 1){
            highestProbableWord = getHighestProbableWord(filteredGreenResults, usedWord)
            return [highestProbableWord, filteredGreenResults]
        }

        let filteredBlackResults = black.size === 0 ? filteredGreenResults : filterForBlack(black, filteredGreenResults)
        //console.log('after black filter... ' + filteredBlackResults.size + ' possibilities')
        if(filteredBlackResults.size === 1){
            highestProbableWord = getHighestProbableWord(filteredBlackResults, usedWord)
            return [highestProbableWord, filteredBlackResults]
        }

        let filteredResults = yellow.size === 0 ? filteredBlackResults : filterForYellow(yellow, filteredBlackResults)
        //console.log('after yellow filter... ' + filteredResults.size + ' possibilities')
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

// updates letter and word frequencies if needed and writes to json file
// if json file already present, data will be just read from it
function updateAllFrequencies(){
    // 1. update/get letter frequencies   
    if(!fileSystem.existsSync('./data/letterFrequencies.json')){       
        lfm.beginProcess()
        //console.log('Calculating letter frequencies for the first time...')
    } else { 
        let letterjson = fileSystem.readFileSync('./data/letterFrequencies.json', 'utf8', function readFileCallback(err, data, letterFrequenciesObj){
            if (err){
                console.log(err);
            } 
            });
        lfm.setLetterFreqMap(new Map(JSON.parse(letterjson)))
        //console.log('Letter frequencies fetched from json file...')
    }  
    
    // 2. update/get word frequencies
    if(!fileSystem.existsSync('./data/wordFrequencies.json')){       
       wfm.beginProcess(lfm.letterFrequencyMap)
       //console.log('Calculating word frequencies for the first time...')
    } else {
        let wordjson = fileSystem.readFileSync('./data/wordFrequencies.json', 'utf8', function readFileCallback(err, data, letterFrequenciesObj){
            if (err){
                console.log(err);
            } 
        }) 
        wfm.setWordFreqMap(new Map(JSON.parse(wordjson)));
        //console.log('Word frequencies fetched from json file...')
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
function filterForGreen(greenAplhabetPosMap){
    let result = new Map()
    let applyGreenFilter = getGreenFilterToExecute(greenAplhabetPosMap)

    wfm.wordFrequencyMap.forEach(function(value, key){
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