// Module imports
import { init } from './main.js';
import { GAME_STATES } from './constants.js';
import { elements } from './elements.js';
import { quiz, newQuiz, nextQuestion, changeQuestionIndex, checkAnswer, showAnswer, reviewQuiz, pauseGame, resumeGame, stopGameplay } from './quiz.js';
import { configureSettingsForm, updateInputWidth, setCustomValidationMessages, updateSpinnerValue, returnToDataSelectMenu } from './ui.js';
import { vocabData, prepareQuizData } from './dataManager.js';
import { syncAudioAndText } from './audioManager.js';

// Event Listeners
document.addEventListener('keydown', (event) => {
    const currentState = quiz.state.current;

    if (event.key === 'Escape' && currentState !== GAME_STATES.MENU && currentState !== GAME_STATES.PAUSED) {
        event.preventDefault();
        stopGameplay();
    }

    if (event.key === 'Enter') {
        if (currentState === GAME_STATES.QUESTION) {
            event.preventDefault();
            checkAnswer(false);
        } else if (currentState === GAME_STATES.ANSWER && !elements.gameplayControls.nextQuestion.disabled) {
            event.preventDefault();
            nextQuestion();
        } else if (currentState === GAME_STATES.END && !elements.endGameUI.reviewButton.disabled) {
            event.preventDefault();
            reviewQuiz();
        }
    }

    if (event.key === ' ' && (currentState === GAME_STATES.ANSWER || currentState === GAME_STATES.REVIEW) && !elements.gameplayControls.playAudio.disabled) {
        event.preventDefault();
        syncAudioAndText();
    }

    if (currentState === GAME_STATES.REVIEW) {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            changeQuestionIndex(quiz.questions.currentIndex - 1);
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            changeQuestionIndex(quiz.questions.currentIndex + 1);
        }
    }
});

elements.menu.dataSelect.form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (prepareQuizData()) {
        configureSettingsForm();
    }
});

elements.menu.settings.form.addEventListener('submit', (event) => {
    event.preventDefault();
    newQuiz();
});

elements.menu.settings.questionCount.addEventListener('change', () => {
    elements.menu.settings.useAllQuestions.checked = false;
});

elements.menu.settings.useAllQuestions.addEventListener('change', (event) => {
    if (event.target.checked) {
        elements.menu.settings.questionCount.value = vocabData.maxQuestionCount;
        elements.menu.settings.questionCount.dispatchEvent(new Event('input', { bubbles : true }));
    };
});

elements.menu.settings.useTimer.addEventListener('change', (event) => {
    const checked = event.target.checked
    quiz.settings.useTimer = checked;
    elements.menu.settings.timePerQuestion.closest('.menu-option')?.classList.toggle('hidden', !checked);
});

elements.menu.settings.limitAttempts.addEventListener('change', (event) => {
    const checked = event.target.checked
    elements.menu.settings.attemptsPerQuestion.closest('.menu-option')?.classList.toggle('hidden', !checked);
});

elements.menu.settings.numberInputs.forEach(input => {
    input.addEventListener('input', () => {
        updateInputWidth(input, 5);
        setCustomValidationMessages(input);
    });

    input.addEventListener('invalid', () =>  setCustomValidationMessages(input));
});

elements.menu.settings.numberSpinButtons.forEach(button => {
    const input = document.querySelector(button.dataset.target);
    const change = Number(button.dataset.change);
    if (!input || isNaN(change)) return;
    
    button.addEventListener('click', () => {
        updateSpinnerValue(input, change);
    });
});

elements.menu.settings.returnButton.addEventListener('click', returnToDataSelectMenu);

elements.navButtons.home.addEventListener('click', stopGameplay);

elements.navButtons.pause.addEventListener('click', pauseGame);

elements.vocabDisplay.eng.container.addEventListener('animationend', (event) => {
    event.target.classList.remove('rubber-band');
});

elements.gameplayControls.prevReview.addEventListener('click', () => {
    changeQuestionIndex(quiz.questions.currentIndex - 1);
});

elements.gameplayControls.playAudio.addEventListener('click', syncAudioAndText);

elements.gameplayControls.showAnswer.addEventListener('click', showAnswer);

elements.gameplayControls.submitAnswer.addEventListener('click', () => {
    checkAnswer(false);
});

elements.gameplayControls.nextQuestion.addEventListener('click', nextQuestion);

elements.gameplayControls.nextReview.addEventListener('click', () => {
    changeQuestionIndex(quiz.questions.currentIndex + 1);
});

elements.endGameUI.reviewButton.addEventListener('click', reviewQuiz);

elements.performanceStats.wrappers.forEach(wrapper => {
    const icon = wrapper.querySelector('.icon-badge');
    const value = wrapper.querySelector('.stat-value');
    const description = wrapper.querySelector('.stat-description');
    
    wrapper.addEventListener('mouseenter', () => {
        icon.classList.add('invisible');
        value.classList.add('invisible');
        description.classList.remove('invisible');
    });

    wrapper.addEventListener('mouseleave', () => {
        icon.classList.remove('invisible');
        value.classList.remove('invisible');
        description.classList.add('invisible');
    });
});

elements.dialogs.pause.addEventListener('close', resumeGame);

document.addEventListener('DOMContentLoaded', init);

