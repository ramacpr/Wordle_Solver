const fileSystem = require('fs')
const jsonFile = require('jsonfile');
const Words = require('./words');

module.exports = class WordFrequency{
    constructor(){
        this.wordFrequencyMap = new Map()
    }

    beginProcess(letterFrequenciesMap){
        for(var rawWord of Words.GetRawWords){
            // skip adding weights if letter occures more than once
            //console.log('----------------------------------')
            //console.log(rawWord)
            let wFreq = 0
            let letterSet = new Set()
            for(var alphabet of rawWord){
                if(letterSet.has(alphabet)) {
                    continue
                }
                let freq = letterFrequenciesMap.get(alphabet)                
                wFreq += freq
                letterSet.add(alphabet)
                //console.log(alphabet + ' - ' + freq + '.... ' + wFreq)
            }
            this.wordFrequencyMap.set(rawWord, wFreq)
            //console.log(rawWord + ' - ' + wFreq)
        }
        this.printAllLetterFrequencies()
    }

    setWordFreqMap(map){
        this.wordFrequencyMap = map
    }

    printAllLetterFrequencies(){
        let json = JSON.stringify([...this.wordFrequencyMap]);
        fileSystem.writeFileSync('.\\data\\wordFrequencies.json', json, 'utf8', (err) => {
            if (err) throw err;
            console.log('word frequency file has been saved!');
        });
    }
}