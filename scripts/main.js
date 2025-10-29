// Module imports
import { VOCAB_DATA_DIRECTORY, VOCAB_DATA_FILENAME } from './constants.js';
import { resetGame } from './quiz.js';
import { populateDataSelectMenu } from './ui.js';
import { vocabData } from './dataManager.js';
import { addButtonClickEffects } from './audioManager.js';
import { loadVocabJSON } from './utils.js';

// Function declarations
export async function init() {
    try {
        vocabData.all = await loadVocabJSON(VOCAB_DATA_FILENAME, VOCAB_DATA_DIRECTORY);
    } catch (error) {
        console.error('Error fetching JSON:', error);
        alert('データの読み込みに失敗しました。');
        return;
    }

    populateDataSelectMenu();
    addButtonClickEffects();
    resetGame();
}