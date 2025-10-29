// Module imports
import { GAME_STATES, DEFAULT_SETTINGS, ANSWER_OUTCOMES, COMPLETION_MESSAGES, VALIDATION_MESSAGES, COLORS } from './constants.js';
import { elements } from './elements.js';
import { quiz, changeQuestionIndex, safeDelay } from './quiz.js';
import { vocabData } from './dataManager.js';
import { stopAllSFX } from './audioManager.js';
import { timer, pauseTimer } from './timer.js'
import { formatTime } from './utils.js';
import { fireworks, startFireworksDisplay } from './fireworksDisplay.js';

// Function declarations
export function populateDataSelectMenu() {
    const orderedCategories = Object.entries(
        vocabData.all.reduce((newObject, { category }) => {
            newObject[category] = (newObject[category] || 0) + 1;
            return newObject;
        }, {})
    ).sort((a, b) => b[1] - a[1]).map(([key]) => key);
    
    const dataSelectForm = elements.menu.dataSelect.form;

    for (let i = 0; i < orderedCategories.length; i++) {
        const currentCategory = orderedCategories[i];
        const html = `<label class="menu-option">${currentCategory}<input class="menu-input" name="data-select" value="${currentCategory}" type="checkbox"></label>`;

        dataSelectForm.insertAdjacentHTML('beforeend', html);
    }

    const submitButtonHTML = '<div class="menu-button-container"><button class="menu-button menu-button--next" type="submit">クイズの設定へ</button></div>';

    dataSelectForm.insertAdjacentHTML('beforeend', submitButtonHTML);
}

export function configureSettingsForm() {
    elements.menu.settings.questionCount.max = vocabData.maxQuestionCount;
    elements.menu.settings.questionCount.value = Math.min(vocabData.maxQuestionCount, DEFAULT_SETTINGS.defaultQuestionCount);

    elements.menu.settings.numberInputs.forEach(input => {
        input.dispatchEvent(new Event('input', { bubbles : true}));
    });

    elements.menu.dataSelect.form.classList.add('hidden');
    elements.menu.settings.form.classList.remove('hidden');
}

export function updateInputWidth(input, charCount) {
    if (input.value.length > charCount) input.value = input.value.slice(0, charCount);
    input.style.width = `${input.value.length + 1}ch`;
}

export function setCustomValidationMessages(input) {
    const messages = {
        valueMissing: `入力が必要です`,
        rangeUnderflow: `${input.min}以上の数値を入力してください`,
        rangeOverflow: `${input.max}以下の数値を入力してください`,
        badInput: `数値を入力してください`,
    }

    for (const [error, message] of Object.entries(messages)) {
        if (input.validity[error]) {
            input.setCustomValidity(message);
            return;
        }
    }

    input.setCustomValidity('');
}

export function updateSpinnerValue(input, change) {
    const min = input.min !== '' ? Number(input.min) : -Infinity;
    const max = input.max !== '' ? Number(input.max) : Infinity;
    const step = Number(input.step) || 1;

    const value = Number(input.value) || 0;
    const newValue = value + change * step;
    input.value = Math.max(Math.min(newValue, max), min);

    updateInputWidth(input, 5);
}

export function returnToDataSelectMenu() {
    resetSettingsToDefault();

    vocabData.subset = [];

    elements.menu.dataSelect.form.classList.remove('hidden');
    elements.menu.settings.form.classList.add('hidden');
}

export function resetSettingsToDefault() {
    elements.menu.settings.questionCount.value = Math.min(vocabData.maxQuestionCount, DEFAULT_SETTINGS.defaultQuestionCount);

    elements.menu.settings.useAllQuestions.checked = false;

    elements.menu.settings.useTimer.checked = true;
    elements.menu.settings.useTimer.dispatchEvent(new Event('change'));

    elements.menu.settings.timePerQuestion.min = DEFAULT_SETTINGS.minAnswerTime;
    elements.menu.settings.timePerQuestion.max = DEFAULT_SETTINGS.maxAnswerTime;
    elements.menu.settings.timePerQuestion.value = DEFAULT_SETTINGS.defaultAnswerTime;
    
    elements.menu.settings.limitAttempts.checked = true;
    elements.menu.settings.limitAttempts.dispatchEvent(new Event('change'));

    elements.menu.settings.attemptsPerQuestion.min = DEFAULT_SETTINGS.minAttempts;
    elements.menu.settings.attemptsPerQuestion.max = DEFAULT_SETTINGS.maxAttempts;
    elements.menu.settings.attemptsPerQuestion.value = DEFAULT_SETTINGS.defaultAttempts;
}

