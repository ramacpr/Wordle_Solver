(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
const fileSystem = require('fs')
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
},{"./words":8,"fs":1}],3:[function(require,module,exports){
const fileSystem = require('fs')
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
            //console.log('word frequency file has been saved!');
        });
    }
}
},{"./words":8,"fs":1}],4:[function(require,module,exports){
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
    console.log('in app.js wordMap size: ' + wordMap.size)
    if((green === undefined || green === null || green.size === 0) && (yellow === undefined || yellow === null || yellow.size === 0) && (black === undefined || black === null || black.size === 0)){
        return ['plumb', wordMap]
    } else {
        let filteredGreenResults = green.size === 0 ? wordMap : filterForGreen(green, wordMap)
        console.log(green.size)
        console.log(wordMap.size)
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
    console.log(applyGreenFilter)
    wordMap.forEach(function(value, key){
        // key is the word and value its frequency
        if(applyGreenFilter(key) == true){
            result.set(key, value)
        }
    })

    console.log(result.size)
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
},{"./LetterFreqProcessor":2,"./WordFreqProcessor":3,"./data/letterFrequencies.json":5,"./data/wordFrequencies.json":6,"./words":8}],5:[function(require,module,exports){
module.exports=[["c",475],["i",670],["g",310],["a",975],["r",897],["e",1230],["b",280],["u",466],["t",729],["s",668],["y",424],["h",387],["m",316],["p",365],["w",194],["k",210],["l",716],["f",229],["o",753],["v",152],["d",393],["n",573],["q",29],["j",27],["x",37],["z",40]]
},{}],6:[function(require,module,exports){
module.exports=[["cigar",3327],["rebut",3602],["sissy",1762],["humph",1534],["awake",2609],["blush",2517],["focal",3148],["evade",2750],["naval",2416],["serve",2947],["heath",3321],["dwarf",2688],["model",3408],["karma",2398],["stink",2850],["grade",3805],["quiet",3124],["bench",2945],["abate",3214],["feign",3012],["major",2968],["death",3714],["fresh",3411],["crust",3235],["stool",2866],["colon",2517],["abase",3153],["marry",2612],["react",4306],["batty",2408],["pride",3555],["floss",2366],["helix",3040],["croak",3310],["staff",2601],["paper",3467],["unfed",2891],["whelp",2892],["trawl",3511],["outdo",2341],["adobe",3631],["crazy",2811],["sower",3742],["repay",3891],["digit",2102],["crate",4306],["cluck",1867],["spike",3143],["mimic",1461],["pound",2550],["maxim",1998],["linen",3189],["unmet",3314],["flesh",3230],["booby",1457],["forth",2995],["first",3193],["stand",3338],["belly",2650],["ivory",2896],["seedy",2715],["print",3234],["yearn",4099],["drain",3508],["bribe",3077],["stout",2616],["panel",3859],["crass",3015],["flume",2957],["offal",2673],["agree",3412],["error",2880],["swirl",3145],["argue",3878],["bleed",2619],["delta",4043],["flick",2300],["totem",3028],["wooer",3074],["front",3181],["shrub",2698],["parry",2661],["biome",3249],["lapel",3286],["start",3269],["greet",3166],["goner",3763],["golem",3325],["lusty",3003],["loopy",2258],["round",3082],["audit",3233],["lying",2693],["gamma",1601],["labor",3621],["islet",4013],["civic",1297],["forge",3419],["corny",3122],["moult",2980],["basic",3068],["salad",2752],["agate",3244],["spicy",2602],["spray",3329],["essay",3297],["fjord",2299],["spend",3229],["kebab",2695],["guild",2555],["aback",1940],["motor",2695],["alone",4247],["hatch",2566],["hyper",3303],["thumb",2178],["dowry",2661],["ought",2645],["belch",3088],["dutch",2450],["pilot",3233],["tweed",2546],["comet",3503],["jaunt",2770],["enema",3094],["steed",3020],["abyss",2347],["growl",2870],["fling",2498],["dozen",2989],["boozy",1497],["erode",3273],["world",2953],["gouge",2759],["click",2071],["briar",2822],["great",4141],["altar",3317],["pulpy",1971],["blurt",3088],["coast",3600],["duchy",2145],["groin",3203],["fixer",3063],["group",2791],["rogue",3656],["badly",2788],["smart",3585],["pithy",2575],["gaudy",2568],["chill",2248],["heron",3840],["vodka",2483],["finer",3599],["surer",3261],["radio",3688],["rouge",3656],["perch",3354],["retch",3718],["wrote",3803],["clock",2154],["tilde",3738],["store",4277],["prove",3397],["bring",2730],["solve",3519],["cheat",3796],["grime",3423],["exult",3178],["usher",3648],["epoch",3210],["triad",3664],["break",3592],["rhino",3280],["viral",3410],["conic",2471],["masse",3189],["sonic",3139],["vital",3242],["trace",4306],["using",2687],["peach",3432],["champ",2518],["baton",3310],["brake",3592],["pluck",2232],["craze",3617],["gripe",3472],["weary",3720],["picky",2144],["acute",3875],["ferry",2780],["aside",3936],["tapir",3636],["troll",3095],["unify",2362],["rebus",3541],["boost",2430],["truss",2760],["siege",2878],["tiger",3836],["banal",2544],["slump",2531],["crank",3130],["gorge",3190],["query",3046],["drink",2743],["favor",3006],["abbey",2909],["tangy",3011],["panic",3058],["solar",4009],["shire",3852],["proxy",2476],["point",3090],["robot",2659],["prick",2617],["wince",3142],["crimp",2723],["knoll",2252],["sugar",3316],["whack",2241],["mount",2837],["perky",3126],["could",2803],["wrung",2440],["light",2812],["those",3767],["moist",3136],["shard",3320],["pleat",4015],["aloft",3402],["skill",2264],["elder",3236],["frame",3647],["humor",2819],["pause",3704],["ulcer",3784],["ultra",3783],["robin",3173],["cynic",2142],["aroma",2941],["caulk",2842],["shake",3470],["dodge",2686],["swill",2248],["tacit",2849],["other",3996],["thorn",3339],["trove",3761],["bloke",3189],["vivid",1215],["spill",2419],["chant",3139],["choke",3055],["rupee",2958],["nasty",3369],["mourn",3005],["ahead",2985],["brine",3650],["cloth",3060],["hoard",3405],["sweet",2821],["month",2758],["lapse",3954],["watch",2760],["today",3274],["focus",2591],["smelt",3659],["tease",3602],["cater",4306],["movie",3121],["saute",4068],["allow",2638],["renew",2894],["their",3913],["slosh",2524],["purge",3268],["chest",3489],["depot",3470],["epoxy",2809],["nymph",2065],["found",2414],["shall",2746],["harry",2683],["stove",3532],["lowly",2087],["snout",3189],["trope",3974],["fewer",2550],["shawl",2940],["natal",2993],["comma",2519],["foray",3278],["scare",4245],["stair",3939],["black",2656],["squad",2531],["royal",3765],["chunk",2111],["mince",3264],["shame",3576],["cheek",2302],["ample",3602],["flair",3487],["foyer",3533],["cargo",3410],["oxide",3083],["plant",3358],["olive",3521],["inert",4099],["askew",3277],["heist",3684],["shown",2575],["zesty",3091],["hasty",3183],["trash",3656],["fella",3150],["larva",2740],["forgo",2189],["story",3471],["hairy",3353],["train",3844],["homer",3583],["badge",3188],["midst",2776],["canny",2447],["fetus",3322],["butch",2337],["farce",3806],["slung",2733],["tipsy",2856],["metal",3966],["yield",3433],["delve",2491],["being",3063],["scour",3259],["glass",2669],["gamer",3728],["scrap",3380],["money",3296],["hinge",3170],["album",2753],["vouch",2233],["asset",3602],["tiara",3271],["crept",3696],["bayou",2898],["atoll",3173],["manor",3514],["creak",3787],["showy",2426],["phase",3625],["froth",2995],["depth",3104],["gloom",2095],["flood",2091],["trait",3271],["girth",2993],["piety",3418],["payer",3891],["goose",2961],["float",3402],["donor",2616],["atone",4260],["primo",3001],["apron",3563],["blown",2516],["cacao",2203],["loser",4264],["input",2803],["gloat",3483],["awful",2580],["brink",2630],["smite",3613],["beady",3302],["rusty",3184],["retro",3609],["droll",2759],["gawky",2113],["hutch",2057],["pinto",3090],["gaily",3095],["egret",3166],["lilac",2836],["sever",2947],["field",3238],["fluff",1411],["hydro",2854],["flack",2605],["agape",2880],["voice",3280],["stead",3995],["stalk",3298],["berth",3523],["madam",1684],["night",2669],["bland",2937],["liver",3665],["wedge",2127],["augur",2648],["roomy",2390],["wacky",2278],["flock",2383],["angry",3179],["bobby",1457],["trite",3526],["aphid",2790],["tryst",2718],["midge",2919],["power",3439],["elope",3064],["cinch",2105],["motto",1798],["stomp",2831],["upset",3458],["bluff",1691],["cramp",3028],["quart",3096],["coyly",2368],["youth",2759],["rhyme",3254],["buggy",1480],["alien",4164],["smear",4086],["unfit",2667],["patty",2493],["cling",2744],["glean",3804],["label",3201],["hunky",2060],["khaki",2242],["poker",3455],["gruel",3619],["twice",3298],["twang",2781],["shrug",2728],["treat",3831],["unlit",3154],["waste",3796],["merit",3842],["woven",2902],["octal",3648],["needy",2620],["clown",2711],["widow",2010],["irony",3317],["ruder",2986],["gauze",3021],["chief",2991],["onset",3953],["prize",3202],["fungi",2248],["charm",3050],["gully",1916],["inter",4099],["whoop",1699],["taunt",2743],["leery",3267],["class",2834],["theme",2662],["lofty",2851],["tibia",2654],["booze",2303],["alpha",2443],["thyme",3086],["eclat",4125],["doubt",2621],["parer",3467],["chute",3287],["stick",2752],["trice",4001],["alike",3801],["sooth",2537],["recap",3942],["saint",3615],["liege",2926],["glory",3100],["grate",4141],["admit",3083],["brisk",2725],["soggy",2155],["usurp",2396],["scald",3227],["scorn",3366],["leave",3073],["twine",3396],["sting",2950],["bough",2196],["marsh",3243],["sloth",3253],["dandy",2365],["vigor",2782],["howdy",2151],["enjoy",3007],["valid",2906],["ionic",2471],["equal",3416],["unset",3666],["floor",2595],["catch",2566],["spade",3631],["stein",3870],["exist",3334],["quirk",2272],["denim",3182],["grove",3342],["spiel",3649],["mummy",1206],["fault",3115],["foggy",1716],["flout",2893],["carry",2771],["sneak",3656],["libel",2896],["waltz",2654],["aptly",3209],["piney",3262],["inept",3567],["aloud",3303],["photo",2234],["dream",3811],["stale",4318],["vomit",2620],["ombre",3476],["fanny",2201],["unite",3668],["snarl",3829],["baker",3592],["there",3243],["glyph",2202],["pooch",1980],["hippy",1846],["spell",2979],["folly",2122],["louse",3833],["gulch",2354],["vault",3038],["godly",2596],["threw",3437],["fleet",2904],["grave",3564],["inane",3448],["shock",2493],["crave",3729],["spite",3662],["valve",3073],["skimp",2229],["claim",3152],["rainy",3539],["musty",2603],["pique",2760],["daddy",1792],["quasi",2808],["arise",4440],["aging",2528],["valet",3802],["opium",2570],["avert",3983],["stuck",2548],["recut",3797],["mulch",2360],["genre",3010],["plume",3093],["rifle",3742],["count",2996],["incur",3081],["total",3173],["wrest",3718],["mocha",2906],["deter",3249],["study",2680],["lover",3748],["safer",3999],["rivet",3678],["funny",1692],["smoke",3177],["mound",2501],["undue",2662],["sedan",3839],["pagan",2223],["swine",3335],["guile",3392],["gusty",2597],["equip",2760],["tough",2645],["canoe",4006],["chaos",3258],["covet",3339],["human",2717],["udder",2986],["lunch",2617],["blast",3368],["stray",3693],["manga",2174],["melee",2262],["lefty",3328],["quick",1850],["paste",3967],["given",2935],["octet",3187],["risen",4038],["groan",3508],["leaky",3555],["grind",2843],["carve",3729],["loose",3367],["sadly",3176],["spilt",3148],["apple",3286],["slack",3044],["honey",3367],["final",3163],["sheen",2858],["eerie",2797],["minty",2712],["slick",2739],["derby",3224],["wharf",2682],["spelt",3708],["coach",2590],["erupt",3687],["singe",3451],["price",3637],["spawn",2775],["fairy",3195],["jiffy",1350],["filmy",2355],["stack",3057],["chose",3513],["sleep",2979],["ardor",3018],["nanny",1972],["niece",2948],["woozy",1411],["handy",2752],["grace",3887],["ditto",2545],["stank",3155],["cream",3893],["usual",2825],["diode",3046],["valor",3493],["angle",3804],["ninja",2245],["muddy",1599],["chase",3735],["reply",3632],["prone",3818],["spoil",3172],["heart",4218],["shade",3653],["diner",3763],["arson",3866],["onion",1996],["sleet",3343],["dowel",3286],["couch",2081],["palsy",3148],["bowel",3173],["smile",3600],["evoke",2345],["creek",2812],["lance",3969],["eagle",3231],["idiot",2545],["siren",4038],["built",2861],["embed",2219],["award",2459],["dross",2711],["annul",2730],["goody",1880],["frown",2646],["patio",3492],["laden",3887],["humid",2232],["elite",3345],["lymph",2208],["edify",2946],["might",2412],["reset",3524],["visit",2219],["gusto",2926],["purse",3626],["vapor",3142],["crock",2335],["write",3720],["sunny",2131],["loath",3560],["chaff",2066],["slide",3677],["queer",2622],["venom",3024],["stamp",3053],["sorry",2742],["still",2783],["acorn",3673],["aping",2893],["pushy",2310],["tamer",4147],["hater",4218],["mania",2534],["awoke",3362],["brawn",2919],["swift",2490],["exile",2653],["birch",2709],["lucky",2291],["freer",2356],["risky",2869],["ghost",2847],["plier",3878],["lunar",3627],["winch",2299],["snare",4343],["nurse",3834],["house",3504],["borax",2942],["nicer",3845],["lurch",2941],["exalt",3687],["about",3203],["savvy",2219],["toxin",2762],["tunic",2913],["pried",3555],["inlay",3358],["chump",2009],["lanky",2898],["cress",3270],["eater",3831],["elude",2805],["cycle",2845],["kitty",2033],["boule",3445],["moron",2539],["tenet",2532],["place",3761],["lobby",2173],["plush",2602],["vigil",1848],["index",2903],["blink",2449],["clung",2540],["qualm",2502],["croup",2956],["clink",2644],["juicy",2062],["stage",3912],["decay",3497],["nerve",2852],["flier",3742],["shaft",2988],["crook",2335],["clean",3969],["china",3080],["ridge",3500],["vowel",3045],["gnome",3182],["snuck",2392],["icing",2028],["spiny",2700],["rigor",2630],["snail",3602],["flown",2465],["rabid",3215],["prose",3913],["thank",2874],["poppy",1542],["budge",2679],["fiber",3306],["moldy",2602],["dowdy",1764],["kneel",2729],["track",3286],["caddy",2267],["quell",2441],["dumpy",1964],["paler",4183],["swore",3742],["rebar",3382],["scuba",2864],["splat",3453],["flyer",3496],["horny",3034],["mason",3285],["doing",2699],["ozone",2596],["amply",2796],["molar",3657],["ovary",3201],["beset",2907],["queue",1725],["cliff",2090],["magic",2746],["truce",3797],["sport",3412],["fritz",2565],["edict",3497],["twirl",3206],["verse",2947],["llama",2007],["eaten",3507],["range",3985],["whisk",2129],["hovel",3238],["rehab",3769],["macaw",1960],["sigma",2939],["spout",2981],["verve",2279],["sushi",2191],["dying",2370],["fetid",3251],["brain",3395],["buddy",1563],["thump",2263],["scion",3139],["candy",2840],["chord",2905],["basin",3166],["march",3050],["crowd",2712],["arbor",2905],["gayly",2425],["musky",2084],["stain",3615],["dally",2508],["bless",2894],["bravo",3057],["stung",2746],["title",3345],["ruler",3309],["kiosk",2301],["blond",2715],["ennui",2939],["layer",4242],["fluid",2474],["tatty",2128],["score",4023],["cutie",3570],["zebra",3422],["barge",3692],["matey",3674],["bluer",3589],["aider",4165],["shook",2018],["river",2949],["privy",2508],["betel",2955],["frisk",2674],["bongo",1916],["begun",2859],["azure",3608],["weave",2551],["genie",2783],["sound",2853],["glove",3161],["braid",3215],["scope",3491],["wryly",2231],["rover",3032],["assay",2067],["ocean",4006],["bloom",2065],["irate",4501],["later",4547],["woken",2960],["silky",2688],["wreck",3006],["dwelt",3262],["slate",4318],["smack",2644],["solid",3200],["amaze",2561],["hazel",3348],["wrist",3158],["jolly",1920],["globe",3289],["flint",2917],["rouse",4014],["civil",2013],["vista",3194],["relax",3855],["cover",3507],["alive",3743],["beech",2372],["jetty",2410],["bliss",2334],["vocal",3071],["often",3514],["dolly",2286],["eight",3326],["joker",3117],["since",3616],["event",2684],["ensue",2937],["shunt",2823],["diver",3342],["poser",3913],["worst",3241],["sweep",2457],["alley",3345],["creed",2995],["anime",3764],["leafy",3574],["bosom",2017],["dunce",3137],["stare",4499],["pudgy",1958],["waive",3221],["choir",3182],["stood",2543],["spoke",3226],["outgo",2258],["delay",3738],["bilge",3206],["ideal",3984],["clasp",3199],["seize",2608],["hotly",3009],["laugh",2854],["sieve",2720],["block",2434],["meant",3823],["grape",3777],["noose",3224],["hardy",3076],["shied",3348],["drawl",3175],["daisy",3130],["putty",1984],["strut",2760],["burnt",2945],["tulip",2946],["crick",2252],["idyll",2203],["vixen",2662],["furor",2345],["geeky",2174],["cough",2391],["naive",3600],["shoal",3499],["stork",3257],["bathe",3601],["aunty",3167],["check",2302],["prime",3478],["brass",2820],["outer",4075],["furry",2016],["razor",2665],["elect",3150],["evict",3256],["imply",2491],["demur",3302],["quota",2952],["haven",3317],["cavil",2988],["swear",3964],["crump",2519],["dough",2309],["gavel",3383],["wagon",2805],["salon",3685],["nudge",2972],["harem",3805],["pitch",2626],["sworn",3085],["pupil",2217],["excel",2458],["stony",3147],["cabin",2973],["unzip",2114],["queen",2298],["trout",2845],["polyp",2258],["earth",4218],["storm",3363],["until",3154],["taper",4196],["enter",3429],["child",2641],["adopt",3215],["minor",3209],["fatty",2357],["husky",2155],["brave",3534],["filet",3574],["slime",3600],["glint",2998],["tread",4224],["steal",4318],["regal",4128],["guest",3403],["every",2703],["murky",2313],["share",4157],["spore",3913],["hoist",3207],["buxom",1852],["inner",3370],["otter",3609],["dimly",2519],["level",2098],["sumac",2900],["donut",2914],["stilt",2783],["arena",3675],["sheet",3014],["scrub",2786],["fancy",2676],["slimy",2794],["pearl",4183],["silly",2478],["porch",2877],["dingo",2699],["sepia",3908],["amble",3517],["shady",2847],["bread",3775],["friar",2771],["reign",3680],["dairy",3359],["quill",1881],["cross",2793],["brood",2323],["tuber",3602],["shear",4157],["posit",3185],["blank",2754],["villa",2513],["shank",2813],["piggy",1769],["freak",3541],["which",1726],["among",2927],["fecal",3625],["shell",3001],["would",2522],["algae",3231],["large",4128],["rabbi",2822],["agony",3035],["amuse",3655],["bushy",2225],["copse",3491],["swoon",2188],["knife",2912],["pouch",2446],["ascot",3600],["plane",3859],["crown",2892],["urban",3191],["snide",3534],["relay",4242],["abide",3548],["viola",3266],["rajah",2286],["straw",3463],["dilly",2203],["crash",3402],["amass",1959],["third",3076],["trick",2981],["tutor",2845],["woody",1764],["blurb",2359],["grief",3336],["disco",2959],["where",2708],["sassy",2067],["beach",3347],["sauna",2682],["comic",2214],["clued",3280],["creep",2967],["caste",4077],["graze",3452],["snuff",1936],["frock",2564],["gonad",3004],["drunk",2539],["prong",2898],["lurid",3142],["steel",3343],["halve",3460],["buyer",3297],["vinyl",2535],["utile",3811],["smell",2930],["adage",2908],["worry",2268],["tasty",2796],["local",2919],["trade",4224],["finch",2334],["ashen",3833],["modal",3153],["gaunt",3053],["clove",3326],["enact",3982],["adorn",3591],["roast",4022],["speck",2948],["sheik",3165],["missy",2078],["grunt",2975],["snoop",2359],["party",3390],["touch",2810],["mafia",2190],["emcee",2021],["array",2296],["south",3003],["vapid",2555],["jelly",2397],["skulk",2060],["angst",3255],["tubal",3166],["lower",3790],["crest",3999],["sweat",3796],["cyber",3306],["adore",4248],["tardy",3418],["swami",2823],["notch",2917],["groom",2276],["roach",3487],["hitch",2261],["young",2526],["align",3244],["ready",3919],["frond",2845],["strap",3634],["puree",2958],["realm",4134],["venue",2421],["swarm",3050],["offer",3109],["seven",2623],["dryer",2944],["diary",3359],["dryly",2430],["drank",3048],["acrid",3410],["heady",3409],["theta",3321],["junto",2548],["pixie",2302],["quoth",2364],["bonus",2740],["shalt",3475],["penne",2168],["amend",3487],["datum",2879],["build",2525],["piano",3336],["shelf",3230],["lodge",3402],["suing",2687],["rearm",3418],["coral",3816],["ramen",3991],["worth",2960],["psalm",3040],["infer",3599],["overt",3761],["mayor",3365],["ovoid",1968],["glide",3319],["usage",3649],["poise",3686],["randy",3262],["chuck",1538],["prank",3020],["fishy",2378],["tooth",1869],["ether",3243],["drove",3425],["idler",3906],["swath",2953],["stint",2640],["while",3197],["begat",3524],["apply",2480],["slang",3242],["tarot",3354],["radar",2265],["credo",3748],["aware",3296],["canon",2776],["shift",2683],["timer",3842],["bylaw",2589],["serum",3577],["three",3243],["steak",3812],["iliac",2836],["shirk",2832],["blunt",2764],["puppy",1255],["penal",3859],["joist",2847],["bunny",1743],["shape",3625],["beget",2549],["wheel",2527],["adept",3692],["stunt",2436],["stole",4096],["topaz",2862],["chore",3742],["fluke",2851],["afoot",2686],["bloat",3453],["bully",1886],["dense",2864],["caper",3942],["sneer",3368],["boxer",3197],["jumbo",1842],["lunge",3295],["space",3713],["avail",2513],["short",3434],["slurp",3112],["loyal",2868],["flirt",3241],["pizza",2050],["conch",2188],["tempo",3393],["droop",2408],["plate",4015],["bible",2896],["plunk",2330],["afoul",3139],["savoy",2972],["steep",2992],["agile",3901],["stake",3812],["dwell",2533],["knave",3140],["beard",3775],["arose",4523],["motif",2697],["smash",2346],["broil",3316],["glare",4128],["shove",3190],["baggy",1989],["mammy",1715],["swamp",2518],["along",3327],["rugby",2377],["wager",3606],["quack",2155],["squat",2867],["snaky",2850],["debit",3302],["mange",3404],["skate",3812],["ninth",2359],["joust",2643],["tramp",3282],["spurn",2969],["medal",3630],["micro",3111],["rebel",3123],["flank",2703],["learn",4391],["nadir",3508],["maple",3602],["comfy",2197],["remit",3842],["gruff",1902],["ester",3524],["least",4318],["mogul",2561],["fetch",3050],["cause",3814],["oaken",3741],["aglow",2948],["meaty",3674],["gaffe",2744],["shyly",2195],["racer",3577],["prowl",2925],["thief",3245],["stern",4097],["poesy",3440],["rocky",2759],["tweet",2153],["waist",3236],["spire",3830],["grope",3555],["havoc",2742],["patsy",3161],["truly",3232],["forty",3032],["deity",3446],["uncle",3460],["swish",1919],["giver",3259],["preen",3065],["bevel",2378],["lemur",3625],["draft",3223],["slope",3732],["annoy",2725],["lingo",3022],["bleak",3411],["ditty",2216],["curly",2978],["cedar",3970],["dirge",3500],["grown",2727],["horde",3660],["drool",2759],["shuck",2206],["crypt",2890],["cumin",2500],["stock",2835],["gravy",2758],["locus",3078],["wider",3384],["breed",2800],["quite",3124],["chafe",3296],["cache",3067],["blimp",2347],["deign",3176],["fiend",3095],["logic",2924],["cheap",3432],["elide",3009],["rigid",2270],["false",3818],["renal",4391],["pence",2643],["rowdy",2661],["shoot",2537],["blaze",3241],["envoy",3132],["posse",3016],["brief",3306],["never",2852],["abort",3634],["mouse",3433],["mucky",1891],["sulky",2484],["fiery",3450],["media",3584],["trunk",2875],["yeast",4026],["clear",4293],["skunk",1917],["scalp",3199],["bitty",2103],["cider",3665],["koala",2654],["duvet",2970],["segue",2674],["creme",2918],["super",3626],["grill",2593],["after",4060],["owner",3647],["ember",2723],["reach",3964],["nobly",2746],["empty",3064],["speed",2656],["gipsy",2437],["recur",3068],["smock",2422],["dread",3495],["merge",2753],["burst",3040],["kappa",1550],["amity",3114],["shaky",2664],["hover",3419],["carol",3816],["snort",3620],["synod",2811],["faint",3176],["haunt",3130],["flour",3061],["chair",3404],["detox",3142],["shrew",3376],["tense",3200],["plied",3374],["quark",2577],["burly",2783],["novel",3424],["waxen",3009],["stoic",3295],["jerky",2788],["blitz",2435],["beefy",2163],["lyric",3182],["hussy",1945],["towel",3622],["quilt",2610],["below",3173],["bingo",2586],["wispy",2321],["brash",3207],["scone",3699],["toast",3125],["easel",3589],["saucy",3008],["value",3539],["spice",3408],["honor",2610],["route",4075],["sharp",3292],["bawdy",2266],["radii",2935],["skull",2060],["phony",2502],["issue",3034],["lager",4128],["swell",2808],["urine",3836],["gassy",2377],["trial",3987],["flora",3570],["upper",2958],["latch",3282],["wight",2290],["brick",2532],["retry",3280],["holly",2280],["decal",3789],["grass",2850],["shack",2715],["dogma",2747],["mover",3348],["defer",2749],["sober",3828],["optic",2992],["crier",3272],["vying",2129],["nomad",3010],["flute",3370],["hippo",2175],["shark",3137],["drier",3190],["obese",2931],["bugle",3002],["tawny",2895],["chalk",2763],["feast",3831],["ruddy",2180],["pedal",3679],["scarf",3244],["cruel",3784],["bleat",3930],["tidal",3483],["slush",2237],["semen",2787],["windy",2254],["dusty",2680],["sally",2783],["igloo",2449],["nerdy",3517],["jewel",2167],["shone",3611],["whale",3502],["hymen",2930],["abuse",3619],["fugue",2235],["elbow",3173],["crumb",2434],["pansy",3005],["welsh",3195],["syrup",2820],["terse",3524],["suave",3491],["gamut",2796],["swung",2211],["drake",3705],["freed",2749],["afire",4001],["shirt",3351],["grout",3155],["oddly",2286],["tithe",3016],["plaid",3119],["dummy",1599],["broom",2246],["blind",2632],["torch",3241],["enemy",2543],["again",2528],["tying",2706],["pesky",2897],["alter",4547],["gazer",3452],["noble",3552],["ethos",3767],["bride",3470],["extol",3465],["decor",3748],["hobby",1844],["beast",3882],["idiom",2132],["utter",3322],["these",3014],["sixth",2491],["alarm",2904],["erase",3770],["elegy",2680],["spunk",2282],["piper",3162],["scaly",3258],["scold",3005],["hefty",2999],["chick",1742],["sooty",2574],["canal",2739],["whiny",2248],["slash",2746],["quake",2910],["joint",2752],["swept",3186],["prude",3351],["heavy",3168],["wield",3203],["femme",1775],["lasso",3112],["maize",3231],["shale",3976],["screw",3464],["spree",3160],["smoky",2371],["whiff",1480],["scent",3675],["glade",3624],["spent",3565],["prism",2916],["stoke",3590],["riper",3162],["orbit",3329],["cocoa",2203],["guilt",2891],["humus",1837],["shush",1521],["table",3930],["smirk",2761],["wrong",2727],["noisy",3088],["alert",4547],["shiny",2722],["elate",3650],["resin",4038],["whole",3280],["hunch",1901],["pixel",3018],["polar",3706],["hotel",3815],["sword",2905],["cleat",4125],["mango",2927],["rumba",2934],["puffy",1484],["filly",2039],["billy",2090],["leash",3976],["clout",3139],["dance",3646],["ovate",3839],["facet",3638],["chili",2248],["paint",3312],["liner",4086],["curio",3261],["salty",3512],["audio",3257],["snake",3656],["fable",3430],["cloak",3129],["navel",3646],["spurt",3125],["pesto",3745],["balmy",2711],["flash",2975],["unwed",2856],["early",4242],["churn",2798],["weedy",2241],["stump",2544],["lease",3589],["witty",2017],["wimpy",1969],["spoof",2015],["saner",4343],["blend",3192],["salsa",2359],["thick",2471],["warty",3219],["manic",3009],["blare",4098],["squib",2113],["spoon",2359],["probe",3525],["crepe",2967],["knack",2233],["force",3584],["debut",3098],["order",3273],["haste",3989],["teeth",2346],["agent",3817],["widen",3060],["icily",2285],["slice",3759],["ingot",3035],["clash",3221],["juror",2143],["blood",2142],["abode",3631],["throw",2960],["unity",2862],["pivot",2669],["slept",3708],["troop",2744],["spare",4135],["sewer",2989],["parse",4135],["morph",2718],["cacti",2849],["tacky",2813],["spool",2502],["demon",3265],["moody",1886],["annex",2815],["begin",3063],["fuzzy",1159],["patch",2931],["water",4025],["lumpy",2287],["admin",2927],["omega",3584],["limit",2431],["tabby",2408],["macho",2906],["aisle",4259],["skiff",1777],["basis",2593],["plank",2839],["verge",2589],["botch",2624],["crawl",3257],["lousy",3027],["slain",3602],["cubic",1891],["raise",4440],["wrack",2751],["guide",3069],["foist",3049],["cameo",3749],["under",3559],["actor",3829],["revue",2745],["fraud",2960],["harpy",3048],["scoop",2261],["climb",2457],["refer",2356],["olden",3665],["clerk",3528],["debar",3775],["tally",2844],["ethic",3491],["cairn",3590],["tulle",3141],["ghoul",2632],["hilly",2197],["crude",3461],["apart",2966],["scale",4064],["older",3989],["plain",3299],["sperm",3476],["briny",2844],["abbot",2737],["rerun",3166],["quest",3122],["crisp",3075],["bound",2465],["befit",3138],["drawn",3032],["suite",3763],["itchy",2685],["cheer",2989],["bagel",3511],["guess",2674],["broad",3298],["axiom",2751],["chard",3127],["caput",3010],["leant",4223],["harsh",2927],["curse",3736],["proud",2874],["swing",2415],["opine",3591],["taste",3602],["lupus",2215],["gumbo",2125],["miner",3686],["green",3010],["chasm",2821],["lipid",2144],["topic",2992],["armor",2941],["brush",2698],["crane",4150],["mural",3370],["abled",3594],["habit",3041],["bossy",2125],["maker",3628],["dusky",2161],["dizzy",1527],["lithe",3732],["brook",2140],["jazzy",1466],["fifty",2052],["sense",2471],["giant",3257],["surly",3171],["legal",3231],["fatal",2649],["flunk",2194],["began",3368],["prune",3531],["small",2675],["slant",3661],["scoff",2125],["torus",3513],["ninny",1667],["covey",3034],["viper",3314],["taken",3717],["moral",3657],["vogue",2911],["owing",2500],["token",3495],["entry",3853],["booth",2149],["voter",3761],["chide",3155],["elfin",3418],["ebony",3260],["neigh",3170],["minim",1559],["melon",3588],["kneed",2406],["decoy",3275],["voila",3266],["ankle",3704],["arrow",2819],["mushy",2261],["tribe",3806],["cease",3348],["eager",3412],["birth",2963],["graph",2934],["odder",3273],["terra",3831],["weird",3384],["tried",3919],["clack",2376],["color",2841],["rough",2813],["weigh",2791],["uncut",2243],["ladle",3314],["strip",3329],["craft",3305],["minus",2693],["dicey",3192],["titan",2947],["lucid",2720],["vicar",3169],["dress",3188],["ditch",2654],["gypsy",1767],["pasta",2737],["taffy",2357],["flame",3466],["swoop",1980],["aloof",2673],["sight",2764],["broke",3370],["teary",4255],["chart",3463],["sixty",2528],["wordy",2661],["sheer",3182],["leper",3208],["nosey",3648],["bulge",3002],["savor",3445],["clamp",2847],["funky",1902],["foamy",2697],["toxic",2664],["brand",3118],["plumb",2143],["dingy",2370],["butte",2705],["drill",2676],["tripe",3891],["bicep",3020],["tenor",4182],["krill",2493],["worse",3742],["drama",2581],["hyena",3589],["think",2569],["ratio",4024],["cobra",3380],["basil",3309],["scrum",2822],["bused",3037],["phone",3308],["court",3320],["camel",3712],["proof",2244],["heard",3882],["angel",3804],["petal",4015],["pouty",2737],["throb",3046],["maybe",3225],["fetal",3879],["sprig",2910],["spine",3506],["shout",3003],["cadet",3802],["macro",3416],["dodgy",1880],["satyr",3693],["rarer",3102],["binge",3063],["trend",3822],["nutty",2192],["leapt",4015],["amiss",2629],["split",3148],["myrrh",2024],["width",2373],["sonar",3866],["tower",3803],["baron",3478],["fever",2508],["waver",3448],["spark",3115],["belie",2896],["sloop",2502],["expel",2348],["smote",3696],["baler",4098],["above",3390],["north",3339],["wafer",3525],["scant",3420],["frill",2512],["awash",2224],["snack",2901],["scowl",2806],["frail",3487],["drift",2918],["limbo",2735],["fence",2507],["motel",3744],["ounce",3497],["wreak",3506],["revel",2995],["talon",3746],["prior",2685],["knelt",3458],["cello",3174],["flake",3360],["debug",2679],["anode",3924],["crime",3588],["salve",3741],["scout",3091],["imbue",2962],["pinky",2242],["stave",3754],["vague",3133],["chock",1825],["fight",2325],["video",3198],["stone",3953],["teach",3796],["cleft",3379],["frost",3276],["prawn",3004],["booty",2186],["twist",2261],["apnea",3143],["stiff",2296],["plaza",2096],["ledge",2649],["tweak",3338],["board",3298],["grant",3484],["medic",3084],["bacon",3056],["cable",3676],["brawl",3062],["slunk",2633],["raspy",3329],["forum",2661],["drone",3846],["women",3066],["mucus",1925],["boast",3405],["toddy",2299],["coven",3183],["tumor",3161],["truer",3322],["wrath",3182],["stall",3088],["steam",3918],["axial",2398],["purer",2958],["daily",3178],["trail",3987],["niche",3335],["mealy",3661],["juice",2868],["nylon",2466],["plump",1863],["merry",2867],["flail",2590],["papal",2056],["wheat",3515],["berry",2831],["cower",3549],["erect",3331],["brute",3602],["leggy",2680],["snipe",3506],["sinew",3335],["skier",3675],["penny",2592],["jumpy",1598],["rally",3012],["umbra",2934],["scary",3439],["modem",2692],["gross",2628],["avian",2370],["greed",2830],["satin",3615],["tonic",3200],["parka",2447],["sniff",2140],["livid",1931],["stark",3479],["trump",2773],["giddy",1797],["reuse",3261],["taboo",2737],["avoid",2943],["quote",3207],["devil",3161],["liken",3399],["gloss",2447],["gayer",3836],["beret",3136],["noise",3894],["gland",2967],["dealt",4043],["sling",2937],["rumor",2432],["opera",4220],["thigh",2096],["tonga",3340],["flare",4047],["wound",2379],["white",3210],["bulky",2096],["etude",2818],["horse",3935],["circa",3017],["paddy",2157],["inbox",2313],["fizzy",1363],["grain",3425],["exert",2893],["surge",3571],["gleam",3547],["belle",2226],["salvo",3264],["crush",2893],["fruit",2991],["sappy",2432],["taker",4041],["tract",3076],["ovine",3378],["spiky",2337],["frank",2884],["reedy",2944],["filth",2731],["spasm",2324],["heave",2744],["mambo",2324],["right",2993],["clank",2949],["trust",2760],["lumen",3301],["borne",3733],["spook",1996],["sauce",3814],["amber",3698],["lathe",4037],["carat",3076],["corer",3355],["dirty",3113],["slyly",1808],["affix",1911],["alloy",2868],["taint",2947],["sheep",2650],["kinky",1877],["wooly",2087],["mauve",3139],["flung",2294],["yacht",2990],["fried",3419],["quail",2856],["brunt",2945],["grimy",2617],["curvy",2414],["cagey",3414],["rinse",4038],["deuce",2564],["state",3602],["grasp",3215],["milky",2336],["bison",2944],["graft",3140],["sandy",3033],["baste",3882],["flask",2798],["hedge",2320],["girly",3017],["swash",2224],["boney",3260],["coupe",3289],["endow",3143],["abhor",3292],["welch",3002],["blade",3594],["tight",2096],["geese",2208],["miser",3781],["mirth",2999],["cloud",2803],["cabal",2446],["leech",2808],["close",3842],["tenth",2919],["pecan",3618],["droit",3442],["grail",3568],["clone",3747],["guise",3344],["ralph",3340],["tango",3340],["biddy",1767],["smith",2770],["mower",3390],["payee",2994],["serif",3694],["drape",3860],["fifth",2015],["spank",2791],["glaze",3271],["allot",3173],["truck",2777],["kayak",1609],["virus",2853],["testy",3051],["tepee",2324],["fully",1835],["zonal",3057],["metro",3925],["curry",2262],["grand",3148],["banjo",2608],["axion",3008],["bezel",2266],["occur",2591],["chain",3080],["nasal",2932],["gooey",2717],["filer",3742],["brace",3857],["allay",2115],["pubic",2256],["raven",3827],["plead",3679],["gnash",2913],["flaky",2554],["munch",2217],["dully",1999],["eking",2993],["thing",2669],["slink",2837],["hurry",2174],["theft",2575],["shorn",3278],["pygmy",1415],["ranch",3307],["wring",2644],["lemon",3588],["shore",3935],["mamma",1291],["froze",3149],["newer",2894],["style",3767],["moose",2967],["antic",3422],["drown",2810],["vegan",3240],["chess",2760],["guppy",1565],["union",2462],["lever",2995],["lorry",2790],["image",3501],["cabby",2154],["druid",2426],["exact",3446],["truth",2479],["dopey",3165],["spear",4135],["cried",3665],["chime",3078],["crony",3122],["stunk",2646],["timid",2108],["batch",2846],["gauge",2981],["rotor",2379],["crack",2557],["curve",3220],["latte",3650],["witch",2455],["bunch",2181],["repel",3208],["anvil",3086],["soapy",3185],["meter",3172],["broth",3046],["madly",2824],["dried",3190],["scene",2946],["known",1730],["magma",1601],["roost",3047],["woman",2811],["thong",2752],["punch",2266],["pasty",3161],["downy",2337],["knead",3381],["whirl",2864],["rapid",3300],["clang",3049],["anger",3985],["drive",3342],["goofy",1716],["email",3907],["music",2595],["stuff",2092],["bleep",2591],["rider",3190],["mecca",2996],["folio",2368],["setup",3458],["verso",3700],["quash",2525],["fauna",2243],["gummy",1516],["happy",2151],["newly",3137],["fussy",1787],["relic",3988],["guava",1903],["ratty",3025],["fudge",2628],["femur",3138],["chirp",2794],["forte",3838],["alibi",2641],["whine",3054],["petty",2748],["golly",2203],["plait",3455],["fleck",2860],["felon",3501],["gourd",2819],["brown",2697],["thrum",2795],["ficus",2508],["stash",2759],["decry",3419],["wiser",3659],["junta",2770],["visor",3140],["daunt",3136],["scree",3270],["impel",3297],["await",2568],["press",3160],["whose",3232],["turbo",3125],["stoop",2515],["speak",3448],["mangy",2598],["eying",3207],["inlet",3918],["crone",3928],["pulse",3445],["mossy",2161],["staid",3435],["hence",2665],["pinch",2470],["teddy",2776],["sully",2274],["snore",4121],["ripen",3735],["snowy",2612],["attic",2849],["going",2306],["leach",3783],["mouth",2651],["hound",2572],["clump",2338],["tonal",3746],["bigot",2742],["peril",3878],["piece",2740],["blame",3517],["haute",3787],["spied",3326],["undid",2102],["intro",3622],["basal",2639],["shine",3528],["gecko",2978],["rodeo",3273],["guard",3041],["steer",3524],["loamy",3184],["scamp",2799],["scram",3331],["manly",3004],["hello",3086],["vaunt",2895],["organ",3508],["feral",4047],["knock",2011],["extra",3868],["condo",2194],["adapt",2462],["willy",2004],["polka",3019],["rayon",3622],["skirt",3174],["faith",2990],["torso",3047],["match",2882],["mercy",3342],["tepid",3387],["sleek",2824],["riser",3465],["twixt",1630],["peace",3045],["flush",2466],["catty",2603],["login",3022],["eject",2461],["roger",3190],["rival",3410],["untie",3668],["refit",3755],["aorta",3354],["adult",3279],["judge",2426],["rower",3074],["artsy",3693],["rural",3054],["shave",3412]]
},{}],7:[function(require,module,exports){
(function (global){(function (){
const wordle_solver = require('./app')

this.wordle = this.wordle || {}
this.wordle.bundle = function(e) {

    function a(e) {
        return (a = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) {
            return typeof e
        } : function(e) {
            return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
        })(e)
    }

    function s(e, a) {
        if (!(e instanceof a)) throw new TypeError("Cannot call a class as a function")
    }

    function t(e, a) {
        for (var s = 0; s < a.length; s++) {
            var t = a[s];
            t.enumerable = t.enumerable || !1, t.configurable = !0, "value" in t && (t.writable = !0), Object.defineProperty(e, t.key, t)
        }
    }

    function n(e, a, s) {
        return a && t(e.prototype, a), s && t(e, s), e
    }

    function o(e, a, s) {
        return a in e ? Object.defineProperty(e, a, {
            value: s,
            enumerable: !0,
            configurable: !0,
            writable: !0
        }) : e[a] = s, e
    }

    function r(e, a) {
        if ("function" != typeof a && null !== a) throw new TypeError("Super expression must either be null or a function");
        e.prototype = Object.create(a && a.prototype, {
            constructor: {
                value: e,
                writable: !0,
                configurable: !0
            }
        }), a && l(e, a)
    }

    function i(e) {
        return (i = Object.setPrototypeOf ? Object.getPrototypeOf : function(e) {
            return e.__proto__ || Object.getPrototypeOf(e)
        })(e)
    }

    function l(e, a) {
        return (l = Object.setPrototypeOf || function(e, a) {
            return e.__proto__ = a, e
        })(e, a)
    }

    function d() {
        if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
        if (Reflect.construct.sham) return !1;
        if ("function" == typeof Proxy) return !0;
        try {
            return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], (function() {}))), !0
        } catch (e) {
            return !1
        }
    }

    function c(e, a, s) {
        return (c = d() ? Reflect.construct : function(e, a, s) {
            var t = [null];
            t.push.apply(t, a);
            var n = new(Function.bind.apply(e, t));
            return s && l(n, s.prototype), n
        }).apply(null, arguments)
    }

    function u(e) {
        var a = "function" == typeof Map ? new Map : void 0;
        return (u = function(e) {
            if (null === e || (s = e, -1 === Function.toString.call(s).indexOf("[native code]"))) return e;
            var s;
            if ("function" != typeof e) throw new TypeError("Super expression must either be null or a function");
            if (void 0 !== a) {
                if (a.has(e)) return a.get(e);
                a.set(e, t)
            }

            function t() {
                return c(e, arguments, i(this).constructor)
            }
            return t.prototype = Object.create(e.prototype, {
                constructor: {
                    value: t,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), l(t, e)
        })(e)
    }

    function m(e) {
        if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        return e
    }

    function p(e, a) {
        return !a || "object" != typeof a && "function" != typeof a ? m(e) : a
    }

    function h(e) {
        var a = d();
        return function() {
            var s, t = i(e);
            if (a) {
                var n = i(this).constructor;
                s = Reflect.construct(t, arguments, n)
            } else s = t.apply(this, arguments);
            return p(this, s)
        }
    }

    function y(e, a) {
        return function(e) {
            if (Array.isArray(e)) return e
        }(e) || function(e, a) {
            var s = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
            if (null == s) return;
            var t, n, o = [],
                r = !0,
                i = !1;
            try {
                for (s = s.call(e); !(r = (t = s.next()).done) && (o.push(t.value), !a || o.length !== a); r = !0);
            } catch (e) {
                i = !0, n = e
            } finally {
                try {
                    r || null == s.return || s.return()
                } finally {
                    if (i) throw n
                }
            }
            return o
        }(e, a) || b(e, a) || function() {
            throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
        }()
    }

    function g(e) {
        return function(e) {
            if (Array.isArray(e)) return f(e)
        }(e) || function(e) {
            if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e)
        }(e) || b(e) || function() {
            throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
        }()
    }

    function b(e, a) {
        if (e) {
            if ("string" == typeof e) return f(e, a);
            var s = Object.prototype.toString.call(e).slice(8, -1);
            return "Object" === s && e.constructor && (s = e.constructor.name), "Map" === s || "Set" === s ? Array.from(e) : "Arguments" === s || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(s) ? f(e, a) : void 0
        }
    }

    function f(e, a) {
        (null == a || a > e.length) && (a = e.length);
        for (var s = 0, t = new Array(a); s < a; s++) t[s] = e[s];
        return t
    }
    var k = document.createElement("template");
    k.innerHTML = "\n<style>\n  :host {\n    display: inline-block;\n  }\n  .tile {\n    width: 100%;\n    display: inline-flex;\n    justify-content: center;\n    align-items: center;\n    font-size: 2rem;\n    line-height: 2rem;\n    font-weight: bold;\n    vertical-align: middle;\n    box-sizing: border-box;\n    color: var(--tile-text-color);\n    text-transform: uppercase;\n    user-select: none;\n  }\n  .tile::before {\n    content: '';\n    display: inline-block;\n    padding-bottom: 100%;\n  }\n\n  /* Allow tiles to be smaller on small screens */\n  @media (max-height: 600px) {\n    .tile {\n      font-size: 1em;\n      line-height: 1em;\n    }\n  }\n\n  .tile[data-state='empty'] {\n    border: 2px solid var(--color-tone-4);\n  }\n  .tile[data-state='tbd'] {\n    background-color: var(--color-tone-7);\n    border: 2px solid var(--color-tone-3);\n    color: var(--color-tone-1);\n  }\n  .tile[data-state='correct'] {\n    background-color: var(--color-correct);\n  }\n  .tile[data-state='present'] {\n    background-color: var(--color-present);\n  }\n  .tile[data-state='absent'] {\n    background-color: var(--color-absent);\n  }\n\n  .tile[data-animation='pop'] {\n    animation-name: PopIn;\n    animation-duration: 100ms;\n  }\n\n  @keyframes PopIn {\n    from {\n      transform: scale(0.8);\n      opacity: 0;\n    }\n\n    40% {\n      transform: scale(1.1);\n      opacity: 1;\n    }\n  }\n  .tile[data-animation='flip-in'] {\n    animation-name: FlipIn;\n    animation-duration: 250ms;\n    animation-timing-function: ease-in;\n  }\n  @keyframes FlipIn {\n    0% {\n      transform: rotateX(0);\n    }\n    100% {\n      transform: rotateX(-90deg);\n    }\n  }\n  .tile[data-animation='flip-out'] {\n    animation-name: FlipOut;\n    animation-duration: 250ms;\n    animation-timing-function: ease-in;\n  }\n  @keyframes FlipOut {\n    0% {\n      transform: rotateX(-90deg);\n    }\n    100% {\n      transform: rotateX(0);\n    }\n  }\n</style>\n<div class=\"tile\" data-state=\"empty\" data-animation=\"idle\"></div>\n";
    var v = function(e) {
        r(t, e);
        var a = h(t);

        function t() {
            var e;
            return s(this, t), o(m(e = a.call(this)), "_letter", ""), o(m(e), "_state", "empty"), o(m(e), "_animation", "idle"), o(m(e), "_last", !1), o(m(e), "_reveal", !1), e.attachShadow({
                mode: "open"
            }), e
        }
        return n(t, [{
            key: "last",
            set: function(e) {
                this._last = e
            }
        }, {
            key: "connectedCallback",
            value: function() {
                var e = this;
                this.shadowRoot.appendChild(k.content.cloneNode(!0)), this.$tile = this.shadowRoot.querySelector(".tile"), this.$tile.addEventListener("animationend", (function(a) {
                    "PopIn" === a.animationName && (e._animation = "idle"), "FlipIn" === a.animationName && (e.$tile.dataset.state = e._state, e._animation = "flip-out"), "FlipOut" === a.animationName && (e._animation = "idle", e._last && e.dispatchEvent(new CustomEvent("game-last-tile-revealed-in-row", {
                        bubbles: !0,
                        composed: !0
                    }))), e._render()
                })), this._render()
            }
        }, {
            key: "attributeChangedCallback",
            value: function(e, a, s) {
                switch (e) {
                    case "letter":
                        if (s === a) break;
                        var t = "null" === s ? "" : s;
                        this._letter = t, this._state = t ? "tbd" : "empty", this._animation = t ? "pop" : "idle";
                        break;
                    case "evaluation":
                        if (!s) break;
                        this._state = s;
                        break;
                    case "reveal":
                        this._animation = "flip-in", this._reveal = !0
                }
                this._render()
            }
        }, {
            key: "_render",
            value: function() {
                this.$tile && (this.$tile.textContent = this._letter, ["empty", "tbd"].includes(this._state) && (this.$tile.dataset.state = this._state), (["empty", "tbd"].includes(this._state) || this._reveal) && this.$tile.dataset.animation != this._animation && (this.$tile.dataset.animation = this._animation))
            }
        }], [{
            key: "observedAttributes",
            get: function() {
                return ["letter", "evaluation", "reveal"]
            }
        }]), t
    }(u(HTMLElement));
    customElements.define("game-tile", v);
    var w = document.createElement("template");
    w.innerHTML = '\n  <style>\n    :host {\n      display: block;\n    }\n    :host([invalid]){\n      animation-name: Shake;\n      animation-duration: 600ms;\n    }\n    .row {\n      display: grid;\n      grid-template-columns: repeat(5, 1fr);\n      grid-gap: 5px;\n    }\n    .win {\n      animation-name: Bounce;\n      animation-duration: 1000ms;\n    }\n\n    @keyframes Bounce {\n      0%, 20% {\n        transform: translateY(0);\n      }\n      40% {\n        transform: translateY(-30px);\n      }\n      50% {\n        transform: translateY(5px);\n      }\n      60% {\n        transform: translateY(-15px);\n      }\n      80% {\n        transform: translateY(2px);\n      }\n      100% {\n        transform: translateY(0);\n      }\n    }\n\n    @keyframes Shake {\n      10%,\n      90% {\n        transform: translateX(-1px);\n      }\n\n      20%,\n      80% {\n        transform: translateX(2px);\n      }\n\n      30%,\n      50%,\n      70% {\n        transform: translateX(-4px);\n      }\n\n      40%,\n      60% {\n        transform: translateX(4px);\n      }\n    }\n  </style>\n  <div class="row"></div>\n';
    var x = function(e) {
        r(t, e);
        var a = h(t);

        function t() {
            var e;
            return s(this, t), (e = a.call(this)).attachShadow({
                mode: "open"
            }), e._letters = "", e._evaluation = [], e._length, e
        }
        return n(t, [{
            key: "evaluation",
            get: function() {
                return this._evaluation
            },
            set: function(e) {
                var a = this;
                this._evaluation = e, this.$tiles && this.$tiles.forEach((function(e, s) {
                    e.setAttribute("evaluation", a._evaluation[s]), setTimeout((function() {
                        e.setAttribute("reveal", "")
                    }), 300 * s)
                }))
            }
        }, {
            key: "connectedCallback",
            value: function() {
                var e = this;
                this.shadowRoot.appendChild(w.content.cloneNode(!0)), this.$row = this.shadowRoot.querySelector(".row");
                for (var a = function(a) {
                        var s = document.createElement("game-tile"),
                            t = e._letters[a];
                        (t && s.setAttribute("letter", t), e._evaluation[a]) && (s.setAttribute("evaluation", e._evaluation[a]), setTimeout((function() {
                            s.setAttribute("reveal", "")
                        }), 100 * a));
                        a === e._length - 1 && (s.last = !0), e.$row.appendChild(s)
                    }, s = 0; s < this._length; s++) a(s);
                this.$tiles = this.shadowRoot.querySelectorAll("game-tile"), this.addEventListener("animationend", (function(a) {
                    "Shake" === a.animationName && e.removeAttribute("invalid")
                }))
            }
        }, {
            key: "attributeChangedCallback",
            value: function(e, a, s) {
                switch (e) {
                    case "letters":
                        this._letters = s || "";
                        break;
                    case "length":
                        this._length = parseInt(s, 10);
                        break;
                    case "win":
                        if (null === s) {
                            this.$tiles.forEach((function(e) {
                                e.classList.remove("win")
                            }));
                            break
                        }
                        this.$tiles.forEach((function(e, a) {
                            e.classList.add("win"), e.style.animationDelay = "".concat(100 * a, "ms")
                        }))
                }
                this._render()
            }
        }, {
            key: "_render",
            value: function() {
                var e = this;
                this.$row && this.$tiles.forEach((function(a, s) {
                    var t = e._letters[s];
                    t ? a.setAttribute("letter", t) : a.removeAttribute("letter")
                }))
            }
        }], [{
            key: "observedAttributes",
            get: function() {
                return ["letters", "length", "invalid", "win"]
            }
        }]), t
    }(u(HTMLElement));
    customElements.define("game-row", x);
    var z = document.createElement("template");
    z.innerHTML = "\n  <slot></slot>\n";
    var j = "nyt-wordle-darkmode",
        S = "nyt-wordle-cbmode",
        C = function(e) {
            r(t, e);
            var a = h(t);

            function t() {
                var e;
                s(this, t), o(m(e = a.call(this)), "isDarkTheme", !1), o(m(e), "isColorBlindTheme", !1), e.attachShadow({
                    mode: "open"
                });
                var n = JSON.parse(window.localStorage.getItem(j)),
                    r = window.matchMedia("(prefers-color-scheme: dark)").matches,
                    i = JSON.parse(window.localStorage.getItem(S));
                return !0 === n || !1 === n ? e.setDarkTheme(n) : r && e.setDarkTheme(!0), !0 !== i && !1 !== i || e.setColorBlindTheme(i), window.themeManager = m(e), e
            }
            return n(t, [{
                key: "setDarkTheme",
                value: function(e) {
                    var a = document.querySelector("body");
                    e && !a.classList.contains("nightmode") ? a.classList.add("nightmode") : a.classList.remove("nightmode"), this.isDarkTheme = e, window.localStorage.setItem(j, JSON.stringify(e))
                }
            }, {
                key: "setColorBlindTheme",
                value: function(e) {
                    var a = document.querySelector("body");
                    e && !a.classList.contains("colorblind") ? a.classList.add("colorblind") : a.classList.remove("colorblind"), this.isColorBlindTheme = e, window.localStorage.setItem(S, JSON.stringify(e))
                }
            }, {
                key: "connectedCallback",
                value: function() {
                    var e = this;
                    this.shadowRoot.appendChild(z.content.cloneNode(!0)), this.shadowRoot.addEventListener("game-setting-change", (function(a) {
                        var s = a.detail,
                            t = s.name,
                            n = s.checked;
                        switch (t) {
                            case "dark-theme":
                                return void e.setDarkTheme(n);
                            case "color-blind-theme":
                                return void e.setColorBlindTheme(n)
                        }
                    }))
                }
            }]), t
        }(u(HTMLElement));

    function _(e, a) {
        return e === a || e != e && a != a
    }

    function E(e, a) {
        for (var s = e.length; s--;)
            if (_(e[s][0], a)) return s;
        return -1
    }
    customElements.define("game-theme-manager", C);
    var q = Array.prototype.splice;

    function L(e) {
        var a = -1,
            s = null == e ? 0 : e.length;
        for (this.clear(); ++a < s;) {
            var t = e[a];
            this.set(t[0], t[1])
        }
    }
    L.prototype.clear = function() {
        this.__data__ = [], this.size = 0
    }, L.prototype.delete = function(e) {
        var a = this.__data__,
            s = E(a, e);
        return !(s < 0) && (s == a.length - 1 ? a.pop() : q.call(a, s, 1), --this.size, !0)
    }, L.prototype.get = function(e) {
        var a = this.__data__,
            s = E(a, e);
        return s < 0 ? void 0 : a[s][1]
    }, L.prototype.has = function(e) {
        return E(this.__data__, e) > -1
    }, L.prototype.set = function(e, a) {
        var s = this.__data__,
            t = E(s, e);
        return t < 0 ? (++this.size, s.push([e, a])) : s[t][1] = a, this
    };
    var T = "object" == ("undefined" == typeof global ? "undefined" : a(global)) && global && global.Object === Object && global,
        A = "object" == ("undefined" == typeof self ? "undefined" : a(self)) && self && self.Object === Object && self,
        I = T || A || Function("return this")(),
        M = I.Symbol,
        O = Object.prototype,
        R = O.hasOwnProperty,
        H = O.toString,
        N = M ? M.toStringTag : void 0;
    var P = Object.prototype.toString;
    var D = M ? M.toStringTag : void 0;

    function $(e) {
        return null == e ? void 0 === e ? "[object Undefined]" : "[object Null]" : D && D in Object(e) ? function(e) {
            var a = R.call(e, N),
                s = e[N];
            try {
                e[N] = void 0;
                var t = !0
            } catch (e) {}
            var n = H.call(e);
            return t && (a ? e[N] = s : delete e[N]), n
        }(e) : function(e) {
            return P.call(e)
        }(e)
    }

    function G(e) {
        var s = a(e);
        return null != e && ("object" == s || "function" == s)
    }

    function B(e) {
        if (!G(e)) return !1;
        var a = $(e);
        return "[object Function]" == a || "[object GeneratorFunction]" == a || "[object AsyncFunction]" == a || "[object Proxy]" == a
    }
    var V, F = I["__core-js_shared__"],
        W = (V = /[^.]+$/.exec(F && F.keys && F.keys.IE_PROTO || "")) ? "Symbol(src)_1." + V : "";
    var Y = Function.prototype.toString;
    var U = /^\[object .+?Constructor\]$/,
        J = Function.prototype,
        X = Object.prototype,
        Z = J.toString,
        K = X.hasOwnProperty,
        Q = RegExp("^" + Z.call(K).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");

    function ee(e) {
        return !(!G(e) || (a = e, W && W in a)) && (B(e) ? Q : U).test(function(e) {
            if (null != e) {
                try {
                    return Y.call(e)
                } catch (e) {}
                try {
                    return e + ""
                } catch (e) {}
            }
            return ""
        }(e));
        var a
    }

    function ae(e, a) {
        var s = function(e, a) {
            return null == e ? void 0 : e[a]
        }(e, a);
        return ee(s) ? s : void 0
    }
    var se = ae(I, "Map"),
        te = ae(Object, "create");
    var ne = Object.prototype.hasOwnProperty;
    var oe = Object.prototype.hasOwnProperty;

    function re(e) {
        var a = -1,
            s = null == e ? 0 : e.length;
        for (this.clear(); ++a < s;) {
            var t = e[a];
            this.set(t[0], t[1])
        }
    }

    function ie(e, s) {
        var t, n, o = e.__data__;
        return ("string" == (n = a(t = s)) || "number" == n || "symbol" == n || "boolean" == n ? "__proto__" !== t : null === t) ? o["string" == typeof s ? "string" : "hash"] : o.map
    }

    function le(e) {
        var a = -1,
            s = null == e ? 0 : e.length;
        for (this.clear(); ++a < s;) {
            var t = e[a];
            this.set(t[0], t[1])
        }
    }
    re.prototype.clear = function() {
        this.__data__ = te ? te(null) : {}, this.size = 0
    }, re.prototype.delete = function(e) {
        var a = this.has(e) && delete this.__data__[e];
        return this.size -= a ? 1 : 0, a
    }, re.prototype.get = function(e) {
        var a = this.__data__;
        if (te) {
            var s = a[e];
            return "__lodash_hash_undefined__" === s ? void 0 : s
        }
        return ne.call(a, e) ? a[e] : void 0
    }, re.prototype.has = function(e) {
        var a = this.__data__;
        return te ? void 0 !== a[e] : oe.call(a, e)
    }, re.prototype.set = function(e, a) {
        var s = this.__data__;
        return this.size += this.has(e) ? 0 : 1, s[e] = te && void 0 === a ? "__lodash_hash_undefined__" : a, this
    }, le.prototype.clear = function() {
        this.size = 0, this.__data__ = {
            hash: new re,
            map: new(se || L),
            string: new re
        }
    }, le.prototype.delete = function(e) {
        var a = ie(this, e).delete(e);
        return this.size -= a ? 1 : 0, a
    }, le.prototype.get = function(e) {
        return ie(this, e).get(e)
    }, le.prototype.has = function(e) {
        return ie(this, e).has(e)
    }, le.prototype.set = function(e, a) {
        var s = ie(this, e),
            t = s.size;
        return s.set(e, a), this.size += s.size == t ? 0 : 1, this
    };

    function de(e) {
        var a = this.__data__ = new L(e);
        this.size = a.size
    }
    de.prototype.clear = function() {
        this.__data__ = new L, this.size = 0
    }, de.prototype.delete = function(e) {
        var a = this.__data__,
            s = a.delete(e);
        return this.size = a.size, s
    }, de.prototype.get = function(e) {
        return this.__data__.get(e)
    }, de.prototype.has = function(e) {
        return this.__data__.has(e)
    }, de.prototype.set = function(e, a) {
        var s = this.__data__;
        if (s instanceof L) {
            var t = s.__data__;
            if (!se || t.length < 199) return t.push([e, a]), this.size = ++s.size, this;
            s = this.__data__ = new le(t)
        }
        return s.set(e, a), this.size = s.size, this
    };
    var ce = function() {
        try {
            var e = ae(Object, "defineProperty");
            return e({}, "", {}), e
        } catch (e) {}
    }();

    function ue(e, a, s) {
        "__proto__" == a && ce ? ce(e, a, {
            configurable: !0,
            enumerable: !0,
            value: s,
            writable: !0
        }) : e[a] = s
    }

    function me(e, a, s) {
        (void 0 !== s && !_(e[a], s) || void 0 === s && !(a in e)) && ue(e, a, s)
    }
    var pe, he = function(e, a, s) {
            for (var t = -1, n = Object(e), o = s(e), r = o.length; r--;) {
                var i = o[pe ? r : ++t];
                if (!1 === a(n[i], i, n)) break
            }
            return e
        },
        ye = "object" == (void 0 === e ? "undefined" : a(e)) && e && !e.nodeType && e,
        ge = ye && "object" == ("undefined" == typeof module ? "undefined" : a(module)) && module && !module.nodeType && module,
        be = ge && ge.exports === ye ? I.Buffer : void 0,
        fe = be ? be.allocUnsafe : void 0;
    var ke = I.Uint8Array;

    function ve(e, a) {
        var s, t, n = a ? (s = e.buffer, t = new s.constructor(s.byteLength), new ke(t).set(new ke(s)), t) : e.buffer;
        return new e.constructor(n, e.byteOffset, e.length)
    }
    var we = Object.create,
        xe = function() {
            function e() {}
            return function(a) {
                if (!G(a)) return {};
                if (we) return we(a);
                e.prototype = a;
                var s = new e;
                return e.prototype = void 0, s
            }
        }();
    var ze, je, Se = (ze = Object.getPrototypeOf, je = Object, function(e) {
            return ze(je(e))
        }),
        Ce = Object.prototype;

    function _e(e) {
        var a = e && e.constructor;
        return e === ("function" == typeof a && a.prototype || Ce)
    }

    function Ee(e) {
        return null != e && "object" == a(e)
    }

    function qe(e) {
        return Ee(e) && "[object Arguments]" == $(e)
    }
    var Le = Object.prototype,
        Te = Le.hasOwnProperty,
        Ae = Le.propertyIsEnumerable,
        Ie = qe(function() {
            return arguments
        }()) ? qe : function(e) {
            return Ee(e) && Te.call(e, "callee") && !Ae.call(e, "callee")
        },
        Me = Array.isArray;

    function Oe(e) {
        return "number" == typeof e && e > -1 && e % 1 == 0 && e <= 9007199254740991
    }

    function Re(e) {
        return null != e && Oe(e.length) && !B(e)
    }
    var He = "object" == (void 0 === e ? "undefined" : a(e)) && e && !e.nodeType && e,
        Ne = He && "object" == ("undefined" == typeof module ? "undefined" : a(module)) && module && !module.nodeType && module,
        Pe = Ne && Ne.exports === He ? I.Buffer : void 0,
        De = (Pe ? Pe.isBuffer : void 0) || function() {
            return !1
        },
        $e = Function.prototype,
        Ge = Object.prototype,
        Be = $e.toString,
        Ve = Ge.hasOwnProperty,
        Fe = Be.call(Object);
    var We = {};
    We["[object Float32Array]"] = We["[object Float64Array]"] = We["[object Int8Array]"] = We["[object Int16Array]"] = We["[object Int32Array]"] = We["[object Uint8Array]"] = We["[object Uint8ClampedArray]"] = We["[object Uint16Array]"] = We["[object Uint32Array]"] = !0, We["[object Arguments]"] = We["[object Array]"] = We["[object ArrayBuffer]"] = We["[object Boolean]"] = We["[object DataView]"] = We["[object Date]"] = We["[object Error]"] = We["[object Function]"] = We["[object Map]"] = We["[object Number]"] = We["[object Object]"] = We["[object RegExp]"] = We["[object Set]"] = We["[object String]"] = We["[object WeakMap]"] = !1;
    var Ye = "object" == (void 0 === e ? "undefined" : a(e)) && e && !e.nodeType && e,
        Ue = Ye && "object" == ("undefined" == typeof module ? "undefined" : a(module)) && module && !module.nodeType && module,
        Je = Ue && Ue.exports === Ye && T.process,
        Xe = function() {
            try {
                var e = Ue && Ue.require && Ue.require("util").types;
                return e || Je && Je.binding && Je.binding("util")
            } catch (e) {}
        }(),
        Ze = Xe && Xe.isTypedArray,
        Ke = Ze ? function(e) {
            return function(a) {
                return e(a)
            }
        }(Ze) : function(e) {
            return Ee(e) && Oe(e.length) && !!We[$(e)]
        };

    function Qe(e, a) {
        if (("constructor" !== a || "function" != typeof e[a]) && "__proto__" != a) return e[a]
    }
    var ea = Object.prototype.hasOwnProperty;

    function aa(e, a, s) {
        var t = e[a];
        ea.call(e, a) && _(t, s) && (void 0 !== s || a in e) || ue(e, a, s)
    }
    var sa = /^(?:0|[1-9]\d*)$/;

    function ta(e, s) {
        var t = a(e);
        return !!(s = null == s ? 9007199254740991 : s) && ("number" == t || "symbol" != t && sa.test(e)) && e > -1 && e % 1 == 0 && e < s
    }
    var na = Object.prototype.hasOwnProperty;

    function oa(e, a) {
        var s = Me(e),
            t = !s && Ie(e),
            n = !s && !t && De(e),
            o = !s && !t && !n && Ke(e),
            r = s || t || n || o,
            i = r ? function(e, a) {
                for (var s = -1, t = Array(e); ++s < e;) t[s] = a(s);
                return t
            }(e.length, String) : [],
            l = i.length;
        for (var d in e) !a && !na.call(e, d) || r && ("length" == d || n && ("offset" == d || "parent" == d) || o && ("buffer" == d || "byteLength" == d || "byteOffset" == d) || ta(d, l)) || i.push(d);
        return i
    }
    var ra = Object.prototype.hasOwnProperty;

    function ia(e) {
        if (!G(e)) return function(e) {
            var a = [];
            if (null != e)
                for (var s in Object(e)) a.push(s);
            return a
        }(e);
        var a = _e(e),
            s = [];
        for (var t in e)("constructor" != t || !a && ra.call(e, t)) && s.push(t);
        return s
    }

    function la(e) {
        return Re(e) ? oa(e, !0) : ia(e)
    }

    function da(e) {
        return function(e, a, s, t) {
            var n = !s;
            s || (s = {});
            for (var o = -1, r = a.length; ++o < r;) {
                var i = a[o],
                    l = t ? t(s[i], e[i], i, s, e) : void 0;
                void 0 === l && (l = e[i]), n ? ue(s, i, l) : aa(s, i, l)
            }
            return s
        }(e, la(e))
    }

    function ca(e, a, s, t, n, o, r) {
        var i = Qe(e, s),
            l = Qe(a, s),
            d = r.get(l);
        if (d) me(e, s, d);
        else {
            var c, u = o ? o(i, l, s + "", e, a, r) : void 0,
                m = void 0 === u;
            if (m) {
                var p = Me(l),
                    h = !p && De(l),
                    y = !p && !h && Ke(l);
                u = l, p || h || y ? Me(i) ? u = i : Ee(c = i) && Re(c) ? u = function(e, a) {
                    var s = -1,
                        t = e.length;
                    for (a || (a = Array(t)); ++s < t;) a[s] = e[s];
                    return a
                }(i) : h ? (m = !1, u = function(e, a) {
                    if (a) return e.slice();
                    var s = e.length,
                        t = fe ? fe(s) : new e.constructor(s);
                    return e.copy(t), t
                }(l, !0)) : y ? (m = !1, u = ve(l, !0)) : u = [] : function(e) {
                    if (!Ee(e) || "[object Object]" != $(e)) return !1;
                    var a = Se(e);
                    if (null === a) return !0;
                    var s = Ve.call(a, "constructor") && a.constructor;
                    return "function" == typeof s && s instanceof s && Be.call(s) == Fe
                }(l) || Ie(l) ? (u = i, Ie(i) ? u = da(i) : G(i) && !B(i) || (u = function(e) {
                    return "function" != typeof e.constructor || _e(e) ? {} : xe(Se(e))
                }(l))) : m = !1
            }
            m && (r.set(l, u), n(u, l, t, o, r), r.delete(l)), me(e, s, u)
        }
    }

    function ua(e, a, s, t, n) {
        e !== a && he(a, (function(o, r) {
            if (n || (n = new de), G(o)) ca(e, a, r, s, ua, t, n);
            else {
                var i = t ? t(Qe(e, r), o, r + "", e, a, n) : void 0;
                void 0 === i && (i = o), me(e, r, i)
            }
        }), la)
    }

    function ma(e) {
        return e
    }

    function pa(e, a, s) {
        switch (s.length) {
            case 0:
                return e.call(a);
            case 1:
                return e.call(a, s[0]);
            case 2:
                return e.call(a, s[0], s[1]);
            case 3:
                return e.call(a, s[0], s[1], s[2])
        }
        return e.apply(a, s)
    }
    var ha = Math.max;
    var ya = ce ? function(e, a) {
            return ce(e, "toString", {
                configurable: !0,
                enumerable: !1,
                value: (s = a, function() {
                    return s
                }),
                writable: !0
            });
            var s
        } : ma,
        ga = Date.now;
    var ba = function(e) {
        var a = 0,
            s = 0;
        return function() {
            var t = ga(),
                n = 16 - (t - s);
            if (s = t, n > 0) {
                if (++a >= 800) return arguments[0]
            } else a = 0;
            return e.apply(void 0, arguments)
        }
    }(ya);

    function fa(e, a) {
        return ba(function(e, a, s) {
            return a = ha(void 0 === a ? e.length - 1 : a, 0),
                function() {
                    for (var t = arguments, n = -1, o = ha(t.length - a, 0), r = Array(o); ++n < o;) r[n] = t[a + n];
                    n = -1;
                    for (var i = Array(a + 1); ++n < a;) i[n] = t[n];
                    return i[a] = s(r), pa(e, this, i)
                }
        }(e, a, ma), e + "")
    }
    var ka, va = (ka = function(e, a, s) {
            ua(e, a, s)
        }, fa((function(e, s) {
            var t = -1,
                n = s.length,
                o = n > 1 ? s[n - 1] : void 0,
                r = n > 2 ? s[2] : void 0;
            for (o = ka.length > 3 && "function" == typeof o ? (n--, o) : void 0, r && function(e, s, t) {
                    if (!G(t)) return !1;
                    var n = a(s);
                    return !!("number" == n ? Re(t) && ta(s, t.length) : "string" == n && s in t) && _(t[s], e)
                }(s[0], s[1], r) && (o = n < 3 ? void 0 : o, n = 1), e = Object(e); ++t < n;) {
                var i = s[t];
                i && ka(e, i, t, o)
            }
            return e
        }))),
        wa = "nyt-wordle-state",
        xa = {
            boardState: null,
            evaluations: null,
            rowIndex: null,
            solution: null,
            gameStatus: null,
            lastPlayedTs: null,
            lastCompletedTs: null,
            restoringFromLocalStorage: null,
            hardMode: !1,
            greenAplhabetPosMap: null, 
            blackAplhabetPosMap: null, 
            yellowAplhabetPosMap: null,
            usedWords: null,   
            allWordMap: null 
        };

    function za() {
        var e = window.localStorage.getItem(wa) || JSON.stringify(xa);
        return JSON.parse(e)
    }

    function ja(e) {
        var a = za();
        ! function(e) {
            window.localStorage.setItem(wa, JSON.stringify(e))
        }(va(a, e))
    }

    function Sa() {
        var e = navigator.userAgent || navigator.vendor || window.opera;
        return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(e) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(e.substr(0, 4))
    }

    function Ca() {
        var e = navigator.userAgent;
        return e.match(/chrome|chromium|crios/i) ? "chrome" : e.match(/firefox|fxios/i) ? "firefox" : e.match(/safari/i) ? "safari" : e.match(/opr\//i) ? "opera" : e.match(/edg/i) ? "edge" : "No browser detection"
    }
    var _a = "mailto:nytgames@nytimes.com";

    function Ea(e) {
        return e.charAt(0).toUpperCase() + e.slice(1)
    }
    var qa = function(e) {
            var a = [];
            return Object.keys(e).forEach((function(s) {
                a.push("".concat(encodeURIComponent(s), "=").concat(encodeURIComponent(e[s])))
            })), "?".concat(a.join("&"))
        },
        La = document.createElement("template");
    La.innerHTML = '\n  <style>\n  .setting {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    border-bottom: 1px solid var(--color-tone-4);\n    padding: 16px 0;\n  }\n\n  a, a:visited {\n    color: var(--color-tone-2);\n  }\n\n  .title {\n    font-size: 18px;\n  }\n  .text {\n    padding-right: 8px;\n  }\n  .description {\n    font-size: 12px;\n    color: var(--color-tone-2);\n  }\n\n  #footnote {\n    position: absolute;\n    bottom: 0;\n    left: 0;\n    right: 0;\n    padding: 16px;\n    color: var(--color-tone-2);\n    font-size: 12px;\n    text-align: right;\n    display: flex;\n    justify-content: space-between;\n    align-items: flex-end;\n  }\n\n  @media only screen and (min-device-width : 320px) and (max-device-width : 480px) {\n    .setting {\n      padding: 16px;\n    }\n  }\n\n  </style>\n  <div class="sections">\n    <section>\n      <div class="setting">\n        <div class="text">\n          <div class="title">Hard Mode</div>\n          <div class="description">Any revealed hints must be used in subsequent guesses</div>\n        </div>\n        <div class="control">\n          <game-switch id="hard-mode" name="hard-mode"></game-switch>\n        </div>\n      </div>\n      <div class="setting">\n        <div class="text">\n          <div class="title">Dark Theme</div>\n        </div>\n        <div class="control">\n          <game-switch id="dark-theme" name="dark-theme"></game-switch>\n        </div>\n      </div>\n      <div class="setting">\n        <div class="text">\n          <div class="title">High Contrast Mode</div>\n          <div class="description">For improved color vision</div>\n        </div>\n        <div class="control">\n          <game-switch id="color-blind-theme" name="color-blind-theme"></game-switch>\n        </div>\n      </div>\n    </section>\n\n    <section>\n      <div class="setting">\n        <div class="text">\n          <div class="title">Feedback</div>\n        </div>\n        <div class="control">\n          <a href="'.concat(function() {
        var e, a = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "Wordle Feedback",
            s = (new Date).getTimezoneOffset(),
            t = "\r\n\r\n\n--\nDevice summary:\nPage: /games/wordle\nPlatform: ".concat(Sa() ? "Web (Mobile)" : "Web (Desktop)", " \nBrowser: ").concat(Ea(Ca()), "\nScreen Resolution: ").concat(window.screen.width, " x ").concat(window.screen.height, "\nViewport Size: ").concat(document.documentElement.clientWidth, " x ").concat(document.documentElement.clientHeight, "\nTimezone: ", "UTC".concat(s > 0 ? "" : "+").concat(s / -60), "\nBuild: ").concat(null === (e = window.wordle) || void 0 === e ? void 0 : e.hash, "\n  ");
        return _a + qa({
            subject: a,
            body: t
        })
    }(), '" title="nytgames@nytimes.com">Email</a>\n        </div>\n      </div>\n      <div class="setting">\n        <div class="text">\n          <div class="title">Community</div>\n        </div>\n        <div class="control">\n          <a href="https://twitter.com/NYTGames" target="blank" title="@NYTGames">Twitter</a>\n        </div>\n      </div>\n      <div class="setting">\n      <div class="text">\n        <div class="title">Questions?</div>\n      </div>\n      <div class="control">\n        <a href="https://help.nytimes.com/hc/en-us/articles/360029050872-Word-Games-and-Logic-Puzzles#h_01FVGCB2Z00ZQMDMCYWBPWJNXB" target="blank">FAQ</a>\n      </div>\n    </div>\n    </section>\n  </div>\n  <div id="footnote">\n    <div id="copyright">&#169; ').concat((new Date).getFullYear(), ' The New York Times Company</div>\n    <div>\n      <div id="puzzle-number"></div>\n    </div>\n  </div>\n');
    var Ta = function(e) {
        r(t, e);
        var a = h(t);

        function t() {
            var e;
            return s(this, t), o(m(e = a.call(this)), "gameApp", void 0), e.attachShadow({
                mode: "open"
            }), e
        }
        return n(t, [{
            key: "connectedCallback",
            value: function() {
                var e = this;
                this.shadowRoot.appendChild(La.content.cloneNode(!0)), this.shadowRoot.querySelector("#puzzle-number").textContent = "#".concat(this.gameApp.dayOffset), this.shadowRoot.addEventListener("game-switch-change", (function(a) {
                    a.stopPropagation();
                    var s = a.detail,
                        t = s.name,
                        n = s.checked,
                        o = s.disabled;
                    e.dispatchEvent(new CustomEvent("game-setting-change", {
                        bubbles: !0,
                        composed: !0,
                        detail: {
                            name: t,
                            checked: n,
                            disabled: o
                        }
                    })), e.render()
                })), this.render()
            }
        }, {
            key: "render",
            value: function() {
                var e = document.querySelector("body");
                e.classList.contains("nightmode") && this.shadowRoot.querySelector("#dark-theme").setAttribute("checked", ""), e.classList.contains("colorblind") && this.shadowRoot.querySelector("#color-blind-theme").setAttribute("checked", "");
                var a = za();
                a.hardMode && this.shadowRoot.querySelector("#hard-mode").setAttribute("checked", ""), a.hardMode || "IN_PROGRESS" !== a.gameStatus || 0 === a.rowIndex || (this.shadowRoot.querySelector("#hard-mode").removeAttribute("checked"), this.shadowRoot.querySelector("#hard-mode").setAttribute("disabled", ""))
            }
        }]), t
    }(u(HTMLElement));
    customElements.define("game-settings", Ta);
    var Aa = document.createElement("template");
    Aa.innerHTML = '\n  <style>\n    .toast {\n      position: relative;\n      margin: 16px;\n      background-color: var(--color-tone-1);\n      color: var(--color-tone-7);\n      padding: 16px;\n      border: none;\n      border-radius: 4px;\n      opacity: 1;\n      transition: opacity 300ms cubic-bezier(0.645, 0.045, 0.355, 1);\n      font-weight: 700;\n    }\n    .win {\n      background-color: var(--color-correct);\n      color: var(--tile-text-color);\n    }\n    .fade {\n      opacity: 0;\n    }\n  </style>\n  <div class="toast"></div>\n';
    var Ia = function(e) {
        r(t, e);
        var a = h(t);

        function t() {
            var e;
            return s(this, t), o(m(e = a.call(this)), "_duration", void 0), e.attachShadow({
                mode: "open"
            }), e
        }
        return n(t, [{
            key: "connectedCallback",
            value: function() {
                var e = this;
                this.shadowRoot.appendChild(Aa.content.cloneNode(!0));
                var a = this.shadowRoot.querySelector(".toast");
                a.textContent = this.getAttribute("text"), this._duration = this.getAttribute("duration") || 1e3, "Infinity" !== this._duration && setTimeout((function() {
                    a.classList.add("fade")
                }), this._duration), a.addEventListener("transitionend", (function(a) {
                    e.parentNode.removeChild(e)
                }))
            }
        }]), t
    }(u(HTMLElement));
    customElements.define("game-toast", Ia);
    var Ma = ["cigar", "rebut", "sissy", "humph", "awake", "blush", "focal", "evade", "naval", "serve", "heath", "dwarf", "model", "karma", "stink", "grade", "quiet", "bench", "abate", "feign", "major", "death", "fresh", "crust", "stool", "colon", "abase", "marry", "react", "batty", "pride", "floss", "helix", "croak", "staff", "paper", "unfed", "whelp", "trawl", "outdo", "adobe", "crazy", "sower", "repay", "digit", "crate", "cluck", "spike", "mimic", "pound", "maxim", "linen", "unmet", "flesh", "booby", "forth", "first", "stand", "belly", "ivory", "seedy", "print", "yearn", "drain", "bribe", "stout", "panel", "crass", "flume", "offal", "agree", "error", "swirl", "argue", "bleed", "delta", "flick", "totem", "wooer", "front", "shrub", "parry", "biome", "lapel", "start", "greet", "goner", "golem", "lusty", "loopy", "round", "audit", "lying", "gamma", "labor", "islet", "civic", "forge", "corny", "moult", "basic", "salad", "agate", "spicy", "spray", "essay", "fjord", "spend", "kebab", "guild", "aback", "motor", "alone", "hatch", "hyper", "thumb", "dowry", "ought", "belch", "dutch", "pilot", "tweed", "comet", "jaunt", "enema", "steed", "abyss", "growl", "fling", "dozen", "boozy", "erode", "world", "gouge", "click", "briar", "great", "altar", "pulpy", "blurt", "coast", "duchy", "groin", "fixer", "group", "rogue", "badly", "smart", "pithy", "gaudy", "chill", "heron", "vodka", "finer", "surer", "radio", "rouge", "perch", "retch", "wrote", "clock", "tilde", "store", "prove", "bring", "solve", "cheat", "grime", "exult", "usher", "epoch", "triad", "break", "rhino", "viral", "conic", "masse", "sonic", "vital", "trace", "using", "peach", "champ", "baton", "brake", "pluck", "craze", "gripe", "weary", "picky", "acute", "ferry", "aside", "tapir", "troll", "unify", "rebus", "boost", "truss", "siege", "tiger", "banal", "slump", "crank", "gorge", "query", "drink", "favor", "abbey", "tangy", "panic", "solar", "shire", "proxy", "point", "robot", "prick", "wince", "crimp", "knoll", "sugar", "whack", "mount", "perky", "could", "wrung", "light", "those", "moist", "shard", "pleat", "aloft", "skill", "elder", "frame", "humor", "pause", "ulcer", "ultra", "robin", "cynic", "aroma", "caulk", "shake", "dodge", "swill", "tacit", "other", "thorn", "trove", "bloke", "vivid", "spill", "chant", "choke", "rupee", "nasty", "mourn", "ahead", "brine", "cloth", "hoard", "sweet", "month", "lapse", "watch", "today", "focus", "smelt", "tease", "cater", "movie", "saute", "allow", "renew", "their", "slosh", "purge", "chest", "depot", "epoxy", "nymph", "found", "shall", "stove", "lowly", "snout", "trope", "fewer", "shawl", "natal", "comma", "foray", "scare", "stair", "black", "squad", "royal", "chunk", "mince", "shame", "cheek", "ample", "flair", "foyer", "cargo", "oxide", "plant", "olive", "inert", "askew", "heist", "shown", "zesty", "trash", "larva", "forgo", "story", "hairy", "train", "homer", "badge", "midst", "canny", "fetus", "butch", "farce", "slung", "tipsy", "metal", "yield", "delve", "being", "scour", "glass", "gamer", "scrap", "money", "hinge", "album", "vouch", "asset", "tiara", "crept", "bayou", "atoll", "manor", "creak", "showy", "phase", "froth", "depth", "gloom", "flood", "trait", "girth", "piety", "goose", "float", "donor", "atone", "primo", "apron", "blown", "cacao", "loser", "input", "gloat", "awful", "brink", "smite", "beady", "rusty", "retro", "droll", "gawky", "hutch", "pinto", "egret", "lilac", "sever", "field", "fluff", "flack", "agape", "voice", "stead", "stalk", "berth", "madam", "night", "bland", "liver", "wedge", "augur", "roomy", "wacky", "flock", "angry", "trite", "aphid", "tryst", "midge", "power", "elope", "cinch", "motto", "stomp", "upset", "bluff", "cramp", "quart", "coyly", "youth", "rhyme", "buggy", "alien", "smear", "unfit", "patty", "cling", "glean", "label", "hunky", "khaki", "poker", "gruel", "twice", "twang", "shrug", "treat", "waste", "merit", "woven", "needy", "clown", "widow", "irony", "ruder", "gauze", "chief", "onset", "prize", "fungi", "charm", "gully", "inter", "whoop", "taunt", "leery", "class", "theme", "lofty", "tibia", "booze", "alpha", "thyme", "doubt", "parer", "chute", "stick", "trice", "alike", "recap", "saint", "glory", "grate", "admit", "brisk", "soggy", "usurp", "scald", "scorn", "leave", "twine", "sting", "bough", "marsh", "sloth", "dandy", "vigor", "howdy", "enjoy", "valid", "ionic", "equal", "floor", "catch", "spade", "stein", "exist", "quirk", "denim", "grove", "spiel", "mummy", "fault", "foggy", "flout", "carry", "sneak", "libel", "waltz", "aptly", "piney", "inept", "aloud", "photo", "dream", "stale", "unite", "snarl", "baker", "there", "glyph", "pooch", "hippy", "spell", "folly", "louse", "gulch", "vault", "godly", "threw", "fleet", "grave", "inane", "shock", "crave", "spite", "valve", "skimp", "claim", "rainy", "musty", "pique", "daddy", "quasi", "arise", "aging", "valet", "opium", "avert", "stuck", "recut", "mulch", "genre", "plume", "rifle", "count", "incur", "total", "wrest", "mocha", "deter", "study", "lover", "safer", "rivet", "funny", "smoke", "mound", "undue", "sedan", "pagan", "swine", "guile", "gusty", "equip", "tough", "canoe", "chaos", "covet", "human", "udder", "lunch", "blast", "stray", "manga", "melee", "lefty", "quick", "paste", "given", "octet", "risen", "groan", "leaky", "grind", "carve", "loose", "sadly", "spilt", "apple", "slack", "honey", "final", "sheen", "eerie", "minty", "slick", "derby", "wharf", "spelt", "coach", "erupt", "singe", "price", "spawn", "fairy", "jiffy", "filmy", "stack", "chose", "sleep", "ardor", "nanny", "niece", "woozy", "handy", "grace", "ditto", "stank", "cream", "usual", "diode", "valor", "angle", "ninja", "muddy", "chase", "reply", "prone", "spoil", "heart", "shade", "diner", "arson", "onion", "sleet", "dowel", "couch", "palsy", "bowel", "smile", "evoke", "creek", "lance", "eagle", "idiot", "siren", "built", "embed", "award", "dross", "annul", "goody", "frown", "patio", "laden", "humid", "elite", "lymph", "edify", "might", "reset", "visit", "gusto", "purse", "vapor", "crock", "write", "sunny", "loath", "chaff", "slide", "queer", "venom", "stamp", "sorry", "still", "acorn", "aping", "pushy", "tamer", "hater", "mania", "awoke", "brawn", "swift", "exile", "birch", "lucky", "freer", "risky", "ghost", "plier", "lunar", "winch", "snare", "nurse", "house", "borax", "nicer", "lurch", "exalt", "about", "savvy", "toxin", "tunic", "pried", "inlay", "chump", "lanky", "cress", "eater", "elude", "cycle", "kitty", "boule", "moron", "tenet", "place", "lobby", "plush", "vigil", "index", "blink", "clung", "qualm", "croup", "clink", "juicy", "stage", "decay", "nerve", "flier", "shaft", "crook", "clean", "china", "ridge", "vowel", "gnome", "snuck", "icing", "spiny", "rigor", "snail", "flown", "rabid", "prose", "thank", "poppy", "budge", "fiber", "moldy", "dowdy", "kneel", "track", "caddy", "quell", "dumpy", "paler", "swore", "rebar", "scuba", "splat", "flyer", "horny", "mason", "doing", "ozone", "amply", "molar", "ovary", "beset", "queue", "cliff", "magic", "truce", "sport", "fritz", "edict", "twirl", "verse", "llama", "eaten", "range", "whisk", "hovel", "rehab", "macaw", "sigma", "spout", "verve", "sushi", "dying", "fetid", "brain", "buddy", "thump", "scion", "candy", "chord", "basin", "march", "crowd", "arbor", "gayly", "musky", "stain", "dally", "bless", "bravo", "stung", "title", "ruler", "kiosk", "blond", "ennui", "layer", "fluid", "tatty", "score", "cutie", "zebra", "barge", "matey", "bluer", "aider", "shook", "river", "privy", "betel", "frisk", "bongo", "begun", "azure", "weave", "genie", "sound", "glove", "braid", "scope", "wryly", "rover", "assay", "ocean", "bloom", "irate", "later", "woken", "silky", "wreck", "dwelt", "slate", "smack", "solid", "amaze", "hazel", "wrist", "jolly", "globe", "flint", "rouse", "civil", "vista", "relax", "cover", "alive", "beech", "jetty", "bliss", "vocal", "often", "dolly", "eight", "joker", "since", "event", "ensue", "shunt", "diver", "poser", "worst", "sweep", "alley", "creed", "anime", "leafy", "bosom", "dunce", "stare", "pudgy", "waive", "choir", "stood", "spoke", "outgo", "delay", "bilge", "ideal", "clasp", "seize", "hotly", "laugh", "sieve", "block", "meant", "grape", "noose", "hardy", "shied", "drawl", "daisy", "putty", "strut", "burnt", "tulip", "crick", "idyll", "vixen", "furor", "geeky", "cough", "naive", "shoal", "stork", "bathe", "aunty", "check", "prime", "brass", "outer", "furry", "razor", "elect", "evict", "imply", "demur", "quota", "haven", "cavil", "swear", "crump", "dough", "gavel", "wagon", "salon", "nudge", "harem", "pitch", "sworn", "pupil", "excel", "stony", "cabin", "unzip", "queen", "trout", "polyp", "earth", "storm", "until", "taper", "enter", "child", "adopt", "minor", "fatty", "husky", "brave", "filet", "slime", "glint", "tread", "steal", "regal", "guest", "every", "murky", "share", "spore", "hoist", "buxom", "inner", "otter", "dimly", "level", "sumac", "donut", "stilt", "arena", "sheet", "scrub", "fancy", "slimy", "pearl", "silly", "porch", "dingo", "sepia", "amble", "shady", "bread", "friar", "reign", "dairy", "quill", "cross", "brood", "tuber", "shear", "posit", "blank", "villa", "shank", "piggy", "freak", "which", "among", "fecal", "shell", "would", "algae", "large", "rabbi", "agony", "amuse", "bushy", "copse", "swoon", "knife", "pouch", "ascot", "plane", "crown", "urban", "snide", "relay", "abide", "viola", "rajah", "straw", "dilly", "crash", "amass", "third", "trick", "tutor", "woody", "blurb", "grief", "disco", "where", "sassy", "beach", "sauna", "comic", "clued", "creep", "caste", "graze", "snuff", "frock", "gonad", "drunk", "prong", "lurid", "steel", "halve", "buyer", "vinyl", "utile", "smell", "adage", "worry", "tasty", "local", "trade", "finch", "ashen", "modal", "gaunt", "clove", "enact", "adorn", "roast", "speck", "sheik", "missy", "grunt", "snoop", "party", "touch", "mafia", "emcee", "array", "south", "vapid", "jelly", "skulk", "angst", "tubal", "lower", "crest", "sweat", "cyber", "adore", "tardy", "swami", "notch", "groom", "roach", "hitch", "young", "align", "ready", "frond", "strap", "puree", "realm", "venue", "swarm", "offer", "seven", "dryer", "diary", "dryly", "drank", "acrid", "heady", "theta", "junto", "pixie", "quoth", "bonus", "shalt", "penne", "amend", "datum", "build", "piano", "shelf", "lodge", "suing", "rearm", "coral", "ramen", "worth", "psalm", "infer", "overt", "mayor", "ovoid", "glide", "usage", "poise", "randy", "chuck", "prank", "fishy", "tooth", "ether", "drove", "idler", "swath", "stint", "while", "begat", "apply", "slang", "tarot", "radar", "credo", "aware", "canon", "shift", "timer", "bylaw", "serum", "three", "steak", "iliac", "shirk", "blunt", "puppy", "penal", "joist", "bunny", "shape", "beget", "wheel", "adept", "stunt", "stole", "topaz", "chore", "fluke", "afoot", "bloat", "bully", "dense", "caper", "sneer", "boxer", "jumbo", "lunge", "space", "avail", "short", "slurp", "loyal", "flirt", "pizza", "conch", "tempo", "droop", "plate", "bible", "plunk", "afoul", "savoy", "steep", "agile", "stake", "dwell", "knave", "beard", "arose", "motif", "smash", "broil", "glare", "shove", "baggy", "mammy", "swamp", "along", "rugby", "wager", "quack", "squat", "snaky", "debit", "mange", "skate", "ninth", "joust", "tramp", "spurn", "medal", "micro", "rebel", "flank", "learn", "nadir", "maple", "comfy", "remit", "gruff", "ester", "least", "mogul", "fetch", "cause", "oaken", "aglow", "meaty", "gaffe", "shyly", "racer", "prowl", "thief", "stern", "poesy", "rocky", "tweet", "waist", "spire", "grope", "havoc", "patsy", "truly", "forty", "deity", "uncle", "swish", "giver", "preen", "bevel", "lemur", "draft", "slope", "annoy", "lingo", "bleak", "ditty", "curly", "cedar", "dirge", "grown", "horde", "drool", "shuck", "crypt", "cumin", "stock", "gravy", "locus", "wider", "breed", "quite", "chafe", "cache", "blimp", "deign", "fiend", "logic", "cheap", "elide", "rigid", "false", "renal", "pence", "rowdy", "shoot", "blaze", "envoy", "posse", "brief", "never", "abort", "mouse", "mucky", "sulky", "fiery", "media", "trunk", "yeast", "clear", "skunk", "scalp", "bitty", "cider", "koala", "duvet", "segue", "creme", "super", "grill", "after", "owner", "ember", "reach", "nobly", "empty", "speed", "gipsy", "recur", "smock", "dread", "merge", "burst", "kappa", "amity", "shaky", "hover", "carol", "snort", "synod", "faint", "haunt", "flour", "chair", "detox", "shrew", "tense", "plied", "quark", "burly", "novel", "waxen", "stoic", "jerky", "blitz", "beefy", "lyric", "hussy", "towel", "quilt", "below", "bingo", "wispy", "brash", "scone", "toast", "easel", "saucy", "value", "spice", "honor", "route", "sharp", "bawdy", "radii", "skull", "phony", "issue", "lager", "swell", "urine", "gassy", "trial", "flora", "upper", "latch", "wight", "brick", "retry", "holly", "decal", "grass", "shack", "dogma", "mover", "defer", "sober", "optic", "crier", "vying", "nomad", "flute", "hippo", "shark", "drier", "obese", "bugle", "tawny", "chalk", "feast", "ruddy", "pedal", "scarf", "cruel", "bleat", "tidal", "slush", "semen", "windy", "dusty", "sally", "igloo", "nerdy", "jewel", "shone", "whale", "hymen", "abuse", "fugue", "elbow", "crumb", "pansy", "welsh", "syrup", "terse", "suave", "gamut", "swung", "drake", "freed", "afire", "shirt", "grout", "oddly", "tithe", "plaid", "dummy", "broom", "blind", "torch", "enemy", "again", "tying", "pesky", "alter", "gazer", "noble", "ethos", "bride", "extol", "decor", "hobby", "beast", "idiom", "utter", "these", "sixth", "alarm", "erase", "elegy", "spunk", "piper", "scaly", "scold", "hefty", "chick", "sooty", "canal", "whiny", "slash", "quake", "joint", "swept", "prude", "heavy", "wield", "femme", "lasso", "maize", "shale", "screw", "spree", "smoky", "whiff", "scent", "glade", "spent", "prism", "stoke", "riper", "orbit", "cocoa", "guilt", "humus", "shush", "table", "smirk", "wrong", "noisy", "alert", "shiny", "elate", "resin", "whole", "hunch", "pixel", "polar", "hotel", "sword", "cleat", "mango", "rumba", "puffy", "filly", "billy", "leash", "clout", "dance", "ovate", "facet", "chili", "paint", "liner", "curio", "salty", "audio", "snake", "fable", "cloak", "navel", "spurt", "pesto", "balmy", "flash", "unwed", "early", "churn", "weedy", "stump", "lease", "witty", "wimpy", "spoof", "saner", "blend", "salsa", "thick", "warty", "manic", "blare", "squib", "spoon", "probe", "crepe", "knack", "force", "debut", "order", "haste", "teeth", "agent", "widen", "icily", "slice", "ingot", "clash", "juror", "blood", "abode", "throw", "unity", "pivot", "slept", "troop", "spare", "sewer", "parse", "morph", "cacti", "tacky", "spool", "demon", "moody", "annex", "begin", "fuzzy", "patch", "water", "lumpy", "admin", "omega", "limit", "tabby", "macho", "aisle", "skiff", "basis", "plank", "verge", "botch", "crawl", "lousy", "slain", "cubic", "raise", "wrack", "guide", "foist", "cameo", "under", "actor", "revue", "fraud", "harpy", "scoop", "climb", "refer", "olden", "clerk", "debar", "tally", "ethic", "cairn", "tulle", "ghoul", "hilly", "crude", "apart", "scale", "older", "plain", "sperm", "briny", "abbot", "rerun", "quest", "crisp", "bound", "befit", "drawn", "suite", "itchy", "cheer", "bagel", "guess", "broad", "axiom", "chard", "caput", "leant", "harsh", "curse", "proud", "swing", "opine", "taste", "lupus", "gumbo", "miner", "green", "chasm", "lipid", "topic", "armor", "brush", "crane", "mural", "abled", "habit", "bossy", "maker", "dusky", "dizzy", "lithe", "brook", "jazzy", "fifty", "sense", "giant", "surly", "legal", "fatal", "flunk", "began", "prune", "small", "slant", "scoff", "torus", "ninny", "covey", "viper", "taken", "moral", "vogue", "owing", "token", "entry", "booth", "voter", "chide", "elfin", "ebony", "neigh", "minim", "melon", "kneed", "decoy", "voila", "ankle", "arrow", "mushy", "tribe", "cease", "eager", "birth", "graph", "odder", "terra", "weird", "tried", "clack", "color", "rough", "weigh", "uncut", "ladle", "strip", "craft", "minus", "dicey", "titan", "lucid", "vicar", "dress", "ditch", "gypsy", "pasta", "taffy", "flame", "swoop", "aloof", "sight", "broke", "teary", "chart", "sixty", "wordy", "sheer", "leper", "nosey", "bulge", "savor", "clamp", "funky", "foamy", "toxic", "brand", "plumb", "dingy", "butte", "drill", "tripe", "bicep", "tenor", "krill", "worse", "drama", "hyena", "think", "ratio", "cobra", "basil", "scrum", "bused", "phone", "court", "camel", "proof", "heard", "angel", "petal", "pouty", "throb", "maybe", "fetal", "sprig", "spine", "shout", "cadet", "macro", "dodgy", "satyr", "rarer", "binge", "trend", "nutty", "leapt", "amiss", "split", "myrrh", "width", "sonar", "tower", "baron", "fever", "waver", "spark", "belie", "sloop", "expel", "smote", "baler", "above", "north", "wafer", "scant", "frill", "awash", "snack", "scowl", "frail", "drift", "limbo", "fence", "motel", "ounce", "wreak", "revel", "talon", "prior", "knelt", "cello", "flake", "debug", "anode", "crime", "salve", "scout", "imbue", "pinky", "stave", "vague", "chock", "fight", "video", "stone", "teach", "cleft", "frost", "prawn", "booty", "twist", "apnea", "stiff", "plaza", "ledge", "tweak", "board", "grant", "medic", "bacon", "cable", "brawl", "slunk", "raspy", "forum", "drone", "women", "mucus", "boast", "toddy", "coven", "tumor", "truer", "wrath", "stall", "steam", "axial", "purer", "daily", "trail", "niche", "mealy", "juice", "nylon", "plump", "merry", "flail", "papal", "wheat", "berry", "cower", "erect", "brute", "leggy", "snipe", "sinew", "skier", "penny", "jumpy", "rally", "umbra", "scary", "modem", "gross", "avian", "greed", "satin", "tonic", "parka", "sniff", "livid", "stark", "trump", "giddy", "reuse", "taboo", "avoid", "quote", "devil", "liken", "gloss", "gayer", "beret", "noise", "gland", "dealt", "sling", "rumor", "opera", "thigh", "tonga", "flare", "wound", "white", "bulky", "etude", "horse", "circa", "paddy", "inbox", "fizzy", "grain", "exert", "surge", "gleam", "belle", "salvo", "crush", "fruit", "sappy", "taker", "tract", "ovine", "spiky", "frank", "reedy", "filth", "spasm", "heave", "mambo", "right", "clank", "trust", "lumen", "borne", "spook", "sauce", "amber", "lathe", "carat", "corer", "dirty", "slyly", "affix", "alloy", "taint", "sheep", "kinky", "wooly", "mauve", "flung", "yacht", "fried", "quail", "brunt", "grimy", "curvy", "cagey", "rinse", "deuce", "state", "grasp", "milky", "bison", "graft", "sandy", "baste", "flask", "hedge", "girly", "swash", "boney", "coupe", "endow", "abhor", "welch", "blade", "tight", "geese", "miser", "mirth", "cloud", "cabal", "leech", "close", "tenth", "pecan", "droit", "grail", "clone", "guise", "ralph", "tango", "biddy", "smith", "mower", "payee", "serif", "drape", "fifth", "spank", "glaze", "allot", "truck", "kayak", "virus", "testy", "tepee", "fully", "zonal", "metro", "curry", "grand", "banjo", "axion", "bezel", "occur", "chain", "nasal", "gooey", "filer", "brace", "allay", "pubic", "raven", "plead", "gnash", "flaky", "munch", "dully", "eking", "thing", "slink", "hurry", "theft", "shorn", "pygmy", "ranch", "wring", "lemon", "shore", "mamma", "froze", "newer", "style", "moose", "antic", "drown", "vegan", "chess", "guppy", "union", "lever", "lorry", "image", "cabby", "druid", "exact", "truth", "dopey", "spear", "cried", "chime", "crony", "stunk", "timid", "batch", "gauge", "rotor", "crack", "curve", "latte", "witch", "bunch", "repel", "anvil", "soapy", "meter", "broth", "madly", "dried", "scene", "known", "magma", "roost", "woman", "thong", "punch", "pasty", "downy", "knead", "whirl", "rapid", "clang", "anger", "drive", "goofy", "email", "music", "stuff", "bleep", "rider", "mecca", "folio", "setup", "verso", "quash", "fauna", "gummy", "happy", "newly", "fussy", "relic", "guava", "ratty", "fudge", "femur", "chirp", "forte", "alibi", "whine", "petty", "golly", "plait", "fleck", "felon", "gourd", "brown", "thrum", "ficus", "stash", "decry", "wiser", "junta", "visor", "daunt", "scree", "impel", "await", "press", "whose", "turbo", "stoop", "speak", "mangy", "eying", "inlet", "crone", "pulse", "mossy", "staid", "hence", "pinch", "teddy", "sully", "snore", "ripen", "snowy", "attic", "going", "leach", "mouth", "hound", "clump", "tonal", "bigot", "peril", "piece", "blame", "haute", "spied", "undid", "intro", "basal", "shine", "gecko", "rodeo", "guard", "steer", "loamy", "scamp", "scram", "manly", "hello", "vaunt", "organ", "feral", "knock", "extra", "condo", "adapt", "willy", "polka", "rayon", "skirt", "faith", "torso", "match", "mercy", "tepid", "sleek", "riser", "twixt", "peace", "flush", "catty", "login", "eject", "roger", "rival", "untie", "refit", "aorta", "adult", "judge", "rower", "artsy", "rural", "shave", "bobby", "eclat", "fella", "gaily", "harry", "hasty", "hydro", "liege", "octal", "ombre", "payer", "sooth", "unset", "unlit", "vomit", "fanny"],
        Oa = ["aahed", "aalii", "aargh", "aarti", "abaca", "abaci", "abacs", "abaft", "abaka", "abamp", "aband", "abash", "abask", "abaya", "abbas", "abbed", "abbes", "abcee", "abeam", "abear", "abele", "abers", "abets", "abies", "abler", "ables", "ablet", "ablow", "abmho", "abohm", "aboil", "aboma", "aboon", "abord", "abore", "abram", "abray", "abrim", "abrin", "abris", "absey", "absit", "abuna", "abune", "abuts", "abuzz", "abyes", "abysm", "acais", "acari", "accas", "accoy", "acerb", "acers", "aceta", "achar", "ached", "aches", "achoo", "acids", "acidy", "acing", "acini", "ackee", "acker", "acmes", "acmic", "acned", "acnes", "acock", "acold", "acred", "acres", "acros", "acted", "actin", "acton", "acyls", "adaws", "adays", "adbot", "addax", "added", "adder", "addio", "addle", "adeem", "adhan", "adieu", "adios", "adits", "adman", "admen", "admix", "adobo", "adown", "adoze", "adrad", "adred", "adsum", "aduki", "adunc", "adust", "advew", "adyta", "adzed", "adzes", "aecia", "aedes", "aegis", "aeons", "aerie", "aeros", "aesir", "afald", "afara", "afars", "afear", "aflaj", "afore", "afrit", "afros", "agama", "agami", "agars", "agast", "agave", "agaze", "agene", "agers", "agger", "aggie", "aggri", "aggro", "aggry", "aghas", "agila", "agios", "agism", "agist", "agita", "aglee", "aglet", "agley", "agloo", "aglus", "agmas", "agoge", "agone", "agons", "agood", "agora", "agria", "agrin", "agros", "agued", "agues", "aguna", "aguti", "aheap", "ahent", "ahigh", "ahind", "ahing", "ahint", "ahold", "ahull", "ahuru", "aidas", "aided", "aides", "aidoi", "aidos", "aiery", "aigas", "aight", "ailed", "aimed", "aimer", "ainee", "ainga", "aioli", "aired", "airer", "airns", "airth", "airts", "aitch", "aitus", "aiver", "aiyee", "aizle", "ajies", "ajiva", "ajuga", "ajwan", "akees", "akela", "akene", "aking", "akita", "akkas", "alaap", "alack", "alamo", "aland", "alane", "alang", "alans", "alant", "alapa", "alaps", "alary", "alate", "alays", "albas", "albee", "alcid", "alcos", "aldea", "alder", "aldol", "aleck", "alecs", "alefs", "aleft", "aleph", "alews", "aleye", "alfas", "algal", "algas", "algid", "algin", "algor", "algum", "alias", "alifs", "aline", "alist", "aliya", "alkie", "alkos", "alkyd", "alkyl", "allee", "allel", "allis", "allod", "allyl", "almah", "almas", "almeh", "almes", "almud", "almug", "alods", "aloed", "aloes", "aloha", "aloin", "aloos", "alowe", "altho", "altos", "alula", "alums", "alure", "alvar", "alway", "amahs", "amain", "amate", "amaut", "amban", "ambit", "ambos", "ambry", "ameba", "ameer", "amene", "amens", "ament", "amias", "amice", "amici", "amide", "amido", "amids", "amies", "amiga", "amigo", "amine", "amino", "amins", "amirs", "amlas", "amman", "ammon", "ammos", "amnia", "amnic", "amnio", "amoks", "amole", "amort", "amour", "amove", "amowt", "amped", "ampul", "amrit", "amuck", "amyls", "anana", "anata", "ancho", "ancle", "ancon", "andro", "anear", "anele", "anent", "angas", "anglo", "anigh", "anile", "anils", "anima", "animi", "anion", "anise", "anker", "ankhs", "ankus", "anlas", "annal", "annas", "annat", "anoas", "anole", "anomy", "ansae", "antae", "antar", "antas", "anted", "antes", "antis", "antra", "antre", "antsy", "anura", "anyon", "apace", "apage", "apaid", "apayd", "apays", "apeak", "apeek", "apers", "apert", "apery", "apgar", "aphis", "apian", "apiol", "apish", "apism", "apode", "apods", "apoop", "aport", "appal", "appay", "appel", "appro", "appui", "appuy", "apres", "apses", "apsis", "apsos", "apted", "apter", "aquae", "aquas", "araba", "araks", "arame", "arars", "arbas", "arced", "archi", "arcos", "arcus", "ardeb", "ardri", "aread", "areae", "areal", "arear", "areas", "areca", "aredd", "arede", "arefy", "areic", "arene", "arepa", "arere", "arete", "arets", "arett", "argal", "argan", "argil", "argle", "argol", "argon", "argot", "argus", "arhat", "arias", "ariel", "ariki", "arils", "ariot", "arish", "arked", "arled", "arles", "armed", "armer", "armet", "armil", "arnas", "arnut", "aroba", "aroha", "aroid", "arpas", "arpen", "arrah", "arras", "arret", "arris", "arroz", "arsed", "arses", "arsey", "arsis", "artal", "artel", "artic", "artis", "aruhe", "arums", "arval", "arvee", "arvos", "aryls", "asana", "ascon", "ascus", "asdic", "ashed", "ashes", "ashet", "asked", "asker", "askoi", "askos", "aspen", "asper", "aspic", "aspie", "aspis", "aspro", "assai", "assam", "asses", "assez", "assot", "aster", "astir", "astun", "asura", "asway", "aswim", "asyla", "ataps", "ataxy", "atigi", "atilt", "atimy", "atlas", "atman", "atmas", "atmos", "atocs", "atoke", "atoks", "atoms", "atomy", "atony", "atopy", "atria", "atrip", "attap", "attar", "atuas", "audad", "auger", "aught", "aulas", "aulic", "auloi", "aulos", "aumil", "aunes", "aunts", "aurae", "aural", "aurar", "auras", "aurei", "aures", "auric", "auris", "aurum", "autos", "auxin", "avale", "avant", "avast", "avels", "avens", "avers", "avgas", "avine", "avion", "avise", "aviso", "avize", "avows", "avyze", "awarn", "awato", "awave", "aways", "awdls", "aweel", "aweto", "awing", "awmry", "awned", "awner", "awols", "awork", "axels", "axile", "axils", "axing", "axite", "axled", "axles", "axman", "axmen", "axoid", "axone", "axons", "ayahs", "ayaya", "ayelp", "aygre", "ayins", "ayont", "ayres", "ayrie", "azans", "azide", "azido", "azine", "azlon", "azoic", "azole", "azons", "azote", "azoth", "azuki", "azurn", "azury", "azygy", "azyme", "azyms", "baaed", "baals", "babas", "babel", "babes", "babka", "baboo", "babul", "babus", "bacca", "bacco", "baccy", "bacha", "bachs", "backs", "baddy", "baels", "baffs", "baffy", "bafts", "baghs", "bagie", "bahts", "bahus", "bahut", "bails", "bairn", "baisa", "baith", "baits", "baiza", "baize", "bajan", "bajra", "bajri", "bajus", "baked", "baken", "bakes", "bakra", "balas", "balds", "baldy", "baled", "bales", "balks", "balky", "balls", "bally", "balms", "baloo", "balsa", "balti", "balun", "balus", "bambi", "banak", "banco", "bancs", "banda", "bandh", "bands", "bandy", "baned", "banes", "bangs", "bania", "banks", "banns", "bants", "bantu", "banty", "banya", "bapus", "barbe", "barbs", "barby", "barca", "barde", "bardo", "bards", "bardy", "bared", "barer", "bares", "barfi", "barfs", "baric", "barks", "barky", "barms", "barmy", "barns", "barny", "barps", "barra", "barre", "barro", "barry", "barye", "basan", "based", "basen", "baser", "bases", "basho", "basij", "basks", "bason", "basse", "bassi", "basso", "bassy", "basta", "basti", "basto", "basts", "bated", "bates", "baths", "batik", "batta", "batts", "battu", "bauds", "bauks", "baulk", "baurs", "bavin", "bawds", "bawks", "bawls", "bawns", "bawrs", "bawty", "bayed", "bayer", "bayes", "bayle", "bayts", "bazar", "bazoo", "beads", "beaks", "beaky", "beals", "beams", "beamy", "beano", "beans", "beany", "beare", "bears", "beath", "beats", "beaty", "beaus", "beaut", "beaux", "bebop", "becap", "becke", "becks", "bedad", "bedel", "bedes", "bedew", "bedim", "bedye", "beedi", "beefs", "beeps", "beers", "beery", "beets", "befog", "begad", "begar", "begem", "begot", "begum", "beige", "beigy", "beins", "bekah", "belah", "belar", "belay", "belee", "belga", "bells", "belon", "belts", "bemad", "bemas", "bemix", "bemud", "bends", "bendy", "benes", "benet", "benga", "benis", "benne", "benni", "benny", "bento", "bents", "benty", "bepat", "beray", "beres", "bergs", "berko", "berks", "berme", "berms", "berob", "beryl", "besat", "besaw", "besee", "beses", "besit", "besom", "besot", "besti", "bests", "betas", "beted", "betes", "beths", "betid", "beton", "betta", "betty", "bever", "bevor", "bevue", "bevvy", "bewet", "bewig", "bezes", "bezil", "bezzy", "bhais", "bhaji", "bhang", "bhats", "bhels", "bhoot", "bhuna", "bhuts", "biach", "biali", "bialy", "bibbs", "bibes", "biccy", "bices", "bided", "bider", "bides", "bidet", "bidis", "bidon", "bield", "biers", "biffo", "biffs", "biffy", "bifid", "bigae", "biggs", "biggy", "bigha", "bight", "bigly", "bigos", "bijou", "biked", "biker", "bikes", "bikie", "bilbo", "bilby", "biled", "biles", "bilgy", "bilks", "bills", "bimah", "bimas", "bimbo", "binal", "bindi", "binds", "biner", "bines", "bings", "bingy", "binit", "binks", "bints", "biogs", "biont", "biota", "biped", "bipod", "birds", "birks", "birle", "birls", "biros", "birrs", "birse", "birsy", "bises", "bisks", "bisom", "bitch", "biter", "bites", "bitos", "bitou", "bitsy", "bitte", "bitts", "bivia", "bivvy", "bizes", "bizzo", "bizzy", "blabs", "blads", "blady", "blaer", "blaes", "blaff", "blags", "blahs", "blain", "blams", "blart", "blase", "blash", "blate", "blats", "blatt", "blaud", "blawn", "blaws", "blays", "blear", "blebs", "blech", "blees", "blent", "blert", "blest", "blets", "bleys", "blimy", "bling", "blini", "blins", "bliny", "blips", "blist", "blite", "blits", "blive", "blobs", "blocs", "blogs", "blook", "bloop", "blore", "blots", "blows", "blowy", "blubs", "blude", "bluds", "bludy", "blued", "blues", "bluet", "bluey", "bluid", "blume", "blunk", "blurs", "blype", "boabs", "boaks", "boars", "boart", "boats", "bobac", "bobak", "bobas", "bobol", "bobos", "bocca", "bocce", "bocci", "boche", "bocks", "boded", "bodes", "bodge", "bodhi", "bodle", "boeps", "boets", "boeuf", "boffo", "boffs", "bogan", "bogey", "boggy", "bogie", "bogle", "bogue", "bogus", "bohea", "bohos", "boils", "boing", "boink", "boite", "boked", "bokeh", "bokes", "bokos", "bolar", "bolas", "bolds", "boles", "bolix", "bolls", "bolos", "bolts", "bolus", "bomas", "bombe", "bombo", "bombs", "bonce", "bonds", "boned", "boner", "bones", "bongs", "bonie", "bonks", "bonne", "bonny", "bonza", "bonze", "booai", "booay", "boobs", "boody", "booed", "boofy", "boogy", "boohs", "books", "booky", "bools", "booms", "boomy", "boong", "boons", "boord", "boors", "boose", "boots", "boppy", "borak", "boral", "boras", "borde", "bords", "bored", "boree", "borel", "borer", "bores", "borgo", "boric", "borks", "borms", "borna", "boron", "borts", "borty", "bortz", "bosie", "bosks", "bosky", "boson", "bosun", "botas", "botel", "botes", "bothy", "botte", "botts", "botty", "bouge", "bouks", "boult", "bouns", "bourd", "bourg", "bourn", "bouse", "bousy", "bouts", "bovid", "bowat", "bowed", "bower", "bowes", "bowet", "bowie", "bowls", "bowne", "bowrs", "bowse", "boxed", "boxen", "boxes", "boxla", "boxty", "boyar", "boyau", "boyed", "boyfs", "boygs", "boyla", "boyos", "boysy", "bozos", "braai", "brach", "brack", "bract", "brads", "braes", "brags", "brail", "braks", "braky", "brame", "brane", "brank", "brans", "brant", "brast", "brats", "brava", "bravi", "braws", "braxy", "brays", "braza", "braze", "bream", "brede", "breds", "breem", "breer", "brees", "breid", "breis", "breme", "brens", "brent", "brere", "brers", "breve", "brews", "breys", "brier", "bries", "brigs", "briki", "briks", "brill", "brims", "brins", "brios", "brise", "briss", "brith", "brits", "britt", "brize", "broch", "brock", "brods", "brogh", "brogs", "brome", "bromo", "bronc", "brond", "brool", "broos", "brose", "brosy", "brows", "brugh", "bruin", "bruit", "brule", "brume", "brung", "brusk", "brust", "bruts", "buats", "buaze", "bubal", "bubas", "bubba", "bubbe", "bubby", "bubus", "buchu", "bucko", "bucks", "bucku", "budas", "budis", "budos", "buffa", "buffe", "buffi", "buffo", "buffs", "buffy", "bufos", "bufty", "buhls", "buhrs", "buiks", "buist", "bukes", "bulbs", "bulgy", "bulks", "bulla", "bulls", "bulse", "bumbo", "bumfs", "bumph", "bumps", "bumpy", "bunas", "bunce", "bunco", "bunde", "bundh", "bunds", "bundt", "bundu", "bundy", "bungs", "bungy", "bunia", "bunje", "bunjy", "bunko", "bunks", "bunns", "bunts", "bunty", "bunya", "buoys", "buppy", "buran", "buras", "burbs", "burds", "buret", "burfi", "burgh", "burgs", "burin", "burka", "burke", "burks", "burls", "burns", "buroo", "burps", "burqa", "burro", "burrs", "burry", "bursa", "burse", "busby", "buses", "busks", "busky", "bussu", "busti", "busts", "busty", "buteo", "butes", "butle", "butoh", "butts", "butty", "butut", "butyl", "buzzy", "bwana", "bwazi", "byded", "bydes", "byked", "bykes", "byres", "byrls", "byssi", "bytes", "byway", "caaed", "cabas", "caber", "cabob", "caboc", "cabre", "cacas", "cacks", "cacky", "cadee", "cades", "cadge", "cadgy", "cadie", "cadis", "cadre", "caeca", "caese", "cafes", "caffs", "caged", "cager", "cages", "cagot", "cahow", "caids", "cains", "caird", "cajon", "cajun", "caked", "cakes", "cakey", "calfs", "calid", "calif", "calix", "calks", "calla", "calls", "calms", "calmy", "calos", "calpa", "calps", "calve", "calyx", "caman", "camas", "cames", "camis", "camos", "campi", "campo", "camps", "campy", "camus", "caned", "caneh", "caner", "canes", "cangs", "canid", "canna", "canns", "canso", "canst", "canto", "cants", "canty", "capas", "caped", "capes", "capex", "caphs", "capiz", "caple", "capon", "capos", "capot", "capri", "capul", "carap", "carbo", "carbs", "carby", "cardi", "cards", "cardy", "cared", "carer", "cares", "caret", "carex", "carks", "carle", "carls", "carns", "carny", "carob", "carom", "caron", "carpi", "carps", "carrs", "carse", "carta", "carte", "carts", "carvy", "casas", "casco", "cased", "cases", "casks", "casky", "casts", "casus", "cates", "cauda", "cauks", "cauld", "cauls", "caums", "caups", "cauri", "causa", "cavas", "caved", "cavel", "caver", "caves", "cavie", "cawed", "cawks", "caxon", "ceaze", "cebid", "cecal", "cecum", "ceded", "ceder", "cedes", "cedis", "ceiba", "ceili", "ceils", "celeb", "cella", "celli", "cells", "celom", "celts", "cense", "cento", "cents", "centu", "ceorl", "cepes", "cerci", "cered", "ceres", "cerge", "ceria", "ceric", "cerne", "ceroc", "ceros", "certs", "certy", "cesse", "cesta", "cesti", "cetes", "cetyl", "cezve", "chace", "chack", "chaco", "chado", "chads", "chaft", "chais", "chals", "chams", "chana", "chang", "chank", "chape", "chaps", "chapt", "chara", "chare", "chark", "charr", "chars", "chary", "chats", "chave", "chavs", "chawk", "chaws", "chaya", "chays", "cheep", "chefs", "cheka", "chela", "chelp", "chemo", "chems", "chere", "chert", "cheth", "chevy", "chews", "chewy", "chiao", "chias", "chibs", "chica", "chich", "chico", "chics", "chiel", "chiks", "chile", "chimb", "chimo", "chimp", "chine", "ching", "chink", "chino", "chins", "chips", "chirk", "chirl", "chirm", "chiro", "chirr", "chirt", "chiru", "chits", "chive", "chivs", "chivy", "chizz", "choco", "chocs", "chode", "chogs", "choil", "choko", "choky", "chola", "choli", "cholo", "chomp", "chons", "choof", "chook", "choom", "choon", "chops", "chota", "chott", "chout", "choux", "chowk", "chows", "chubs", "chufa", "chuff", "chugs", "chums", "churl", "churr", "chuse", "chuts", "chyle", "chyme", "chynd", "cibol", "cided", "cides", "ciels", "ciggy", "cilia", "cills", "cimar", "cimex", "cinct", "cines", "cinqs", "cions", "cippi", "circs", "cires", "cirls", "cirri", "cisco", "cissy", "cists", "cital", "cited", "citer", "cites", "cives", "civet", "civie", "civvy", "clach", "clade", "clads", "claes", "clags", "clame", "clams", "clans", "claps", "clapt", "claro", "clart", "clary", "clast", "clats", "claut", "clave", "clavi", "claws", "clays", "cleck", "cleek", "cleep", "clefs", "clegs", "cleik", "clems", "clepe", "clept", "cleve", "clews", "clied", "clies", "clift", "clime", "cline", "clint", "clipe", "clips", "clipt", "clits", "cloam", "clods", "cloff", "clogs", "cloke", "clomb", "clomp", "clonk", "clons", "cloop", "cloot", "clops", "clote", "clots", "clour", "clous", "clows", "cloye", "cloys", "cloze", "clubs", "clues", "cluey", "clunk", "clype", "cnida", "coact", "coady", "coala", "coals", "coaly", "coapt", "coarb", "coate", "coati", "coats", "cobbs", "cobby", "cobia", "coble", "cobza", "cocas", "cocci", "cocco", "cocks", "cocky", "cocos", "codas", "codec", "coded", "coden", "coder", "codes", "codex", "codon", "coeds", "coffs", "cogie", "cogon", "cogue", "cohab", "cohen", "cohoe", "cohog", "cohos", "coifs", "coign", "coils", "coins", "coirs", "coits", "coked", "cokes", "colas", "colby", "colds", "coled", "coles", "coley", "colic", "colin", "colls", "colly", "colog", "colts", "colza", "comae", "comal", "comas", "combe", "combi", "combo", "combs", "comby", "comer", "comes", "comix", "commo", "comms", "commy", "compo", "comps", "compt", "comte", "comus", "coned", "cones", "coney", "confs", "conga", "conge", "congo", "conia", "conin", "conks", "conky", "conne", "conns", "conte", "conto", "conus", "convo", "cooch", "cooed", "cooee", "cooer", "cooey", "coofs", "cooks", "cooky", "cools", "cooly", "coomb", "cooms", "coomy", "coons", "coops", "coopt", "coost", "coots", "cooze", "copal", "copay", "coped", "copen", "coper", "copes", "coppy", "copra", "copsy", "coqui", "coram", "corbe", "corby", "cords", "cored", "cores", "corey", "corgi", "coria", "corks", "corky", "corms", "corni", "corno", "corns", "cornu", "corps", "corse", "corso", "cosec", "cosed", "coses", "coset", "cosey", "cosie", "costa", "coste", "costs", "cotan", "coted", "cotes", "coths", "cotta", "cotts", "coude", "coups", "courb", "courd", "coure", "cours", "couta", "couth", "coved", "coves", "covin", "cowal", "cowan", "cowed", "cowks", "cowls", "cowps", "cowry", "coxae", "coxal", "coxed", "coxes", "coxib", "coyau", "coyed", "coyer", "coypu", "cozed", "cozen", "cozes", "cozey", "cozie", "craal", "crabs", "crags", "craic", "craig", "crake", "crame", "crams", "crans", "crape", "craps", "crapy", "crare", "craws", "crays", "creds", "creel", "crees", "crems", "crena", "creps", "crepy", "crewe", "crews", "crias", "cribs", "cries", "crims", "crine", "crios", "cripe", "crips", "crise", "crith", "crits", "croci", "crocs", "croft", "crogs", "cromb", "crome", "cronk", "crons", "crool", "croon", "crops", "crore", "crost", "crout", "crows", "croze", "cruck", "crudo", "cruds", "crudy", "crues", "cruet", "cruft", "crunk", "cruor", "crura", "cruse", "crusy", "cruve", "crwth", "cryer", "ctene", "cubby", "cubeb", "cubed", "cuber", "cubes", "cubit", "cuddy", "cuffo", "cuffs", "cuifs", "cuing", "cuish", "cuits", "cukes", "culch", "culet", "culex", "culls", "cully", "culms", "culpa", "culti", "cults", "culty", "cumec", "cundy", "cunei", "cunit", "cunts", "cupel", "cupid", "cuppa", "cuppy", "curat", "curbs", "curch", "curds", "curdy", "cured", "curer", "cures", "curet", "curfs", "curia", "curie", "curli", "curls", "curns", "curny", "currs", "cursi", "curst", "cusec", "cushy", "cusks", "cusps", "cuspy", "cusso", "cusum", "cutch", "cuter", "cutes", "cutey", "cutin", "cutis", "cutto", "cutty", "cutup", "cuvee", "cuzes", "cwtch", "cyano", "cyans", "cycad", "cycas", "cyclo", "cyder", "cylix", "cymae", "cymar", "cymas", "cymes", "cymol", "cysts", "cytes", "cyton", "czars", "daals", "dabba", "daces", "dacha", "dacks", "dadah", "dadas", "dados", "daffs", "daffy", "dagga", "daggy", "dagos", "dahls", "daiko", "daine", "daint", "daker", "daled", "dales", "dalis", "dalle", "dalts", "daman", "damar", "dames", "damme", "damns", "damps", "dampy", "dancy", "dangs", "danio", "danks", "danny", "dants", "daraf", "darbs", "darcy", "dared", "darer", "dares", "darga", "dargs", "daric", "daris", "darks", "darky", "darns", "darre", "darts", "darzi", "dashi", "dashy", "datal", "dated", "dater", "dates", "datos", "datto", "daube", "daubs", "dauby", "dauds", "dault", "daurs", "dauts", "daven", "davit", "dawah", "dawds", "dawed", "dawen", "dawks", "dawns", "dawts", "dayan", "daych", "daynt", "dazed", "dazer", "dazes", "deads", "deair", "deals", "deans", "deare", "dearn", "dears", "deary", "deash", "deave", "deaws", "deawy", "debag", "debby", "debel", "debes", "debts", "debud", "debur", "debus", "debye", "decad", "decaf", "decan", "decko", "decks", "decos", "dedal", "deeds", "deedy", "deely", "deems", "deens", "deeps", "deere", "deers", "deets", "deeve", "deevs", "defat", "deffo", "defis", "defog", "degas", "degum", "degus", "deice", "deids", "deify", "deils", "deism", "deist", "deked", "dekes", "dekko", "deled", "deles", "delfs", "delft", "delis", "dells", "delly", "delos", "delph", "delts", "deman", "demes", "demic", "demit", "demob", "demoi", "demos", "dempt", "denar", "denay", "dench", "denes", "denet", "denis", "dents", "deoxy", "derat", "deray", "dered", "deres", "derig", "derma", "derms", "derns", "derny", "deros", "derro", "derry", "derth", "dervs", "desex", "deshi", "desis", "desks", "desse", "devas", "devel", "devis", "devon", "devos", "devot", "dewan", "dewar", "dewax", "dewed", "dexes", "dexie", "dhaba", "dhaks", "dhals", "dhikr", "dhobi", "dhole", "dholl", "dhols", "dhoti", "dhows", "dhuti", "diact", "dials", "diane", "diazo", "dibbs", "diced", "dicer", "dices", "dicht", "dicks", "dicky", "dicot", "dicta", "dicts", "dicty", "diddy", "didie", "didos", "didst", "diebs", "diels", "diene", "diets", "diffs", "dight", "dikas", "diked", "diker", "dikes", "dikey", "dildo", "dilli", "dills", "dimbo", "dimer", "dimes", "dimps", "dinar", "dined", "dines", "dinge", "dings", "dinic", "dinks", "dinky", "dinna", "dinos", "dints", "diols", "diota", "dippy", "dipso", "diram", "direr", "dirke", "dirks", "dirls", "dirts", "disas", "disci", "discs", "dishy", "disks", "disme", "dital", "ditas", "dited", "dites", "ditsy", "ditts", "ditzy", "divan", "divas", "dived", "dives", "divis", "divna", "divos", "divot", "divvy", "diwan", "dixie", "dixit", "diyas", "dizen", "djinn", "djins", "doabs", "doats", "dobby", "dobes", "dobie", "dobla", "dobra", "dobro", "docht", "docks", "docos", "docus", "doddy", "dodos", "doeks", "doers", "doest", "doeth", "doffs", "dogan", "doges", "dogey", "doggo", "doggy", "dogie", "dohyo", "doilt", "doily", "doits", "dojos", "dolce", "dolci", "doled", "doles", "dolia", "dolls", "dolma", "dolor", "dolos", "dolts", "domal", "domed", "domes", "domic", "donah", "donas", "donee", "doner", "donga", "dongs", "donko", "donna", "donne", "donny", "donsy", "doobs", "dooce", "doody", "dooks", "doole", "dools", "dooly", "dooms", "doomy", "doona", "doorn", "doors", "doozy", "dopas", "doped", "doper", "dopes", "dorad", "dorba", "dorbs", "doree", "dores", "doric", "doris", "dorks", "dorky", "dorms", "dormy", "dorps", "dorrs", "dorsa", "dorse", "dorts", "dorty", "dosai", "dosas", "dosed", "doseh", "doser", "doses", "dosha", "dotal", "doted", "doter", "dotes", "dotty", "douar", "douce", "doucs", "douks", "doula", "douma", "doums", "doups", "doura", "douse", "douts", "doved", "doven", "dover", "doves", "dovie", "dowar", "dowds", "dowed", "dower", "dowie", "dowle", "dowls", "dowly", "downa", "downs", "dowps", "dowse", "dowts", "doxed", "doxes", "doxie", "doyen", "doyly", "dozed", "dozer", "dozes", "drabs", "drack", "draco", "draff", "drags", "drail", "drams", "drant", "draps", "drats", "drave", "draws", "drays", "drear", "dreck", "dreed", "dreer", "drees", "dregs", "dreks", "drent", "drere", "drest", "dreys", "dribs", "drice", "dries", "drily", "drips", "dript", "droid", "droil", "droke", "drole", "drome", "drony", "droob", "droog", "drook", "drops", "dropt", "drouk", "drows", "drubs", "drugs", "drums", "drupe", "druse", "drusy", "druxy", "dryad", "dryas", "dsobo", "dsomo", "duads", "duals", "duans", "duars", "dubbo", "ducal", "ducat", "duces", "ducks", "ducky", "ducts", "duddy", "duded", "dudes", "duels", "duets", "duett", "duffs", "dufus", "duing", "duits", "dukas", "duked", "dukes", "dukka", "dulce", "dules", "dulia", "dulls", "dulse", "dumas", "dumbo", "dumbs", "dumka", "dumky", "dumps", "dunam", "dunch", "dunes", "dungs", "dungy", "dunks", "dunno", "dunny", "dunsh", "dunts", "duomi", "duomo", "duped", "duper", "dupes", "duple", "duply", "duppy", "dural", "duras", "dured", "dures", "durgy", "durns", "duroc", "duros", "duroy", "durra", "durrs", "durry", "durst", "durum", "durzi", "dusks", "dusts", "duxes", "dwaal", "dwale", "dwalm", "dwams", "dwang", "dwaum", "dweeb", "dwile", "dwine", "dyads", "dyers", "dyked", "dykes", "dykey", "dykon", "dynel", "dynes", "dzhos", "eagre", "ealed", "eales", "eaned", "eards", "eared", "earls", "earns", "earnt", "earst", "eased", "easer", "eases", "easle", "easts", "eathe", "eaved", "eaves", "ebbed", "ebbet", "ebons", "ebook", "ecads", "eched", "eches", "echos", "ecrus", "edema", "edged", "edger", "edges", "edile", "edits", "educe", "educt", "eejit", "eensy", "eeven", "eevns", "effed", "egads", "egers", "egest", "eggar", "egged", "egger", "egmas", "ehing", "eider", "eidos", "eigne", "eiked", "eikon", "eilds", "eisel", "ejido", "ekkas", "elain", "eland", "elans", "elchi", "eldin", "elemi", "elfed", "eliad", "elint", "elmen", "eloge", "elogy", "eloin", "elops", "elpee", "elsin", "elute", "elvan", "elven", "elver", "elves", "emacs", "embar", "embay", "embog", "embow", "embox", "embus", "emeer", "emend", "emerg", "emery", "emeus", "emics", "emirs", "emits", "emmas", "emmer", "emmet", "emmew", "emmys", "emoji", "emong", "emote", "emove", "empts", "emule", "emure", "emyde", "emyds", "enarm", "enate", "ended", "ender", "endew", "endue", "enews", "enfix", "eniac", "enlit", "enmew", "ennog", "enoki", "enols", "enorm", "enows", "enrol", "ensew", "ensky", "entia", "enure", "enurn", "envoi", "enzym", "eorls", "eosin", "epact", "epees", "ephah", "ephas", "ephod", "ephor", "epics", "epode", "epopt", "epris", "eques", "equid", "erbia", "erevs", "ergon", "ergos", "ergot", "erhus", "erica", "erick", "erics", "ering", "erned", "ernes", "erose", "erred", "erses", "eruct", "erugo", "eruvs", "erven", "ervil", "escar", "escot", "esile", "eskar", "esker", "esnes", "esses", "estoc", "estop", "estro", "etage", "etape", "etats", "etens", "ethal", "ethne", "ethyl", "etics", "etnas", "ettin", "ettle", "etuis", "etwee", "etyma", "eughs", "euked", "eupad", "euros", "eusol", "evens", "evert", "evets", "evhoe", "evils", "evite", "evohe", "ewers", "ewest", "ewhow", "ewked", "exams", "exeat", "execs", "exeem", "exeme", "exfil", "exies", "exine", "exing", "exits", "exode", "exome", "exons", "expat", "expos", "exude", "exuls", "exurb", "eyass", "eyers", "eyots", "eyras", "eyres", "eyrie", "eyrir", "ezine", "fabby", "faced", "facer", "faces", "facia", "facta", "facts", "faddy", "faded", "fader", "fades", "fadge", "fados", "faena", "faery", "faffs", "faffy", "faggy", "fagin", "fagot", "faiks", "fails", "faine", "fains", "fairs", "faked", "faker", "fakes", "fakey", "fakie", "fakir", "falaj", "falls", "famed", "fames", "fanal", "fands", "fanes", "fanga", "fango", "fangs", "fanks", "fanon", "fanos", "fanum", "faqir", "farad", "farci", "farcy", "fards", "fared", "farer", "fares", "farle", "farls", "farms", "faros", "farro", "farse", "farts", "fasci", "fasti", "fasts", "fated", "fates", "fatly", "fatso", "fatwa", "faugh", "fauld", "fauns", "faurd", "fauts", "fauve", "favas", "favel", "faver", "faves", "favus", "fawns", "fawny", "faxed", "faxes", "fayed", "fayer", "fayne", "fayre", "fazed", "fazes", "feals", "feare", "fears", "feart", "fease", "feats", "feaze", "feces", "fecht", "fecit", "fecks", "fedex", "feebs", "feeds", "feels", "feens", "feers", "feese", "feeze", "fehme", "feint", "feist", "felch", "felid", "fells", "felly", "felts", "felty", "femal", "femes", "femmy", "fends", "fendy", "fenis", "fenks", "fenny", "fents", "feods", "feoff", "ferer", "feres", "feria", "ferly", "fermi", "ferms", "ferns", "ferny", "fesse", "festa", "fests", "festy", "fetas", "feted", "fetes", "fetor", "fetta", "fetts", "fetwa", "feuar", "feuds", "feued", "feyed", "feyer", "feyly", "fezes", "fezzy", "fiars", "fiats", "fibre", "fibro", "fices", "fiche", "fichu", "ficin", "ficos", "fides", "fidge", "fidos", "fiefs", "fient", "fiere", "fiers", "fiest", "fifed", "fifer", "fifes", "fifis", "figgy", "figos", "fiked", "fikes", "filar", "filch", "filed", "files", "filii", "filks", "fille", "fillo", "fills", "filmi", "films", "filos", "filum", "finca", "finds", "fined", "fines", "finis", "finks", "finny", "finos", "fiord", "fiqhs", "fique", "fired", "firer", "fires", "firie", "firks", "firms", "firns", "firry", "firth", "fiscs", "fisks", "fists", "fisty", "fitch", "fitly", "fitna", "fitte", "fitts", "fiver", "fives", "fixed", "fixes", "fixit", "fjeld", "flabs", "flaff", "flags", "flaks", "flamm", "flams", "flamy", "flane", "flans", "flaps", "flary", "flats", "flava", "flawn", "flaws", "flawy", "flaxy", "flays", "fleam", "fleas", "fleek", "fleer", "flees", "flegs", "fleme", "fleur", "flews", "flexi", "flexo", "fleys", "flics", "flied", "flies", "flimp", "flims", "flips", "flirs", "flisk", "flite", "flits", "flitt", "flobs", "flocs", "floes", "flogs", "flong", "flops", "flors", "flory", "flosh", "flota", "flote", "flows", "flubs", "flued", "flues", "fluey", "fluky", "flump", "fluor", "flurr", "fluty", "fluyt", "flyby", "flype", "flyte", "foals", "foams", "foehn", "fogey", "fogie", "fogle", "fogou", "fohns", "foids", "foils", "foins", "folds", "foley", "folia", "folic", "folie", "folks", "folky", "fomes", "fonda", "fonds", "fondu", "fones", "fonly", "fonts", "foods", "foody", "fools", "foots", "footy", "foram", "forbs", "forby", "fordo", "fords", "forel", "fores", "forex", "forks", "forky", "forme", "forms", "forts", "forza", "forze", "fossa", "fosse", "fouat", "fouds", "fouer", "fouet", "foule", "fouls", "fount", "fours", "fouth", "fovea", "fowls", "fowth", "foxed", "foxes", "foxie", "foyle", "foyne", "frabs", "frack", "fract", "frags", "fraim", "franc", "frape", "fraps", "frass", "frate", "frati", "frats", "fraus", "frays", "frees", "freet", "freit", "fremd", "frena", "freon", "frere", "frets", "fribs", "frier", "fries", "frigs", "frise", "frist", "frith", "frits", "fritt", "frize", "frizz", "froes", "frogs", "frons", "frore", "frorn", "frory", "frosh", "frows", "frowy", "frugs", "frump", "frush", "frust", "fryer", "fubar", "fubby", "fubsy", "fucks", "fucus", "fuddy", "fudgy", "fuels", "fuero", "fuffs", "fuffy", "fugal", "fuggy", "fugie", "fugio", "fugle", "fugly", "fugus", "fujis", "fulls", "fumed", "fumer", "fumes", "fumet", "fundi", "funds", "fundy", "fungo", "fungs", "funks", "fural", "furan", "furca", "furls", "furol", "furrs", "furth", "furze", "furzy", "fused", "fusee", "fusel", "fuses", "fusil", "fusks", "fusts", "fusty", "futon", "fuzed", "fuzee", "fuzes", "fuzil", "fyces", "fyked", "fykes", "fyles", "fyrds", "fytte", "gabba", "gabby", "gable", "gaddi", "gades", "gadge", "gadid", "gadis", "gadje", "gadjo", "gadso", "gaffs", "gaged", "gager", "gages", "gaids", "gains", "gairs", "gaita", "gaits", "gaitt", "gajos", "galah", "galas", "galax", "galea", "galed", "gales", "galls", "gally", "galop", "galut", "galvo", "gamas", "gamay", "gamba", "gambe", "gambo", "gambs", "gamed", "games", "gamey", "gamic", "gamin", "gamme", "gammy", "gamps", "ganch", "gandy", "ganef", "ganev", "gangs", "ganja", "ganof", "gants", "gaols", "gaped", "gaper", "gapes", "gapos", "gappy", "garbe", "garbo", "garbs", "garda", "gares", "garis", "garms", "garni", "garre", "garth", "garum", "gases", "gasps", "gaspy", "gasts", "gatch", "gated", "gater", "gates", "gaths", "gator", "gauch", "gaucy", "gauds", "gauje", "gault", "gaums", "gaumy", "gaups", "gaurs", "gauss", "gauzy", "gavot", "gawcy", "gawds", "gawks", "gawps", "gawsy", "gayal", "gazal", "gazar", "gazed", "gazes", "gazon", "gazoo", "geals", "geans", "geare", "gears", "geats", "gebur", "gecks", "geeks", "geeps", "geest", "geist", "geits", "gelds", "gelee", "gelid", "gelly", "gelts", "gemel", "gemma", "gemmy", "gemot", "genal", "genas", "genes", "genet", "genic", "genii", "genip", "genny", "genoa", "genom", "genro", "gents", "genty", "genua", "genus", "geode", "geoid", "gerah", "gerbe", "geres", "gerle", "germs", "germy", "gerne", "gesse", "gesso", "geste", "gests", "getas", "getup", "geums", "geyan", "geyer", "ghast", "ghats", "ghaut", "ghazi", "ghees", "ghest", "ghyll", "gibed", "gibel", "giber", "gibes", "gibli", "gibus", "gifts", "gigas", "gighe", "gigot", "gigue", "gilas", "gilds", "gilet", "gills", "gilly", "gilpy", "gilts", "gimel", "gimme", "gimps", "gimpy", "ginch", "ginge", "gings", "ginks", "ginny", "ginzo", "gipon", "gippo", "gippy", "girds", "girls", "girns", "giron", "giros", "girrs", "girsh", "girts", "gismo", "gisms", "gists", "gitch", "gites", "giust", "gived", "gives", "gizmo", "glace", "glads", "glady", "glaik", "glair", "glams", "glans", "glary", "glaum", "glaur", "glazy", "gleba", "glebe", "gleby", "glede", "gleds", "gleed", "gleek", "glees", "gleet", "gleis", "glens", "glent", "gleys", "glial", "glias", "glibs", "gliff", "glift", "glike", "glime", "glims", "glisk", "glits", "glitz", "gloam", "globi", "globs", "globy", "glode", "glogg", "gloms", "gloop", "glops", "glost", "glout", "glows", "gloze", "glued", "gluer", "glues", "gluey", "glugs", "glume", "glums", "gluon", "glute", "gluts", "gnarl", "gnarr", "gnars", "gnats", "gnawn", "gnaws", "gnows", "goads", "goafs", "goals", "goary", "goats", "goaty", "goban", "gobar", "gobbi", "gobbo", "gobby", "gobis", "gobos", "godet", "godso", "goels", "goers", "goest", "goeth", "goety", "gofer", "goffs", "gogga", "gogos", "goier", "gojis", "golds", "goldy", "goles", "golfs", "golpe", "golps", "gombo", "gomer", "gompa", "gonch", "gonef", "gongs", "gonia", "gonif", "gonks", "gonna", "gonof", "gonys", "gonzo", "gooby", "goods", "goofs", "googs", "gooks", "gooky", "goold", "gools", "gooly", "goons", "goony", "goops", "goopy", "goors", "goory", "goosy", "gopak", "gopik", "goral", "goras", "gored", "gores", "goris", "gorms", "gormy", "gorps", "gorse", "gorsy", "gosht", "gosse", "gotch", "goths", "gothy", "gotta", "gouch", "gouks", "goura", "gouts", "gouty", "gowan", "gowds", "gowfs", "gowks", "gowls", "gowns", "goxes", "goyim", "goyle", "graal", "grabs", "grads", "graff", "graip", "grama", "grame", "gramp", "grams", "grana", "grans", "grapy", "gravs", "grays", "grebe", "grebo", "grece", "greek", "grees", "grege", "grego", "grein", "grens", "grese", "greve", "grews", "greys", "grice", "gride", "grids", "griff", "grift", "grigs", "grike", "grins", "griot", "grips", "gript", "gripy", "grise", "grist", "grisy", "grith", "grits", "grize", "groat", "grody", "grogs", "groks", "groma", "grone", "groof", "grosz", "grots", "grouf", "grovy", "grows", "grrls", "grrrl", "grubs", "grued", "grues", "grufe", "grume", "grump", "grund", "gryce", "gryde", "gryke", "grype", "grypt", "guaco", "guana", "guano", "guans", "guars", "gucks", "gucky", "gudes", "guffs", "gugas", "guids", "guimp", "guiro", "gulag", "gular", "gulas", "gules", "gulet", "gulfs", "gulfy", "gulls", "gulph", "gulps", "gulpy", "gumma", "gummi", "gumps", "gundy", "gunge", "gungy", "gunks", "gunky", "gunny", "guqin", "gurdy", "gurge", "gurls", "gurly", "gurns", "gurry", "gursh", "gurus", "gushy", "gusla", "gusle", "gusli", "gussy", "gusts", "gutsy", "gutta", "gutty", "guyed", "guyle", "guyot", "guyse", "gwine", "gyals", "gyans", "gybed", "gybes", "gyeld", "gymps", "gynae", "gynie", "gynny", "gynos", "gyoza", "gypos", "gyppo", "gyppy", "gyral", "gyred", "gyres", "gyron", "gyros", "gyrus", "gytes", "gyved", "gyves", "haafs", "haars", "hable", "habus", "hacek", "hacks", "hadal", "haded", "hades", "hadji", "hadst", "haems", "haets", "haffs", "hafiz", "hafts", "haggs", "hahas", "haick", "haika", "haiks", "haiku", "hails", "haily", "hains", "haint", "hairs", "haith", "hajes", "hajis", "hajji", "hakam", "hakas", "hakea", "hakes", "hakim", "hakus", "halal", "haled", "haler", "hales", "halfa", "halfs", "halid", "hallo", "halls", "halma", "halms", "halon", "halos", "halse", "halts", "halva", "halwa", "hamal", "hamba", "hamed", "hames", "hammy", "hamza", "hanap", "hance", "hanch", "hands", "hangi", "hangs", "hanks", "hanky", "hansa", "hanse", "hants", "haole", "haoma", "hapax", "haply", "happi", "hapus", "haram", "hards", "hared", "hares", "harim", "harks", "harls", "harms", "harns", "haros", "harps", "harts", "hashy", "hasks", "hasps", "hasta", "hated", "hates", "hatha", "hauds", "haufs", "haugh", "hauld", "haulm", "hauls", "hault", "hauns", "hause", "haver", "haves", "hawed", "hawks", "hawms", "hawse", "hayed", "hayer", "hayey", "hayle", "hazan", "hazed", "hazer", "hazes", "heads", "heald", "heals", "heame", "heaps", "heapy", "heare", "hears", "heast", "heats", "heben", "hebes", "hecht", "hecks", "heder", "hedgy", "heeds", "heedy", "heels", "heeze", "hefte", "hefts", "heids", "heigh", "heils", "heirs", "hejab", "hejra", "heled", "heles", "helio", "hells", "helms", "helos", "helot", "helps", "helve", "hemal", "hemes", "hemic", "hemin", "hemps", "hempy", "hench", "hends", "henge", "henna", "henny", "henry", "hents", "hepar", "herbs", "herby", "herds", "heres", "herls", "herma", "herms", "herns", "heros", "herry", "herse", "hertz", "herye", "hesps", "hests", "hetes", "heths", "heuch", "heugh", "hevea", "hewed", "hewer", "hewgh", "hexad", "hexed", "hexer", "hexes", "hexyl", "heyed", "hiant", "hicks", "hided", "hider", "hides", "hiems", "highs", "hight", "hijab", "hijra", "hiked", "hiker", "hikes", "hikoi", "hilar", "hilch", "hillo", "hills", "hilts", "hilum", "hilus", "himbo", "hinau", "hinds", "hings", "hinky", "hinny", "hints", "hiois", "hiply", "hired", "hiree", "hirer", "hires", "hissy", "hists", "hithe", "hived", "hiver", "hives", "hizen", "hoaed", "hoagy", "hoars", "hoary", "hoast", "hobos", "hocks", "hocus", "hodad", "hodja", "hoers", "hogan", "hogen", "hoggs", "hoghs", "hohed", "hoick", "hoied", "hoiks", "hoing", "hoise", "hokas", "hoked", "hokes", "hokey", "hokis", "hokku", "hokum", "holds", "holed", "holes", "holey", "holks", "holla", "hollo", "holme", "holms", "holon", "holos", "holts", "homas", "homed", "homes", "homey", "homie", "homme", "homos", "honan", "honda", "honds", "honed", "honer", "hones", "hongi", "hongs", "honks", "honky", "hooch", "hoods", "hoody", "hooey", "hoofs", "hooka", "hooks", "hooky", "hooly", "hoons", "hoops", "hoord", "hoors", "hoosh", "hoots", "hooty", "hoove", "hopak", "hoped", "hoper", "hopes", "hoppy", "horah", "horal", "horas", "horis", "horks", "horme", "horns", "horst", "horsy", "hosed", "hosel", "hosen", "hoser", "hoses", "hosey", "hosta", "hosts", "hotch", "hoten", "hotty", "houff", "houfs", "hough", "houri", "hours", "houts", "hovea", "hoved", "hoven", "hoves", "howbe", "howes", "howff", "howfs", "howks", "howls", "howre", "howso", "hoxed", "hoxes", "hoyas", "hoyed", "hoyle", "hubby", "hucks", "hudna", "hudud", "huers", "huffs", "huffy", "huger", "huggy", "huhus", "huias", "hulas", "hules", "hulks", "hulky", "hullo", "hulls", "hully", "humas", "humfs", "humic", "humps", "humpy", "hunks", "hunts", "hurds", "hurls", "hurly", "hurra", "hurst", "hurts", "hushy", "husks", "husos", "hutia", "huzza", "huzzy", "hwyls", "hydra", "hyens", "hygge", "hying", "hykes", "hylas", "hyleg", "hyles", "hylic", "hymns", "hynde", "hyoid", "hyped", "hypes", "hypha", "hyphy", "hypos", "hyrax", "hyson", "hythe", "iambi", "iambs", "ibrik", "icers", "iched", "iches", "ichor", "icier", "icker", "ickle", "icons", "ictal", "ictic", "ictus", "idant", "ideas", "idees", "ident", "idled", "idles", "idola", "idols", "idyls", "iftar", "igapo", "igged", "iglus", "ihram", "ikans", "ikats", "ikons", "ileac", "ileal", "ileum", "ileus", "iliad", "ilial", "ilium", "iller", "illth", "imago", "imams", "imari", "imaum", "imbar", "imbed", "imide", "imido", "imids", "imine", "imino", "immew", "immit", "immix", "imped", "impis", "impot", "impro", "imshi", "imshy", "inapt", "inarm", "inbye", "incel", "incle", "incog", "incus", "incut", "indew", "india", "indie", "indol", "indow", "indri", "indue", "inerm", "infix", "infos", "infra", "ingan", "ingle", "inion", "inked", "inker", "inkle", "inned", "innit", "inorb", "inrun", "inset", "inspo", "intel", "intil", "intis", "intra", "inula", "inure", "inurn", "inust", "invar", "inwit", "iodic", "iodid", "iodin", "iotas", "ippon", "irade", "irids", "iring", "irked", "iroko", "irone", "irons", "isbas", "ishes", "isled", "isles", "isnae", "issei", "istle", "items", "ither", "ivied", "ivies", "ixias", "ixnay", "ixora", "ixtle", "izard", "izars", "izzat", "jaaps", "jabot", "jacal", "jacks", "jacky", "jaded", "jades", "jafas", "jaffa", "jagas", "jager", "jaggs", "jaggy", "jagir", "jagra", "jails", "jaker", "jakes", "jakey", "jalap", "jalop", "jambe", "jambo", "jambs", "jambu", "james", "jammy", "jamon", "janes", "janns", "janny", "janty", "japan", "japed", "japer", "japes", "jarks", "jarls", "jarps", "jarta", "jarul", "jasey", "jaspe", "jasps", "jatos", "jauks", "jaups", "javas", "javel", "jawan", "jawed", "jaxie", "jeans", "jeats", "jebel", "jedis", "jeels", "jeely", "jeeps", "jeers", "jeeze", "jefes", "jeffs", "jehad", "jehus", "jelab", "jello", "jells", "jembe", "jemmy", "jenny", "jeons", "jerid", "jerks", "jerry", "jesse", "jests", "jesus", "jetes", "jeton", "jeune", "jewed", "jewie", "jhala", "jiaos", "jibba", "jibbs", "jibed", "jiber", "jibes", "jiffs", "jiggy", "jigot", "jihad", "jills", "jilts", "jimmy", "jimpy", "jingo", "jinks", "jinne", "jinni", "jinns", "jirds", "jirga", "jirre", "jisms", "jived", "jiver", "jives", "jivey", "jnana", "jobed", "jobes", "jocko", "jocks", "jocky", "jocos", "jodel", "joeys", "johns", "joins", "joked", "jokes", "jokey", "jokol", "joled", "joles", "jolls", "jolts", "jolty", "jomon", "jomos", "jones", "jongs", "jonty", "jooks", "joram", "jorum", "jotas", "jotty", "jotun", "joual", "jougs", "jouks", "joule", "jours", "jowar", "jowed", "jowls", "jowly", "joyed", "jubas", "jubes", "jucos", "judas", "judgy", "judos", "jugal", "jugum", "jujus", "juked", "jukes", "jukus", "julep", "jumar", "jumby", "jumps", "junco", "junks", "junky", "jupes", "jupon", "jural", "jurat", "jurel", "jures", "justs", "jutes", "jutty", "juves", "juvie", "kaama", "kabab", "kabar", "kabob", "kacha", "kacks", "kadai", "kades", "kadis", "kafir", "kagos", "kagus", "kahal", "kaiak", "kaids", "kaies", "kaifs", "kaika", "kaiks", "kails", "kaims", "kaing", "kains", "kakas", "kakis", "kalam", "kales", "kalif", "kalis", "kalpa", "kamas", "kames", "kamik", "kamis", "kamme", "kanae", "kanas", "kandy", "kaneh", "kanes", "kanga", "kangs", "kanji", "kants", "kanzu", "kaons", "kapas", "kaphs", "kapok", "kapow", "kapus", "kaput", "karas", "karat", "karks", "karns", "karoo", "karos", "karri", "karst", "karsy", "karts", "karzy", "kasha", "kasme", "katal", "katas", "katis", "katti", "kaugh", "kauri", "kauru", "kaury", "kaval", "kavas", "kawas", "kawau", "kawed", "kayle", "kayos", "kazis", "kazoo", "kbars", "kebar", "kebob", "kecks", "kedge", "kedgy", "keech", "keefs", "keeks", "keels", "keema", "keeno", "keens", "keeps", "keets", "keeve", "kefir", "kehua", "keirs", "kelep", "kelim", "kells", "kelly", "kelps", "kelpy", "kelts", "kelty", "kembo", "kembs", "kemps", "kempt", "kempy", "kenaf", "kench", "kendo", "kenos", "kente", "kents", "kepis", "kerbs", "kerel", "kerfs", "kerky", "kerma", "kerne", "kerns", "keros", "kerry", "kerve", "kesar", "kests", "ketas", "ketch", "ketes", "ketol", "kevel", "kevil", "kexes", "keyed", "keyer", "khadi", "khafs", "khans", "khaph", "khats", "khaya", "khazi", "kheda", "kheth", "khets", "khoja", "khors", "khoum", "khuds", "kiaat", "kiack", "kiang", "kibbe", "kibbi", "kibei", "kibes", "kibla", "kicks", "kicky", "kiddo", "kiddy", "kidel", "kidge", "kiefs", "kiers", "kieve", "kievs", "kight", "kikes", "kikoi", "kiley", "kilim", "kills", "kilns", "kilos", "kilps", "kilts", "kilty", "kimbo", "kinas", "kinda", "kinds", "kindy", "kines", "kings", "kinin", "kinks", "kinos", "kiore", "kipes", "kippa", "kipps", "kirby", "kirks", "kirns", "kirri", "kisan", "kissy", "kists", "kited", "kiter", "kites", "kithe", "kiths", "kitul", "kivas", "kiwis", "klang", "klaps", "klett", "klick", "klieg", "kliks", "klong", "kloof", "kluge", "klutz", "knags", "knaps", "knarl", "knars", "knaur", "knawe", "knees", "knell", "knish", "knits", "knive", "knobs", "knops", "knosp", "knots", "knout", "knowe", "knows", "knubs", "knurl", "knurr", "knurs", "knuts", "koans", "koaps", "koban", "kobos", "koels", "koffs", "kofta", "kogal", "kohas", "kohen", "kohls", "koine", "kojis", "kokam", "kokas", "koker", "kokra", "kokum", "kolas", "kolos", "kombu", "konbu", "kondo", "konks", "kooks", "kooky", "koori", "kopek", "kophs", "kopje", "koppa", "korai", "koras", "korat", "kores", "korma", "koros", "korun", "korus", "koses", "kotch", "kotos", "kotow", "koura", "kraal", "krabs", "kraft", "krais", "krait", "krang", "krans", "kranz", "kraut", "krays", "kreep", "kreng", "krewe", "krona", "krone", "kroon", "krubi", "krunk", "ksars", "kubie", "kudos", "kudus", "kudzu", "kufis", "kugel", "kuias", "kukri", "kukus", "kulak", "kulan", "kulas", "kulfi", "kumis", "kumys", "kuris", "kurre", "kurta", "kurus", "kusso", "kutas", "kutch", "kutis", "kutus", "kuzus", "kvass", "kvell", "kwela", "kyack", "kyaks", "kyang", "kyars", "kyats", "kybos", "kydst", "kyles", "kylie", "kylin", "kylix", "kyloe", "kynde", "kynds", "kypes", "kyrie", "kytes", "kythe", "laari", "labda", "labia", "labis", "labra", "laced", "lacer", "laces", "lacet", "lacey", "lacks", "laddy", "laded", "lader", "lades", "laers", "laevo", "lagan", "lahal", "lahar", "laich", "laics", "laids", "laigh", "laika", "laiks", "laird", "lairs", "lairy", "laith", "laity", "laked", "laker", "lakes", "lakhs", "lakin", "laksa", "laldy", "lalls", "lamas", "lambs", "lamby", "lamed", "lamer", "lames", "lamia", "lammy", "lamps", "lanai", "lanas", "lanch", "lande", "lands", "lanes", "lanks", "lants", "lapin", "lapis", "lapje", "larch", "lards", "lardy", "laree", "lares", "largo", "laris", "larks", "larky", "larns", "larnt", "larum", "lased", "laser", "lases", "lassi", "lassu", "lassy", "lasts", "latah", "lated", "laten", "latex", "lathi", "laths", "lathy", "latke", "latus", "lauan", "lauch", "lauds", "laufs", "laund", "laura", "laval", "lavas", "laved", "laver", "laves", "lavra", "lavvy", "lawed", "lawer", "lawin", "lawks", "lawns", "lawny", "laxed", "laxer", "laxes", "laxly", "layed", "layin", "layup", "lazar", "lazed", "lazes", "lazos", "lazzi", "lazzo", "leads", "leady", "leafs", "leaks", "leams", "leans", "leany", "leaps", "leare", "lears", "leary", "leats", "leavy", "leaze", "leben", "leccy", "ledes", "ledgy", "ledum", "leear", "leeks", "leeps", "leers", "leese", "leets", "leeze", "lefte", "lefts", "leger", "leges", "legge", "leggo", "legit", "lehrs", "lehua", "leirs", "leish", "leman", "lemed", "lemel", "lemes", "lemma", "lemme", "lends", "lenes", "lengs", "lenis", "lenos", "lense", "lenti", "lento", "leone", "lepid", "lepra", "lepta", "lered", "leres", "lerps", "lesbo", "leses", "lests", "letch", "lethe", "letup", "leuch", "leuco", "leuds", "leugh", "levas", "levee", "leves", "levin", "levis", "lewis", "lexes", "lexis", "lezes", "lezza", "lezzy", "liana", "liane", "liang", "liard", "liars", "liart", "liber", "libra", "libri", "lichi", "licht", "licit", "licks", "lidar", "lidos", "liefs", "liens", "liers", "lieus", "lieve", "lifer", "lifes", "lifts", "ligan", "liger", "ligge", "ligne", "liked", "liker", "likes", "likin", "lills", "lilos", "lilts", "liman", "limas", "limax", "limba", "limbi", "limbs", "limby", "limed", "limen", "limes", "limey", "limma", "limns", "limos", "limpa", "limps", "linac", "linch", "linds", "lindy", "lined", "lines", "liney", "linga", "lings", "lingy", "linin", "links", "linky", "linns", "linny", "linos", "lints", "linty", "linum", "linux", "lions", "lipas", "lipes", "lipin", "lipos", "lippy", "liras", "lirks", "lirot", "lisks", "lisle", "lisps", "lists", "litai", "litas", "lited", "liter", "lites", "litho", "liths", "litre", "lived", "liven", "lives", "livor", "livre", "llano", "loach", "loads", "loafs", "loams", "loans", "loast", "loave", "lobar", "lobed", "lobes", "lobos", "lobus", "loche", "lochs", "locie", "locis", "locks", "locos", "locum", "loden", "lodes", "loess", "lofts", "logan", "loges", "loggy", "logia", "logie", "logoi", "logon", "logos", "lohan", "loids", "loins", "loipe", "loirs", "lokes", "lolls", "lolly", "lolog", "lomas", "lomed", "lomes", "loner", "longa", "longe", "longs", "looby", "looed", "looey", "loofa", "loofs", "looie", "looks", "looky", "looms", "loons", "loony", "loops", "loord", "loots", "loped", "loper", "lopes", "loppy", "loral", "loran", "lords", "lordy", "lorel", "lores", "loric", "loris", "losed", "losel", "losen", "loses", "lossy", "lotah", "lotas", "lotes", "lotic", "lotos", "lotsa", "lotta", "lotte", "lotto", "lotus", "loued", "lough", "louie", "louis", "louma", "lound", "louns", "loupe", "loups", "loure", "lours", "loury", "louts", "lovat", "loved", "loves", "lovey", "lovie", "lowan", "lowed", "lowes", "lownd", "lowne", "lowns", "lowps", "lowry", "lowse", "lowts", "loxed", "loxes", "lozen", "luach", "luaus", "lubed", "lubes", "lubra", "luces", "lucks", "lucre", "ludes", "ludic", "ludos", "luffa", "luffs", "luged", "luger", "luges", "lulls", "lulus", "lumas", "lumbi", "lumme", "lummy", "lumps", "lunas", "lunes", "lunet", "lungi", "lungs", "lunks", "lunts", "lupin", "lured", "lurer", "lures", "lurex", "lurgi", "lurgy", "lurks", "lurry", "lurve", "luser", "lushy", "lusks", "lusts", "lusus", "lutea", "luted", "luter", "lutes", "luvvy", "luxed", "luxer", "luxes", "lweis", "lyams", "lyard", "lyart", "lyase", "lycea", "lycee", "lycra", "lymes", "lynch", "lynes", "lyres", "lysed", "lyses", "lysin", "lysis", "lysol", "lyssa", "lyted", "lytes", "lythe", "lytic", "lytta", "maaed", "maare", "maars", "mabes", "macas", "maced", "macer", "maces", "mache", "machi", "machs", "macks", "macle", "macon", "madge", "madid", "madre", "maerl", "mafic", "mages", "maggs", "magot", "magus", "mahoe", "mahua", "mahwa", "maids", "maiko", "maiks", "maile", "maill", "mails", "maims", "mains", "maire", "mairs", "maise", "maist", "makar", "makes", "makis", "makos", "malam", "malar", "malas", "malax", "males", "malic", "malik", "malis", "malls", "malms", "malmy", "malts", "malty", "malus", "malva", "malwa", "mamas", "mamba", "mamee", "mamey", "mamie", "manas", "manat", "mandi", "maneb", "maned", "maneh", "manes", "manet", "mangs", "manis", "manky", "manna", "manos", "manse", "manta", "manto", "manty", "manul", "manus", "mapau", "maqui", "marae", "marah", "maras", "marcs", "mardy", "mares", "marge", "margs", "maria", "marid", "marka", "marks", "marle", "marls", "marly", "marms", "maron", "maror", "marra", "marri", "marse", "marts", "marvy", "masas", "mased", "maser", "mases", "mashy", "masks", "massa", "massy", "masts", "masty", "masus", "matai", "mated", "mater", "mates", "maths", "matin", "matlo", "matte", "matts", "matza", "matzo", "mauby", "mauds", "mauls", "maund", "mauri", "mausy", "mauts", "mauzy", "maven", "mavie", "mavin", "mavis", "mawed", "mawks", "mawky", "mawns", "mawrs", "maxed", "maxes", "maxis", "mayan", "mayas", "mayed", "mayos", "mayst", "mazed", "mazer", "mazes", "mazey", "mazut", "mbira", "meads", "meals", "meane", "means", "meany", "meare", "mease", "meath", "meats", "mebos", "mechs", "mecks", "medii", "medle", "meeds", "meers", "meets", "meffs", "meins", "meint", "meiny", "meith", "mekka", "melas", "melba", "melds", "melic", "melik", "mells", "melts", "melty", "memes", "memos", "menad", "mends", "mened", "menes", "menge", "mengs", "mensa", "mense", "mensh", "menta", "mento", "menus", "meous", "meows", "merch", "mercs", "merde", "mered", "merel", "merer", "meres", "meril", "meris", "merks", "merle", "merls", "merse", "mesal", "mesas", "mesel", "meses", "meshy", "mesic", "mesne", "meson", "messy", "mesto", "meted", "metes", "metho", "meths", "metic", "metif", "metis", "metol", "metre", "meuse", "meved", "meves", "mewed", "mewls", "meynt", "mezes", "mezze", "mezzo", "mhorr", "miaou", "miaow", "miasm", "miaul", "micas", "miche", "micht", "micks", "micky", "micos", "micra", "middy", "midgy", "midis", "miens", "mieve", "miffs", "miffy", "mifty", "miggs", "mihas", "mihis", "miked", "mikes", "mikra", "mikva", "milch", "milds", "miler", "miles", "milfs", "milia", "milko", "milks", "mille", "mills", "milor", "milos", "milpa", "milts", "milty", "miltz", "mimed", "mimeo", "mimer", "mimes", "mimsy", "minae", "minar", "minas", "mincy", "minds", "mined", "mines", "minge", "mings", "mingy", "minis", "minke", "minks", "minny", "minos", "mints", "mired", "mires", "mirex", "mirid", "mirin", "mirks", "mirky", "mirly", "miros", "mirvs", "mirza", "misch", "misdo", "mises", "misgo", "misos", "missa", "mists", "misty", "mitch", "miter", "mites", "mitis", "mitre", "mitts", "mixed", "mixen", "mixer", "mixes", "mixte", "mixup", "mizen", "mizzy", "mneme", "moans", "moats", "mobby", "mobes", "mobey", "mobie", "moble", "mochi", "mochs", "mochy", "mocks", "moder", "modes", "modge", "modii", "modus", "moers", "mofos", "moggy", "mohel", "mohos", "mohrs", "mohua", "mohur", "moile", "moils", "moira", "moire", "moits", "mojos", "mokes", "mokis", "mokos", "molal", "molas", "molds", "moled", "moles", "molla", "molls", "molly", "molto", "molts", "molys", "momes", "momma", "mommy", "momus", "monad", "monal", "monas", "monde", "mondo", "moner", "mongo", "mongs", "monic", "monie", "monks", "monos", "monte", "monty", "moobs", "mooch", "moods", "mooed", "mooks", "moola", "mooli", "mools", "mooly", "moong", "moons", "moony", "moops", "moors", "moory", "moots", "moove", "moped", "moper", "mopes", "mopey", "moppy", "mopsy", "mopus", "morae", "moras", "morat", "moray", "morel", "mores", "moria", "morne", "morns", "morra", "morro", "morse", "morts", "mosed", "moses", "mosey", "mosks", "mosso", "moste", "mosts", "moted", "moten", "motes", "motet", "motey", "moths", "mothy", "motis", "motte", "motts", "motty", "motus", "motza", "mouch", "moues", "mould", "mouls", "moups", "moust", "mousy", "moved", "moves", "mowas", "mowed", "mowra", "moxas", "moxie", "moyas", "moyle", "moyls", "mozed", "mozes", "mozos", "mpret", "mucho", "mucic", "mucid", "mucin", "mucks", "mucor", "mucro", "mudge", "mudir", "mudra", "muffs", "mufti", "mugga", "muggs", "muggy", "muhly", "muids", "muils", "muirs", "muist", "mujik", "mulct", "muled", "mules", "muley", "mulga", "mulie", "mulla", "mulls", "mulse", "mulsh", "mumms", "mumps", "mumsy", "mumus", "munga", "munge", "mungo", "mungs", "munis", "munts", "muntu", "muons", "muras", "mured", "mures", "murex", "murid", "murks", "murls", "murly", "murra", "murre", "murri", "murrs", "murry", "murti", "murva", "musar", "musca", "mused", "muser", "muses", "muset", "musha", "musit", "musks", "musos", "musse", "mussy", "musth", "musts", "mutch", "muted", "muter", "mutes", "mutha", "mutis", "muton", "mutts", "muxed", "muxes", "muzak", "muzzy", "mvule", "myall", "mylar", "mynah", "mynas", "myoid", "myoma", "myope", "myops", "myopy", "mysid", "mythi", "myths", "mythy", "myxos", "mzees", "naams", "naans", "nabes", "nabis", "nabks", "nabla", "nabob", "nache", "nacho", "nacre", "nadas", "naeve", "naevi", "naffs", "nagas", "naggy", "nagor", "nahal", "naiad", "naifs", "naiks", "nails", "naira", "nairu", "naked", "naker", "nakfa", "nalas", "naled", "nalla", "named", "namer", "names", "namma", "namus", "nanas", "nance", "nancy", "nandu", "nanna", "nanos", "nanua", "napas", "naped", "napes", "napoo", "nappa", "nappe", "nappy", "naras", "narco", "narcs", "nards", "nares", "naric", "naris", "narks", "narky", "narre", "nashi", "natch", "nates", "natis", "natty", "nauch", "naunt", "navar", "naves", "navew", "navvy", "nawab", "nazes", "nazir", "nazis", "nduja", "neafe", "neals", "neaps", "nears", "neath", "neats", "nebek", "nebel", "necks", "neddy", "needs", "neeld", "neele", "neemb", "neems", "neeps", "neese", "neeze", "negro", "negus", "neifs", "neist", "neive", "nelis", "nelly", "nemas", "nemns", "nempt", "nenes", "neons", "neper", "nepit", "neral", "nerds", "nerka", "nerks", "nerol", "nerts", "nertz", "nervy", "nests", "netes", "netop", "netts", "netty", "neuks", "neume", "neums", "nevel", "neves", "nevus", "newbs", "newed", "newel", "newie", "newsy", "newts", "nexts", "nexus", "ngaio", "ngana", "ngati", "ngoma", "ngwee", "nicad", "nicht", "nicks", "nicol", "nidal", "nided", "nides", "nidor", "nidus", "niefs", "nieve", "nifes", "niffs", "niffy", "nifty", "niger", "nighs", "nihil", "nikab", "nikah", "nikau", "nills", "nimbi", "nimbs", "nimps", "niner", "nines", "ninon", "nipas", "nippy", "niqab", "nirls", "nirly", "nisei", "nisse", "nisus", "niter", "nites", "nitid", "niton", "nitre", "nitro", "nitry", "nitty", "nival", "nixed", "nixer", "nixes", "nixie", "nizam", "nkosi", "noahs", "nobby", "nocks", "nodal", "noddy", "nodes", "nodus", "noels", "noggs", "nohow", "noils", "noily", "noint", "noirs", "noles", "nolls", "nolos", "nomas", "nomen", "nomes", "nomic", "nomoi", "nomos", "nonas", "nonce", "nones", "nonet", "nongs", "nonis", "nonny", "nonyl", "noobs", "nooit", "nooks", "nooky", "noons", "noops", "nopal", "noria", "noris", "norks", "norma", "norms", "nosed", "noser", "noses", "notal", "noted", "noter", "notes", "notum", "nould", "noule", "nouls", "nouns", "nouny", "noups", "novae", "novas", "novum", "noway", "nowed", "nowls", "nowts", "nowty", "noxal", "noxes", "noyau", "noyed", "noyes", "nubby", "nubia", "nucha", "nuddy", "nuder", "nudes", "nudie", "nudzh", "nuffs", "nugae", "nuked", "nukes", "nulla", "nulls", "numbs", "numen", "nummy", "nunny", "nurds", "nurdy", "nurls", "nurrs", "nutso", "nutsy", "nyaff", "nyala", "nying", "nyssa", "oaked", "oaker", "oakum", "oared", "oases", "oasis", "oasts", "oaten", "oater", "oaths", "oaves", "obang", "obeah", "obeli", "obeys", "obias", "obied", "obiit", "obits", "objet", "oboes", "obole", "oboli", "obols", "occam", "ocher", "oches", "ochre", "ochry", "ocker", "ocrea", "octad", "octan", "octas", "octyl", "oculi", "odahs", "odals", "odeon", "odeum", "odism", "odist", "odium", "odors", "odour", "odyle", "odyls", "ofays", "offed", "offie", "oflag", "ofter", "ogams", "ogeed", "ogees", "oggin", "ogham", "ogive", "ogled", "ogler", "ogles", "ogmic", "ogres", "ohias", "ohing", "ohmic", "ohone", "oidia", "oiled", "oiler", "oinks", "oints", "ojime", "okapi", "okays", "okehs", "okras", "oktas", "oldie", "oleic", "olein", "olent", "oleos", "oleum", "olios", "ollas", "ollav", "oller", "ollie", "ology", "olpae", "olpes", "omasa", "omber", "ombus", "omens", "omers", "omits", "omlah", "omovs", "omrah", "oncer", "onces", "oncet", "oncus", "onely", "oners", "onery", "onium", "onkus", "onlay", "onned", "ontic", "oobit", "oohed", "oomph", "oonts", "ooped", "oorie", "ooses", "ootid", "oozed", "oozes", "opahs", "opals", "opens", "opepe", "oping", "oppos", "opsin", "opted", "opter", "orach", "oracy", "orals", "orang", "orant", "orate", "orbed", "orcas", "orcin", "ordos", "oread", "orfes", "orgia", "orgic", "orgue", "oribi", "oriel", "orixa", "orles", "orlon", "orlop", "ormer", "ornis", "orpin", "orris", "ortho", "orval", "orzos", "oscar", "oshac", "osier", "osmic", "osmol", "ossia", "ostia", "otaku", "otary", "ottar", "ottos", "oubit", "oucht", "ouens", "ouija", "oulks", "oumas", "oundy", "oupas", "ouped", "ouphe", "ouphs", "ourie", "ousel", "ousts", "outby", "outed", "outre", "outro", "outta", "ouzel", "ouzos", "ovals", "ovels", "ovens", "overs", "ovist", "ovoli", "ovolo", "ovule", "owche", "owies", "owled", "owler", "owlet", "owned", "owres", "owrie", "owsen", "oxbow", "oxers", "oxeye", "oxids", "oxies", "oxime", "oxims", "oxlip", "oxter", "oyers", "ozeki", "ozzie", "paals", "paans", "pacas", "paced", "pacer", "paces", "pacey", "pacha", "packs", "pacos", "pacta", "pacts", "padis", "padle", "padma", "padre", "padri", "paean", "paedo", "paeon", "paged", "pager", "pages", "pagle", "pagod", "pagri", "paiks", "pails", "pains", "paire", "pairs", "paisa", "paise", "pakka", "palas", "palay", "palea", "paled", "pales", "palet", "palis", "palki", "palla", "palls", "pally", "palms", "palmy", "palpi", "palps", "palsa", "pampa", "panax", "pance", "panda", "pands", "pandy", "paned", "panes", "panga", "pangs", "panim", "panko", "panne", "panni", "panto", "pants", "panty", "paoli", "paolo", "papas", "papaw", "papes", "pappi", "pappy", "parae", "paras", "parch", "pardi", "pards", "pardy", "pared", "paren", "pareo", "pares", "pareu", "parev", "parge", "pargo", "paris", "parki", "parks", "parky", "parle", "parly", "parma", "parol", "parps", "parra", "parrs", "parti", "parts", "parve", "parvo", "paseo", "pases", "pasha", "pashm", "paska", "paspy", "passe", "pasts", "pated", "paten", "pater", "pates", "paths", "patin", "patka", "patly", "patte", "patus", "pauas", "pauls", "pavan", "paved", "paven", "paver", "paves", "pavid", "pavin", "pavis", "pawas", "pawaw", "pawed", "pawer", "pawks", "pawky", "pawls", "pawns", "paxes", "payed", "payor", "paysd", "peage", "peags", "peaks", "peaky", "peals", "peans", "peare", "pears", "peart", "pease", "peats", "peaty", "peavy", "peaze", "pebas", "pechs", "pecke", "pecks", "pecky", "pedes", "pedis", "pedro", "peece", "peeks", "peels", "peens", "peeoy", "peepe", "peeps", "peers", "peery", "peeve", "peggy", "peghs", "peins", "peise", "peize", "pekan", "pekes", "pekin", "pekoe", "pelas", "pelau", "peles", "pelfs", "pells", "pelma", "pelon", "pelta", "pelts", "pends", "pendu", "pened", "penes", "pengo", "penie", "penis", "penks", "penna", "penni", "pents", "peons", "peony", "pepla", "pepos", "peppy", "pepsi", "perai", "perce", "percs", "perdu", "perdy", "perea", "peres", "peris", "perks", "perms", "perns", "perog", "perps", "perry", "perse", "perst", "perts", "perve", "pervo", "pervs", "pervy", "pesos", "pests", "pesty", "petar", "peter", "petit", "petre", "petri", "petti", "petto", "pewee", "pewit", "peyse", "phage", "phang", "phare", "pharm", "pheer", "phene", "pheon", "phese", "phial", "phish", "phizz", "phlox", "phoca", "phono", "phons", "phots", "phpht", "phuts", "phyla", "phyle", "piani", "pians", "pibal", "pical", "picas", "piccy", "picks", "picot", "picra", "picul", "piend", "piers", "piert", "pieta", "piets", "piezo", "pight", "pigmy", "piing", "pikas", "pikau", "piked", "piker", "pikes", "pikey", "pikis", "pikul", "pilae", "pilaf", "pilao", "pilar", "pilau", "pilaw", "pilch", "pilea", "piled", "pilei", "piler", "piles", "pilis", "pills", "pilow", "pilum", "pilus", "pimas", "pimps", "pinas", "pined", "pines", "pingo", "pings", "pinko", "pinks", "pinna", "pinny", "pinon", "pinot", "pinta", "pints", "pinup", "pions", "piony", "pious", "pioye", "pioys", "pipal", "pipas", "piped", "pipes", "pipet", "pipis", "pipit", "pippy", "pipul", "pirai", "pirls", "pirns", "pirog", "pisco", "pises", "pisky", "pisos", "pissy", "piste", "pitas", "piths", "piton", "pitot", "pitta", "piums", "pixes", "pized", "pizes", "plaas", "plack", "plage", "plans", "plaps", "plash", "plasm", "plast", "plats", "platt", "platy", "playa", "plays", "pleas", "plebe", "plebs", "plena", "pleon", "plesh", "plews", "plica", "plies", "plims", "pling", "plink", "ploat", "plods", "plong", "plonk", "plook", "plops", "plots", "plotz", "plouk", "plows", "ploye", "ploys", "plues", "pluff", "plugs", "plums", "plumy", "pluot", "pluto", "plyer", "poach", "poaka", "poake", "poboy", "pocks", "pocky", "podal", "poddy", "podex", "podge", "podgy", "podia", "poems", "poeps", "poets", "pogey", "pogge", "pogos", "pohed", "poilu", "poind", "pokal", "poked", "pokes", "pokey", "pokie", "poled", "poler", "poles", "poley", "polio", "polis", "polje", "polks", "polls", "polly", "polos", "polts", "polys", "pombe", "pomes", "pommy", "pomos", "pomps", "ponce", "poncy", "ponds", "pones", "poney", "ponga", "pongo", "pongs", "pongy", "ponks", "ponts", "ponty", "ponzu", "poods", "pooed", "poofs", "poofy", "poohs", "pooja", "pooka", "pooks", "pools", "poons", "poops", "poopy", "poori", "poort", "poots", "poove", "poovy", "popes", "poppa", "popsy", "porae", "poral", "pored", "porer", "pores", "porge", "porgy", "porin", "porks", "porky", "porno", "porns", "porny", "porta", "ports", "porty", "posed", "poses", "posey", "posho", "posts", "potae", "potch", "poted", "potes", "potin", "potoo", "potsy", "potto", "potts", "potty", "pouff", "poufs", "pouke", "pouks", "poule", "poulp", "poult", "poupe", "poupt", "pours", "pouts", "powan", "powin", "pownd", "powns", "powny", "powre", "poxed", "poxes", "poynt", "poyou", "poyse", "pozzy", "praam", "prads", "prahu", "prams", "prana", "prang", "praos", "prase", "prate", "prats", "pratt", "praty", "praus", "prays", "predy", "preed", "prees", "preif", "prems", "premy", "prent", "preon", "preop", "preps", "presa", "prese", "prest", "preve", "prexy", "preys", "prial", "pricy", "prief", "prier", "pries", "prigs", "prill", "prima", "primi", "primp", "prims", "primy", "prink", "prion", "prise", "priss", "proas", "probs", "prods", "proem", "profs", "progs", "proin", "proke", "prole", "proll", "promo", "proms", "pronk", "props", "prore", "proso", "pross", "prost", "prosy", "proto", "proul", "prows", "proyn", "prunt", "pruta", "pryer", "pryse", "pseud", "pshaw", "psion", "psoae", "psoai", "psoas", "psora", "psych", "psyop", "pubco", "pubes", "pubis", "pucan", "pucer", "puces", "pucka", "pucks", "puddy", "pudge", "pudic", "pudor", "pudsy", "pudus", "puers", "puffa", "puffs", "puggy", "pugil", "puhas", "pujah", "pujas", "pukas", "puked", "puker", "pukes", "pukey", "pukka", "pukus", "pulao", "pulas", "puled", "puler", "pules", "pulik", "pulis", "pulka", "pulks", "pulli", "pulls", "pully", "pulmo", "pulps", "pulus", "pumas", "pumie", "pumps", "punas", "punce", "punga", "pungs", "punji", "punka", "punks", "punky", "punny", "punto", "punts", "punty", "pupae", "pupal", "pupas", "pupus", "purda", "pured", "pures", "purin", "puris", "purls", "purpy", "purrs", "pursy", "purty", "puses", "pusle", "pussy", "putid", "puton", "putti", "putto", "putts", "puzel", "pwned", "pyats", "pyets", "pygal", "pyins", "pylon", "pyned", "pynes", "pyoid", "pyots", "pyral", "pyran", "pyres", "pyrex", "pyric", "pyros", "pyxed", "pyxes", "pyxie", "pyxis", "pzazz", "qadis", "qaids", "qajaq", "qanat", "qapik", "qibla", "qophs", "qorma", "quads", "quaff", "quags", "quair", "quais", "quaky", "quale", "quant", "quare", "quass", "quate", "quats", "quayd", "quays", "qubit", "quean", "queme", "quena", "quern", "queyn", "queys", "quich", "quids", "quiff", "quims", "quina", "quine", "quino", "quins", "quint", "quipo", "quips", "quipu", "quire", "quirt", "quist", "quits", "quoad", "quods", "quoif", "quoin", "quoit", "quoll", "quonk", "quops", "qursh", "quyte", "rabat", "rabic", "rabis", "raced", "races", "rache", "racks", "racon", "radge", "radix", "radon", "raffs", "rafts", "ragas", "ragde", "raged", "ragee", "rager", "rages", "ragga", "raggs", "raggy", "ragis", "ragus", "rahed", "rahui", "raias", "raids", "raiks", "raile", "rails", "raine", "rains", "raird", "raita", "raits", "rajas", "rajes", "raked", "rakee", "raker", "rakes", "rakia", "rakis", "rakus", "rales", "ramal", "ramee", "ramet", "ramie", "ramin", "ramis", "rammy", "ramps", "ramus", "ranas", "rance", "rands", "ranee", "ranga", "rangi", "rangs", "rangy", "ranid", "ranis", "ranke", "ranks", "rants", "raped", "raper", "rapes", "raphe", "rappe", "rared", "raree", "rares", "rarks", "rased", "raser", "rases", "rasps", "rasse", "rasta", "ratal", "ratan", "ratas", "ratch", "rated", "ratel", "rater", "rates", "ratha", "rathe", "raths", "ratoo", "ratos", "ratus", "rauns", "raupo", "raved", "ravel", "raver", "raves", "ravey", "ravin", "rawer", "rawin", "rawly", "rawns", "raxed", "raxes", "rayah", "rayas", "rayed", "rayle", "rayne", "razed", "razee", "razer", "razes", "razoo", "readd", "reads", "reais", "reaks", "realo", "reals", "reame", "reams", "reamy", "reans", "reaps", "rears", "reast", "reata", "reate", "reave", "rebbe", "rebec", "rebid", "rebit", "rebop", "rebuy", "recal", "recce", "recco", "reccy", "recit", "recks", "recon", "recta", "recti", "recto", "redan", "redds", "reddy", "reded", "redes", "redia", "redid", "redip", "redly", "redon", "redos", "redox", "redry", "redub", "redux", "redye", "reech", "reede", "reeds", "reefs", "reefy", "reeks", "reeky", "reels", "reens", "reest", "reeve", "refed", "refel", "reffo", "refis", "refix", "refly", "refry", "regar", "reges", "reggo", "regie", "regma", "regna", "regos", "regur", "rehem", "reifs", "reify", "reiki", "reiks", "reink", "reins", "reird", "reist", "reive", "rejig", "rejon", "reked", "rekes", "rekey", "relet", "relie", "relit", "rello", "reman", "remap", "remen", "remet", "remex", "remix", "renay", "rends", "reney", "renga", "renig", "renin", "renne", "renos", "rente", "rents", "reoil", "reorg", "repeg", "repin", "repla", "repos", "repot", "repps", "repro", "reran", "rerig", "resat", "resaw", "resay", "resee", "reses", "resew", "resid", "resit", "resod", "resow", "resto", "rests", "resty", "resus", "retag", "retax", "retem", "retia", "retie", "retox", "revet", "revie", "rewan", "rewax", "rewed", "rewet", "rewin", "rewon", "rewth", "rexes", "rezes", "rheas", "rheme", "rheum", "rhies", "rhime", "rhine", "rhody", "rhomb", "rhone", "rhumb", "rhyne", "rhyta", "riads", "rials", "riant", "riata", "ribas", "ribby", "ribes", "riced", "ricer", "rices", "ricey", "richt", "ricin", "ricks", "rides", "ridgy", "ridic", "riels", "riems", "rieve", "rifer", "riffs", "rifte", "rifts", "rifty", "riggs", "rigol", "riled", "riles", "riley", "rille", "rills", "rimae", "rimed", "rimer", "rimes", "rimus", "rinds", "rindy", "rines", "rings", "rinks", "rioja", "riots", "riped", "ripes", "ripps", "rises", "rishi", "risks", "risps", "risus", "rites", "ritts", "ritzy", "rivas", "rived", "rivel", "riven", "rives", "riyal", "rizas", "roads", "roams", "roans", "roars", "roary", "roate", "robed", "robes", "roble", "rocks", "roded", "rodes", "roguy", "rohes", "roids", "roils", "roily", "roins", "roist", "rojak", "rojis", "roked", "roker", "rokes", "rolag", "roles", "rolfs", "rolls", "romal", "roman", "romeo", "romps", "ronde", "rondo", "roneo", "rones", "ronin", "ronne", "ronte", "ronts", "roods", "roofs", "roofy", "rooks", "rooky", "rooms", "roons", "roops", "roopy", "roosa", "roose", "roots", "rooty", "roped", "roper", "ropes", "ropey", "roque", "roral", "rores", "roric", "rorid", "rorie", "rorts", "rorty", "rosed", "roses", "roset", "roshi", "rosin", "rosit", "rosti", "rosts", "rotal", "rotan", "rotas", "rotch", "roted", "rotes", "rotis", "rotls", "roton", "rotos", "rotte", "rouen", "roues", "roule", "rouls", "roums", "roups", "roupy", "roust", "routh", "routs", "roved", "roven", "roves", "rowan", "rowed", "rowel", "rowen", "rowie", "rowme", "rownd", "rowth", "rowts", "royne", "royst", "rozet", "rozit", "ruana", "rubai", "rubby", "rubel", "rubes", "rubin", "ruble", "rubli", "rubus", "ruche", "rucks", "rudas", "rudds", "rudes", "rudie", "rudis", "rueda", "ruers", "ruffe", "ruffs", "rugae", "rugal", "ruggy", "ruing", "ruins", "rukhs", "ruled", "rules", "rumal", "rumbo", "rumen", "rumes", "rumly", "rummy", "rumpo", "rumps", "rumpy", "runch", "runds", "runed", "runes", "rungs", "runic", "runny", "runts", "runty", "rupia", "rurps", "rurus", "rusas", "ruses", "rushy", "rusks", "rusma", "russe", "rusts", "ruths", "rutin", "rutty", "ryals", "rybat", "ryked", "rykes", "rymme", "rynds", "ryots", "ryper", "saags", "sabal", "sabed", "saber", "sabes", "sabha", "sabin", "sabir", "sable", "sabot", "sabra", "sabre", "sacks", "sacra", "saddo", "sades", "sadhe", "sadhu", "sadis", "sados", "sadza", "safed", "safes", "sagas", "sager", "sages", "saggy", "sagos", "sagum", "saheb", "sahib", "saice", "saick", "saics", "saids", "saiga", "sails", "saims", "saine", "sains", "sairs", "saist", "saith", "sajou", "sakai", "saker", "sakes", "sakia", "sakis", "sakti", "salal", "salat", "salep", "sales", "salet", "salic", "salix", "salle", "salmi", "salol", "salop", "salpa", "salps", "salse", "salto", "salts", "salue", "salut", "saman", "samas", "samba", "sambo", "samek", "samel", "samen", "sames", "samey", "samfu", "sammy", "sampi", "samps", "sands", "saned", "sanes", "sanga", "sangh", "sango", "sangs", "sanko", "sansa", "santo", "sants", "saola", "sapan", "sapid", "sapor", "saran", "sards", "sared", "saree", "sarge", "sargo", "sarin", "saris", "sarks", "sarky", "sarod", "saros", "sarus", "saser", "sasin", "sasse", "satai", "satay", "sated", "satem", "sates", "satis", "sauba", "sauch", "saugh", "sauls", "sault", "saunt", "saury", "sauts", "saved", "saver", "saves", "savey", "savin", "sawah", "sawed", "sawer", "saxes", "sayed", "sayer", "sayid", "sayne", "sayon", "sayst", "sazes", "scabs", "scads", "scaff", "scags", "scail", "scala", "scall", "scams", "scand", "scans", "scapa", "scape", "scapi", "scarp", "scars", "scart", "scath", "scats", "scatt", "scaud", "scaup", "scaur", "scaws", "sceat", "scena", "scend", "schav", "schmo", "schul", "schwa", "sclim", "scody", "scogs", "scoog", "scoot", "scopa", "scops", "scots", "scoug", "scoup", "scowp", "scows", "scrab", "scrae", "scrag", "scran", "scrat", "scraw", "scray", "scrim", "scrip", "scrob", "scrod", "scrog", "scrow", "scudi", "scudo", "scuds", "scuff", "scuft", "scugs", "sculk", "scull", "sculp", "sculs", "scums", "scups", "scurf", "scurs", "scuse", "scuta", "scute", "scuts", "scuzz", "scyes", "sdayn", "sdein", "seals", "seame", "seams", "seamy", "seans", "seare", "sears", "sease", "seats", "seaze", "sebum", "secco", "sechs", "sects", "seder", "sedes", "sedge", "sedgy", "sedum", "seeds", "seeks", "seeld", "seels", "seely", "seems", "seeps", "seepy", "seers", "sefer", "segar", "segni", "segno", "segol", "segos", "sehri", "seifs", "seils", "seine", "seirs", "seise", "seism", "seity", "seiza", "sekos", "sekts", "selah", "seles", "selfs", "sella", "selle", "sells", "selva", "semee", "semes", "semie", "semis", "senas", "sends", "senes", "sengi", "senna", "senor", "sensa", "sensi", "sente", "senti", "sents", "senvy", "senza", "sepad", "sepal", "sepic", "sepoy", "septa", "septs", "serac", "serai", "seral", "sered", "serer", "seres", "serfs", "serge", "seric", "serin", "serks", "seron", "serow", "serra", "serre", "serrs", "serry", "servo", "sesey", "sessa", "setae", "setal", "seton", "setts", "sewan", "sewar", "sewed", "sewel", "sewen", "sewin", "sexed", "sexer", "sexes", "sexto", "sexts", "seyen", "shads", "shags", "shahs", "shako", "shakt", "shalm", "shaly", "shama", "shams", "shand", "shans", "shaps", "sharn", "shash", "shaul", "shawm", "shawn", "shaws", "shaya", "shays", "shchi", "sheaf", "sheal", "sheas", "sheds", "sheel", "shend", "shent", "sheol", "sherd", "shere", "shero", "shets", "sheva", "shewn", "shews", "shiai", "shiel", "shier", "shies", "shill", "shily", "shims", "shins", "ships", "shirr", "shirs", "shish", "shiso", "shist", "shite", "shits", "shiur", "shiva", "shive", "shivs", "shlep", "shlub", "shmek", "shmoe", "shoat", "shoed", "shoer", "shoes", "shogi", "shogs", "shoji", "shojo", "shola", "shool", "shoon", "shoos", "shope", "shops", "shorl", "shote", "shots", "shott", "showd", "shows", "shoyu", "shred", "shris", "shrow", "shtik", "shtum", "shtup", "shule", "shuln", "shuls", "shuns", "shura", "shute", "shuts", "shwas", "shyer", "sials", "sibbs", "sibyl", "sices", "sicht", "sicko", "sicks", "sicky", "sidas", "sided", "sider", "sides", "sidha", "sidhe", "sidle", "sield", "siens", "sient", "sieth", "sieur", "sifts", "sighs", "sigil", "sigla", "signa", "signs", "sijos", "sikas", "siker", "sikes", "silds", "siled", "silen", "siler", "siles", "silex", "silks", "sills", "silos", "silts", "silty", "silva", "simar", "simas", "simba", "simis", "simps", "simul", "sinds", "sined", "sines", "sings", "sinhs", "sinks", "sinky", "sinus", "siped", "sipes", "sippy", "sired", "siree", "sires", "sirih", "siris", "siroc", "sirra", "sirup", "sisal", "sises", "sista", "sists", "sitar", "sited", "sites", "sithe", "sitka", "situp", "situs", "siver", "sixer", "sixes", "sixmo", "sixte", "sizar", "sized", "sizel", "sizer", "sizes", "skags", "skail", "skald", "skank", "skart", "skats", "skatt", "skaws", "skean", "skear", "skeds", "skeed", "skeef", "skeen", "skeer", "skees", "skeet", "skegg", "skegs", "skein", "skelf", "skell", "skelm", "skelp", "skene", "skens", "skeos", "skeps", "skers", "skets", "skews", "skids", "skied", "skies", "skiey", "skimo", "skims", "skink", "skins", "skint", "skios", "skips", "skirl", "skirr", "skite", "skits", "skive", "skivy", "sklim", "skoal", "skody", "skoff", "skogs", "skols", "skool", "skort", "skosh", "skran", "skrik", "skuas", "skugs", "skyed", "skyer", "skyey", "skyfs", "skyre", "skyrs", "skyte", "slabs", "slade", "slaes", "slags", "slaid", "slake", "slams", "slane", "slank", "slaps", "slart", "slats", "slaty", "slave", "slaws", "slays", "slebs", "sleds", "sleer", "slews", "sleys", "slier", "slily", "slims", "slipe", "slips", "slipt", "slish", "slits", "slive", "sloan", "slobs", "sloes", "slogs", "sloid", "slojd", "slomo", "sloom", "sloot", "slops", "slopy", "slorm", "slots", "slove", "slows", "sloyd", "slubb", "slubs", "slued", "slues", "sluff", "slugs", "sluit", "slums", "slurb", "slurs", "sluse", "sluts", "slyer", "slype", "smaak", "smaik", "smalm", "smalt", "smarm", "smaze", "smeek", "smees", "smeik", "smeke", "smerk", "smews", "smirr", "smirs", "smits", "smogs", "smoko", "smolt", "smoor", "smoot", "smore", "smorg", "smout", "smowt", "smugs", "smurs", "smush", "smuts", "snabs", "snafu", "snags", "snaps", "snarf", "snark", "snars", "snary", "snash", "snath", "snaws", "snead", "sneap", "snebs", "sneck", "sneds", "sneed", "snees", "snell", "snibs", "snick", "snies", "snift", "snigs", "snips", "snipy", "snirt", "snits", "snobs", "snods", "snoek", "snoep", "snogs", "snoke", "snood", "snook", "snool", "snoot", "snots", "snowk", "snows", "snubs", "snugs", "snush", "snyes", "soaks", "soaps", "soare", "soars", "soave", "sobas", "socas", "soces", "socko", "socks", "socle", "sodas", "soddy", "sodic", "sodom", "sofar", "sofas", "softa", "softs", "softy", "soger", "sohur", "soils", "soily", "sojas", "sojus", "sokah", "soken", "sokes", "sokol", "solah", "solan", "solas", "solde", "soldi", "soldo", "solds", "soled", "solei", "soler", "soles", "solon", "solos", "solum", "solus", "soman", "somas", "sonce", "sonde", "sones", "songs", "sonly", "sonne", "sonny", "sonse", "sonsy", "sooey", "sooks", "sooky", "soole", "sools", "sooms", "soops", "soote", "soots", "sophs", "sophy", "sopor", "soppy", "sopra", "soral", "soras", "sorbo", "sorbs", "sorda", "sordo", "sords", "sored", "soree", "sorel", "sorer", "sores", "sorex", "sorgo", "sorns", "sorra", "sorta", "sorts", "sorus", "soths", "sotol", "souce", "souct", "sough", "souks", "souls", "soums", "soups", "soupy", "sours", "souse", "souts", "sowar", "sowce", "sowed", "sowff", "sowfs", "sowle", "sowls", "sowms", "sownd", "sowne", "sowps", "sowse", "sowth", "soyas", "soyle", "soyuz", "sozin", "spacy", "spado", "spaed", "spaer", "spaes", "spags", "spahi", "spail", "spain", "spait", "spake", "spald", "spale", "spall", "spalt", "spams", "spane", "spang", "spans", "spard", "spars", "spart", "spate", "spats", "spaul", "spawl", "spaws", "spayd", "spays", "spaza", "spazz", "speal", "spean", "speat", "specs", "spect", "speel", "speer", "speil", "speir", "speks", "speld", "spelk", "speos", "spets", "speug", "spews", "spewy", "spial", "spica", "spick", "spics", "spide", "spier", "spies", "spiff", "spifs", "spiks", "spile", "spims", "spina", "spink", "spins", "spirt", "spiry", "spits", "spitz", "spivs", "splay", "splog", "spode", "spods", "spoom", "spoor", "spoot", "spork", "sposh", "spots", "sprad", "sprag", "sprat", "spred", "sprew", "sprit", "sprod", "sprog", "sprue", "sprug", "spuds", "spued", "spuer", "spues", "spugs", "spule", "spume", "spumy", "spurs", "sputa", "spyal", "spyre", "squab", "squaw", "squeg", "squid", "squit", "squiz", "stabs", "stade", "stags", "stagy", "staig", "stane", "stang", "staph", "staps", "starn", "starr", "stars", "stats", "staun", "staws", "stays", "stean", "stear", "stedd", "stede", "steds", "steek", "steem", "steen", "steil", "stela", "stele", "stell", "steme", "stems", "stend", "steno", "stens", "stent", "steps", "stept", "stere", "stets", "stews", "stewy", "steys", "stich", "stied", "sties", "stilb", "stile", "stime", "stims", "stimy", "stipa", "stipe", "stire", "stirk", "stirp", "stirs", "stive", "stivy", "stoae", "stoai", "stoas", "stoat", "stobs", "stoep", "stogy", "stoit", "stoln", "stoma", "stond", "stong", "stonk", "stonn", "stook", "stoor", "stope", "stops", "stopt", "stoss", "stots", "stott", "stoun", "stoup", "stour", "stown", "stowp", "stows", "strad", "strae", "strag", "strak", "strep", "strew", "stria", "strig", "strim", "strop", "strow", "stroy", "strum", "stubs", "stude", "studs", "stull", "stulm", "stumm", "stums", "stuns", "stupa", "stupe", "sture", "sturt", "styed", "styes", "styli", "stylo", "styme", "stymy", "styre", "styte", "subah", "subas", "subby", "suber", "subha", "succi", "sucks", "sucky", "sucre", "sudds", "sudor", "sudsy", "suede", "suent", "suers", "suete", "suets", "suety", "sugan", "sughs", "sugos", "suhur", "suids", "suint", "suits", "sujee", "sukhs", "sukuk", "sulci", "sulfa", "sulfo", "sulks", "sulph", "sulus", "sumis", "summa", "sumos", "sumph", "sumps", "sunis", "sunks", "sunna", "sunns", "sunup", "supes", "supra", "surah", "sural", "suras", "surat", "surds", "sured", "sures", "surfs", "surfy", "surgy", "surra", "sused", "suses", "susus", "sutor", "sutra", "sutta", "swabs", "swack", "swads", "swage", "swags", "swail", "swain", "swale", "swaly", "swamy", "swang", "swank", "swans", "swaps", "swapt", "sward", "sware", "swarf", "swart", "swats", "swayl", "sways", "sweal", "swede", "sweed", "sweel", "sweer", "swees", "sweir", "swelt", "swerf", "sweys", "swies", "swigs", "swile", "swims", "swink", "swipe", "swire", "swiss", "swith", "swits", "swive", "swizz", "swobs", "swole", "swoln", "swops", "swopt", "swots", "swoun", "sybbe", "sybil", "syboe", "sybow", "sycee", "syces", "sycon", "syens", "syker", "sykes", "sylis", "sylph", "sylva", "symar", "synch", "syncs", "synds", "syned", "synes", "synth", "syped", "sypes", "syphs", "syrah", "syren", "sysop", "sythe", "syver", "taals", "taata", "taber", "tabes", "tabid", "tabis", "tabla", "tabor", "tabun", "tabus", "tacan", "taces", "tacet", "tache", "tacho", "tachs", "tacks", "tacos", "tacts", "taels", "tafia", "taggy", "tagma", "tahas", "tahrs", "taiga", "taigs", "taiko", "tails", "tains", "taira", "taish", "taits", "tajes", "takas", "takes", "takhi", "takin", "takis", "takky", "talak", "talaq", "talar", "talas", "talcs", "talcy", "talea", "taler", "tales", "talks", "talky", "talls", "talma", "talpa", "taluk", "talus", "tamal", "tamed", "tames", "tamin", "tamis", "tammy", "tamps", "tanas", "tanga", "tangi", "tangs", "tanhs", "tanka", "tanks", "tanky", "tanna", "tansy", "tanti", "tanto", "tanty", "tapas", "taped", "tapen", "tapes", "tapet", "tapis", "tappa", "tapus", "taras", "tardo", "tared", "tares", "targa", "targe", "tarns", "taroc", "tarok", "taros", "tarps", "tarre", "tarry", "tarsi", "tarts", "tarty", "tasar", "tased", "taser", "tases", "tasks", "tassa", "tasse", "tasso", "tatar", "tater", "tates", "taths", "tatie", "tatou", "tatts", "tatus", "taube", "tauld", "tauon", "taupe", "tauts", "tavah", "tavas", "taver", "tawai", "tawas", "tawed", "tawer", "tawie", "tawse", "tawts", "taxed", "taxer", "taxes", "taxis", "taxol", "taxon", "taxor", "taxus", "tayra", "tazza", "tazze", "teade", "teads", "teaed", "teaks", "teals", "teams", "tears", "teats", "teaze", "techs", "techy", "tecta", "teels", "teems", "teend", "teene", "teens", "teeny", "teers", "teffs", "teggs", "tegua", "tegus", "tehrs", "teiid", "teils", "teind", "teins", "telae", "telco", "teles", "telex", "telia", "telic", "tells", "telly", "teloi", "telos", "temed", "temes", "tempi", "temps", "tempt", "temse", "tench", "tends", "tendu", "tenes", "tenge", "tenia", "tenne", "tenno", "tenny", "tenon", "tents", "tenty", "tenue", "tepal", "tepas", "tepoy", "terai", "teras", "terce", "terek", "teres", "terfe", "terfs", "terga", "terms", "terne", "terns", "terry", "terts", "tesla", "testa", "teste", "tests", "tetes", "teths", "tetra", "tetri", "teuch", "teugh", "tewed", "tewel", "tewit", "texas", "texes", "texts", "thack", "thagi", "thaim", "thale", "thali", "thana", "thane", "thang", "thans", "thanx", "tharm", "thars", "thaws", "thawy", "thebe", "theca", "theed", "theek", "thees", "thegn", "theic", "thein", "thelf", "thema", "thens", "theow", "therm", "thesp", "thete", "thews", "thewy", "thigs", "thilk", "thill", "thine", "thins", "thiol", "thirl", "thoft", "thole", "tholi", "thoro", "thorp", "thous", "thowl", "thrae", "thraw", "thrid", "thrip", "throe", "thuds", "thugs", "thuja", "thunk", "thurl", "thuya", "thymi", "thymy", "tians", "tiars", "tical", "ticca", "ticed", "tices", "tichy", "ticks", "ticky", "tiddy", "tided", "tides", "tiers", "tiffs", "tifos", "tifts", "tiges", "tigon", "tikas", "tikes", "tikis", "tikka", "tilak", "tiled", "tiler", "tiles", "tills", "tilly", "tilth", "tilts", "timbo", "timed", "times", "timon", "timps", "tinas", "tinct", "tinds", "tinea", "tined", "tines", "tinge", "tings", "tinks", "tinny", "tints", "tinty", "tipis", "tippy", "tired", "tires", "tirls", "tiros", "tirrs", "titch", "titer", "titis", "titre", "titty", "titup", "tiyin", "tiyns", "tizes", "tizzy", "toads", "toady", "toaze", "tocks", "tocky", "tocos", "todde", "toeas", "toffs", "toffy", "tofts", "tofus", "togae", "togas", "toged", "toges", "togue", "tohos", "toile", "toils", "toing", "toise", "toits", "tokay", "toked", "toker", "tokes", "tokos", "tolan", "tolar", "tolas", "toled", "toles", "tolls", "tolly", "tolts", "tolus", "tolyl", "toman", "tombs", "tomes", "tomia", "tommy", "tomos", "tondi", "tondo", "toned", "toner", "tones", "toney", "tongs", "tonka", "tonks", "tonne", "tonus", "tools", "tooms", "toons", "toots", "toped", "topee", "topek", "toper", "topes", "tophe", "tophi", "tophs", "topis", "topoi", "topos", "toppy", "toque", "torah", "toran", "toras", "torcs", "tores", "toric", "torii", "toros", "torot", "torrs", "torse", "torsi", "torsk", "torta", "torte", "torts", "tosas", "tosed", "toses", "toshy", "tossy", "toted", "toter", "totes", "totty", "touks", "touns", "tours", "touse", "tousy", "touts", "touze", "touzy", "towed", "towie", "towns", "towny", "towse", "towsy", "towts", "towze", "towzy", "toyed", "toyer", "toyon", "toyos", "tozed", "tozes", "tozie", "trabs", "trads", "tragi", "traik", "trams", "trank", "tranq", "trans", "trant", "trape", "traps", "trapt", "trass", "trats", "tratt", "trave", "trayf", "trays", "treck", "treed", "treen", "trees", "trefa", "treif", "treks", "trema", "trems", "tress", "trest", "trets", "trews", "treyf", "treys", "triac", "tride", "trier", "tries", "triff", "trigo", "trigs", "trike", "trild", "trill", "trims", "trine", "trins", "triol", "trior", "trios", "trips", "tripy", "trist", "troad", "troak", "troat", "trock", "trode", "trods", "trogs", "trois", "troke", "tromp", "trona", "tronc", "trone", "tronk", "trons", "trooz", "troth", "trots", "trows", "troys", "trued", "trues", "trugo", "trugs", "trull", "tryer", "tryke", "tryma", "tryps", "tsade", "tsadi", "tsars", "tsked", "tsuba", "tsubo", "tuans", "tuart", "tuath", "tubae", "tubar", "tubas", "tubby", "tubed", "tubes", "tucks", "tufas", "tuffe", "tuffs", "tufts", "tufty", "tugra", "tuile", "tuina", "tuism", "tuktu", "tules", "tulpa", "tulsi", "tumid", "tummy", "tumps", "tumpy", "tunas", "tunds", "tuned", "tuner", "tunes", "tungs", "tunny", "tupek", "tupik", "tuple", "tuque", "turds", "turfs", "turfy", "turks", "turme", "turms", "turns", "turnt", "turps", "turrs", "tushy", "tusks", "tusky", "tutee", "tutti", "tutty", "tutus", "tuxes", "tuyer", "twaes", "twain", "twals", "twank", "twats", "tways", "tweel", "tween", "tweep", "tweer", "twerk", "twerp", "twier", "twigs", "twill", "twilt", "twink", "twins", "twiny", "twire", "twirp", "twite", "twits", "twoer", "twyer", "tyees", "tyers", "tyiyn", "tykes", "tyler", "tymps", "tynde", "tyned", "tynes", "typal", "typed", "types", "typey", "typic", "typos", "typps", "typto", "tyran", "tyred", "tyres", "tyros", "tythe", "tzars", "udals", "udons", "ugali", "ugged", "uhlan", "uhuru", "ukase", "ulama", "ulans", "ulema", "ulmin", "ulnad", "ulnae", "ulnar", "ulnas", "ulpan", "ulvas", "ulyie", "ulzie", "umami", "umbel", "umber", "umble", "umbos", "umbre", "umiac", "umiak", "umiaq", "ummah", "ummas", "ummed", "umped", "umphs", "umpie", "umpty", "umrah", "umras", "unais", "unapt", "unarm", "unary", "unaus", "unbag", "unban", "unbar", "unbed", "unbid", "unbox", "uncap", "unces", "uncia", "uncos", "uncoy", "uncus", "undam", "undee", "undos", "undug", "uneth", "unfix", "ungag", "unget", "ungod", "ungot", "ungum", "unhat", "unhip", "unica", "units", "unjam", "unked", "unket", "unkid", "unlaw", "unlay", "unled", "unlet", "unlid", "unman", "unmew", "unmix", "unpay", "unpeg", "unpen", "unpin", "unred", "unrid", "unrig", "unrip", "unsaw", "unsay", "unsee", "unsew", "unsex", "unsod", "untax", "untin", "unwet", "unwit", "unwon", "upbow", "upbye", "updos", "updry", "upend", "upjet", "uplay", "upled", "uplit", "upped", "upran", "uprun", "upsee", "upsey", "uptak", "upter", "uptie", "uraei", "urali", "uraos", "urare", "urari", "urase", "urate", "urbex", "urbia", "urdee", "ureal", "ureas", "uredo", "ureic", "urena", "urent", "urged", "urger", "urges", "urial", "urite", "urman", "urnal", "urned", "urped", "ursae", "ursid", "urson", "urubu", "urvas", "users", "usnea", "usque", "usure", "usury", "uteri", "uveal", "uveas", "uvula", "vacua", "vaded", "vades", "vagal", "vagus", "vails", "vaire", "vairs", "vairy", "vakas", "vakil", "vales", "valis", "valse", "vamps", "vampy", "vanda", "vaned", "vanes", "vangs", "vants", "vaped", "vaper", "vapes", "varan", "varas", "vardy", "varec", "vares", "varia", "varix", "varna", "varus", "varve", "vasal", "vases", "vasts", "vasty", "vatic", "vatus", "vauch", "vaute", "vauts", "vawte", "vaxes", "veale", "veals", "vealy", "veena", "veeps", "veers", "veery", "vegas", "veges", "vegie", "vegos", "vehme", "veils", "veily", "veins", "veiny", "velar", "velds", "veldt", "veles", "vells", "velum", "venae", "venal", "vends", "vendu", "veney", "venge", "venin", "vents", "venus", "verbs", "verra", "verry", "verst", "verts", "vertu", "vespa", "vesta", "vests", "vetch", "vexed", "vexer", "vexes", "vexil", "vezir", "vials", "viand", "vibes", "vibex", "vibey", "viced", "vices", "vichy", "viers", "views", "viewy", "vifda", "viffs", "vigas", "vigia", "vilde", "viler", "villi", "vills", "vimen", "vinal", "vinas", "vinca", "vined", "viner", "vines", "vinew", "vinic", "vinos", "vints", "viold", "viols", "vired", "vireo", "vires", "virga", "virge", "virid", "virls", "virtu", "visas", "vised", "vises", "visie", "visne", "vison", "visto", "vitae", "vitas", "vitex", "vitro", "vitta", "vivas", "vivat", "vivda", "viver", "vives", "vizir", "vizor", "vleis", "vlies", "vlogs", "voars", "vocab", "voces", "voddy", "vodou", "vodun", "voema", "vogie", "voids", "voile", "voips", "volae", "volar", "voled", "voles", "volet", "volks", "volta", "volte", "volti", "volts", "volva", "volve", "vomer", "voted", "votes", "vouge", "voulu", "vowed", "vower", "voxel", "vozhd", "vraic", "vrils", "vroom", "vrous", "vrouw", "vrows", "vuggs", "vuggy", "vughs", "vughy", "vulgo", "vulns", "vulva", "vutty", "waacs", "wacke", "wacko", "wacks", "wadds", "waddy", "waded", "wader", "wades", "wadge", "wadis", "wadts", "waffs", "wafts", "waged", "wages", "wagga", "wagyu", "wahoo", "waide", "waifs", "waift", "wails", "wains", "wairs", "waite", "waits", "wakas", "waked", "waken", "waker", "wakes", "wakfs", "waldo", "walds", "waled", "waler", "wales", "walie", "walis", "walks", "walla", "walls", "wally", "walty", "wamed", "wames", "wamus", "wands", "waned", "wanes", "waney", "wangs", "wanks", "wanky", "wanle", "wanly", "wanna", "wants", "wanty", "wanze", "waqfs", "warbs", "warby", "wards", "wared", "wares", "warez", "warks", "warms", "warns", "warps", "warre", "warst", "warts", "wases", "washy", "wasms", "wasps", "waspy", "wasts", "watap", "watts", "wauff", "waugh", "wauks", "waulk", "wauls", "waurs", "waved", "waves", "wavey", "wawas", "wawes", "wawls", "waxed", "waxer", "waxes", "wayed", "wazir", "wazoo", "weald", "weals", "weamb", "weans", "wears", "webby", "weber", "wecht", "wedel", "wedgy", "weeds", "weeke", "weeks", "weels", "weems", "weens", "weeny", "weeps", "weepy", "weest", "weete", "weets", "wefte", "wefts", "weids", "weils", "weirs", "weise", "weize", "wekas", "welds", "welke", "welks", "welkt", "wells", "welly", "welts", "wembs", "wench", "wends", "wenge", "wenny", "wents", "weros", "wersh", "wests", "wetas", "wetly", "wexed", "wexes", "whamo", "whams", "whang", "whaps", "whare", "whata", "whats", "whaup", "whaur", "wheal", "whear", "wheen", "wheep", "wheft", "whelk", "whelm", "whens", "whets", "whews", "wheys", "whids", "whift", "whigs", "whilk", "whims", "whins", "whios", "whips", "whipt", "whirr", "whirs", "whish", "whiss", "whist", "whits", "whity", "whizz", "whomp", "whoof", "whoot", "whops", "whore", "whorl", "whort", "whoso", "whows", "whump", "whups", "whyda", "wicca", "wicks", "wicky", "widdy", "wides", "wiels", "wifed", "wifes", "wifey", "wifie", "wifty", "wigan", "wigga", "wiggy", "wikis", "wilco", "wilds", "wiled", "wiles", "wilga", "wilis", "wilja", "wills", "wilts", "wimps", "winds", "wined", "wines", "winey", "winge", "wings", "wingy", "winks", "winna", "winns", "winos", "winze", "wiped", "wiper", "wipes", "wired", "wirer", "wires", "wirra", "wised", "wises", "wisha", "wisht", "wisps", "wists", "witan", "wited", "wites", "withe", "withs", "withy", "wived", "wiver", "wives", "wizen", "wizes", "woads", "woald", "wocks", "wodge", "woful", "wojus", "woker", "wokka", "wolds", "wolfs", "wolly", "wolve", "wombs", "womby", "womyn", "wonga", "wongi", "wonks", "wonky", "wonts", "woods", "wooed", "woofs", "woofy", "woold", "wools", "woons", "woops", "woopy", "woose", "woosh", "wootz", "words", "works", "worms", "wormy", "worts", "wowed", "wowee", "woxen", "wrang", "wraps", "wrapt", "wrast", "wrate", "wrawl", "wrens", "wrick", "wried", "wrier", "wries", "writs", "wroke", "wroot", "wroth", "wryer", "wuddy", "wudus", "wulls", "wurst", "wuses", "wushu", "wussy", "wuxia", "wyled", "wyles", "wynds", "wynns", "wyted", "wytes", "xebec", "xenia", "xenic", "xenon", "xeric", "xerox", "xerus", "xoana", "xrays", "xylan", "xylem", "xylic", "xylol", "xylyl", "xysti", "xysts", "yaars", "yabas", "yabba", "yabby", "yacca", "yacka", "yacks", "yaffs", "yager", "yages", "yagis", "yahoo", "yaird", "yakka", "yakow", "yales", "yamen", "yampy", "yamun", "yangs", "yanks", "yapok", "yapon", "yapps", "yappy", "yarak", "yarco", "yards", "yarer", "yarfa", "yarks", "yarns", "yarrs", "yarta", "yarto", "yates", "yauds", "yauld", "yaups", "yawed", "yawey", "yawls", "yawns", "yawny", "yawps", "ybore", "yclad", "ycled", "ycond", "ydrad", "ydred", "yeads", "yeahs", "yealm", "yeans", "yeard", "years", "yecch", "yechs", "yechy", "yedes", "yeeds", "yeesh", "yeggs", "yelks", "yells", "yelms", "yelps", "yelts", "yenta", "yente", "yerba", "yerds", "yerks", "yeses", "yesks", "yests", "yesty", "yetis", "yetts", "yeuks", "yeuky", "yeven", "yeves", "yewen", "yexed", "yexes", "yfere", "yiked", "yikes", "yills", "yince", "yipes", "yippy", "yirds", "yirks", "yirrs", "yirth", "yites", "yitie", "ylems", "ylike", "ylkes", "ymolt", "ympes", "yobbo", "yobby", "yocks", "yodel", "yodhs", "yodle", "yogas", "yogee", "yoghs", "yogic", "yogin", "yogis", "yoick", "yojan", "yoked", "yokel", "yoker", "yokes", "yokul", "yolks", "yolky", "yomim", "yomps", "yonic", "yonis", "yonks", "yoofs", "yoops", "yores", "yorks", "yorps", "youks", "yourn", "yours", "yourt", "youse", "yowed", "yowes", "yowie", "yowls", "yowza", "yrapt", "yrent", "yrivd", "yrneh", "ysame", "ytost", "yuans", "yucas", "yucca", "yucch", "yucko", "yucks", "yucky", "yufts", "yugas", "yuked", "yukes", "yukky", "yukos", "yulan", "yules", "yummo", "yummy", "yumps", "yupon", "yuppy", "yurta", "yurts", "yuzus", "zabra", "zacks", "zaida", "zaidy", "zaire", "zakat", "zaman", "zambo", "zamia", "zanja", "zante", "zanza", "zanze", "zappy", "zarfs", "zaris", "zatis", "zaxes", "zayin", "zazen", "zeals", "zebec", "zebub", "zebus", "zedas", "zeins", "zendo", "zerda", "zerks", "zeros", "zests", "zetas", "zexes", "zezes", "zhomo", "zibet", "ziffs", "zigan", "zilas", "zilch", "zilla", "zills", "zimbi", "zimbs", "zinco", "zincs", "zincy", "zineb", "zines", "zings", "zingy", "zinke", "zinky", "zippo", "zippy", "ziram", "zitis", "zizel", "zizit", "zlote", "zloty", "zoaea", "zobos", "zobus", "zocco", "zoeae", "zoeal", "zoeas", "zoism", "zoist", "zombi", "zonae", "zonda", "zoned", "zoner", "zones", "zonks", "zooea", "zooey", "zooid", "zooks", "zooms", "zoons", "zooty", "zoppa", "zoppo", "zoril", "zoris", "zorro", "zouks", "zowee", "zowie", "zulus", "zupan", "zupas", "zuppa", "zurfs", "zuzim", "zygal", "zygon", "zymes", "zymic"],
        Ra = "present",
        Ha = "correct",
        Na = "absent";
    var Pa = {
        unknown: 0,
        absent: 1,
        present: 2,
        correct: 3
    };

    function Da(e, a) {
        var s = {};
        return e.forEach((function(e, t) {
            if (a[t])
                for (var n = 0; n < e.length; n++) {
                    var o = e[n],
                        r = a[t][n],
                        i = s[o] || "unknown";
                    Pa[r] > Pa[i] && (s[o] = r)
                }
        })), s
    }

    function $a(e) {
        var a = ["th", "st", "nd", "rd"],
            s = e % 100;
        return e + (a[(s - 20) % 10] || a[s] || a[0])
    }
    var Ga = new Date(2021, 5, 19, 0, 0, 0, 0);

    function Ba(e, a) {
        var s = new Date(e),
            t = new Date(a).setHours(0, 0, 0, 0) - s.setHours(0, 0, 0, 0);
        return Math.round(t / 864e5)
    }

    function Va(e) {
        var a, s = Fa(e);
        return a = s % Ma.length, Ma[a]
    }

    function Fa(e) {
        return Ba(Ga, e)
    }
    var Wa = "abcdefghijklmnopqrstuvwxyz";
    var Ya = "nyt-wordle-statistics",
        Ua = "fail",
        Ja = {
            currentStreak: 0,
            maxStreak: 0,
            guesses: o({
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0,
                6: 0
            }, Ua, 0),
            winPercentage: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            averageGuesses: 0
        };

    function Xa() {
        var e = window.localStorage.getItem(Ya) || JSON.stringify(Ja);
        return JSON.parse(e)
    }

    function Za(e) {
        var a = e.isWin,
            s = e.isStreak,
            t = e.numGuesses,
            n = Xa();
        a ? (n.guesses[t] += 1, s ? n.currentStreak += 1 : n.currentStreak = 1) : (n.currentStreak = 0, n.guesses.fail += 1), n.maxStreak = Math.max(n.currentStreak, n.maxStreak), n.gamesPlayed += 1, n.gamesWon += a ? 1 : 0, n.winPercentage = Math.round(n.gamesWon / n.gamesPlayed * 100), n.averageGuesses = Math.round(Object.entries(n.guesses).reduce((function(e, a) {
                var s = y(a, 2),
                    t = s[0],
                    n = s[1];
                return t !== Ua ? e += t * n : e
            }), 0) / n.gamesWon),
            function(e) {
                window.localStorage.setItem(Ya, JSON.stringify(e))
            }(n)
    }
    var Ka, Qa = "nyt-wordle-refresh",
        es = window.localStorage;

    function as() {
        return Ka || (Ka = setInterval((function() {
            es.getItem(Qa) && (es.removeItem(Qa), window.location.href.match(/.*\.nytimes\.com/g) ? window.location.reload(!0) : window.location.replace("https://www.nytimes.com/games/wordle"))
        }), 432e5))
    }
    var ss = "nyt-wordle-statistics",
        ts = window.localStorage;

    function ns(e, a) {
        if (!e.gamesPlayed) return !1;
        var s = function() {
            var e = {
                gamesPlayed: 0
            };
            try {
                var a = JSON.parse(ts.getItem(ss));
                if (a && a.gamesPlayed) return a
            } catch (a) {
                return e
            }
            return e
        }();
        return !(s.gamesPlayed && !a) || e.gamesPlayed > s.gamesPlayed
    }

    function os() {
        if (ts) {
            try {
                var e = new Proxy(new URLSearchParams(window.location.search), {
                    get: function(e, a) {
                        return e.get(a)
                    }
                });
                if (e.data) ! function(e) {
                    if (!e.statistics) throw new Error("User local data does not contain statistics. Aborting transfer.");
                    if (ns(e.statistics, e.force)) {
                        ts.setItem(ss, JSON.stringify(e.statistics));
                        var a = e.darkTheme;
                        window.themeManager.setDarkTheme(a);
                        var s = !!e.colorBlindTheme;
                        window.themeManager.setColorBlindTheme(s)
                    }
                }(JSON.parse(e.data))
            } catch (e) {}
            window.history.replaceState({}, document.title, new URL(location.pathname, location.href).href)
        }
    }
    var rs = document.createElement("template");
    rs.innerHTML = "\n  <style>\n  .toaster {\n    position: absolute;\n    top: 10%;\n    left: 50%;\n    transform: translate(-50%, 0);\n    pointer-events: none;\n    width: fit-content;\n  }\n  #game-toaster {\n    z-index: ".concat(1e3, ";\n  }\n  #system-toaster {\n    z-index: ").concat(4e3, ';\n  }\n\n  #game {\n    width: 100%;\n    max-width: var(--game-max-width);\n    margin: 0 auto;\n    height: calc(100% - var(--header-height));\n    display: flex;\n    flex-direction: column;\n  }\n  header {\n    display: flex;\n    flex-direction: row;\n    align-items: center;\n    justify-content: space-between;\n    flex-wrap: nowrap;\n    padding: 0 16px;\n    height: var(--header-height);\n    color: var(--color-tone-1);\n    border-bottom: 1px solid var(--color-tone-4);\n  }\n  header .title {\n    font-family: \'nyt-karnakcondensed\';\n    font-weight: 700;\n    font-size: 37px;\n    line-height: 100%;\n    letter-spacing: 0.01em;\n    text-align: center;\n    left: 0;\n    right: 0;\n    pointer-events: none;\n  }\n  .menu-left {\n    display: flex;\n    margin: 0;\n    padding: 0;\n    align-items: center;\n    width: 70px;\n    justify-content: flex-start;\n  }\n  .menu-right {\n    display: flex;\n    width: 70px;\n    justify-content: flex-end;\n  }\n  #nav-button {\n    padding-top: 2px;\n  }\n\n  @media (min-width: 415px) {\n    header {\n      padding: 0px 16px;\n    }\n  }\n\n  @media (max-width: 360px) {\n    header .title {\n      font-size: 22px;\n      letter-spacing: 0.1rem;\n    }\n  }\n\n  #board-container {\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    flex-grow: 1;\n    overflow: hidden;\n  }\n  #board {\n    display: grid;\n    grid-template-rows: repeat(6, 1fr);\n    grid-gap: 5px;\n    padding:10px;\n    box-sizing: border-box;\n  }\n  button.icon {\n    background: none;\n    border: none;\n    cursor: pointer;\n    padding: 0 4px;\n  }\n\n  #debug-tools {\n    position: absolute;\n    bottom: 0;\n  }\n\n  </style>\n  <game-theme-manager>\n  <header>\n  <div class="menu-left">\n    <button id="nav-button" class="icon" aria-label="Navigation menu. Click for links to other NYT Games and our Privacy Policy." tabindex="-1">\n      <nav-icon></nav-icon>\n    </button>\n    <button id="help-button" class="icon" aria-label="Help" tabindex="-1">\n      <game-icon icon="help"></game-icon>\n    </button>\n  </div>\n  <div class="title">\n    Wordle\n  </div>\n  <div class="menu-right">\n    <button id="statistics-button" class="icon" aria-label="Statistics" tabindex="-1">\n      <game-icon icon="statistics"></game-icon>\n    </button>\n    <button id="settings-button" class="icon" aria-label="Settings" tabindex="-1">\n      <game-icon icon="settings"></game-icon>\n    </button>\n  </div>\n</header>\n    <div id="game">\n        <div id="board-container">\n          <div id="board"></div>\n        </div>\n        <game-keyboard></game-keyboard>\n        <game-nav-modal></game-nav-modal>\n        <game-modal></game-modal>\n        <game-page></game-page>\n        <div class="toaster" id="game-toaster"></div>\n        <div class="toaster" id="system-toaster"></div>\n    </div>\n  </game-theme-manager>\n  <div id="debug-tools"></div>\n');
    var is = document.createElement("template");
    is.innerHTML = '\n<button id="reveal">reveal</button>\n<button id="shake">shake</button>\n<button id="bounce">bounce</button>\n<button id="toast">toast</button>\n<button id="modal">modal</button>\n';
    var ls = "IN_PROGRESS",
        ds = "WIN",
        cs = "FAIL",
        us = ["Genius", "Magnificent", "Impressive", "Splendid", "Great", "Phew"],
        ms = function(e) {
            r(t, e);
            var a = h(t);

            function t() {
                var e;
                s(this, t), o(m(e = a.call(this)), "tileIndex", 0), o(m(e), "rowIndex", 0), o(m(e), "solution", void 0), o(m(e), "boardState", void 0), o(m(e), "evaluations", void 0), o(m(e), "canInput", !0), o(m(e), "gameStatus", ls), o(m(e), "letterEvaluations", {}), o(m(e), "$board", void 0), o(m(e), "$keyboard", void 0), o(m(e), "$game", void 0), o(m(e), "today", void 0), o(m(e), "lastPlayedTs", void 0), o(m(e), "lastCompletedTs", void 0), o(m(e), "hardMode", void 0), o(m(e), "dayOffset", void 0), e.attachShadow({
                    mode: "open"
                }), e.today = new Date, e.refreshTimer = as();
                var n = za();
                return e.lastPlayedTs = n.lastPlayedTs, e.lastCompletedTs = n.lastCompletedTs, !e.lastPlayedTs || Ba(new Date(e.lastPlayedTs), e.today) >= 1 ? (e.boardState = new Array(6).fill(""), e.evaluations = new Array(6).fill(null), e.solution = "comma", e.dayOffset = Fa(e.today), e.lastCompletedTs = n.lastCompletedTs, e.hardMode = n.hardMode, e.restoringFromLocalStorage = !1, ja({
                    rowIndex: e.rowIndex,
                    boardState: e.boardState,
                    evaluations: e.evaluations,
                    solution: e.solution,
                    gameStatus: e.gameStatus
                })) : (e.boardState = n.boardState, e.evaluations = n.evaluations, e.rowIndex = n.rowIndex, e.solution = n.solution, e.dayOffset = Fa(e.today), e.letterEvaluations = Da(e.boardState, e.evaluations), e.gameStatus = n.gameStatus, e.lastCompletedTs = n.lastCompletedTs, e.hardMode = n.hardMode, e.gameStatus !== ls && (e.canInput = !1), e.restoringFromLocalStorage = !0), e
            }
            return n(t, [{
                key: "evaluateRow",
                value: function() {
                    if (5 === this.tileIndex && !(this.rowIndex >= 6)) {
                        var e, a = this.$board.querySelectorAll("game-row")[this.rowIndex],
                            s = this.boardState[this.rowIndex];                                          
                        if (e = s, !Oa.includes(e) && !Ma.includes(e)) 
                          return a.setAttribute("invalid", ""), void this.addToast("Not in word list");
                        if (this.hardMode) {
                            var t = function(e, a, s) {
                                    if (!e || !a || !s) return {
                                        validGuess: !0
                                    };
                                    for (var t = 0; t < s.length; t++)
                                        if (s[t] === Ha && e[t] !== a[t]) return {
                                            validGuess: !1,
                                            errorMessage: "".concat($a(t + 1), " letter must be ").concat(a[t].toUpperCase())
                                        };
                                    for (var n = {}, o = 0; o < s.length; o++)[Ha, Ra].includes(s[o]) && (n[a[o]] ? n[a[o]] += 1 : n[a[o]] = 1);
                                    var r = e.split("").reduce((function(e, a) {
                                        return e[a] ? e[a] += 1 : e[a] = 1, e
                                    }), {});
                                    for (var i in n)
                                        if ((r[i] || 0) < n[i]) return {
                                            validGuess: !1,
                                            errorMessage: "Guess must contain ".concat(i.toUpperCase())
                                        };
                                    return {
                                        validGuess: !0
                                    }
                                }(s, this.boardState[this.rowIndex - 1], this.evaluations[this.rowIndex - 1]),
                                n = t.validGuess,
                                o = t.errorMessage;
                            if (!n) return a.setAttribute("invalid", ""), void this.addToast(o || "Not valid in hard mode")
                        }
                        var r = function(e, a) {
                            for (var s = Array(a.length).fill(Na), t = Array(a.length).fill(!0), n = Array(a.length).fill(!0), o = 0; o < e.length; o++) e[o] === a[o] && n[o] && (s[o] = Ha, t[o] = !1, n[o] = !1);
                            for (var r = 0; r < e.length; r++) {
                                var i = e[r];
                                if (t[r])
                                    for (var l = 0; l < a.length; l++) {
                                        var d = a[l];
                                        if (n[l] && i === d) {
                                            s[r] = Ra, n[l] = !1;
                                            break
                                        }
                                    }
                            }
                            return s
                        }(s, this.solution);
                        this.evaluations[this.rowIndex] = r, this.letterEvaluations = Da(this.boardState, this.evaluations), a.evaluation = this.evaluations[this.rowIndex], this.rowIndex += 1;
                        var i = this.rowIndex >= 6,
                            l = r.every((function(e) {
                                return "correct" === e
                            }));
                        if (i || l) Za({
                            isWin: l,
                            isStreak: !!this.lastCompletedTs && 1 === Ba(new Date(this.lastCompletedTs), new Date),
                            numGuesses: this.rowIndex
                        }), ja({
                            lastCompletedTs: Date.now()
                        }), this.gameStatus = l ? ds : cs, es.setItem(Qa, !0);
                        this.tileIndex = 0, this.canInput = !1, ja({
                            rowIndex: this.rowIndex,
                            boardState: this.boardState,
                            evaluations: this.evaluations,
                            solution: this.solution,
                            gameStatus: this.gameStatus,
                            lastPlayedTs: Date.now()
                        })
                    }
                }
            }, {
                key: "addLetter",
                value: function(e) {
                    this.gameStatus === ls && (this.canInput && (this.tileIndex >= 5 || (this.boardState[this.rowIndex] += e, this.$board.querySelectorAll("game-row")[this.rowIndex].setAttribute("letters", this.boardState[this.rowIndex]), this.tileIndex += 1)))
                }
            }, {
                key: "removeLetter",
                value: function() {
                //   this.rowIndex = 0
                //   this.tileIndex = 0
                //   this.boardState[0] = ""
                //   this.$board.querySelectorAll("game-row")[0].setAttribute("letters","")
                      
                //   this.boardState[1] = ""
                //   this.$board.querySelectorAll("game-row")[1].setAttribute("letters","")
                      
                //   this.boardState[2] = ""
                //   this.$board.querySelectorAll("game-row")[2].setAttribute("letters","")
                      
                //   this.boardState[3] = ""
                //   this.$board.querySelectorAll("game-row")[3].setAttribute("letters","")
                      
                //   this.boardState[4] = ""
                //   this.$board.querySelectorAll("game-row")[4].setAttribute("letters","")
                      
                //   this.boardState[5] = ""
                //   this.$board.querySelectorAll("game-row")[5].setAttribute("letters","")                      
                  
                //   this.gameStatus = ls
                //     this.canInput = true
                //     this.allWordMap = null
                //     this.greenAplhabetPosMap = null
                //     this.yellowAplhabetPosMap = null
                //     this.blackAplhabetPosMap = null
                //     this.usedWords = null
                    if (this.gameStatus === ls && this.canInput && !(this.tileIndex <= 0)) {
                        this.boardState[this.rowIndex] = this.boardState[this.rowIndex].slice(0, this.boardState[this.rowIndex].length - 1);
                        var e = this.$board.querySelectorAll("game-row")[this.rowIndex];
                        this.boardState[this.rowIndex] ? e.setAttribute("letters", this.boardState[this.rowIndex]) : e.removeAttribute("letters"), e.removeAttribute("invalid"), this.tileIndex -= 1
                    }
                }
            }, {
                key: "submitGuess",
                value: function() {                    
                    if (this.gameStatus === ls && this.canInput) {
                        
                        if(this.allWordMap == null){
                            this.allWordMap = new Map(wordle_solver.getAllWordFrequencies())
                        }
                        if(this.greenAplhabetPosMap == null){
                            this.greenAplhabetPosMap = new Map()
                        }
                        if(this.yellowAplhabetPosMap == null){
                            this.yellowAplhabetPosMap = new Map()
                        }
                        if(this.blackAplhabetPosMap == null){
                            this.blackAplhabetPosMap = new Map()
                        }
                        if(this.usedWords == null){
                            this.usedWords = new Set()
                        }
                        
                        let guess = wordle_solver.getNextGuessWord(this.allWordMap, this.greenAplhabetPosMap, this.yellowAplhabetPosMap, this.blackAplhabetPosMap, this.usedWords)
                        this.usedWords.add(guess[0]) 
                        this.allWordMap = new Map(guess[1])
                        console.log(guess[0] + ' - next map size: ' + guess[1].size)
                        this.hardMode = false
                        this.boardState[this.rowIndex] = guess[0]
                        this.$board.querySelectorAll("game-row")[this.rowIndex].setAttribute("letters", guess[0])
                        this.tileIndex = 5
                        if (5 !== this.tileIndex) {
                            return this.$board.querySelectorAll("game-row")[this.rowIndex].setAttribute("invalid", ""), void this.addToast("Not enough letters");
                        }
                        this.evaluateRow()

                        let currentGuessEvaluation = this.evaluations[this.rowIndex - 1]
                        this.greenAplhabetPosMap = new Map()
                        this.yellowAplhabetPosMap = new Map()
                        this.blackAplhabetPosMap = new Map()
                        for(let colIndex = 0; colIndex < 6; colIndex++){
                            if(currentGuessEvaluation[colIndex] === 'correct'){ // green
                                this.greenAplhabetPosMap.set(this.boardState[this.rowIndex - 1][colIndex], colIndex)
                            } else if (currentGuessEvaluation[colIndex] === 'present'){ // yellow
                                this.yellowAplhabetPosMap.set(this.boardState[this.rowIndex - 1][colIndex], colIndex)
                            } else if(currentGuessEvaluation[colIndex] === 'absent'){ // black
                                this.blackAplhabetPosMap.set(this.boardState[this.rowIndex - 1][colIndex], colIndex)
                            }
                        }
                    }
                }
            }, {
                key: "addToast",
                value: function(e, a) {
                    var s = arguments.length > 2 && void 0 !== arguments[2] && arguments[2],
                        t = document.createElement("game-toast");
                    t.setAttribute("text", e), a && t.setAttribute("duration", a), s ? this.shadowRoot.querySelector("#system-toaster").prepend(t) : this.shadowRoot.querySelector("#game-toaster").prepend(t)
                }
            }, {
                key: "sizeBoard",
                value: function() {
                    var e = this.shadowRoot.querySelector("#board-container"),
                        a = Math.min(Math.floor(e.clientHeight * (5 / 6)), 350),
                        s = 6 * Math.floor(a / 5);
                    this.$board.style.width = "".concat(a, "px"), this.$board.style.height = "".concat(s, "px")
                }
            }, {
                key: "showStatsModal",
                value: function() {
                    var e = this.$game.querySelector("game-modal"),
                        a = document.createElement("game-stats");
                    this.gameStatus === ds && this.rowIndex <= 6 && a.setAttribute("highlight-guess", this.rowIndex), a.gameApp = this, e.appendChild(a), e.setAttribute("open", "")
                }
            }, {
                key: "showNavModal",
                value: function() {
                    var e = this.$game.querySelector("game-nav-modal"),
                        a = document.createElement("game-nav");
                    a.gameApp = this, e.appendChild(a), e.setAttribute("open", "")
                }
            }, {
                key: "showHelpModal",
                value: function() {
                    var e = this.$game.querySelector("game-modal");
                    e.appendChild(document.createElement("game-help")), e.setAttribute("open", "")
                }
            }, {
                key: "connectedCallback",
                value: function() {
                    var e, a, s, t, n, o, r, i, l, d = this;
                    this.shadowRoot.appendChild(rs.content.cloneNode(!0)), this.$game = this.shadowRoot.querySelector("#game"), this.$board = this.shadowRoot.querySelector("#board"), this.$keyboard = this.shadowRoot.querySelector("game-keyboard"), this.sizeBoard(), this.lastPlayedTs || setTimeout((function() {
                        return d.showHelpModal()
                    }), 100);
                    for (var c = 0; c < 6; c++) {
                        var u = document.createElement("game-row");
                        u.setAttribute("letters", this.boardState[c]), u.setAttribute("length", 5), this.evaluations[c] && (u.evaluation = this.evaluations[c]), this.$board.appendChild(u)
                    }
                    this.$game.addEventListener("game-key-press", (function(e) {
                            var a = e.detail.key;
                            "←" === a || "Backspace" === a ? d.removeLetter() : "↵" === a || "Enter" === a ? d.submitGuess() : Wa.includes(a.toLowerCase()) && d.addLetter(a.toLowerCase())
                        })), this.$game.addEventListener("game-last-tile-revealed-in-row", (function(e) {
                            d.$keyboard.letterEvaluations = d.letterEvaluations, d.rowIndex < 6 && (d.canInput = !0);
                            var a = d.$board.querySelectorAll("game-row")[d.rowIndex - 1];
                            (e.path || e.composedPath && e.composedPath()).includes(a) && ([ds, cs].includes(d.gameStatus) && (d.restoringFromLocalStorage ? d.showStatsModal() : (d.gameStatus === ds && (a.setAttribute("win", ""), d.addToast(us[d.rowIndex - 1], 2e3)), d.gameStatus === cs && d.addToast(d.solution.toUpperCase(), 1 / 0), setTimeout((function() {
                                d.showStatsModal()
                            }), 2500))), d.restoringFromLocalStorage = !1)
                        })), this.shadowRoot.addEventListener("game-setting-change", (function(e) {
                            var a = e.detail,
                                s = a.name,
                                t = a.checked,
                                n = a.disabled;
                            switch (s) {
                                case "hard-mode":
                                    return void(n ? d.addToast("Hard mode can only be enabled at the start of a round", 1500, !0) : (d.hardMode = t, ja({
                                        hardMode: t
                                    })))
                            }
                        })), this.shadowRoot.getElementById("settings-button").addEventListener("click", (function(e) {
                            var a = d.$game.querySelector("game-page"),
                                s = document.createTextNode("Settings");
                            a.appendChild(s);
                            var t = document.createElement("game-settings");
                            t.setAttribute("slot", "content"), t.gameApp = d, a.appendChild(t), a.setAttribute("open", "")
                        })), this.shadowRoot.getElementById("help-button").addEventListener("click", (function(e) {
                            var a = d.$game.querySelector("game-page"),
                                s = document.createTextNode("How to play");
                            a.appendChild(s);
                            var t = document.createElement("game-help");
                            t.setAttribute("page", ""), t.setAttribute("slot", "content"), a.appendChild(t), a.setAttribute("open", "")
                        })), this.shadowRoot.getElementById("statistics-button").addEventListener("click", (function(e) {
                            d.showStatsModal()
                        })), this.shadowRoot.getElementById("nav-button").addEventListener("click", (function(e) {
                            d.showNavModal()
                        })), window.addEventListener("resize", this.sizeBoard.bind(this)), os(), i = {
                            container: "GTM-P528B3",
                            prdstring: "&gtm_auth=tfAzqo1rYDLgYhmTnSjPqw&gtm_preview=env-130",
                            devstring: "&gtm_auth=WiJyA7zv1sohHCWSZ3mF1Q&gtm_preview=env-8",
                            stgstring: "&gtm_auth=FOuAsPhG-4kWeLk6Kq5AzQ&gtm_preview=env-7",
                            dataLayer: "",
                            modifier: "",
                            env: document.location.host.indexOf(".dev.") > -1 ? "dev" : document.location.host.indexOf(".stg.") > -1 || document.location.host.indexOf(".stage.") > -1 ? "stg" : "prod"
                        }, l = {
                            event: "pageDataReady",
                            application: {
                                name: "games-crosswords",
                                environment: i.env
                            }
                        }, i.modifier = i.prdstring, "dev" === i.env ? i.modifier = i.devstring : "stg" === i.env && (i.modifier = i.stgstring),
                        function(e, a, s, t, n, o) {
                            e[t] = e[t] || [], e[t].push({
                                "gtm.start": (new Date).getTime(),
                                event: "gtm.js"
                            });
                            var r = a.getElementsByTagName(s)[0],
                                i = a.createElement(s);
                            i.async = !0, i.src = "https://www.googletagmanager.com/gtm.js?id=" + n + o + "&gtm_cookies_win=x", r.parentNode.insertBefore(i, r)
                        }(window, document, "script", "dataLayer", i.container, i.modifier), e = l, a = i.env, t = a && "prod" === a ? "a.nytimes.com" : "a.dev.nytimes.com", n = encodeURIComponent(document.referrer), o = encodeURIComponent((s = document.querySelector("link[rel=canonical]")) ? s.href : document.location.href), (r = new XMLHttpRequest).withCredentials = !0, r.open("GET", "https://" + t + "/svc/nyt/data-layer?sourceApp=" + e.application.name + "&referrer=" + n + "&assetUrl=" + o, !0), r.onload = function() {
                            var a = JSON.parse(r.responseText);
                            a.event = "userDataReady", window.dataLayer.push(a), window.dataLayer.push(e)
                        }, r.addEventListener("error", (function() {
                            window.dataLayer.push(e)
                        })), r.send()
                }
            }, {
                key: "disconnectedCallback",
                value: function() {
                    clearInterval(this.refreshTimer)
                }
            }, {
                key: "debugTools",
                value: function() {
                    var e = this;
                    this.shadowRoot.getElementById("debug-tools").appendChild(is.content.cloneNode(!0)), this.shadowRoot.getElementById("toast").addEventListener("click", (function(a) {
                        e.addToast("hello world")
                    })), this.shadowRoot.getElementById("modal").addEventListener("click", (function(a) {
                        var s = e.$game.querySelector("game-modal");
                        s.textContent = "hello plz", s.setAttribute("open", "")
                    })), this.shadowRoot.getElementById("reveal").addEventListener("click", (function() {
                        e.evaluateRow()
                    })), this.shadowRoot.getElementById("shake").addEventListener("click", (function() {
                        e.$board.querySelectorAll("game-row")[e.rowIndex].setAttribute("invalid", "")
                    })), this.shadowRoot.getElementById("bounce").addEventListener("click", (function() {
                        var a = e.$board.querySelectorAll("game-row")[e.rowIndex - 1];
                        "" === a.getAttribute("win") ? a.removeAttribute("win") : a.setAttribute("win", "")
                    }))
                }
            }]), t
        }(u(HTMLElement));
    customElements.define("game-app", ms);
    var ps = document.createElement("template");
    ps.innerHTML = "\n  <style>\n    .overlay {\n      display: none;\n      position: absolute;\n      width: 100%;\n      height: 100%;\n      top: 0;\n      left: 0;\n      justify-content: center;\n      align-items: center;\n      background-color: var(--opacity-50);\n      z-index: ".concat(3e3, ';\n    }\n\n    :host([open]) .overlay {\n      display: flex;\n    }\n\n    .content {\n      position: relative;\n      border-radius: 8px;\n      border: 1px solid var(--color-tone-6);\n      background-color: var(--modal-content-bg);\n      color: var(--color-tone-1);\n      box-shadow: 0 4px 23px 0 rgba(0, 0, 0, 0.2);\n      width: 90%;\n      max-height: 90%;\n      overflow-y: auto;\n      animation: SlideIn 200ms;\n      max-width: var(--game-max-width);\n      padding: 16px;\n      box-sizing: border-box;\n    }\n\n    .content.closing {\n      animation: SlideOut 200ms;\n    }\n\n    .close-icon {\n      width: 24px;\n      height: 24px;\n      position: absolute;\n      top: 16px;\n      right: 16px;\n    }\n\n    game-icon {\n      position: fixed;\n      user-select: none;\n      cursor: pointer;\n    }\n\n    @keyframes SlideIn {\n      0% {\n        transform: translateY(30px);\n        opacity: 0;\n      }\n      100% {\n        transform: translateY(0px);\n        opacity: 1;\n      }\n    }\n    @keyframes SlideOut {\n      0% {\n        transform: translateY(0px);\n        opacity: 1;\n      }\n      90% {\n        opacity: 0;\n      }\n      100% {\n        opacity: 0;\n        transform: translateY(60px);\n      }\n    }\n  </style>\n  <div class="overlay">\n    <div class="content">\n      <slot></slot>\n      <div class="close-icon">\n        <game-icon icon="close"></game-icon>\n      </div>\n    </div>\n  </div>\n');
    var hs = function(e) {
        r(t, e);
        var a = h(t);

        function t() {
            var e;
            return s(this, t), (e = a.call(this)).attachShadow({
                mode: "open"
            }), e
        }
        return n(t, [{
            key: "connectedCallback",
            value: function() {
                var e = this;
                this.shadowRoot.appendChild(ps.content.cloneNode(!0)), this.addEventListener("click", (function(a) {
                    e.shadowRoot.querySelector(".content").classList.add("closing")
                })), this.shadowRoot.addEventListener("animationend", (function(a) {
                    "SlideOut" === a.animationName && (e.shadowRoot.querySelector(".content").classList.remove("closing"), e.removeChild(e.firstChild), e.removeAttribute("open"))
                }))
            }
        }]), t
    }(u(HTMLElement));
    customElements.define("game-modal", hs);
    var ys = document.createElement("template");
    ys.innerHTML = "\n  <style>\n  :host {\n    height: var(--keyboard-height);\n  }\n  #keyboard {\n    margin: 0 8px;\n    user-select: none;\n  }\n  \n  .row {\n    display: flex;\n    width: 100%;\n    margin: 0 auto 8px;\n    /* https://stackoverflow.com/questions/46167604/ios-html-disable-double-tap-to-zoom */\n    touch-action: manipulation;\n  }\n  \n  button {\n    font-family: inherit;\n    font-weight: bold;\n    border: 0;\n    padding: 0;\n    margin: 0 6px 0 0;\n    height: 58px;\n    border-radius: 4px;\n    cursor: pointer;\n    user-select: none;\n    background-color: var(--key-bg);\n    color: var(--key-text-color);\n    flex: 1;\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    text-transform: uppercase;\n    -webkit-tap-highlight-color: rgba(0,0,0,0.3);\n  }\n\n  button:focus {\n    outline: none;\n  }\n\n  button.fade {\n    transition: background-color 0.1s ease, color 0.1s ease;\n  }\n  \n  button:last-of-type {\n    margin: 0;\n  }\n  \n  .half {\n    flex: 0.5;\n  }\n  \n  .one {\n    flex: 1;\n  }\n\n  .one-and-a-half {\n    flex: 1.5;\n    font-size: 12px;\n  }\n  \n  .two {\n    flex: 2;\n  }\n\n  button[data-state='correct'] {\n    background-color: var(--key-bg-correct);\n    color: var(--key-evaluated-text-color);\n  }\n\n  button[data-state='present'] {\n    background-color: var(--key-bg-present);\n    color: var(--key-evaluated-text-color);\n  }\n\n  button[data-state='absent'] {\n    background-color: var(--key-bg-absent);\n    color: var(--key-evaluated-text-color);\n  }\n\n  </style>\n  <div id=\"keyboard\"></div>\n";
    var gs = document.createElement("template");
    gs.innerHTML = "\n  <button>key</button>\n";
    var bs = document.createElement("template");
    bs.innerHTML = '\n  <div class="spacer"></div>\n';
    var fs = [
            ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
            ["-", "a", "s", "d", "f", "g", "h", "j", "k", "l", "-"],
            ["↵", "z", "x", "c", "v", "b", "n", "m", "←"]
        ],
        ks = function(e) {
            r(t, e);
            var a = h(t);

            function t() {
                var e;
                return s(this, t), o(m(e = a.call(this)), "_letterEvaluations", {}), e.attachShadow({
                    mode: "open"
                }), e
            }
            return n(t, [{
                key: "letterEvaluations",
                set: function(e) {
                    this._letterEvaluations = e, this._render()
                }
            }, {
                key: "dispatchKeyPressEvent",
                value: function(e) {
                    this.dispatchEvent(new CustomEvent("game-key-press", {
                        bubbles: !0,
                        composed: !0,
                        detail: {
                            key: e
                        }
                    }))
                }
            }, {
                key: "connectedCallback",
                value: function() {
                    var e = this;
                    this.shadowRoot.appendChild(ys.content.cloneNode(!0)), this.$keyboard = this.shadowRoot.getElementById("keyboard"), this.$keyboard.addEventListener("click", (function(a) {
                        var s = a.target.closest("button");
                        s && e.$keyboard.contains(s) && e.dispatchKeyPressEvent(s.dataset.key)
                    })), window.addEventListener("keydown", (function(a) {
                        if (!0 !== a.repeat) {
                            var s = a.key,
                                t = a.metaKey,
                                n = a.ctrlKey;
                            t || n || (Wa.includes(s.toLowerCase()) || "Backspace" === s || "Enter" === s) && e.dispatchKeyPressEvent(s)
                        }
                    })), this.$keyboard.addEventListener("transitionend", (function(a) {
                        var s = a.target.closest("button");
                        s && e.$keyboard.contains(s) && s.classList.remove("fade")
                    })), fs.forEach((function(a) {
                        var s = document.createElement("div");
                        s.classList.add("row"), a.forEach((function(e) {
                            var a;
                            if (e >= "a" && e <= "z" || "←" === e || "↵" === e) {
                                if ((a = gs.content.cloneNode(!0).firstElementChild).dataset.key = e, a.textContent = e, "←" === e) {
                                    var t = document.createElement("game-icon");
                                    t.setAttribute("icon", "backspace"), a.textContent = "", a.appendChild(t), a.classList.add("one-and-a-half")
                                }
                                "↵" == e && (a.textContent = "enter", a.classList.add("one-and-a-half"))
                            } else(a = bs.content.cloneNode(!0).firstElementChild).classList.add(1 === e.length ? "half" : "one");
                            s.appendChild(a)
                        })), e.$keyboard.appendChild(s)
                    })), this._render()
                }
            }, {
                key: "_render",
                value: function() {
                    for (var e in this._letterEvaluations) {
                        var a = this.$keyboard.querySelector('[data-key="'.concat(e, '"]'));
                        a.dataset.state = this._letterEvaluations[e], a.classList.add("fade")
                    }
                }
            }]), t
        }(u(HTMLElement));
    /*! *****************************************************************************
      Copyright (c) Microsoft Corporation.

      Permission to use, copy, modify, and/or distribute this software for any
      purpose with or without fee is hereby granted.

      THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
      REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
      AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
      INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
      LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
      OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
      PERFORMANCE OF THIS SOFTWARE.
      ***************************************************************************** */
    function vs(e, a, s, t) {
        return new(s || (s = Promise))((function(n, o) {
            function r(e) {
                try {
                    l(t.next(e))
                } catch (e) {
                    o(e)
                }
            }

            function i(e) {
                try {
                    l(t.throw(e))
                } catch (e) {
                    o(e)
                }
            }

            function l(e) {
                var a;
                e.done ? n(e.value) : (a = e.value, a instanceof s ? a : new s((function(e) {
                    e(a)
                }))).then(r, i)
            }
            l((t = t.apply(e, a || [])).next())
        }))
    }

    function ws(e, a) {
        var s, t, n, o, r = {
            label: 0,
            sent: function() {
                if (1 & n[0]) throw n[1];
                return n[1]
            },
            trys: [],
            ops: []
        };
        return o = {
            next: i(0),
            throw: i(1),
            return: i(2)
        }, "function" == typeof Symbol && (o[Symbol.iterator] = function() {
            return this
        }), o;

        function i(o) {
            return function(i) {
                return function(o) {
                    if (s) throw new TypeError("Generator is already executing.");
                    for (; r;) try {
                        if (s = 1, t && (n = 2 & o[0] ? t.return : o[0] ? t.throw || ((n = t.return) && n.call(t), 0) : t.next) && !(n = n.call(t, o[1])).done) return n;
                        switch (t = 0, n && (o = [2 & o[0], n.value]), o[0]) {
                            case 0:
                            case 1:
                                n = o;
                                break;
                            case 4:
                                return r.label++, {
                                    value: o[1],
                                    done: !1
                                };
                            case 5:
                                r.label++, t = o[1], o = [0];
                                continue;
                            case 7:
                                o = r.ops.pop(), r.trys.pop();
                                continue;
                            default:
                                if (!((n = (n = r.trys).length > 0 && n[n.length - 1]) || 6 !== o[0] && 2 !== o[0])) {
                                    r = 0;
                                    continue
                                }
                                if (3 === o[0] && (!n || o[1] > n[0] && o[1] < n[3])) {
                                    r.label = o[1];
                                    break
                                }
                                if (6 === o[0] && r.label < n[1]) {
                                    r.label = n[1], n = o;
                                    break
                                }
                                if (n && r.label < n[2]) {
                                    r.label = n[2], r.ops.push(o);
                                    break
                                }
                                n[2] && r.ops.pop(), r.trys.pop();
                                continue
                        }
                        o = a.call(e, r)
                    } catch (e) {
                        o = [6, e], t = 0
                    } finally {
                        s = n = 0
                    }
                    if (5 & o[0]) throw o[1];
                    return {
                        value: o[0] ? o[1] : void 0,
                        done: !0
                    }
                }([o, i])
            }
        }
    }
    customElements.define("game-keyboard", ks),
        function() {
            (console.warn || console.log).apply(console, arguments)
        }.bind("[clipboard-polyfill]");
    var xs, zs, js, Ss, Cs = "undefined" == typeof navigator ? void 0 : navigator,
        _s = null == Cs ? void 0 : Cs.clipboard;
    null === (xs = null == _s ? void 0 : _s.read) || void 0 === xs || xs.bind(_s), null === (zs = null == _s ? void 0 : _s.readText) || void 0 === zs || zs.bind(_s);
    var Es = (null === (js = null == _s ? void 0 : _s.write) || void 0 === js || js.bind(_s), null === (Ss = null == _s ? void 0 : _s.writeText) || void 0 === Ss ? void 0 : Ss.bind(_s)),
        qs = "undefined" == typeof window ? void 0 : window,
        Ls = (null == qs || qs.ClipboardItem, qs);
    var Ts = function() {
        this.success = !1
    };

    function As(e, a, s) {
        for (var t in e.success = !0, a) {
            var n = a[t],
                o = s.clipboardData;
            o.setData(t, n), "text/plain" === t && o.getData(t) !== n && (e.success = !1)
        }
        s.preventDefault()
    }

    function Is(e) {
        var a = new Ts,
            s = As.bind(this, a, e);
        document.addEventListener("copy", s);
        try {
            document.execCommand("copy")
        } finally {
            document.removeEventListener("copy", s)
        }
        return a.success
    }

    function Ms(e, a) {
        Os(e);
        var s = Is(a);
        return Rs(), s
    }

    function Os(e) {
        var a = document.getSelection();
        if (a) {
            var s = document.createRange();
            s.selectNodeContents(e), a.removeAllRanges(), a.addRange(s)
        }
    }

    function Rs() {
        var e = document.getSelection();
        e && e.removeAllRanges()
    }

    function Hs(e) {
        return vs(this, void 0, void 0, (function() {
            var a;
            return ws(this, (function(s) {
                if (a = "text/plain" in e, "undefined" == typeof ClipboardEvent && void 0 !== Ls.clipboardData && void 0 !== Ls.clipboardData.setData) {
                    if (!a) throw new Error("No `text/plain` value was specified.");
                    if (t = e["text/plain"], Ls.clipboardData.setData("Text", t)) return [2, !0];
                    throw new Error("Copying failed, possibly because the user rejected it.")
                }
                var t;
                return Is(e) || navigator.userAgent.indexOf("Edge") > -1 || Ms(document.body, e) || function(e) {
                    var a = document.createElement("div");
                    a.setAttribute("style", "-webkit-user-select: text !important"), a.textContent = "temporary element", document.body.appendChild(a);
                    var s = Ms(a, e);
                    return document.body.removeChild(a), s
                }(e) || function(e) {
                    var a = document.createElement("div");
                    a.setAttribute("style", "-webkit-user-select: text !important");
                    var s = a;
                    a.attachShadow && (s = a.attachShadow({
                        mode: "open"
                    }));
                    var t = document.createElement("span");
                    t.innerText = e, s.appendChild(t), document.body.appendChild(a), Os(t);
                    var n = document.execCommand("copy");
                    return Rs(), document.body.removeChild(a), n
                }(e["text/plain"]) ? [2, !0] : [2, !1]
            }))
        }))
    }

    function Ns(e, a, s) {
        try {
            Sa() && !(navigator.userAgent.toLowerCase().indexOf("firefox") > -1) && void 0 !== navigator.share && navigator.canShare && navigator.canShare(e) ? navigator.share(e) : function(e) {
                return vs(this, void 0, void 0, (function() {
                    return ws(this, (function(a) {
                        if (Es) return [2, Es(e)];
                        if (!Hs(function(e) {
                                var a = {};
                                return a["text/plain"] = e, a
                            }(e))) throw new Error("writeText() failed");
                        return [2]
                    }))
                }))
            }(e.text).then(a, s)
        } catch (e) {
            s()
        }
    }
    var Ps = document.createElement("template");
    Ps.innerHTML = '\n  <style>\n    .container {\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      justify-content: center;\n      padding: 16px 0; \n    }\n    h1 {\n      font-weight: 700;\n      font-size: 16px;\n      letter-spacing: 0.5px;\n      text-transform: uppercase;\n      text-align: center;\n      margin-bottom: 10px;\n    }\n  \n    #statistics {\n      display: flex;\n      margin-bottom: \n    }\n\n    .statistic-container {\n      flex: 1;\n    }\n\n    .statistic-container .statistic {\n      font-size: 36px;\n      font-weight: 400;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      text-align: center;\n      letter-spacing: 0.05em;\n      font-variant-numeric: proportional-nums;\n    }\n\n    .statistic.timer {\n      font-variant-numeric: initial;\n    }\n\n    .statistic-container .label {\n      font-size: 12px;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      text-align: center;\n    }\n\n    #guess-distribution {\n      width: 80%;\n    }\n\n    .graph-container {\n      width: 100%;\n      height: 20px;\n      display: flex;\n      align-items: center;\n      padding-bottom: 4px;\n      font-size: 14px;\n      line-height: 20px;\n    }\n\n    .graph-container .graph {\n      width: 100%;\n      height: 100%;\n      padding-left: 4px;\n    }\n\n    .graph-container .graph .graph-bar {\n      height: 100%;\n      /* Assume no wins */\n      width: 0%;\n      position: relative;\n      background-color: var(--color-absent);\n      display: flex;\n      justify-content: center;\n    }\n\n    .graph-container .graph .graph-bar.highlight {\n      background-color: var(--color-correct);\n    }\n\n    .graph-container .graph .graph-bar.align-right {\n      justify-content: flex-end;\n      padding-right: 8px;\n    }\n\n    .graph-container .graph .num-guesses {\n      font-weight: bold;\n      color: var(--tile-text-color);\n    }\n\n    #statistics,\n    #guess-distribution {\n      padding-bottom: 10px;\n    }\n\n    .footer {\n      display: flex;\n      width: 100%;\n    }\n\n    .countdown {\n      border-right: 1px solid var(--color-tone-1);\n      padding-right: 12px;\n      width: 50%;\n    }\n\n    .share {\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      padding-left: 12px;\n      width: 50%;\n    }\n\n    .no-data {\n      text-align: center;\n    }\n\n    button#share-button {\n      background-color: var(--key-bg-correct);\n      color: var(--key-evaluated-text-color);\n      font-family: inherit;\n      font-weight: bold;\n      border-radius: 4px;\n      cursor: pointer;\n      border: none;\n      user-select: none;\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      text-transform: uppercase;\n      -webkit-tap-highlight-color: rgba(0,0,0,0.3);\n      width: 80%;\n      font-size: 20px;\n      height: 52px;\n      -webkit-filter: brightness(100%);\n    }\n    button#share-button:hover {\n      opacity: 0.9;\n    }\n    button#share-button game-icon {\n      width: 24px;\n      height: 24px;\n      padding-left: 8px;\n    }\n  </style>\n\n  <div class="container">\n    <h1>Statistics</h1>\n    <div id="statistics"></div>\n    <h1>Guess Distribution</h1>\n    <div id="guess-distribution"></div>\n    <div class="footer"></div>\n  </div>\n';
    var Ds = document.createElement("template");
    Ds.innerHTML = '\n  <div class="statistic-container">\n    <div class="statistic"></div>\n    <div class="label"></div>\n  </div>\n';
    var $s = document.createElement("template");
    $s.innerHTML = '\n    <div class="graph-container">\n      <div class="guess"></div>\n      <div class="graph">\n        <div class="graph-bar">\n          <div class="num-guesses">\n        </div>\n      </div>\n      </div>\n    </div>\n';
    var Gs = document.createElement("template");
    Gs.innerHTML = '\n  <div class="countdown">\n    <h1>Next WORDLE</h1>\n    <div id="timer">\n      <div class="statistic-container">\n        <div class="statistic timer">\n          <countdown-timer></countdown-timer>\n        </div>\n      </div>\n    </div>\n  </div>\n  <div class="share">\n    <button id="share-button">\n      Share <game-icon icon="share"></game-icon>\n    </button>\n  </div>\n';
    var Bs = {
            currentStreak: "Current Streak",
            maxStreak: "Max Streak",
            winPercentage: "Win %",
            gamesPlayed: "Played",
            gamesWon: "Won",
            averageGuesses: "Av. Guesses"
        },
        Vs = function(e) {
            r(t, e);
            var a = h(t);

            function t() {
                var e;
                return s(this, t), o(m(e = a.call(this)), "stats", {}), o(m(e), "gameApp", void 0), e.attachShadow({
                    mode: "open"
                }), e.stats = Xa(), e
            }
            return n(t, [{
                key: "connectedCallback",
                value: function() {
                    var e = this;
                    this.shadowRoot.appendChild(Ps.content.cloneNode(!0));
                    var a = this.shadowRoot.getElementById("statistics"),
                        s = this.shadowRoot.getElementById("guess-distribution"),
                        t = Math.max.apply(Math, g(Object.values(this.stats.guesses)));
                    if (Object.values(this.stats.guesses).every((function(e) {
                            return 0 === e
                        }))) {
                        var n = document.createElement("div");
                        n.classList.add("no-data"), n.innerText = "No Data", s.appendChild(n)
                    } else
                        for (var o = 1; o < Object.keys(this.stats.guesses).length; o++) {
                            var r = o,
                                i = this.stats.guesses[o],
                                l = $s.content.cloneNode(!0),
                                d = Math.max(7, Math.round(i / t * 100));
                            l.querySelector(".guess").textContent = r;
                            var c = l.querySelector(".graph-bar");
                            if (c.style.width = "".concat(d, "%"), "number" == typeof i) {
                                l.querySelector(".num-guesses").textContent = i, i > 0 && c.classList.add("align-right");
                                var u = parseInt(this.getAttribute("highlight-guess"), 10);
                                u && o === u && c.classList.add("highlight")
                            }
                            s.appendChild(l)
                        }
                    if (["gamesPlayed", "winPercentage", "currentStreak", "maxStreak"].forEach((function(s) {
                            var t = Bs[s],
                                n = e.stats[s],
                                o = Ds.content.cloneNode(!0);
                            o.querySelector(".label").textContent = t, o.querySelector(".statistic").textContent = n, a.appendChild(o)
                        })), this.gameApp.gameStatus !== ls) {
                        var m = this.shadowRoot.querySelector(".footer"),
                            p = Gs.content.cloneNode(!0);
                        m.appendChild(p), this.shadowRoot.querySelector("button#share-button").addEventListener("click", (function(a) {
                            a.preventDefault(), a.stopPropagation();
                            Ns(function(e) {
                                var a = e.evaluations,
                                    s = e.dayOffset,
                                    t = e.rowIndex,
                                    n = e.isHardMode,
                                    o = e.isWin,
                                    r = JSON.parse(window.localStorage.getItem(j)),
                                    i = JSON.parse(window.localStorage.getItem(S)),
                                    l = "Wordle ".concat(s);
                                l += " ".concat(o ? t : "X", "/").concat(6), n && (l += "*");
                                var d = "";
                                return a.forEach((function(e) {
                                    e && (e.forEach((function(e) {
                                        if (e) {
                                            var a = "";
                                            switch (e) {
                                                case Ha:
                                                    a = function(e) {
                                                        return e ? "🟧" : "🟩"
                                                    }(i);
                                                    break;
                                                case Ra:
                                                    a = function(e) {
                                                        return e ? "🟦" : "🟨"
                                                    }(i);
                                                    break;
                                                case Na:
                                                    a = function(e) {
                                                        return e ? "⬛" : "⬜"
                                                    }(r)
                                            }
                                            d += a
                                        }
                                    })), d += "\n")
                                })), {
                                    text: "".concat(l, "\n\n").concat(d.trimEnd())
                                }
                            }({
                                evaluations: e.gameApp.evaluations,
                                dayOffset: e.gameApp.dayOffset,
                                rowIndex: e.gameApp.rowIndex,
                                isHardMode: e.gameApp.hardMode,
                                isWin: e.gameApp.gameStatus === ds
                            }), (function() {
                                e.gameApp.addToast("Copied results to clipboard", 2e3, !0)
                            }), (function() {
                                e.gameApp.addToast("Share failed", 2e3, !0)
                            }))
                        }))
                    }
                }
            }]), t
        }(u(HTMLElement));
    customElements.define("game-stats", Vs);
    var Fs = document.createElement("template"),
        Ws = [{
            id: "spelling-bee",
            name: "Spelling Bee",
            url: "/puzzles/spelling-bee?utm_source=wordle&utm_medium=referral&utm_campaign=wordle_nav",
            backgroundImage: "var(--spelling-bee)"
        }, {
            id: "crossword",
            name: "The Crossword",
            url: "/crosswords/game/daily?utm_source=wordle&utm_medium=referral&utm_campaign=wordle_nav",
            backgroundImage: "var(--daily)"
        }, {
            id: "mini",
            name: "The Mini",
            url: "/crosswords/game/mini?utm_source=wordle&utm_medium=referral&utm_campaign=wordle_nav",
            backgroundImage: "var(--mini)"
        }, {
            id: "gameplay-stories",
            name: "Gameplay Stories",
            url: "/column/wordplay?utm_source=wordle&utm_medium=referral&utm_campaign=wordle_nav"
        }, {
            id: "more-games",
            name: "More Games",
            url: "/puzzles?utm_source=wordle&utm_medium=referral&utm_campaign=wordle_nav"
        }].map((function(e) {
            return "\n    <a href=".concat(e.url, " id=").concat(e.id, '>\n      <div class="nav-item" style="--hover-color: var(--color-nav-hover)">\n        <span style="background-image: ').concat(e.backgroundImage, '; background-size: 20px;"class="nav-icon"></span>\n          ').concat(e.name, " \n      </div>\n    </a>\n    ")
        })).join(""),
        Ys = [{
            id: "nyt",
            name: "The New York Times",
            url: "https://www.nytimes.com/?utm_source=wordle&utm_medium=referral&utm_campaign=wordle_nav",
            backgroundImage: "var(--nyt)"
        }, {
            id: "cooking",
            name: "New York Times Cooking",
            url: "https://cooking.nytimes.com",
            backgroundImage: "var(--cooking)"
        }, {
            id: "wirecutter",
            name: "New York Times Wirecutter",
            url: "https://www.nytimes.com/wirecutter/?utm_source=wordle&utm_medium=referral&utm_campaign=wordle_nav",
            backgroundImage: "var(--wirecutter)"
        }, {
            id: "athletic",
            name: "The Athletic",
            url: "https://theathletic.com/?utm_source=wordle&utm_medium=referral&utm_campaign=wordle_nav",
            backgroundImage: "var(--athletic)"
        }].map((function(e) {
            return "\n    <a href=".concat(e.url, " id=").concat(e.id, '>\n      <div class="nav-item" style="--hover-color: var(--color-nav-hover)">\n        <span style="background-image: ').concat(e.backgroundImage, '; background-size: 20px;"class="nav-icon"></span>\n          ').concat(e.name, " \n      </div>\n    </a>\n    ")
        })).join("");
    Fs.innerHTML = "\n  <style>\n    .container {\n      display: flex;\n      flex-direction: column;\n      align-items: left;\n      justify-content: center;\n    }\n    h1 {\n      font-weight: 700;\n      font-size: 16px;\n      letter-spacing: 0.5px;\n      text-transform: uppercase;\n      text-align: center;\n      margin-bottom: 10px;\n    }\n\n    .nav-container {\n      flex: 1;\n    }\n\n    .nav-container .nav {\n      font-size: 36px;\n      font-weight: 400;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      text-align: center;\n      letter-spacing: 0.05em;\n      font-variant-numeric: proportional-nums;\n    }\n\n    .nav-container .label {\n      font-size: 12px;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      text-align: center;\n    }\n\n    .game-list, .nyt-list {\n        list-style: none;\n        color: var(--color-tone-1);\n        padding: unset;\n        margin: unset;\n    }\n\n    .nyt-list {\n      margin-top: 5px;\n      padding: 12px 0px;\n      border-top: 1px solid #DCDCDC;\n    }\n\n    .nav-item {\n        display: flex;\n        justify-content: left;\n        align-items: center;\n        height: 40px;\n        font-weight: 500;\n        font-family: 'nyt-franklin';\n        font-size: 16px;\n        line-height: 16px;\n        padding-left: 18px;\n    }\n\n    .nav-item:hover {\n        background-color: var(--hover-color);\n    }\n\n    .nav-icon {\n        padding-bottom: 2px;\n        content: '';\n        height: 20px;\n        width: 28px;\n        padding-right: 8px;\n        display: inline-block;\n        vertical-align: middle;\n        background-repeat: no-repeat;\n    }\n\n    #nav {\n      padding-bottom: 10px;\n    }\n\n    a {\n        text-decoration: none;\n        color: inherit;\n    }\n\n    .more-text {\n        font-family: 'nyt-franklin-700';\n        font-weight: 700;\n        text-transform: uppercase;\n        font-size: 12px;\n        line-height: 12px;\n        margin: 32px 0px 24px 0px;\n        padding-left: 18px;\n    }\n\n    .nav-header {\n        padding-top: 18px;\n        padding-left: 18px;\n    }\n\n    .privacy {\n      letter-spacing: .5px;\n      font-family: 'nyt-franklin';\n      position: absolute;\n      bottom: 0;\n      left: 0;\n      right: 0;\n      margin: 0px 25px 0px 17px;\n      padding: 12px 0px;\n      border-top: 1px solid #DCDCDC;\n      color: var(--color-tone-1);\n      font-size: 15px;\n      text-align: right;\n      display: flex;\n      justify-content: space-between;\n      align-items: flex-end;\n    }\n  </style>\n\n  <div class=\"container\">\n    <span class=\"nav-header\">\n        <nyt-icon></nyt-icon>\n    </span>\n    <span class=\"more-text\">More From New York Times Games</span>\n    <div class=\"game-list\">".concat(Ws, '</div>\n    <div class="nyt-list">').concat(Ys, '</div>\n    <div class="privacy">\n      <a href="https://www.nytimes.com/privacy/privacy-policy" onmouseover="this.style.textDecoration=\'underline\';" \n      onmouseout="this.style.textDecoration=\'none\';">\n        Privacy Policy\n      </a>\n    </div>\n  </div>\n');
    var Us = function(e) {
        r(t, e);
        var a = h(t);

        function t() {
            var e;
            return s(this, t), o(m(e = a.call(this)), "gameApp", void 0), e.attachShadow({
                mode: "open"
            }), e
        }
        return n(t, [{
            key: "connectedCallback",
            value: function() {
                this.shadowRoot.appendChild(Fs.content.cloneNode(!0))
            }
        }]), t
    }(u(HTMLElement));
    customElements.define("game-nav", Us);
    var Js = document.createElement("template");
    Js.innerHTML = "\n  <style>\n    .overlay-nav {\n      display: none;\n      position: absolute;\n      width: 100%;\n      height: 100%;\n      top: 0;\n      left: 0;\n      z-index: ".concat(3e3, ';\n      background-color: transparent;\n      justify-content: left;\n      align-items: unset;\n    }\n\n    :host([open]) .overlay-nav {\n      display: flex;\n    }\n\n    .content-nav {\n      position: relative;\n      border: 1px solid var(--color-tone-6);\n      background-color: var(--modal-content-bg);\n      color: var(--color-tone-1);\n      overflow-y: auto;\n      animation: SlideRight 200ms;\n      max-width: var(--game-max-width);\n      box-sizing: border-box;\n      width: 100%;\n      border-radius: 0px;\n      box-shadow: 3px 5px 5px rgba(0, 0, 0, 0.15);\n      max-height: calc(100% - var(--header-height) - 1px);\n      margin-top: calc(var(--header-height) + 1px);\n      padding: 0px;\n    }\n\n    @media (min-width: 415px) {\n      .content-nav {\n        width: 375px;\n      }\n    }\n\n    .content-nav.closing-nav {\n      animation: SlideLeft 200ms;\n    }\n\n    .close-icon-nav {\n      width: 24px;\n      height: 24px;\n      position: absolute;\n      top: 16px;\n      right: 16px;\n    }\n\n    game-icon {\n      position: fixed;\n      user-select: none;\n      cursor: pointer;\n    }\n\n    @keyframes SlideRight {\n      0% {\n        transform: translateX(-100px);\n        opacity: 0;\n      }\n      100% {\n        transform: translateX(0px);\n        opacity: 1;\n      }\n    }\n    @keyframes SlideLeft {\n      0% {\n        transform: translateX(0px);\n        opacity: 1;\n      }\n      90% {\n        opacity: 0;\n      }\n      100% {\n        opacity: 0;\n        transform: translateX(-200px);\n      }\n    }\n  </style>\n  <div class="overlay-nav">\n    <div class="content-nav">\n      <slot></slot>\n      <div class="close-icon-nav">\n        <game-icon icon="close"></game-icon>\n      </div>\n    </div>\n  </div>\n');
    var Xs = function(e) {
        r(t, e);
        var a = h(t);

        function t() {
            var e;
            return s(this, t), (e = a.call(this)).attachShadow({
                mode: "open"
            }), e
        }
        return n(t, [{
            key: "connectedCallback",
            value: function() {
                var e = this;
                this.shadowRoot.appendChild(Js.content.cloneNode(!0)), this.addEventListener("click", (function(a) {
                    e.shadowRoot.querySelector(".content-nav").classList.add("closing-nav")
                })), this.shadowRoot.addEventListener("animationend", (function(a) {
                    "SlideLeft" === a.animationName && (e.shadowRoot.querySelector(".content-nav").classList.remove("closing-nav"), e.removeChild(e.firstChild), e.removeAttribute("open"))
                }))
            }
        }]), t
    }(u(HTMLElement));
    customElements.define("game-nav-modal", Xs);
    var Zs = document.createElement("template");
    Zs.innerHTML = '\n  <style>\n    :host {\n    }\n    .container {\n      display: flex;\n      justify-content: space-between;\n    }\n    .switch {\n      height: 20px;\n      width: 32px;\n      vertical-align: middle;\n      /* not quite right */\n      background: var(--color-tone-3);\n      border-radius: 999px;\n      display: block;\n      position: relative;\n    }\n    .knob {\n      display: block;\n      position: absolute;\n      left: 2px;\n      top: 2px;\n      height: calc(100% - 4px);\n      width: 50%;\n      border-radius: 8px;\n      background: var(--white);\n      transform: translateX(0);\n      transition: transform 0.3s;\n    }\n    :host([checked]) .switch {\n      background: var(--color-correct);\n    }\n    :host([checked]) .knob {\n      transform: translateX(calc(100% - 4px));\n    }\n    :host([disabled]) .switch {\n      opacity: 0.5;\n    }\n  </style>\n  <div class="container">\n    <label><slot></slot></label>\n    <div class="switch">\n      <span class="knob"></div>\n    </div>\n  </div>\n';
    var Ks = function(e) {
        r(t, e);
        var a = h(t);

        function t() {
            var e;
            return s(this, t), (e = a.call(this)).attachShadow({
                mode: "open"
            }), e
        }
        return n(t, [{
            key: "connectedCallback",
            value: function() {
                var e = this;
                this.shadowRoot.appendChild(Zs.content.cloneNode(!0)), this.shadowRoot.querySelector(".container").addEventListener("click", (function(a) {
                    a.stopPropagation(), e.hasAttribute("checked") ? e.removeAttribute("checked") : e.setAttribute("checked", ""), e.dispatchEvent(new CustomEvent("game-switch-change", {
                        bubbles: !0,
                        composed: !0,
                        detail: {
                            name: e.getAttribute("name"),
                            checked: e.hasAttribute("checked"),
                            disabled: e.hasAttribute("disabled")
                        }
                    }))
                }))
            }
        }], [{
            key: "observedAttributes",
            get: function() {
                return ["checked"]
            }
        }]), t
    }(u(HTMLElement));
    customElements.define("game-switch", Ks);
    var Qs = document.createElement("template");
    Qs.innerHTML = '\n  <style>\n  .instructions {\n    font-size: 14px;\n    color: var(--color-tone-1)\n  }\n\n  .examples {\n    border-bottom: 1px solid var(--color-tone-4);\n    border-top: 1px solid var(--color-tone-4);\n  }\n\n  .example {\n    margin-top: 24px;\n    margin-bottom: 24px;\n  }\n\n  game-tile {\n    width: 40px;\n    height: 40px;\n  }\n\n  :host([page]) section {\n    padding: 16px;\n    padding-top: 0px;\n  }\n\n  </style>\n  <section>\n    <div class="instructions">\n      <p>Guess the <strong>WORDLE</strong> in six tries.</p>\n      <p>Each guess must be a valid five-letter word. Hit the enter button to submit.</p>\n      <p>After each guess, the color of the tiles will change to show how close your guess was to the word.</p>\n      <div class="examples">\n        <p><strong>Examples</strong></p>\n        <div class="example">\n          <div class="row">\n            <game-tile letter="w" evaluation="correct" reveal></game-tile>\n            <game-tile letter="e"></game-tile>\n            <game-tile letter="a"></game-tile>\n            <game-tile letter="r"></game-tile>\n            <game-tile letter="y"></game-tile>\n          </div>\n          <p>The letter <strong>W</strong> is in the word and in the correct spot.</p>\n        </div>\n        <div class="example">\n          <div class="row">\n            <game-tile letter="p"></game-tile>\n            <game-tile letter="i" evaluation="present" reveal></game-tile>\n            <game-tile letter="l"></game-tile>\n            <game-tile letter="l"></game-tile>\n            <game-tile letter="s"></game-tile>\n          </div>\n          <p>The letter <strong>I</strong> is in the word but in the wrong spot.</p>\n        </div>\n        <div class="example">\n          <div class="row">\n            <game-tile letter="v"></game-tile>\n            <game-tile letter="a"></game-tile>\n            <game-tile letter="g"></game-tile>\n            <game-tile letter="u" evaluation="absent" reveal></game-tile>\n            <game-tile letter="e"></game-tile>\n          </div>\n          <p>The letter <strong>U</strong> is not in the word in any spot.</p>\n        </div>\n      </div>\n      <p><strong>A new WORDLE will be available each day!<strong></p>\n    </div>\n  </section>\n';
    var et = function(e) {
        r(t, e);
        var a = h(t);

        function t() {
            var e;
            return s(this, t), (e = a.call(this)).attachShadow({
                mode: "open"
            }), e
        }
        return n(t, [{
            key: "connectedCallback",
            value: function() {
                this.shadowRoot.appendChild(Qs.content.cloneNode(!0))
            }
        }]), t
    }(u(HTMLElement));
    customElements.define("game-help", et);
    var at = document.createElement("template");
    at.innerHTML = "\n  <style>\n    .overlay {\n      display: none;\n      position: absolute;\n      width: 100%;\n      height: 100%;\n      top: 0;\n      left: 0;\n      justify-content: center;\n      background-color: var(--color-background);\n      animation: SlideIn 100ms linear;\n      z-index: ".concat(2e3, ';\n    }\n\n    :host([open]) .overlay {\n      display: flex;\n    }\n\n    .content {\n      position: relative;\n      color: var(--color-tone-1);\n      padding: 0 32px;\n      max-width: var(--game-max-width);\n      width: 100%;\n      overflow-y: auto;\n      height: 100%;\n      display: flex;\n      flex-direction: column;\n    }\n\n    .content-container {\n      height: 100%;\n    }\n\n    .overlay.closing {\n      animation: SlideOut 150ms linear;\n    }\n\n    header {\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      position: relative;\n    }\n\n    h1 {\n      font-weight: 700;\n      font-size: 16px;\n      letter-spacing: 0.5px;\n      text-transform: uppercase;\n      text-align: center;\n      margin-bottom: 10px;\n    }\n\n    game-icon {\n      position: absolute;\n      right: 0;\n      user-select: none;\n      cursor: pointer;\n    }\n\n    @media only screen and (min-device-width : 320px) and (max-device-width : 480px) {\n      .content {\n        max-width: 100%;\n        padding: 0;\n      }\n      game-icon {\n        padding: 0 16px;\n      }\n    }\n\n    @keyframes SlideIn {\n      0% {\n        transform: translateY(30px);\n        opacity: 0;\n      }\n      100% {\n        transform: translateY(0px);\n        opacity: 1;\n      }\n    }\n    @keyframes SlideOut {\n      0% {\n        transform: translateY(0px);\n        opacity: 1;\n      }\n      90% {\n        opacity: 0;\n      }\n      100% {\n        opacity: 0;\n        transform: translateY(60px);\n      }\n    }\n  </style>\n  <div class="overlay">\n    <div class="content">\n      <header>\n        <h1><slot></slot></h1>\n        <game-icon icon="close"></game-icon>\n      </header>\n      <div class="content-container">\n        <slot name="content"></slot>\n      </div>\n    </div>\n  </div>\n');
    var st = function(e) {
        r(t, e);
        var a = h(t);

        function t() {
            var e;
            return s(this, t), (e = a.call(this)).attachShadow({
                mode: "open"
            }), e
        }
        return n(t, [{
            key: "connectedCallback",
            value: function() {
                var e = this;
                this.shadowRoot.appendChild(at.content.cloneNode(!0)), this.shadowRoot.querySelector("game-icon").addEventListener("click", (function(a) {
                    e.shadowRoot.querySelector(".overlay").classList.add("closing")
                })), this.shadowRoot.addEventListener("animationend", (function(a) {
                    "SlideOut" === a.animationName && (e.shadowRoot.querySelector(".overlay").classList.remove("closing"), Array.from(e.childNodes).forEach((function(a) {
                        e.removeChild(a)
                    })), e.removeAttribute("open"))
                }))
            }
        }]), t
    }(u(HTMLElement));
    customElements.define("game-page", st);
    var tt = document.createElement("template");
    tt.innerHTML = '\n  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">\n    <path fill=var(--color-tone-1) />\n  </svg>\n';
    var nt = {
            help: "M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z",
            settings: "M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z",
            backspace: "M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z",
            close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
            share: "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z",
            statistics: "M16,11V3H8v6H2v12h20V11H16z M10,5h4v14h-4V5z M4,11h4v8H4V11z M20,19h-4v-6h4V19z"
        },
        ot = function(e) {
            r(t, e);
            var a = h(t);

            function t() {
                var e;
                return s(this, t), (e = a.call(this)).attachShadow({
                    mode: "open"
                }), e
            }
            return n(t, [{
                key: "connectedCallback",
                value: function() {
                    this.shadowRoot.appendChild(tt.content.cloneNode(!0));
                    var e = this.getAttribute("icon");
                    this.shadowRoot.querySelector("path").setAttribute("d", nt[e]), "backspace" === e && this.shadowRoot.querySelector("path").setAttribute("fill", "var(--color-tone-1)"), "share" === e && this.shadowRoot.querySelector("path").setAttribute("fill", "var(--white)")
                }
            }]), t
        }(u(HTMLElement));
    customElements.define("game-icon", ot);
    var rt = document.createElement("template");
    rt.innerHTML = '\n  <a href="https://www.nytimes.com/crosswords">\n  <svg\n    className="pz-nav__logo"\n    width="95"\n    height="18"\n    viewBox="0 0 138 25"\n    fill="none"\n    xmlns="http://www.w3.org/2000/svg"\n    aria-label="New York Times Games Logo. Click for more puzzles"\n  >\n    <rect width="138" height="25" fill="none" />\n    <path\n      d="M42.4599 1.03519C44.219 1.00558 45.9577 1.41634 47.5176 2.23008V1.45245H53.4162V8.80515H47.5239C47.1067 7.03494 46.3607 6.2257 44.5904 6.2257C42.365 6.23834 41.0058 7.86947 41.0058 12.4151C41.0058 17.3148 42.2386 18.8827 45.0077 18.8827C45.7187 18.8975 46.4203 18.7183 47.0371 18.3643V16.2211H45.2037V11.9283H53.4225V24.0543H48.3648V22.9289C46.902 24.0012 45.1195 24.5471 43.307 24.4778C36.9216 24.4778 32.4392 20.2546 32.4392 12.4214C32.4708 5.2584 36.9849 1.03519 42.4599 1.03519Z"\n      fill=var(--color-tone-1)\n    />\n    <path\n      d="M59.8645 24.3471C56.3494 24.3471 54.2883 22.4505 54.2883 19.2198C54.2883 15.9892 56.7097 13.9345 60.541 13.9345C61.9923 13.9222 63.4232 14.2767 64.701 14.965C64.6377 13.2264 63.3164 12.0947 60.8634 12.0947C59.0925 12.1015 57.3477 12.5215 55.7677 13.3212V9.25608C58.149 8.58084 60.6136 8.24457 63.0888 8.25718C69.7966 8.25718 72.0853 11.1907 72.0853 13.7701V19.8647H73.4382V24.0563H64.7705V22.5074C63.544 23.8603 61.7359 24.3471 59.8645 24.3471ZM64.859 18.8658C64.888 18.6431 64.8655 18.4166 64.7931 18.204C64.7207 17.9914 64.6005 17.7982 64.4417 17.6394C64.2829 17.4805 64.0897 17.3603 63.877 17.288C63.6644 17.2156 63.438 17.193 63.2153 17.222C62.1215 17.222 61.3755 17.7721 61.3755 18.8974C61.3755 20.0228 62.0077 20.478 63.1836 20.478C64.3596 20.478 64.8653 19.9911 64.8653 18.8848L64.859 18.8658Z"\n      fill=var(--color-tone-1)\n    />\n    <path\n      d="M75.8371 19.8644V12.7709H74.5726V8.57927H83.1455V10.2546C85.1433 8.73732 86.2055 8.25684 87.786 8.25684C89.7206 8.25684 90.8839 8.80687 92.3949 10.3874C94.3611 8.83848 95.7456 8.25684 97.4526 8.25684C100.614 8.25684 102.801 10.419 102.801 13.2197V19.858H104.066V24.0496H95.5054V14.6739C95.5054 13.4473 95.0249 12.7772 94.1841 12.7772C93.3432 12.7772 92.9576 13.4094 92.9576 14.6739V19.8644H94.0513V24.056H85.6681V14.6106C85.6681 13.5169 85.1497 12.7709 84.4036 12.7709C83.6576 12.7709 83.1392 13.479 83.1392 14.6106V19.8644H84.2646V24.056H74.5474V19.8644H75.8371Z"\n      fill=var(--color-tone-1)\n    />\n    <path\n      d="M113.781 24.3784C111.46 24.3784 108.881 23.8979 107.073 22.2858C106.216 21.5344 105.534 20.6058 105.072 19.5643C104.61 18.5229 104.38 17.3935 104.398 16.2544C104.398 11.1967 108.432 8.25684 113.25 8.25684C118.453 8.25684 121.924 11.93 121.924 16.3555C121.924 16.874 121.892 17.3545 121.86 17.8729H111.745C111.941 19.681 112.908 20.4839 114.387 20.4839C114.871 20.4803 115.347 20.3544 115.769 20.1178C116.191 19.8813 116.547 19.5418 116.803 19.131H121.86C120.773 22.6777 117.498 24.3784 113.781 24.3784ZM111.688 15.5273H115.481V15.1417C115.481 13.8204 115.159 12.4674 113.585 12.4674C113.201 12.4558 112.824 12.5691 112.51 12.7903C112.197 13.0115 111.964 13.3286 111.846 13.6939C111.68 14.2856 111.624 14.9028 111.682 15.5147L111.688 15.5273Z"\n      fill=var(--color-tone-1)\n    />\n    <path\n      d="M126.195 24.059H122.712V18.8875H126.164C126.581 20.2404 127.131 20.9485 128.452 20.9485C129.451 20.9485 130.064 20.5313 130.064 19.7536C130.064 19.2036 129.71 18.7863 129.034 18.4892L125.683 17.073C124.909 16.7631 124.246 16.2281 123.779 15.5371C123.313 14.8462 123.064 14.0312 123.066 13.1975C123.066 10.5549 125.677 8.23462 128.964 8.23462C130.352 8.25084 131.718 8.58156 132.96 9.20191V8.5697H136.469V13.4062H133.244C132.954 11.9584 132.372 11.244 131.215 11.244C130.374 11.244 129.729 11.6612 129.729 12.3377C129.729 12.9194 130.115 13.3998 130.924 13.7223L134.212 14.9867C136.374 15.8276 137.373 17.2121 137.373 19.0835C137.373 22.0486 134.844 24.3372 131.215 24.3372C129.603 24.3372 128.477 24.078 126.157 23.2435L126.195 24.059Z"\n      fill=var(--color-tone-1)\n    />\n    <path\n      d="M25.9544 1.46704H25.3601V24.0372H25.9544V1.46704Z"\n      fill=var(--color-tone-1)\n    />\n    <path\n      d="M19.2574 15.4535C18.8889 16.497 18.3042 17.4509 17.5416 18.2527C16.7789 19.0546 15.8555 19.6863 14.8318 20.1066V15.4535L17.3607 13.1586L14.8318 10.8952V7.69619C15.8763 7.67489 16.8715 7.24792 17.6067 6.50567C18.3419 5.76342 18.7593 4.76418 18.7706 3.71953C18.7706 0.975708 16.1532 0.00209168 14.6675 0.00209168C14.2653 -0.0102783 13.8633 0.0322617 13.4726 0.128535V0.261301C13.6686 0.261301 13.9594 0.22969 14.0542 0.22969C15.0847 0.22969 15.8624 0.716498 15.8624 1.65218C15.8562 1.85411 15.809 2.05266 15.7235 2.23571C15.638 2.41875 15.5161 2.58244 15.3652 2.71677C15.2143 2.85109 15.0376 2.95323 14.8459 3.01695C14.6542 3.08066 14.4515 3.1046 14.2502 3.08732C11.7213 3.08732 8.693 1.01996 5.43075 1.01996C2.52255 1.00732 0.537385 3.17583 0.537385 5.36962C0.537385 7.56342 1.80182 8.24622 3.12316 8.7267L3.15477 8.60026C2.91743 8.45028 2.72511 8.23886 2.59822 7.98842C2.47133 7.73797 2.41459 7.45785 2.43404 7.17777C2.4493 6.92796 2.51386 6.68363 2.62398 6.45888C2.73411 6.23414 2.88763 6.03341 3.07569 5.86826C3.26375 5.70312 3.48264 5.57683 3.71973 5.49668C3.95683 5.41652 4.20745 5.38408 4.45714 5.40124C7.20096 5.40124 11.6265 7.69619 14.3766 7.69619H14.6359V10.9268L12.107 13.1586L14.6359 15.4535V20.1572C13.5788 20.533 12.4638 20.7192 11.342 20.7072C7.07452 20.7072 4.38759 18.1215 4.38759 13.8287C4.37897 12.8127 4.51955 11.8009 4.80486 10.8257L6.93543 9.88999V19.3733L11.2661 17.4766V7.75941L4.88072 10.6044C5.17861 9.73458 5.646 8.93247 6.25588 8.24446C6.86575 7.55645 7.606 6.99621 8.43379 6.59613L8.40218 6.5013C4.13471 7.43698 0 10.6739 0 15.5167C0 21.1055 4.71635 25 10.2103 25C16.0267 25 19.3206 21.1245 19.3522 15.4725L19.2574 15.4535Z"\n      fill=var(--color-tone-1)\n    />\n  </svg>\n  </a>\n';
    var it = function(e) {
        r(t, e);
        var a = h(t);

        function t() {
            var e;
            return s(this, t), (e = a.call(this)).attachShadow({
                mode: "open"
            }), e
        }
        return n(t, [{
            key: "connectedCallback",
            value: function() {
                this.shadowRoot.appendChild(rt.content.cloneNode(!0))
            }
        }]), t
    }(u(HTMLElement));
    customElements.define("nyt-icon", it);
    var lt = document.createElement("template");
    lt.innerHTML = '\n<svg width="24" height="17" viewBox="0 0 24 17" fill="none" xmlns="http://www.w3.org/2000/svg">\n    <rect x="0.172974" width="20" height="3" rx="1.5" fill=var(--color-tone-1) />\n    <rect x="0.172974" y="7" width="20" height="3" rx="1.5" fill=var(--color-tone-1) />\n    <rect x="0.172974" y="14" width="20" height="3" rx="1.5" fill=var(--color-tone-1) />\n</svg>\n';
    var dt = function(e) {
        r(t, e);
        var a = h(t);

        function t() {
            var e;
            return s(this, t), (e = a.call(this)).attachShadow({
                mode: "open"
            }), e
        }
        return n(t, [{
            key: "connectedCallback",
            value: function() {
                this.shadowRoot.appendChild(lt.content.cloneNode(!0))
            }
        }]), t
    }(u(HTMLElement));
    customElements.define("nav-icon", dt);
    var ct = document.createElement("template");
    ct.innerHTML = '\n  <div id="timer"></div>\n';
    var ut = 6e4,
        mt = 36e5,
        pt = function(e) {
            r(t, e);
            var a = h(t);

            function t() {
                var e;
                s(this, t), o(m(e = a.call(this)), "targetEpochMS", void 0), o(m(e), "intervalId", void 0), o(m(e), "$timer", void 0), e.attachShadow({
                    mode: "open"
                });
                var n = new Date;
                return n.setDate(n.getDate() + 1), n.setHours(0, 0, 0, 0), e.targetEpochMS = n.getTime(), e
            }
            return n(t, [{
                key: "padDigit",
                value: function(e) {
                    return e.toString().padStart(2, "0")
                }
            }, {
                key: "updateTimer",
                value: function() {
                    var e, a = (new Date).getTime(),
                        s = Math.floor(this.targetEpochMS - a);
                    if (s <= 0) e = "00:00:00";
                    else {
                        var t = Math.floor(s % 864e5 / mt),
                            n = Math.floor(s % mt / ut),
                            o = Math.floor(s % ut / 1e3);
                        e = "".concat(this.padDigit(t), ":").concat(this.padDigit(n), ":").concat(this.padDigit(o))
                    }
                    this.$timer.textContent = e
                }
            }, {
                key: "connectedCallback",
                value: function() {
                    var e = this;
                    this.shadowRoot.appendChild(ct.content.cloneNode(!0)), this.$timer = this.shadowRoot.querySelector("#timer"), this.intervalId = setInterval((function() {
                        e.updateTimer()
                    }), 200)
                }
            }, {
                key: "disconnectedCallback",
                value: function() {
                    clearInterval(this.intervalId)
                }
            }]), t
        }(u(HTMLElement));
    return customElements.define("countdown-timer", pt), e.CountdownTimer = pt, e.GameApp = ms, e.GameHelp = et, e.GameIcon = ot, e.GameKeyboard = ks, e.GameModal = hs, e.GameNav = Us, e.GamePage = st, e.GameRow = x, e.GameSettings = Ta, e.GameStats = Vs, e.GameSwitch = Ks, e.GameThemeManager = C, e.GameTile = v, e.GameToast = Ia, e.NYTIcon = it, e.NavIcon = dt, e.NavModal = Xs, Object.defineProperty(e, "__esModule", {
        value: !0
    }), e
}({});
}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./app":4}],8:[function(require,module,exports){
module.exports = {
    GetRawWords: RawWords = ["cigar","rebut","sissy","humph","awake","blush","focal","evade","naval","serve","heath","dwarf","model","karma","stink",
        "grade","quiet","bench","abate","feign","major","death","fresh","crust","stool","colon","abase","marry","react","batty","pride",
        "floss","helix","croak","staff","paper","unfed","whelp","trawl","outdo","adobe","crazy","sower","repay","digit","crate","cluck",
        "spike","mimic","pound","maxim","linen","unmet","flesh","booby","forth","first","stand","belly","ivory","seedy","print","yearn",
        "drain","bribe","stout","panel","crass","flume","offal","agree","error","swirl","argue","bleed","delta","flick","totem","wooer",
        "front","shrub","parry","biome","lapel","start","greet","goner","golem","lusty","loopy","round","audit","lying","gamma","labor",
        "islet","civic","forge","corny","moult","basic","salad","agate","spicy","spray","essay","fjord","spend","kebab","guild","aback",
        "motor","alone","hatch","hyper","thumb","dowry","ought","belch","dutch","pilot","tweed","comet","jaunt","enema","steed","abyss",
        "growl","fling","dozen","boozy","erode","world","gouge","click","briar","great","altar","pulpy","blurt","coast","duchy","groin",
        "fixer","group","rogue","badly","smart","pithy","gaudy","chill","heron","vodka","finer","surer","radio","rouge","perch","retch",
        "wrote","clock","tilde","store","prove","bring","solve","cheat","grime","exult","usher","epoch","triad","break","rhino","viral",
        "conic","masse","sonic","vital","trace","using","peach","champ","baton","brake","pluck","craze","gripe","weary","picky","acute",
        "ferry","aside","tapir","troll","unify","rebus","boost","truss","siege","tiger","banal","slump","crank","gorge","query","drink",
        "favor","abbey","tangy","panic","solar","shire","proxy","point","robot","prick","wince","crimp","knoll","sugar","whack","mount",
        "perky","could","wrung","light","those","moist","shard","pleat","aloft","skill","elder","frame","humor","pause","ulcer","ultra",
        "robin","cynic","aroma","caulk","shake","dodge","swill","tacit","other","thorn","trove","bloke","vivid","spill","chant","choke",
        "rupee","nasty","mourn","ahead","brine","cloth","hoard","sweet","month","lapse","watch","today","focus","smelt","tease","cater",
        "movie","saute","allow","renew","their","slosh","purge","chest","depot","epoxy","nymph","found","shall","harry","stove","lowly",
        "snout","trope","fewer","shawl","natal","comma","foray","scare","stair","black","squad","royal","chunk","mince","shame","cheek",
        "ample","flair","foyer","cargo","oxide","plant","olive","inert","askew","heist","shown","zesty","hasty","trash","fella","larva",
        "forgo","story","hairy","train","homer","badge","midst","canny","fetus","butch","farce","slung","tipsy","metal","yield","delve",
        "being","scour","glass","gamer","scrap","money","hinge","album","vouch","asset","tiara","crept","bayou","atoll","manor","creak",
        "showy","phase","froth","depth","gloom","flood","trait","girth","piety","payer","goose","float","donor","atone","primo","apron",
        "blown","cacao","loser","input","gloat","awful","brink","smite","beady","rusty","retro","droll","gawky","hutch","pinto","gaily",
        "egret","lilac","sever","field","fluff","hydro","flack","agape","voice","stead","stalk","berth","madam","night","bland","liver",
        "wedge","augur","roomy","wacky","flock","angry","bobby","trite","aphid","tryst","midge","power","elope","cinch","motto","stomp",
        "upset","bluff","cramp","quart","coyly","youth","rhyme","buggy","alien","smear","unfit","patty","cling","glean","label","hunky",
        "khaki","poker","gruel","twice","twang","shrug","treat","unlit","waste","merit","woven","octal","needy","clown","widow","irony",
        "ruder","gauze","chief","onset","prize","fungi","charm","gully","inter","whoop","taunt","leery","class","theme","lofty","tibia",
        "booze","alpha","thyme","eclat","doubt","parer","chute","stick","trice","alike","sooth","recap","saint","liege","glory","grate",
        "admit","brisk","soggy","usurp","scald","scorn","leave","twine","sting","bough","marsh","sloth","dandy","vigor","howdy","enjoy",
        "valid","ionic","equal","unset","floor","catch","spade","stein","exist","quirk","denim","grove","spiel","mummy","fault","foggy",
        "flout","carry","sneak","libel","waltz","aptly","piney","inept","aloud","photo","dream","stale","vomit","ombre","fanny","unite",
        "snarl","baker","there","glyph","pooch","hippy","spell","folly","louse","gulch","vault","godly","threw","fleet","grave","inane",
        "shock","crave","spite","valve","skimp","claim","rainy","musty","pique","daddy","quasi","arise","aging","valet","opium","avert",
        "stuck","recut","mulch","genre","plume","rifle","count","incur","total","wrest","mocha","deter","study","lover","safer","rivet",
        "funny","smoke","mound","undue","sedan","pagan","swine","guile","gusty","equip","tough","canoe","chaos","covet","human","udder",
        "lunch","blast","stray","manga","melee","lefty","quick","paste","given","octet","risen","groan","leaky","grind","carve","loose",
        "sadly","spilt","apple","slack","honey","final","sheen","eerie","minty","slick","derby","wharf","spelt","coach","erupt","singe",
        "price","spawn","fairy","jiffy","filmy","stack","chose","sleep","ardor","nanny","niece","woozy","handy","grace","ditto","stank",
        "cream","usual","diode","valor","angle","ninja","muddy","chase","reply","prone","spoil","heart","shade","diner","arson","onion",
        "sleet","dowel","couch","palsy","bowel","smile","evoke","creek","lance","eagle","idiot","siren","built","embed","award","dross",
        "annul","goody","frown","patio","laden","humid","elite","lymph","edify","might","reset","visit","gusto","purse","vapor","crock",
        "write","sunny","loath","chaff","slide","queer","venom","stamp","sorry","still","acorn","aping","pushy","tamer","hater","mania",
        "awoke","brawn","swift","exile","birch","lucky","freer","risky","ghost","plier","lunar","winch","snare","nurse","house","borax",
        "nicer","lurch","exalt","about","savvy","toxin","tunic","pried","inlay","chump","lanky","cress","eater","elude","cycle","kitty",
        "boule","moron","tenet","place","lobby","plush","vigil","index","blink","clung","qualm","croup","clink","juicy","stage","decay",
        "nerve","flier","shaft","crook","clean","china","ridge","vowel","gnome","snuck","icing","spiny","rigor","snail","flown","rabid",
        "prose","thank","poppy","budge","fiber","moldy","dowdy","kneel","track","caddy","quell","dumpy","paler","swore","rebar","scuba",
        "splat","flyer","horny","mason","doing","ozone","amply","molar","ovary","beset","queue","cliff","magic","truce","sport","fritz",
        "edict","twirl","verse","llama","eaten","range","whisk","hovel","rehab","macaw","sigma","spout","verve","sushi","dying","fetid",
        "brain","buddy","thump","scion","candy","chord","basin","march","crowd","arbor","gayly","musky","stain","dally","bless","bravo",
        "stung","title","ruler","kiosk","blond","ennui","layer","fluid","tatty","score","cutie","zebra","barge","matey","bluer","aider",
        "shook","river","privy","betel","frisk","bongo","begun","azure","weave","genie","sound","glove","braid","scope","wryly","rover",
        "assay","ocean","bloom","irate","later","woken","silky","wreck","dwelt","slate","smack","solid","amaze","hazel","wrist","jolly",
        "globe","flint","rouse","civil","vista","relax","cover","alive","beech","jetty","bliss","vocal","often","dolly","eight","joker",
        "since","event","ensue","shunt","diver","poser","worst","sweep","alley","creed","anime","leafy","bosom","dunce","stare","pudgy",
        "waive","choir","stood","spoke","outgo","delay","bilge","ideal","clasp","seize","hotly","laugh","sieve","block","meant","grape",
        "noose","hardy","shied","drawl","daisy","putty","strut","burnt","tulip","crick","idyll","vixen","furor","geeky","cough","naive",
        "shoal","stork","bathe","aunty","check","prime","brass","outer","furry","razor","elect","evict","imply","demur","quota","haven",
        "cavil","swear","crump","dough","gavel","wagon","salon","nudge","harem","pitch","sworn","pupil","excel","stony","cabin","unzip",
        "queen","trout","polyp","earth","storm","until","taper","enter","child","adopt","minor","fatty","husky","brave","filet","slime",
        "glint","tread","steal","regal","guest","every","murky","share","spore","hoist","buxom","inner","otter","dimly","level","sumac",
        "donut","stilt","arena","sheet","scrub","fancy","slimy","pearl","silly","porch","dingo","sepia","amble","shady","bread","friar",
        "reign","dairy","quill","cross","brood","tuber","shear","posit","blank","villa","shank","piggy","freak","which","among","fecal",
        "shell","would","algae","large","rabbi","agony","amuse","bushy","copse","swoon","knife","pouch","ascot","plane","crown","urban",
        "snide","relay","abide","viola","rajah","straw","dilly","crash","amass","third","trick","tutor","woody","blurb","grief","disco",
        "where","sassy","beach","sauna","comic","clued","creep","caste","graze","snuff","frock","gonad","drunk","prong","lurid","steel",
        "halve","buyer","vinyl","utile","smell","adage","worry","tasty","local","trade","finch","ashen","modal","gaunt","clove","enact",
        "adorn","roast","speck","sheik","missy","grunt","snoop","party","touch","mafia","emcee","array","south","vapid","jelly","skulk",
        "angst","tubal","lower","crest","sweat","cyber","adore","tardy","swami","notch","groom","roach","hitch","young","align","ready",
        "frond","strap","puree","realm","venue","swarm","offer","seven","dryer","diary","dryly","drank","acrid","heady","theta","junto",
        "pixie","quoth","bonus","shalt","penne","amend","datum","build","piano","shelf","lodge","suing","rearm","coral","ramen","worth",
        "psalm","infer","overt","mayor","ovoid","glide","usage","poise","randy","chuck","prank","fishy","tooth","ether","drove","idler",
        "swath","stint","while","begat","apply","slang","tarot","radar","credo","aware","canon","shift","timer","bylaw","serum","three",
        "steak","iliac","shirk","blunt","puppy","penal","joist","bunny","shape","beget","wheel","adept","stunt","stole","topaz","chore",
        "fluke","afoot","bloat","bully","dense","caper","sneer","boxer","jumbo","lunge","space","avail","short","slurp","loyal","flirt",
        "pizza","conch","tempo","droop","plate","bible","plunk","afoul","savoy","steep","agile","stake","dwell","knave","beard","arose",
        "motif","smash","broil","glare","shove","baggy","mammy","swamp","along","rugby","wager","quack","squat","snaky","debit","mange",
        "skate","ninth","joust","tramp","spurn","medal","micro","rebel","flank","learn","nadir","maple","comfy","remit","gruff","ester",
        "least","mogul","fetch","cause","oaken","aglow","meaty","gaffe","shyly","racer","prowl","thief","stern","poesy","rocky","tweet",
        "waist","spire","grope","havoc","patsy","truly","forty","deity","uncle","swish","giver","preen","bevel","lemur","draft","slope",
        "annoy","lingo","bleak","ditty","curly","cedar","dirge","grown","horde","drool","shuck","crypt","cumin","stock","gravy","locus",
        "wider","breed","quite","chafe","cache","blimp","deign","fiend","logic","cheap","elide","rigid","false","renal","pence","rowdy",
        "shoot","blaze","envoy","posse","brief","never","abort","mouse","mucky","sulky","fiery","media","trunk","yeast","clear","skunk",
        "scalp","bitty","cider","koala","duvet","segue","creme","super","grill","after","owner","ember","reach","nobly","empty","speed",
        "gipsy","recur","smock","dread","merge","burst","kappa","amity","shaky","hover","carol","snort","synod","faint","haunt","flour",
        "chair","detox","shrew","tense","plied","quark","burly","novel","waxen","stoic","jerky","blitz","beefy","lyric","hussy","towel",
        "quilt","below","bingo","wispy","brash","scone","toast","easel","saucy","value","spice","honor","route","sharp","bawdy","radii",
        "skull","phony","issue","lager","swell","urine","gassy","trial","flora","upper","latch","wight","brick","retry","holly","decal",
        "grass","shack","dogma","mover","defer","sober","optic","crier","vying","nomad","flute","hippo","shark","drier","obese","bugle",
        "tawny","chalk","feast","ruddy","pedal","scarf","cruel","bleat","tidal","slush","semen","windy","dusty","sally","igloo","nerdy",
        "jewel","shone","whale","hymen","abuse","fugue","elbow","crumb","pansy","welsh","syrup","terse","suave","gamut","swung","drake",
        "freed","afire","shirt","grout","oddly","tithe","plaid","dummy","broom","blind","torch","enemy","again","tying","pesky","alter",
        "gazer","noble","ethos","bride","extol","decor","hobby","beast","idiom","utter","these","sixth","alarm","erase","elegy","spunk",
        "piper","scaly","scold","hefty","chick","sooty","canal","whiny","slash","quake","joint","swept","prude","heavy","wield","femme",
        "lasso","maize","shale","screw","spree","smoky","whiff","scent","glade","spent","prism","stoke","riper","orbit","cocoa","guilt",
        "humus","shush","table","smirk","wrong","noisy","alert","shiny","elate","resin","whole","hunch","pixel","polar","hotel","sword",
        "cleat","mango","rumba","puffy","filly","billy","leash","clout","dance","ovate","facet","chili","paint","liner","curio","salty",
        "audio","snake","fable","cloak","navel","spurt","pesto","balmy","flash","unwed","early","churn","weedy","stump","lease","witty",
        "wimpy","spoof","saner","blend","salsa","thick","warty","manic","blare","squib","spoon","probe","crepe","knack","force","debut",
        "order","haste","teeth","agent","widen","icily","slice","ingot","clash","juror","blood","abode","throw","unity","pivot","slept",
        "troop","spare","sewer","parse","morph","cacti","tacky","spool","demon","moody","annex","begin","fuzzy","patch","water","lumpy",
        "admin","omega","limit","tabby","macho","aisle","skiff","basis","plank","verge","botch","crawl","lousy","slain","cubic","raise",
        "wrack","guide","foist","cameo","under","actor","revue","fraud","harpy","scoop","climb","refer","olden","clerk","debar","tally",
        "ethic","cairn","tulle","ghoul","hilly","crude","apart","scale","older","plain","sperm","briny","abbot","rerun","quest","crisp",
        "bound","befit","drawn","suite","itchy","cheer","bagel","guess","broad","axiom","chard","caput","leant","harsh","curse","proud",
        "swing","opine","taste","lupus","gumbo","miner","green","chasm","lipid","topic","armor","brush","crane","mural","abled","habit",
        "bossy","maker","dusky","dizzy","lithe","brook","jazzy","fifty","sense","giant","surly","legal","fatal","flunk","began","prune",
        "small","slant","scoff","torus","ninny","covey","viper","taken","moral","vogue","owing","token","entry","booth","voter","chide",
        "elfin","ebony","neigh","minim","melon","kneed","decoy","voila","ankle","arrow","mushy","tribe","cease","eager","birth","graph",
        "odder","terra","weird","tried","clack","color","rough","weigh","uncut","ladle","strip","craft","minus","dicey","titan","lucid",
        "vicar","dress","ditch","gypsy","pasta","taffy","flame","swoop","aloof","sight","broke","teary","chart","sixty","wordy","sheer",
        "leper","nosey","bulge","savor","clamp","funky","foamy","toxic","brand","plumb","dingy","butte","drill","tripe","bicep","tenor",
        "krill","worse","drama","hyena","think","ratio","cobra","basil","scrum","bused","phone","court","camel","proof","heard","angel",
        "petal","pouty","throb","maybe","fetal","sprig","spine","shout","cadet","macro","dodgy","satyr","rarer","binge","trend","nutty",
        "leapt","amiss","split","myrrh","width","sonar","tower","baron","fever","waver","spark","belie","sloop","expel","smote","baler",
        "above","north","wafer","scant","frill","awash","snack","scowl","frail","drift","limbo","fence","motel","ounce","wreak","revel",
        "talon","prior","knelt","cello","flake","debug","anode","crime","salve","scout","imbue","pinky","stave","vague","chock","fight",
        "video","stone","teach","cleft","frost","prawn","booty","twist","apnea","stiff","plaza","ledge","tweak","board","grant","medic",
        "bacon","cable","brawl","slunk","raspy","forum","drone","women","mucus","boast","toddy","coven","tumor","truer","wrath","stall",
        "steam","axial","purer","daily","trail","niche","mealy","juice","nylon","plump","merry","flail","papal","wheat","berry","cower",
        "erect","brute","leggy","snipe","sinew","skier","penny","jumpy","rally","umbra","scary","modem","gross","avian","greed","satin",
        "tonic","parka","sniff","livid","stark","trump","giddy","reuse","taboo","avoid","quote","devil","liken","gloss","gayer","beret",
        "noise","gland","dealt","sling","rumor","opera","thigh","tonga","flare","wound","white","bulky","etude","horse","circa","paddy",
        "inbox","fizzy","grain","exert","surge","gleam","belle","salvo","crush","fruit","sappy","taker","tract","ovine","spiky","frank",
        "reedy","filth","spasm","heave","mambo","right","clank","trust","lumen","borne","spook","sauce","amber","lathe","carat","corer",
        "dirty","slyly","affix","alloy","taint","sheep","kinky","wooly","mauve","flung","yacht","fried","quail","brunt","grimy","curvy",
        "cagey","rinse","deuce","state","grasp","milky","bison","graft","sandy","baste","flask","hedge","girly","swash","boney","coupe",
        "endow","abhor","welch","blade","tight","geese","miser","mirth","cloud","cabal","leech","close","tenth","pecan","droit","grail",
        "clone","guise","ralph","tango","biddy","smith","mower","payee","serif","drape","fifth","spank","glaze","allot","truck","kayak",
        "virus","testy","tepee","fully","zonal","metro","curry","grand","banjo","axion","bezel","occur","chain","nasal","gooey","filer",
        "brace","allay","pubic","raven","plead","gnash","flaky","munch","dully","eking","thing","slink","hurry","theft","shorn","pygmy",
        "ranch","wring","lemon","shore","mamma","froze","newer","style","moose","antic","drown","vegan","chess","guppy","union","lever",
        "lorry","image","cabby","druid","exact","truth","dopey","spear","cried","chime","crony","stunk","timid","batch","gauge","rotor",
        "crack","curve","latte","witch","bunch","repel","anvil","soapy","meter","broth","madly","dried","scene","known","magma","roost",
        "woman","thong","punch","pasty","downy","knead","whirl","rapid","clang","anger","drive","goofy","email","music","stuff","bleep",
        "rider","mecca","folio","setup","verso","quash","fauna","gummy","happy","newly","fussy","relic","guava","ratty","fudge","femur",
        "chirp","forte","alibi","whine","petty","golly","plait","fleck","felon","gourd","brown","thrum","ficus","stash","decry","wiser",
        "junta","visor","daunt","scree","impel","await","press","whose","turbo","stoop","speak","mangy","eying","inlet","crone","pulse",
        "mossy","staid","hence","pinch","teddy","sully","snore","ripen","snowy","attic","going","leach","mouth","hound","clump","tonal",
        "bigot","peril","piece","blame","haute","spied","undid","intro","basal","shine","gecko","rodeo","guard","steer","loamy","scamp",
        "scram","manly","hello","vaunt","organ","feral","knock","extra","condo","adapt","willy","polka","rayon","skirt","faith","torso",
        "match","mercy","tepid","sleek","riser","twixt","peace","flush","catty","login","eject","roger","rival","untie","refit","aorta",
        "adult","judge","rower","artsy","rural","shave"],
    GetSortedRawWords: sortedRawWords = ["later",
    "alter",
    "alert",
    "arose",
    "irate",
    "stare",
    "arise",
    "raise",
    "learn",
    "renal",
    "snare",
    "saner",
    "stale",
    "slate",
    "steal",
    "least",
    "react",
    "crate",
    "trace",
    "cater",
    "clear",
    "store",
    "loser",
    "atone",
    "aisle",
    "teary",
    "adore",
    "alone",
    "scare",
    "layer",
    "relay",
    "early",
    "tread",
    "trade",
    "leant",
    "opera",
    "heart",
    "hater",
    "earth",
    "taper",
    "paler",
    "pearl",
    "tenor",
    "aider",
    "alien",
    "share",
    "shear",
    "crane",
    "tamer",
    "great",
    "grate",
    "spare",
    "parse",
    "spear",
    "realm",
    "regal",
    "large",
    "glare",
    "lager",
    "eclat",
    "cleat",
    "snore",
    "yearn",
    "inert",
    "inter",
    "blare",
    "baler",
    "stern",
    "stole",
    "smear",
    "liner",
    "caste",
    "outer",
    "route",
    "saute",
    "scale",
    "after",
    "flare",
    "feral",
    "delta",
    "dealt",
    "taker",
    "risen",
    "siren",
    "resin",
    "rinse",
    "lathe",
    "yeast",
    "water",
    "ratio",
    "score",
    "roast",
    "pleat",
    "plate",
    "petal",
    "leapt",
    "rouse",
    "islet",
    "solar",
    "canoe",
    "ocean",
    "trice",
    "afire",
    "safer",
    "crest",
    "other",
    "stead",
    "ramen",
    "haste",
    "older",
    "relic",
    "trial",
    "trail",
    "range",
    "anger",
    "ideal",
    "avert",
    "enact",
    "shale",
    "leash",
    "trope",
    "cedar",
    "lance",
    "clean",
    "paste",
    "metal",
    "swear",
    "reach",
    "lapse",
    "onset",
    "stone",
    "recap",
    "caper",
    "stair",
    "aside",
    "horse",
    "shore",
    "bleat",
    "table",
    "crone",
    "metro",
    "anode",
    "ready",
    "tried",
    "steam",
    "inlet",
    "their",
    "prose",
    "poser",
    "spore",
    "stage",
    "sepia",
    "email",
    "idler",
    "agile",
    "noise",
    "cream",
    "repay",
    "payer",
    "tripe",
    "grace",
    "laden",
    "beast",
    "heard",
    "baste",
    "fetal",
    "argue",
    "plier",
    "peril",
    "acute",
    "stein",
    "extra",
    "arson",
    "sonar",
    "drape",
    "panel",
    "plane",
    "penal",
    "brace",
    "relax",
    "entry",
    "shire",
    "drone",
    "nicer",
    "train",
    "merit",
    "timer",
    "remit",
    "close",
    "heron",
    "sedan",
    "ovate",
    "forte",
    "tiger",
    "urine",
    "gayer",
    "nurse",
    "louse",
    "ashen",
    "treat",
    "eater",
    "feast",
    "terra",
    "spire",
    "snarl",
    "actor",
    "sober",
    "raven",
    "meant",
    "trend",
    "prone",
    "FALSE",
    "agent",
    "coral",
    "carol",
    "hotel",
    "cause",
    "sauce",
    "steak",
    "stake",
    "skate",
    "dream",
    "utile",
    "farce",
    "tribe",
    "grade",
    "harem",
    "glean",
    "angle",
    "angel",
    "wrote",
    "tower",
    "valet",
    "cadet",
    "alike",
    "recut",
    "truce",
    "cheat",
    "waste",
    "sweat",
    "teach",
    "lower",
    "decal",
    "creak",
    "haute",
    "ulcer",
    "cruel",
    "ultra",
    "leach",
    "miser",
    "grape",
    "bread",
    "beard",
    "debar",
    "erase",
    "rehab",
    "those",
    "ethos",
    "style",
    "royal",
    "anime",
    "goner",
    "diner",
    "suite",
    "trove",
    "place",
    "overt",
    "voter",
    "slice",
    "refit",
    "stave",
    "cameo",
    "lover",
    "credo",
    "decor",
    "clone",
    "talon",
    "tonal",
    "pesto",
    "motel",
    "alive",
    "sower",
    "rifle",
    "flier",
    "swore",
    "chore",
    "worse",
    "filer",
    "oaken",
    "salve",
    "tilde",
    "delay",
    "curse",
    "chase",
    "ripen",
    "borne",
    "slope",
    "lithe",
    "crave",
    "carve",
    "gamer",
    "weary",
    "write",
    "retch",
    "wrest",
    "taken",
    "death",
    "space",
    "camel",
    "spelt",
    "slept",
    "polar",
    "drake",
    "pause",
    "ankle",
    "verso",
    "scone",
    "amber",
    "crept",
    "smote",
    "serif",
    "stray",
    "satyr",
    "artsy",
    "barge",
    "adept",
    "radio",
    "erupt",
    "exalt",
    "poise",
    "miner",
    "salon",
    "heist",
    "reign",
    "pedal",
    "plead",
    "rivet",
    "slide",
    "cable",
    "arena",
    "scent",
    "skier",
    "matey",
    "meaty",
    "acorn",
    "unite",
    "untie",
    "unset",
    "liver",
    "cider",
    "olden",
    "cried",
    "triad",
    "spite",
    "slant",
    "mealy",
    "horde",
    "smelt",
    "wiser",
    "molar",
    "moral",
    "rogue",
    "rouge",
    "trash",
    "sneak",
    "snake",
    "amuse",
    "shade",
    "brine",
    "elate",
    "latte",
    "spiel",
    "usage",
    "usher",
    "octal",
    "nosey",
    "frame",
    "owner",
    "dance",
    "navel",
    "facet",
    "price",
    "tapir",
    "strap",
    "abort",
    "reply",
    "adobe",
    "spade",
    "abode",
    "medal",
    "maker",
    "lunar",
    "purse",
    "super",
    "phase",
    "fecal",
    "shape",
    "lemur",
    "glade",
    "towel",
    "intro",
    "rayon",
    "labor",
    "snort",
    "gruel",
    "abuse",
    "pecan",
    "craze",
    "since",
    "saint",
    "stain",
    "satin",
    "smite",
    "shone",
    "retro",
    "otter",
    "azure",
    "wager",
    "rebut",
    "tease",
    "ample",
    "asset",
    "snail",
    "tuber",
    "maple",
    "slain",
    "taste",
    "brute",
    "state",
    "bathe",
    "coast",
    "smile",
    "naive",
    "slime",
    "ascot",
    "finer",
    "infer",
    "abled",
    "blade",
    "break",
    "brake",
    "baker",
    "adorn",
    "opine",
    "stoke",
    "cairn",
    "bluer",
    "easel",
    "lease",
    "hyena",
    "melon",
    "crime",
    "lemon",
    "smart",
    "media",
    "force",
    "omega",
    "homer",
    "serum",
    "racer",
    "shame",
    "leafy",
    "filet",
    "surge",
    "cutie",
    "flora",
    "grail",
    "inept",
    "spent",
    "grave",
    "apron",
    "loath",
    "under",
    "pride",
    "leaky",
    "pried",
    "grope",
    "noble",
    "cower",
    "abide",
    "gleam",
    "rebus",
    "freak",
    "rainy",
    "value",
    "brave",
    "snide",
    "foyer",
    "stove",
    "prune",
    "clerk",
    "shine",
    "trite",
    "probe",
    "wafer",
    "reset",
    "begat",
    "ester",
    "terse",
    "steer",
    "berth",
    "olive",
    "solve",
    "amble",
    "nerdy",
    "blame",
    "wheat",
    "manor",
    "often",
    "chose",
    "torus",
    "salty",
    "trawl",
    "bagel",
    "drain",
    "groan",
    "nadir",
    "organ",
    "eaten",
    "cover",
    "spine",
    "wreak",
    "snipe",
    "house",
    "comet",
    "whale",
    "image",
    "felon",
    "ridge",
    "dirge",
    "shoal",
    "decay",
    "edict",
    "ounce",
    "flyer",
    "dread",
    "token",
    "valor",
    "patio",
    "scope",
    "copse",
    "suave",
    "ethic",
    "chest",
    "flair",
    "roach",
    "amend",
    "frail",
    "grant",
    "gloat",
    "tidal",
    "stark",
    "prime",
    "baron",
    "ombre",
    "sperm",
    "shalt",
    "gripe",
    "story",
    "shake",
    "depot",
    "bride",
    "paper",
    "parer",
    "flame",
    "extol",
    "riser",
    "screw",
    "straw",
    "chart",
    "crude",
    "halve",
    "uncle",
    "upset",
    "knelt",
    "setup",
    "poker",
    "plait",
    "splat",
    "bloat",
    "graze",
    "gazer",
    "singe",
    "fiery",
    "inane",
    "waver",
    "speak",
    "deity",
    "exact",
    "boule",
    "savor",
    "pulse",
    "droit",
    "poesy",
    "power",
    "scary",
    "threw",
    "staid",
    "short",
    "yield",
    "mouse",
    "peach",
    "cheap",
    "fable",
    "enter",
    "drove",
    "grain",
    "novel",
    "grime",
    "zebra",
    "antic",
    "scant",
    "forge",
    "hover",
    "fried",
    "decry",
    "piety",
    "tardy",
    "rearm",
    "elfin",
    "equal",
    "macro",
    "cagey",
    "agree",
    "sport",
    "eager",
    "shave",
    "fresh",
    "bleak",
    "viral",
    "cargo",
    "acrid",
    "rival",
    "heady",
    "model",
    "spice",
    "hoard",
    "boast",
    "mange",
    "chair",
    "guest",
    "aloft",
    "float",
    "crash",
    "lodge",
    "liken",
    "prove",
    "twine",
    "brain",
    "tempo",
    "guile",
    "party",
    "above",
    "mower",
    "tepid",
    "wider",
    "weird",
    "gavel",
    "rebar",
    "knead",
    "scrap",
    "cobra",
    "cleft",
    "ovine",
    "shrew",
    "plied",
    "inner",
    "flute",
    "mural",
    "broke",
    "nasty",
    "blast",
    "sneer",
    "began",
    "loose",
    "honey",
    "scorn",
    "mayor",
    "storm",
    "awoke",
    "flake",
    "dairy",
    "diary",
    "plant",
    "inlay",
    "corer",
    "perch",
    "tarot",
    "aorta",
    "hairy",
    "shirt",
    "prude",
    "hazel",
    "shied",
    "mover",
    "cease",
    "beach",
    "elite",
    "title",
    "alley",
    "guise",
    "sleet",
    "steel",
    "grove",
    "diver",
    "drive",
    "mercy",
    "tonga",
    "ralph",
    "tango",
    "thorn",
    "covet",
    "north",
    "stand",
    "tweak",
    "grief",
    "piano",
    "swine",
    "niche",
    "sinew",
    "exist",
    "erect",
    "scram",
    "spray",
    "orbit",
    "strip",
    "raspy",
    "lefty",
    "cigar",
    "along",
    "eight",
    "clove",
    "spied",
    "golem",
    "fetus",
    "utter",
    "truer",
    "heath",
    "theta",
    "shard",
    "court",
    "glide",
    "altar",
    "irony",
    "haven",
    "sugar",
    "broil",
    "unmet",
    "viper",
    "ladle",
    "paint",
    "croak",
    "baton",
    "ruler",
    "basil",
    "phone",
    "ranch",
    "fiber",
    "cyber",
    "brief",
    "craft",
    "hyper",
    "aloud",
    "beady",
    "demur",
    "debit",
    "lumen",
    "rapid",
    "plain",
    "stalk",
    "twice",
    "broad",
    "board",
    "essay",
    "buyer",
    "impel",
    "money",
    "aware",
    "chafe",
    "lunge",
    "stoic",
    "sharp",
    "abhor",
    "globe",
    "coupe",
    "chute",
    "lapel",
    "apple",
    "dowel",
    "track",
    "mason",
    "tramp",
    "latch",
    "rhino",
    "voice",
    "clued",
    "retry",
    "whole",
    "adult",
    "foray",
    "shorn",
    "askew",
    "frost",
    "decoy",
    "today",
    "erode",
    "order",
    "odder",
    "rodeo",
    "crier",
    "tiara",
    "trait",
    "glaze",
    "cress",
    "scree",
    "start",
    "purge",
    "leery",
    "viola",
    "voila",
    "demon",
    "mince",
    "salvo",
    "piney",
    "dwelt",
    "randy",
    "surer",
    "curio",
    "reuse",
    "ebony",
    "boney",
    "scour",
    "giver",
    "chaos",
    "scaly",
    "stork",
    "audio",
    "crawl",
    "giant",
    "evict",
    "angst",
    "rhyme",
    "sloth",
    "fetid",
    "biome",
    "deter",
    "thief",
    "agate",
    "align",
    "scarf",
    "marsh",
    "there",
    "ether",
    "three",
    "vital",
    "slang",
    "worst",
    "flirt",
    "blaze",
    "torch",
    "vegan",
    "field",
    "hovel",
    "elder",
    "waist",
    "crust",
    "print",
    "audit",
    "pilot",
    "truly",
    "whose",
    "eagle",
    "algae",
    "maize",
    "legal",
    "flesh",
    "shelf",
    "spend",
    "scald",
    "spoke",
    "maybe",
    "derby",
    "noose",
    "draft",
    "waive",
    "clash",
    "curve",
    "warty",
    "rabid",
    "braid",
    "adopt",
    "grasp",
    "abate",
    "epoch",
    "white",
    "aptly",
    "minor",
    "leper",
    "repel",
    "hoist",
    "brash",
    "quote",
    "eying",
    "twirl",
    "bilge",
    "groin",
    "about",
    "wield",
    "prize",
    "label",
    "ovary",
    "solid",
    "tense",
    "tonic",
    "clasp",
    "scalp",
    "video",
    "while",
    "boxer",
    "fairy",
    "welsh",
    "vista",
    "first",
    "blend",
    "dicey",
    "urban",
    "gorge",
    "shove",
    "drier",
    "dried",
    "rider",
    "roger",
    "linen",
    "masse",
    "bloke",
    "snout",
    "badge",
    "dress",
    "octet",
    "swept",
    "posit",
    "soapy",
    "rusty",
    "loamy",
    "hasty",
    "coven",
    "denim",
    "gnome",
    "choir",
    "lyric",
    "sheer",
    "wrath",
    "front",
    "angry",
    "exult",
    "daily",
    "smoke",
    "sadly",
    "deign",
    "faint",
    "drawl",
    "cello",
    "skirt",
    "robin",
    "atoll",
    "total",
    "bowel",
    "below",
    "elbow",
    "allot",
    "spoil",
    "meter",
    "surly",
    "hinge",
    "neigh",
    "vicar",
    "heavy",
    "aunty",
    "greet",
    "egret",
    "basin",
    "tubal",
    "rerun",
    "sheik",
    "dopey",
    "final",
    "piper",
    "riper",
    "glove",
    "patsy",
    "tumor",
    "devil",
    "pasty",
    "spree",
    "press",
    "wrist",
    "stank",
    "grout",
    "chide",
    "unlit",
    "until",
    "abase",
    "modal",
    "claim",
    "fella",
    "elect",
    "froze",
    "focal",
    "spilt",
    "palsy",
    "split",
    "grand",
    "stony",
    "swirl",
    "spike",
    "apnea",
    "endow",
    "wince",
    "vapor",
    "lurid",
    "detox",
    "tulle",
    "knave",
    "graft",
    "visor",
    "sonic",
    "chant",
    "scion",
    "afoul",
    "clout",
    "mauve",
    "befit",
    "femur",
    "dunce",
    "shark",
    "newly",
    "moist",
    "beret",
    "daunt",
    "vague",
    "envoy",
    "crank",
    "daisy",
    "haunt",
    "cloak",
    "chard",
    "perky",
    "toast",
    "spurt",
    "turbo",
    "quiet",
    "quite",
    "rebel",
    "corny",
    "quest",
    "crony",
    "movie",
    "plaid",
    "brand",
    "joker",
    "fault",
    "spark",
    "amity",
    "dirty",
    "slurp",
    "lasso",
    "micro",
    "offer",
    "depth",
    "rarer",
    "glory",
    "debut",
    "quart",
    "troll",
    "gaily",
    "fiend",
    "enema",
    "plume",
    "zesty",
    "scout",
    "point",
    "pinto",
    "belch",
    "blurt",
    "noisy",
    "stall",
    "thyme",
    "anvil",
    "hello",
    "sworn",
    "medic",
    "oxide",
    "admit",
    "round",
    "incur",
    "china",
    "chain",
    "locus",
    "chime",
    "bribe",
    "hardy",
    "third",
    "tract",
    "carat",
    "crisp",
    "wooer",
    "rower",
    "leave",
    "valve",
    "vocal",
    "guide",
    "basic",
    "recur",
    "cache",
    "women",
    "preen",
    "elope",
    "empty",
    "fixer",
    "being",
    "begin",
    "binge",
    "brawl",
    "flour",
    "cloth",
    "widen",
    "panic",
    "stack",
    "bravo",
    "zonal",
    "bacon",
    "choke",
    "whine",
    "rural",
    "stamp",
    "gaunt",
    "testy",
    "charm",
    "march",
    "swarm",
    "fetch",
    "foist",
    "clang",
    "drank",
    "harpy",
    "roost",
    "torso",
    "query",
    "diode",
    "throb",
    "broth",
    "vowel",
    "peace",
    "slack",
    "habit",
    "guard",
    "helix",
    "psalm",
    "burst",
    "vault",
    "bused",
    "agony",
    "ingot",
    "horny",
    "issue",
    "covey",
    "sandy",
    "rover",
    "forty",
    "drawn",
    "totem",
    "cramp",
    "lousy",
    "ratty",
    "venom",
    "lingo",
    "login",
    "gauze",
    "steed",
    "prank",
    "bicep",
    "polka",
    "ardor",
    "pixel",
    "circa",
    "girly",
    "posse",
    "tithe",
    "crass",
    "sheet",
    "these",
    "feign",
    "rally",
    "tangy",
    "genre",
    "nomad",
    "caput",
    "green",
    "hotly",
    "elide",
    "waxen",
    "manic",
    "saucy",
    "axion",
    "enjoy",
    "favor",
    "wreck",
    "mourn",
    "pansy",
    "scold",
    "gonad",
    "prawn",
    "manly",
    "lusty",
    "south",
    "shout",
    "bugle",
    "bulge",
    "welch",
    "primo",
    "shell",
    "hefty",
    "mirth",
    "glint",
    "count",
    "mecca",
    "forth",
    "froth",
    "creed",
    "revel",
    "lever",
    "payee",
    "natal",
    "girth",
    "right",
    "eking",
    "steep",
    "optic",
    "topic",
    "chief",
    "fruit",
    "yacht",
    "faith",
    "dozen",
    "sewer",
    "cheer",
    "shaft",
    "cavil",
    "ruder",
    "udder",
    "ahead",
    "spout",
    "trick",
    "gauge",
    "moult",
    "spell",
    "sleep",
    "curly",
    "gecko",
    "grunt",
    "flash",
    "cabin",
    "nudge",
    "savoy",
    "duvet",
    "spurn",
    "major",
    "creep",
    "crepe",
    "gland",
    "moose",
    "apart",
    "birth",
    "imbue",
    "goose",
    "woken",
    "worth",
    "throw",
    "fraud",
    "disco",
    "rupee",
    "puree",
    "upper",
    "purer",
    "flume",
    "croup",
    "betel",
    "world",
    "swath",
    "quota",
    "sting",
    "river",
    "clank",
    "niece",
    "speck",
    "aglow",
    "serve",
    "sever",
    "verse",
    "titan",
    "taint",
    "edify",
    "tulip",
    "scene",
    "bench",
    "burnt",
    "brunt",
    "dryer",
    "reedy",
    "bison",
    "avoid",
    "borax",
    "aroma",
    "lurch",
    "armor",
    "shawl",
    "sigma",
    "ennui",
    "bland",
    "ensue",
    "sling",
    "given",
    "radii",
    "rumba",
    "graph",
    "umbra",
    "nasal",
    "obese",
    "patch",
    "smell",
    "hymen",
    "among",
    "mango",
    "admin",
    "harsh",
    "liege",
    "gusto",
    "prowl",
    "logic",
    "midge",
    "brawn",
    "local",
    "tenth",
    "creme",
    "drift",
    "flint",
    "notch",
    "prism",
    "donut",
    "tunic",
    "gnash",
    "knife",
    "vogue",
    "quake",
    "sprig",
    "abbey",
    "adage",
    "beset",
    "valid",
    "mocha",
    "macho",
    "chord",
    "arbor",
    "sword",
    "fleet",
    "alarm",
    "index",
    "woven",
    "snack",
    "sumac",
    "bayou",
    "lanky",
    "prong",
    "pesky",
    "ivory",
    "libel",
    "bible",
    "belie",
    "tawny",
    "vaunt",
    "renew",
    "bless",
    "newer",
    "flout",
    "aping",
    "exert",
    "crush",
    "whelp",
    "crown",
    "unfed",
    "guilt",
    "crypt",
    "frank",
    "match",
    "error",
    "agape",
    "datum",
    "siege",
    "porch",
    "trunk",
    "thank",
    "proud",
    "growl",
    "risky",
    "loyal",
    "juice",
    "alloy",
    "squat",
    "merry",
    "stool",
    "scuba",
    "dense",
    "whirl",
    "topaz",
    "unity",
    "built",
    "fleck",
    "begun",
    "sheen",
    "tipsy",
    "unwed",
    "quail",
    "hydro",
    "laugh",
    "sound",
    "virus",
    "nerve",
    "never",
    "lofty",
    "fluke",
    "stink",
    "snaky",
    "grass",
    "tacit",
    "cacti",
    "attic",
    "ghost",
    "shady",
    "joist",
    "clamp",
    "batch",
    "cycle",
    "trout",
    "tutor",
    "frond",
    "tally",
    "briny",
    "grind",
    "caulk",
    "color",
    "candy",
    "plank",
    "mount",
    "slink",
    "lilac",
    "iliac",
    "stock",
    "class",
    "shirk",
    "stomp",
    "berry",
    "greed",
    "usual",
    "madly",
    "sleek",
    "shunt",
    "swami",
    "briar",
    "rabbi",
    "scrum",
    "sweet",
    "chasm",
    "brass",
    "syrup",
    "humor",
    "arrow",
    "gourd",
    "etude",
    "annex",
    "shank",
    "tacky",
    "rough",
    "light",
    "creek",
    "crazy",
    "synod",
    "woman",
    "touch",
    "drown",
    "epoxy",
    "quasi",
    "swell",
    "leech",
    "scowl",
    "elude",
    "wagon",
    "could",
    "input",
    "cloud",
    "breed",
    "scamp",
    "churn",
    "flask",
    "eerie",
    "amply",
    "tasty",
    "gamut",
    "thrum",
    "slimy",
    "chirp",
    "cross",
    "group",
    "weigh",
    "spank",
    "aphid",
    "lorry",
    "badly",
    "jerky",
    "semen",
    "scrub",
    "still",
    "genie",
    "stilt",
    "burly",
    "sally",
    "vigor",
    "twang",
    "ferry",
    "truck",
    "midst",
    "canon",
    "teddy",
    "spawn",
    "trump",
    "carry",
    "friar",
    "jaunt",
    "smith",
    "junta",
    "blunt",
    "sight",
    "chalk",
    "toxin",
    "smirk",
    "truss",
    "watch",
    "pique",
    "equip",
    "strut",
    "trust",
    "chess",
    "gouge",
    "droll",
    "youth",
    "rocky",
    "drool",
    "stash",
    "month",
    "gravy",
    "blank",
    "album",
    "merge",
    "salad",
    "stick",
    "handy",
    "joint",
    "thong",
    "wrack",
    "axiom",
    "evade",
    "defer",
    "freed",
    "petty",
    "dogma",
    "shall",
    "magic",
    "stung",
    "nobly",
    "slash",
    "revue",
    "cling",
    "gaffe",
    "troop",
    "heave",
    "drink",
    "taunt",
    "sorry",
    "havoc",
    "bigot",
    "larva",
    "bonus",
    "piece",
    "slick",
    "canal",
    "abbot",
    "pasta",
    "pouty",
    "taboo",
    "limbo",
    "slung",
    "filth",
    "bring",
    "annul",
    "kneel",
    "shrug",
    "grown",
    "wrong",
    "brisk",
    "annoy",
    "crimp",
    "ember",
    "shiny",
    "sieve",
    "lucid",
    "tryst",
    "morph",
    "human",
    "gooey",
    "seedy",
    "blond",
    "shack",
    "minty",
    "crowd",
    "clown",
    "dross",
    "balmy",
    "birch",
    "where",
    "tying",
    "butte",
    "every",
    "flank",
    "spiny",
    "doing",
    "dingo",
    "shrub",
    "brush",
    "motif",
    "foamy",
    "brown",
    "kebab",
    "motor",
    "lying",
    "minus",
    "modem",
    "dwarf",
    "silky",
    "using",
    "suing",
    "dodge",
    "afoot",
    "itchy",
    "prior",
    "event",
    "harry",
    "shift",
    "wharf",
    "sauna",
    "study",
    "dusty",
    "elegy",
    "leggy",
    "budge",
    "debug",
    "fancy",
    "drill",
    "small",
    "frisk",
    "segue",
    "guess",
    "offal",
    "aloof",
    "glass",
    "night",
    "pivot",
    "thing",
    "unfit",
    "razor",
    "hence",
    "shaky",
    "toxic",
    "theme",
    "undue",
    "vixen",
    "parry",
    "dowry",
    "rowdy",
    "wordy",
    "forum",
    "robot",
    "black",
    "speed",
    "tibia",
    "waltz",
    "koala",
    "ditch",
    "exile",
    "mouth",
    "belly",
    "sheep",
    "fatal",
    "ledge",
    "augur",
    "frown",
    "stunk",
    "ought",
    "tough",
    "clink",
    "smack",
    "wring",
    "joust",
    "pence",
    "child",
    "alibi",
    "stint",
    "basal",
    "allow",
    "slunk",
    "blind",
    "ghoul",
    "brink",
    "rigor",
    "amiss",
    "gross",
    "fudge",
    "pitch",
    "botch",
    "seven",
    "queer",
    "doubt",
    "needy",
    "vomit",
    "bleed",
    "prick",
    "lunch",
    "grimy",
    "stout",
    "donor",
    "marry",
    "snowy",
    "quilt",
    "honor",
    "awake",
    "seize",
    "banjo",
    "flack",
    "musty",
    "catty",
    "spicy",
    "plush",
    "moldy",
    "staff",
    "mangy",
    "gusty",
    "godly",
    "ozone",
    "floor",
    "music",
    "grill",
    "basis",
    "penny",
    "focus",
    "occur",
    "bleep",
    "coach",
    "flail",
    "bylaw",
    "verge",
    "bingo",
    "drama",
    "awful",
    "quark",
    "pithy",
    "shown",
    "theft",
    "sooty",
    "hound",
    "opium",
    "think",
    "gaudy",
    "await",
    "hatch",
    "catch",
    "fritz",
    "frock",
    "deuce",
    "amaze",
    "mogul",
    "crack",
    "guild",
    "vapid",
    "flaky",
    "weave",
    "pound",
    "fewer",
    "beget",
    "stuck",
    "junto",
    "tweed",
    "ditto",
    "idiot",
    "banal",
    "stump",
    "stood",
    "enemy",
    "clung",
    "moron",
    "drunk",
    "sooth",
    "shoot",
    "vinyl",
    "mania",
    "dwell",
    "tenet",
    "brick",
    "slump",
    "squad",
    "aging",
    "again",
    "sixty",
    "wheel",
    "young",
    "build",
    "quash",
    "slosh",
    "would",
    "comma",
    "crump",
    "dimly",
    "champ",
    "swamp",
    "blush",
    "colon",
    "blown",
    "stoop",
    "villa",
    "avail",
    "frill",
    "dally",
    "privy",
    "fever",
    "ficus",
    "fence",
    "qualm",
    "phony",
    "spool",
    "sloop",
    "mound",
    "cumin",
    "owing",
    "fling",
    "patty",
    "shock",
    "krill",
    "delve",
    "imply",
    "sixth",
    "swift",
    "sulky",
    "vodka",
    "apply",
    "truth",
    "silly",
    "proxy",
    "fluid",
    "conic",
    "ionic",
    "thick",
    "sense",
    "pinch",
    "nylon",
    "flush",
    "flown",
    "bound",
    "union",
    "adapt",
    "eject",
    "award",
    "excel",
    "sweep",
    "climb",
    "witch",
    "dutch",
    "blink",
    "igloo",
    "canny",
    "parka",
    "gloss",
    "pouch",
    "cabal",
    "alpha",
    "quell",
    "wrung",
    "gipsy",
    "stunt",
    "blitz",
    "block",
    "crumb",
    "rumor",
    "sappy",
    "limit",
    "boost",
    "dryly",
    "showy",
    "druid",
    "judge",
    "gayly",
    "smock",
    "venue",
    "spill",
    "naval",
    "swing",
    "found",
    "curvy",
    "might",
    "jetty",
    "batty",
    "droop",
    "tabby",
    "kneed",
    "karma",
    "axial",
    "jelly",
    "usurp",
    "snuck",
    "cough",
    "roomy",
    "flock",
    "wound",
    "rotor",
    "fishy",
    "bevel",
    "rugby",
    "gassy",
    "clack",
    "width",
    "beech",
    "smoky",
    "dying",
    "dingy",
    "avian",
    "coyly",
    "folio",
    "floss",
    "dandy",
    "quoth",
    "unify",
    "mulch",
    "blurb",
    "snoop",
    "ninth",
    "salsa",
    "spoon",
    "fatty",
    "taffy",
    "freer",
    "refer",
    "filmy",
    "gulch",
    "expel",
    "abyss",
    "blimp",
    "smash",
    "teeth",
    "evoke",
    "furor",
    "outdo",
    "clump",
    "butch",
    "spiky",
    "downy",
    "milky",
    "crock",
    "crook",
    "bliss",
    "finch",
    "plunk",
    "fight",
    "spasm",
    "mambo",
    "tepee",
    "brood",
    "wispy",
    "hedge",
    "murky",
    "inbox",
    "pushy",
    "dough",
    "going",
    "booze",
    "cheek",
    "check",
    "pixie",
    "kiosk",
    "flick",
    "fjord",
    "winch",
    "toddy",
    "queen",
    "array",
    "stiff",
    "flung",
    "lucky",
    "wight",
    "lumpy",
    "dolly",
    "rajah",
    "oddly",
    "icily",
    "spunk",
    "holly",
    "verve",
    "wacky",
    "groom",
    "sully",
    "quirk",
    "rigid",
    "worry",
    "caddy",
    "bawdy",
    "bezel",
    "punch",
    "radar",
    "skill",
    "thump",
    "melee",
    "curry",
    "hitch",
    "scoop",
    "mushy",
    "twist",
    "loopy",
    "outgo",
    "polyp",
    "pubic",
    "windy",
    "knoll",
    "crick",
    "chill",
    "swill",
    "fungi",
    "whiny",
    "chili",
    "broom",
    "ninja",
    "proof",
    "uncut",
    "fauna",
    "khaki",
    "pinky",
    "whack",
    "weedy",
    "slush",
    "fugue",
    "photo",
    "vouch",
    "knack",
    "pluck",
    "humid",
    "wryly",
    "skimp",
    "belle",
    "bushy",
    "awash",
    "swash",
    "pagan",
    "embed",
    "visit",
    "savvy",
    "pupil",
    "munch",
    "ditty",
    "lupus",
    "comic",
    "swung",
    "lymph",
    "geese",
    "shuck",
    "cacao",
    "idyll",
    "dilly",
    "cocoa",
    "golly",
    "glyph",
    "fanny",
    "comfy",
    "hilly",
    "bough",
    "shyly",
    "flunk",
    "condo",
    "nutty",
    "sushi",
    "mafia",
    "forgo",
    "swoon",
    "conch",
    "booty",
    "bunch",
    "ruddy",
    "thumb",
    "hippo",
    "manga",
    "geeky",
    "hurry",
    "lobby",
    "penne",
    "jewel",
    "beefy",
    "dusky",
    "mossy",
    "paddy",
    "soggy",
    "husky",
    "quack",
    "clock",
    "cabby",
    "tweet",
    "howdy",
    "happy",
    "booth",
    "duchy",
    "picky",
    "lipid",
    "juror",
    "plumb",
    "cynic",
    "blood",
    "brook",
    "sniff",
    "idiom",
    "sunny",
    "whisk",
    "vying",
    "tatty",
    "wedge",
    "gumbo",
    "bossy",
    "scoff",
    "folly",
    "allay",
    "unzip",
    "gawky",
    "squib",
    "chunk",
    "timid",
    "cinch",
    "bitty",
    "digit",
    "undid",
    "level",
    "plaza",
    "thigh",
    "bulky",
    "tight",
    "gloom",
    "stuff",
    "flood",
    "cliff",
    "billy",
    "lowly",
    "wooly",
    "musky",
    "couch",
    "missy",
    "click",
    "assay",
    "sassy",
    "chaff",
    "nymph",
    "bloom",
    "juicy",
    "hunky",
    "skulk",
    "skull",
    "hutch",
    "papal",
    "fifty",
    "pizza",
    "filly",
    "kitty",
    "icing",
    "myrrh",
    "emcee",
    "shook",
    "bosom",
    "witty",
    "furry",
    "spoof",
    "fifth",
    "civil",
    "knock",
    "widow",
    "chump",
    "llama",
    "willy",
    "dully",
    "maxim",
    "onion",
    "spook",
    "baggy",
    "putty",
    "pooch",
    "swoop",
    "nanny",
    "pulpy",
    "wimpy",
    "ovoid",
    "dumpy",
    "macaw",
    "amass",
    "pudgy",
    "hussy",
    "aback",
    "snuff",
    "livid",
    "mucus",
    "jolly",
    "swish",
    "skunk",
    "gully",
    "bongo",
    "affix",
    "guava",
    "gruff",
    "funky",
    "hunch",
    "mucky",
    "cubic",
    "bully",
    "moody",
    "quill",
    "goody",
    "dodgy",
    "kinky",
    "tooth",
    "cluck",
    "plump",
    "buxom",
    "quick",
    "vigil",
    "hippy",
    "hobby",
    "jumbo",
    "humus",
    "fully",
    "chock",
    "slyly",
    "motto",
    "giddy",
    "daddy",
    "fussy",
    "skiff",
    "femme",
    "piggy",
    "gypsy",
    "biddy",
    "dowdy",
    "woody",
    "sissy",
    "bunny",
    "chick",
    "known",
    "which",
    "queue",
    "foggy",
    "goofy",
    "mammy",
    "whoop",
    "funny",
    "bluff",
    "madam",
    "ninny",
    "twixt",
    "kayak",
    "gamma",
    "magma",
    "muddy",
    "dummy",
    "jumpy",
    "guppy",
    "buddy",
    "minim",
    "kappa",
    "poppy",
    "chuck",
    "humph",
    "dizzy",
    "shush",
    "gummy",
    "boozy",
    "puffy",
    "buggy",
    "whiff",
    "jazzy",
    "mimic",
    "booby",
    "bobby",
    "pygmy",
    "fluff",
    "woozy",
    "fizzy",
    "jiffy",
    "civic",
    "mamma",
    "puppy",
    "vivid",
    "mummy",
    "fuzzy"]
}
},{}]},{},[7]);
