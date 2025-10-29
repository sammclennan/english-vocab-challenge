// Module imports
import { elements } from './elements.js';
import { quiz } from './quiz.js';

// Vocab data object
export const vocabData = {
    all: [],
    subset: [],
    get maxQuestionCount() { return this.subset.length }, 
}

// Function declarations
export function prepareQuizData() {
    vocabData.subset = subsetVocabData();

    if (!vocabData.subset.length) {
        elements.dialogs.dataMenu.showModal();
        return false;
    }

    return true;
}

function subsetVocabData() {
    const checkboxes = document.querySelectorAll('input[name="data-select"]:checked');
    const selectedCategories = [...checkboxes].map(checkbox => checkbox.value);
    const subsetData = vocabData.all.filter(entry => selectedCategories.includes(entry.category));
    
    return subsetData;
}

export function generateQuestionList(data, sampleSize, shuffleWithReplacement) {
    if (!shuffleWithReplacement && data.length < sampleSize) {
        console.error('Not enough elements to sample.');
        return [];
    }
    
    let questions;

    if (shuffleWithReplacement) {
        questions = Array.from({ length: sampleSize}, () => Math.floor(Math.random() * data.length));
    } else {
        questions = data.map((_, i) => i);

        for (let i = questions.length - 1; i >= 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }
        questions = questions.slice(0, sampleSize);
    }

    return questions;
}

export async function getVocabData(index) {
    const vocab = vocabData.subset[index];

    if (!vocab || !vocab.eng || !vocab.jp) {
        console.error(`Missing vocab data at index ${index}.`);
        return;
    }

    const { subwords, separators } = getVocabSubparts(vocab.eng);

    quiz.currentQuestion = {
        ...vocab,
        subwords,
        separators,
        attemptsRemaining: quiz.settings.attemptsPerQuestion,
    }
}

export function getVocabSubparts(text) {
    if (!text || typeof(text) !== 'string') {
        return { subwords: [], separators: []};
    }

    const trimmedText = text.trim().replace(/\s+/g, ' ').replace(/[-]+/g, '-');
    const splitText = trimmedText.split(/([ -])/);
    const subwords = splitText.filter(item => /\w/.test(item));
    const separators = splitText.filter(item => /[ -]/.test(item));

    return { subwords, separators };
}