export function resetDOMElements() {
    elements.menu.dataSelect.form.classList.remove('hidden');
    elements.menu.settings.form.classList.add('hidden');

    elements.navButtons.pause.classList.remove('hidden');
    elements.navButtons.pause.disabled = false;

    elements.statusBars.attemptsRemaining.fill.removeAttribute('style');
    elements.statusBars.attemptsRemaining.bar.parentElement.classList.add('hidden');
    elements.statusBars.attemptsRemaining.bar.classList.remove('flash-background');

    elements.statusBars.countdownTimer.bar.parentElement.classList.add('hidden');
    elements.statusBars.countdownTimer.fill.removeAttribute('style');

    elements.countdownTimer.textContent = '';
    elements.countdownTimer.classList.add('hidden');

    elements.vocabImage.image.removeAttribute('src');
    elements.vocabImage.image.removeAttribute('alt');
    elements.vocabImage.attribution.textContent = '';

    elements.vocabDisplay.jp.innerHTML = '';
    elements.vocabDisplay.eng.container.classList.remove('rubber-band');
    elements.vocabDisplay.eng.container.innerHTML = '';
    elements.vocabDisplay.eng.inputs = null;
    elements.vocabDisplay.eng.textDisplays = null;  

    elements.endGameUI.finalScore.textContent = '0';
    elements.endGameUI.questionCount.textContent = '';
    elements.endGameUI.message.textContent = '';
    elements.endGameUI.reviewButton.disabled = true;
    elements.endGameUI.fireworksBackground.innerHTML = '';

    elements.statusBars.quizProgress.bar.removeAttribute('style');
    elements.statusBars.quizProgress.bar.classList.remove('flash-background');
    elements.statusBars.quizProgress.bar.innerHTML = '';
    elements.statusBars.quizProgress.segments = null;

    elements.interfaces.menu.classList.remove('hidden');
    elements.interfaces.quiz.classList.add('hidden');

    elements.dialogs.dataMenu.close();
    elements.dialogs.pause.close();
    
    elements.vocabAudio.removeAttribute('src');
    elements.vocabAudio.load();

    cancelAnimationFrame(fireworks.animationFrameID);
    fireworks.animationFrameID = null;

    toggleGameplayButtons();
    toggleCompletionScreen();
    resetPerformanceStatsUI();
    hideValidationMessages();
}

export function toggleGameplayButtons() {
    function toggleButton(button, visibleStates) {
        const wrapper = button?.closest('.control-button-wrapper');
        const isVisible = visibleStates.includes(quiz.state.current);

        wrapper?.classList.toggle('hidden', !isVisible);
        button.disabled = !isVisible || (isVisible && quiz.state.current === GAME_STATES.ANSWER);
    }

    toggleButton(elements.gameplayControls.showAnswer, [GAME_STATES.QUESTION]);
    toggleButton(elements.gameplayControls.submitAnswer, [GAME_STATES.QUESTION]);
    toggleButton(elements.gameplayControls.playAudio, [GAME_STATES.ANSWER, GAME_STATES.REVIEW]);
    toggleButton(elements.gameplayControls.nextQuestion, [GAME_STATES.ANSWER]);
    toggleButton(elements.gameplayControls.nextReview, [GAME_STATES.REVIEW]);
    toggleButton(elements.gameplayControls.prevReview, [GAME_STATES.REVIEW]);    
}

function toggleCompletionScreen() {
    const quizEnded = quiz.state.current === GAME_STATES.END
    
    setButtonDisabledState(elements.gameplayControls.playAudio, quizEnded);
    setButtonDisabledState(elements.gameplayControls.nextQuestion, quizEnded);

    elements.endGameUI.container.classList.toggle('invisible', !quizEnded);
    elements.countdownTimer.classList.toggle('invisible', quizEnded);
    elements.vocabImage.container.classList.toggle('invisible', quizEnded);
    elements.vocabDisplay.container.classList.toggle('invisible', quizEnded);
}

function setButtonDisabledState(buttonElement, disable) {
    buttonElement.disabled = disable;
    buttonElement.style.pointerEvents = disable ? 'none' : 'auto';
    buttonElement.classList.toggle('control-button--disabled', disable);
}

