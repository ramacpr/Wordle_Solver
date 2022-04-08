Wordle is a web-based word game published by The New York Times Company (game link: https://www.nytimes.com/games/wordle/index.html)

The goal of this project, Wordle Solver is to simulate the gameplay and try to win in 6 tries. The solution word on the sim is the same as that of the original game website for the day. 

How to use: 
Open the 'index.html' file from the project folder on your browser. This opens a sim of the original game. Now, just press the 'Enter' button on the virtual keyboard. The algorithm decides the next guess dynamically based on the 'correctness evaluations' of the previous guess (also made by the algorithm). Eventually, when all the tiles go green the algorithm (and you) have won! 

Technical Background: 
The algorithm follows the difficulty mode 'hard', i.e, the clues of the current guess evaluations will be used in the next guess. The measured accuracy of the algorithm is ~77% with the start word 'plumb'. The file accuracyReport.json has the measured accuracy for each of the words as the starting word. 
The valid word dictionary for the algorithm is the same as the original wordle source code. 
Refer end of this file for steps on how to use the project and the scripts. 

The repo also had a node-only file which can be used for further testing of the algorithm. Details of usage in the repo. 

Further improvements: 
1. The next guess is picked based on previous guess evaluations and word probabilities. This is the main factor affecting 
the overall system accuracy. For example, if the destination word is 'SPARE' and we start with 'PLUMB', the guesses 
the algorithm makes are (1)PLUMB (2)AROSE (3)STARE (4)SNARE (5)SCARE. The last three guesses here are similar 
(with a difference in just a single letter). In worst cases, this can go beyond 6 tries making us lose! Further algorithmic 
optimizations can be done here to get the win in fewer trials.

ON THE WEB:
Open index.html to play along on web! 
The solution for the day is same as NYT's solution for the day. Just press enter key to automatically enter the next guess.
The 2 JSON files under data folder are prerequisite. If these files are not present, run in node setup first and then try the web plug-in. 
To recompile local code changes for web -> 'npm run wordleForWeb'

ON THE NODE:
To test accuracy locally on node setup, run script 'npm run wordleOnNode <test_destination_word> <debug_logging_true/false>'
The 2 JSON files under data folder are prerequisite. When testing on node, if these files are not present they will be generated automatically.
