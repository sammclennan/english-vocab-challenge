// Module imports
import { IMAGE_DIRECTORY } from './constants.js';
import { elements } from './elements.js';
import { quiz } from './quiz.js';
import { vocabData} from './dataManager.js';

// Image cache
const imageCache = {};

// Function declarations
async function loadImage(filename) {
    if (!filename) return null;

    if (filename in imageCache) {
        return imageCache[filename];
    }

    return new Promise(resolve => {
        const img = new Image();
        img.src = `${IMAGE_DIRECTORY}${filename}`;

        img.onload = () => {
            imageCache[filename] = img;
            resolve(img);
        };

        img.onerror = () => {
            console.warn(`Failed to load image: ${filename}`);
            resolve(null);
        };
    });
}

export function preloadImages(startIndex, count=3) {
    const promises = [];
    const maxIndex = Math.min(startIndex + count, quiz.questions.list.length);

    for (let i = startIndex; i < maxIndex; i++) {
        const questionNumber = quiz.questions.list[i];
        const filename = vocabData.subset[questionNumber].image;
        
        if (!filename || filename in imageCache) continue;

        promises.push(loadImage(filename));
    }

    return Promise.all(promises);
}

export async function setVocabImage() {
    const img = await loadImage(quiz.currentQuestion?.image);

    if (img) {
        elements.vocabImage.image.src = img.src;
        elements.vocabImage.attribution.innerHTML = quiz.currentQuestion?.attr || '';

        const attributionLinks = elements.vocabImage.attribution.querySelectorAll('a');
        attributionLinks.forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });
    } else {
        elements.vocabImage.image.removeAttribute('src');
        elements.vocabImage.attribution.innerHTML = '';
    }

    elements.vocabImage.image.alt = quiz.currentQuestion?.jp || '';
}