function resetPerformanceStatsUI() {
    elements.performanceStats.wrappers.forEach(wrapper => {
        const icon = wrapper.querySelector('.icon-badge');
        const value = wrapper.querySelector('.stat-value');
        const description = wrapper.querySelector('.stat-description');

        icon.classList.remove('invisible');
        value.classList.remove('invisible');
        description.classList.add('invisible');
    });

    updateStatsDisplay();
}

function updateStatsDisplay() {
    const correctPercentage = Math.round(quiz.stats.score.correctRatio * 100);

    elements.performanceStats.correctCount.textContent = quiz.stats.score.correct;
    elements.performanceStats.incorrectCount.textContent = quiz.stats.score.incorrect;
    elements.performanceStats.showAnswerCount.textContent = quiz.stats.score.showAnswer;
    elements.performanceStats.accuracy.textContent = quiz.stats.score.totalAnswered === 0 ? '-' : correctPercentage;
    elements.performanceStats.currentStreak.textContent = quiz.stats.streak.current;
    elements.performanceStats.avgAnswerTime.textContent = quiz.stats.answerTimes.list.length === 0 ? '-' : quiz.stats.answerTimes.average;
}

export function hideValidationMessages() {
    const messages = document.querySelectorAll('.validation-message');
    messages.forEach(message => message.classList.remove('validation-message--visible'));
}

export function prepareQuizUI() {    
    elements.statusBars.attemptsRemaining.bar.parentElement.classList.toggle('hidden', !quiz.settings.limitAttempts);
    elements.statusBars.countdownTimer.bar.parentElement.classList.toggle('hidden', !quiz.settings.useTimer);

    elements.countdownTimer.classList.toggle('hidden', !quiz.settings.useTimer);

    populateQuizProgressBar(quiz.questions.count);

    elements.interfaces.menu.classList.add('hidden');
    elements.interfaces.quiz.classList.remove('hidden');
}

function populateQuizProgressBar(questionCount) {
    const container = elements.statusBars.quizProgress.bar;
    container.innerHTML = '';

    for (let i = 0; i < questionCount; i++) {
        const segment = document.createElement('span');
        segment.classList.add('progress-bar-segment', 'invisible');
        container.appendChild(segment);
    }

    elements.statusBars.quizProgress.segments = document.querySelectorAll('.progress-bar-segment');

    document.documentElement.style.setProperty('--progress-bar-radius', questionCount > 50 ? '0.25rem' : 'var(--pill-button-radius)');

    updateProgressBarOverlay();
}

function updateProgressBarOverlay() {
    const bar = elements.statusBars.quizProgress.bar;
    const segments = elements.statusBars.quizProgress.segments ?? [];
    const segmentCount = segments.length;

    let visibleCount = 0;
    segments.forEach(segment => {
        if (!segment.classList.contains('invisible')) visibleCount++;
    });

    const filledPct = segmentCount ? (visibleCount / segmentCount) * 100 : 0;

    bar.style.setProperty('--filled-pct', `${filledPct}%`);

    if (filledPct >= 99.999) {
        bar.setAttribute('data-filled', '100');
    } else {
        bar.removeAttribute('data-filled');
    }
}

export function displayVocab() {
    elements.vocabDisplay.jp.innerHTML = quiz.currentQuestion.jpFormatted;

    elements.vocabDisplay.eng.container.innerHTML = populateVocabHTML(quiz.currentQuestion.subwords, quiz.currentQuestion.separators);

    elements.vocabDisplay.eng.textDisplays = document.querySelectorAll('.eng-text');
    
    if (quiz.state.current === GAME_STATES.QUESTION) {
        elements.vocabDisplay.eng.inputs = document.querySelectorAll('.answer-input');
        elements.vocabDisplay.eng.inputs?.[0]?.focus();
        elements.vocabDisplay.eng.inputs?.[0]?.select();
        addInputEventListeners();
    }
}

function populateVocabHTML(subwords, separators) {
    let html = '';

    subwords.forEach((subword, i) => {
        const length = subword.length;
        if (quiz.state.current === GAME_STATES.QUESTION) {
            html += `<div class="answer-input-wrapper"><input id="input-${i}" class="answer-input" type="text" style="width: ${length}ch" maxlength="${length}" inputmode="latin" autocapitalize="off" autocomplete="off" spellcheck="false" oninput="this.value = this.value.replace(/[^a-zA-Z0-9']/g, '')"><span class="eng-text input-overlay">${'_'.repeat(length)}</span><div class="validation-message"></div></div>`;
        } else {
            html += `<span class="eng-text" style="width: ${length}ch"></span>`;
        }

        if (i < separators.length) {
            html += `<span>${separators[i]}</span>`;
        }
    });
    
    return html;
}

