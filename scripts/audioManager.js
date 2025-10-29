// Module imports
import { AUDIO_DIRECTORY, SFX_DIRECTORY, SFX_FILENAMES } from './constants.js';
import { elements } from './elements.js';
import { quiz } from './quiz.js';
import { highlightAnswer } from './ui.js';

// SFX set
const activeSFX = new Set();

// Function declarations
function playSoundEffect(source) {
    return new Promise((resolve, reject) => {
        const sfx = new Audio(source);
        activeSFX.add(sfx);
        const removeFromQueue = () => activeSFX.delete(sfx);

        sfx.onended = () => {
            removeFromQueue();
            resolve();
        }

        sfx.onerror = () => {
            removeFromQueue();
            reject(new Error(`Audio error on ${source}`));
        }

        sfx.play().catch(error => {
            removeFromQueue();
            reject(error);
        });
    });
}

export async function playSFXSafe(source) {
    try {
        await playSoundEffect(source);
    } catch (error) {
        console.warn('Failed to play sound effect: ', error);
    }
}

async function playAudio() {
    const audio = elements.vocabAudio;

    if (!audio.src) {
        console.warn('No audio available.');
        return;
    }

    if (!audio.paused && !audio.ended) return;

    try {
        audio.load(); // Fixes cutoff audio playback on Safari
        await audio.play();
    } catch (error) {
        console.warn('Audio playback failed:', error);
        alert('音声の再生に失敗しました。');
    }
}

export function stopAudio(audioElement) {
    if (!audioElement) return;
    audioElement.pause();
    audioElement.currentTime = 0;

    if (audioElement.cancelAudioPromise) {
        audioElement.cancelAudioPromise();
        delete audioElement.cancelAudioPromise;
    }
}

export function stopAllSFX() {
    activeSFX.forEach(sfx => stopAudio(sfx));
    activeSFX.clear();
}

export function pauseAllSFX() {
    activeSFX.forEach(sfx => {
        if (!sfx.paused) {
            sfx.pause();
        }
    });
}

export function resumeAllSFX() {
    activeSFX.forEach(sfx => {
        if (sfx.paused) {
            sfx.play().catch(error => console.warn(`Failed to resume audio: ${error}`));
        }
    });
}

function createAudioPromise(audio) {
    return new Promise((resolve, reject) => {
        if (!audio.src) {
            resolve();
            return
        }

        const onEnded = () => resolve();
        const onError = () => reject(new Error(`Audio error on ${audio.src}`));
        
        audio.addEventListener('ended', onEnded, { once: true });
        audio.addEventListener('error', onError, { once: true });

        audio.cancelAudioPromise = () => {
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            resolve();
        }
    });
}

export function setVocabAudio() {
    const audioFilename = quiz.currentQuestion?.audio;

    if (audioFilename) {
        elements.vocabAudio.src = `${AUDIO_DIRECTORY}${audioFilename}`;
    } else {
        elements.vocabAudio.removeAttribute('src');
    }

    elements.vocabAudio.load();
}

export function addButtonClickEffects() {
    function addMultipleSFX(selector, event, SFX) {
        const elementGroup = document.querySelectorAll(selector);
        elementGroup.forEach(element => {
            element.addEventListener(event, () => {
                playSFXSafe(`${SFX_DIRECTORY}${SFX_FILENAMES[SFX]}`);
            });
        });
    }

    addMultipleSFX('.menu-button, #review-quiz-button', 'click', 'buttonClick');
    addMultipleSFX('input[type="checkbox"]', 'click', 'checkboxClick');
    addMultipleSFX('.number-spin-button', 'click', 'spinnerClick');
    addMultipleSFX('.nav-button', 'click', 'navButtonClick');
}

export async function syncAudioAndText() {
    const audioButton = elements.gameplayControls.playAudio;
    audioButton.disabled = true;

    try {
        const audio = elements.vocabAudio;
        const audioPromise = createAudioPromise(audio);

        await playAudio();

        const highlightPromise = highlightAnswer();

        await Promise.all([audioPromise, highlightPromise]);

    } catch (error) {
        console.error(`Audio and text sync failed: ${error}`);
    } finally {
        audioButton.disabled = false;
    }
}