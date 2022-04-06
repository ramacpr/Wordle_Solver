const fileSystem = require('fs')
const jsonFile = require('jsonfile');
const Words = require('./words');

module.exports = class LetterFrequency{
    constructor(){
        this.letterFrequencyMap = new Map()
    }

    setLetterFreqMap(map){
        this.letterFrequencyMap = map
    }

    beginProcess(){
        for(var rawWord of Words.GetRawWords){
            // how many times does a letter occur in all 5
            // letter words...
            for(let alphabet of rawWord){
                this.updateLetterFrequencyBy1(alphabet)
            }
        }
        this.printAllLetterFrequencies()   
    }

    updateLetterFrequencyBy1(letter){
        if(this.letterFrequencyMap.has(letter)){
            this.letterFrequencyMap.set(letter, this.letterFrequencyMap.get(letter) + 1)
        } else {
            this.letterFrequencyMap.set(letter, 1)
        }
    }

    printAllLetterFrequencies(){
        // convert map to json to dump to the file
        let json = JSON.stringify([...this.letterFrequencyMap]);
        fileSystem.writeFileSync('.\\data\\letterFrequencies.json', json, 'utf8', (err) => {
            if (err) throw err;
            //console.log('letter frequency file has been saved!');
        });
    }
}