function addInputEventListeners() {
    function focusCursorOnInput(input) {
        input.focus();
        const length = input.value.length;
        input.setSelectionRange(length, length);
    }

    elements.vocabDisplay.eng.inputs?.forEach((input, index) => {
        const prevInput = elements.vocabDisplay.eng.inputs?.[index - 1];
        const nextInput = elements.vocabDisplay.eng.inputs?.[index + 1];
        
        input.addEventListener('input', (event) => {
            if (event.data === '. ') {
                input.value = input.value.slice(0, -2);
                return;
            }

            const overlay = input.parentElement.querySelector('.eng-text');
            const placeholderText = '_'.repeat(input.maxLength);
            overlay.textContent = input.value + placeholderText.slice(input.value.length);

            if (index < elements.vocabDisplay.eng.inputs?.length - 1 && input.value.length === input.maxLength && nextInput) {
                focusCursorOnInput(nextInput);
            }
        });

        input.addEventListener('keydown', (event) => {
            hideValidationMessages();

            if (event.key === ' ' || event.key === 'ArrowRight') {
                event.preventDefault();
                if (nextInput) {
                    focusCursorOnInput(nextInput);
                }
            }

            if ((event.key === 'Backspace' || event.key === 'ArrowLeft') && index > 0 && input.selectionStart === 0 && input.selectionEnd === 0 && prevInput) {
                focusCursorOnInput(prevInput);
            }

            if (index < elements.vocabDisplay.eng.inputs?.length - 1 && input.selectionStart === input.maxLength && event.key !== 'Backspace' && nextInput) {
                focusCursorOnInput(nextInput);
            }
        });
    });
}

export function updateReviewButtons() {
    const atFirstIndex = quiz.questions.currentIndex === 0;
    const atLastIndex = quiz.questions.currentIndex === quiz.questions.list.length - 1;

    setButtonDisabledState(elements.gameplayControls.prevReview, atFirstIndex);
    setButtonDisabledState(elements.gameplayControls.nextReview, atLastIndex);
}

export async function highlightAnswer() {
    const textDisplays = elements.vocabDisplay.eng.textDisplays ?? [];
    const subwords = quiz.currentQuestion.subwords;

    let charCount = 0;

    textDisplays.forEach((display, i) => {
        display.innerHTML = '';

        [...subwords[i]].forEach(char => {
            display.innerHTML += `<span style="color: transparent; display: inline-block">${char}</span>`;
            charCount++;
        });
    });

    for (let i = 0; i < textDisplays.length; i++) {
        await karaokeHighlight(textDisplays[i], charCount);
    }
}

async function karaokeHighlight(textDisplay, charCount) {
    const spans = textDisplay.querySelectorAll('span');
    
    const delayDuration = (quiz.currentQuestion.effectiveAudioDuration || DEFAULT_SETTINGS.defaultEffectiveDuration) / charCount * 1000;
    
    for (let j = 0; j < spans.length; j++) {
        const span = spans[j];
        span.style.color = 'black';
        resetClass(span, 'bounce-in');
        
        if (await safeDelay(delayDuration)) return;
    }
}

function resetClass(element, className) {
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
}

export function updateStatusBar(DOMElement, fraction, total) {
    DOMElement.style.width = `${fraction / total * 100}%`;
    colorStatusBar(DOMElement, fraction, total)
}

function colorStatusBar(DOMElement, fraction, total) {
    const hue = fraction / total * 120;
    DOMElement.style.background = `linear-gradient(hsl(${hue}, 100%, 50%), hsl(${hue}, 100%, 40%))`;
}

export function updateTimerDisplay() {
    elements.countdownTimer.textContent = formatTime(Math.ceil(timer.timeRemaining / 1000));

    updateStatusBar(
        elements.statusBars.countdownTimer.fill,
        timer.timeRemaining,
        quiz.settings.timePerQuestion
    );

    const countdownTimerBar = elements.statusBars.countdownTimer.bar;

    if (timer.playingTimeWarning && !countdownTimerBar.classList.contains('pulsing')) {
        resetClass(elements.statusBars.countdownTimer.bar, 'pulsing');
    }
}

export function validateInput(textInput) {
    const validationMessage = textInput.parentElement.querySelector('.validation-message');

    if (!textInput.value || textInput.value.length < textInput.maxLength) {
        validationMessage.classList.add('validation-message--visible');
        validationMessage.textContent = !textInput.value ? VALIDATION_MESSAGES.emptyField : VALIDATION_MESSAGES.missingCharacter;

        textInput.focus();

        return false;
    }

    return true;
}

export function addFlashEffect(element, color, property) {
    element.style.setProperty('--flash-color', color);
    resetClass(element, `flash-${property}`);
}

export function clearIncorrectInput(input, addEffect) {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    if (addEffect) {
        addFlashEffect(input.parentElement, COLORS.redTransparent, 'background');
    }
}

export function prepareAnswerUI(outcome) {
    pauseTimer();
    stopAllSFX();
    freezeInputs();
    toggleGameplayButtons();
    fillProgressBarSegment(outcome);
    updateStatsDisplay();

    if (outcome === ANSWER_OUTCOMES.SHOW_ANSWER) revealAnswerWithEffect();
}

function freezeInputs() {
    elements.vocabDisplay.eng.inputs?.forEach(input => {
        input.disabled = true;
        input.style.pointerEvents = 'none';
        input.blur();
    });
}

function fillProgressBarSegment(outcome) {
    const index = quiz.questions.currentIndex;
    const segments = elements.statusBars.quizProgress.segments ?? [];

    if (!segments.length || index < 0 || index >= segments.length) {
        console.error(`Invalid Progress Bar index ${index}`);
        return;
    }

    const currentSegment = segments[index];
    currentSegment.classList.remove('invisible');

    colorStatusBar(currentSegment, outcome === ANSWER_OUTCOMES.CORRECT ? 1 : outcome === ANSWER_OUTCOMES.SHOW_ANSWER ? 0.5 : 0, 1);

    addFlashEffect(
        elements.statusBars.quizProgress.bar,
        outcome === ANSWER_OUTCOMES.CORRECT ? COLORS.greenTransparent : 
        outcome === ANSWER_OUTCOMES.SHOW_ANSWER ? COLORS.yellowTransparent :
        COLORS.redTransparent,
        'background'
    );

    updateProgressBarOverlay();
}

function revealAnswerWithEffect() {
    elements.vocabDisplay.eng.textDisplays?.forEach((display, i) => {
        display.textContent = quiz.currentQuestion.subwords[i];
    });

    elements.vocabDisplay.eng.container.classList.add('rubber-band');
}

export function getCompletionMessage(correctRatio) {
    const messageKey = [
        [0, 'zero'],
        [0.25, 'low'],
        [0.75, 'average'],
        [0.9999, 'high'],
        [1, 'perfect'],
    ].find(([threshold]) => correctRatio <= threshold)[1];
    
    return COMPLETION_MESSAGES[messageKey];
}

export function prepareGameEndUI(correctRatio, message) {
    elements.navButtons.pause.classList.add('hidden');
    elements.navButtons.pause.disabled = true;

    elements.endGameUI.finalScore.textContent = quiz.stats.score.correct;
    elements.endGameUI.questionCount.textContent = quiz.questions.count;
    elements.endGameUI.message.textContent = message;
    
    toggleCompletionScreen();

    if (correctRatio >= fireworks.minCorrectRatio) {
        startFireworksDisplay();
    }
}

export function updateAttemptsRemainingBar() {        
    updateStatusBar(
        elements.statusBars.attemptsRemaining.fill,
        quiz.currentQuestion.attemptsRemaining,
        quiz.settings.attemptsPerQuestion
    );

    addFlashEffect(
        elements.statusBars.attemptsRemaining.bar,
        COLORS.redTransparent,
        'background'
    );
}

export function focusFirstEmptyInput() {
    const inputs = elements.vocabDisplay.eng.inputs ?? [];

    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        if (input.value === '') {
            input.focus();
            input.select();
            break;
        }
    }
}

export function prepareReviewUI() {
    cancelAnimationFrame(fireworks.animationFrameID);
    fireworks.animationFrameID = null;

    toggleCompletionScreen();
    toggleGameplayButtons();
    enableProgressBarInteraction();

    elements.statusBars.attemptsRemaining.bar.parentElement.classList.add('hidden');
    elements.statusBars.countdownTimer.bar.parentElement.classList.add('hidden');

    elements.countdownTimer.classList.add('hidden');
}

function enableProgressBarInteraction() {
    const segments = elements.statusBars.quizProgress.segments ?? [];

    if (!segments.length) {
        console.error('Progress bar segments do not exist.');
        return;
    }

    segments.forEach((segment, index) => {
        segment.classList.add('progress-bar-segment--clickable');
        segment.addEventListener('click', () => {
            changeQuestionIndex(index);
        });
    });
}