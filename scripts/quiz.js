// Module imports
import { SFX_DIRECTORY, GAME_STATES, DEFAULT_SETTINGS, ANSWER_OUTCOMES,  SFX_FILENAMES, COLORS } from './constants.js';
import { elements } from './elements.js';
import { resetSettingsToDefault, resetDOMElements, toggleGameplayButtons, hideValidationMessages, prepareQuizUI, displayVocab, updateReviewButtons,  updateStatusBar, validateInput, addFlashEffect, clearIncorrectInput, prepareAnswerUI, getCompletionMessage, prepareGameEndUI, updateAttemptsRemainingBar, focusFirstEmptyInput, prepareReviewUI } from './ui.js';
import { vocabData, generateQuestionList, getVocabData } from './dataManager.js';
import { setVocabAudio, syncAudioAndText, playSFXSafe, pauseAllSFX, resumeAllSFX, stopAllSFX, stopAudio } from './audioManager.js';
import { setVocabImage, preloadImages } from './imageManager.js';
import { timer, resetTimerObjectValues, resetTimer, startTimer, pauseTimer } from './timer.js';
import { roundXDP, verifyIntegerInput, sleep } from './utils.js';

// Quiz state object
export const quiz = {};

// Function declarations
export function resetGame() {
    resetObjectValues();
    resetSettingsToDefault();
    resetDOMElements();
}

function resetObjectValues() {
    Object.assign(quiz, {
        state: {
            current: GAME_STATES.MENU,
            previous: null,
        },
        settings: {
            useTimer: false,
            timePerQuestion: 0,
            limitAttempts: false,
            attemptsPerQuestion: 0,
        },
        questions: {
            list: [],
            currentIndex: 0,
            get count() { return this.list.length },
        },
        currentQuestion: {},
        stats: {
            score: {
                correct: 0,
                incorrect: 0,
                showAnswer: 0,
                get totalAnswered() { 
                    return this.correct + this.incorrect + this.showAnswer;
                },
                get correctRatio() {
                    return this.totalAnswered > 0 ? this.correct / this.totalAnswered : 0;
                },
            },
            streak: {
                current: 0,
                longest: 0,
            },
            answerTimes: {
                list: [],
                get average() { 
                    return this.list.length > 0 ? roundXDP(this.list.reduce((a, b) => a + b, 0) / this.list.length, 2) : 0;
                },
            }
        },
    });

    resetTimerObjectValues();
}

export function newQuiz() {
    const questionCount = updateQuizSettings();
    if (questionCount === null) return;

    quiz.questions.list = generateQuestionList(vocabData.subset, questionCount, DEFAULT_SETTINGS.duplicateQuestions);

    quiz.state.current = GAME_STATES.QUESTION;

    prepareQuizUI();
    renderQuestion(quiz.questions.currentIndex);
}

function updateQuizSettings() {
    const questionCount = verifyIntegerInput(elements.menu.settings.questionCount.value, 'Question Count', 1, vocabData.maxQuestionCount);

    if (questionCount === null) return null;

    quiz.settings.useTimer = elements.menu.settings.useTimer.checked;

    if (quiz.settings.useTimer) {
        const timePerQuestion = verifyIntegerInput(elements.menu.settings.timePerQuestion.value, 'Time Per Question', DEFAULT_SETTINGS.minAnswerTime, DEFAULT_SETTINGS.maxAnswerTime);

        if (timePerQuestion === null) return null;

        quiz.settings.timePerQuestion = timePerQuestion * 1000;
    }

    quiz.settings.limitAttempts = elements.menu.settings.limitAttempts.checked;

    if (quiz.settings.limitAttempts) {
        const attemptsPerQuestion = verifyIntegerInput(elements.menu.settings.attemptsPerQuestion.value, 'Attempts Per Question', 1, DEFAULT_SETTINGS.maxAttempts);

        if (attemptsPerQuestion === null) return null;
    
        quiz.settings.attemptsPerQuestion = attemptsPerQuestion;
    }

    return questionCount;
}

export function nextQuestion() {
    quiz.state.current = GAME_STATES.QUESTION;
    changeQuestionIndex(quiz.questions.currentIndex + 1);
}

export async function changeQuestionIndex(newIndex) {
    if (newIndex < 0 || newIndex >= quiz.questions.list.length) return;
    
    quiz.questions.currentIndex = newIndex;
    renderQuestion();
}

function renderQuestion() {
    getVocabData(quiz.questions.list[quiz.questions.currentIndex]);
    displayVocab();
    setVocabAudio();
    setVocabImage();

    if (quiz.state.current === GAME_STATES.REVIEW) {
        updateReviewButtons();
        syncAudioAndText();
    } else {
        toggleGameplayButtons();
        resetRemainingAttempts();
        preloadImages(quiz.questions.currentIndex + 1);
        resetTimer();
        startTimer();
    }
}

export async function safeDelay(ms) {
    await sleep(ms);
    await waitIfPaused();
    return quiz.state.current === GAME_STATES.MENU;
}

async function waitIfPaused() {
    while (quiz.state.current === GAME_STATES.PAUSED) {
        await sleep(100);
    }
}

function resetRemainingAttempts() {
    if (!quiz.settings.limitAttempts) return;

    quiz.currentQuestion.attemptsRemaining = quiz.settings.attemptsPerQuestion;

    updateStatusBar(
        elements.statusBars.attemptsRemaining.fill,
        quiz.currentQuestion.attemptsRemaining,
        quiz.settings.attemptsPerQuestion
    );
}

export function checkAnswer(timerActivated) {
    const inputs = elements.vocabDisplay.eng.inputs ?? [];
    const subwords = quiz.currentQuestion.subwords;
    const answerLength = inputs.length;

    if (!timerActivated) {
        for (let i = 0; i < answerLength; i++) {
            if (!validateInput(inputs[i])) return;
        } 
    }
    
    let matches = 0;

    for (let i = 0; i < answerLength; i++) {
        const input = inputs[i];
        if (input.value.toLowerCase() === subwords[i].toLowerCase()) {
            addFlashEffect(input.parentElement, COLORS.greenTransparent, 'background');
            matches++;
        } else {
            clearIncorrectInput(input, true);
        }
    }

    quiz.currentQuestion.attemptsRemaining--;

    if (matches === answerLength) {
        handleAnswer(ANSWER_OUTCOMES.CORRECT);
    } else {
        timerActivated ? outOfTime() : handleWrongAttempt(matches);
    }
}

export function showAnswer() {
    elements.vocabDisplay.eng.inputs?.forEach(input => {
        clearIncorrectInput(input, false);
    });

    hideValidationMessages();
    handleAnswer(ANSWER_OUTCOMES.SHOW_ANSWER);
}

async function handleAnswer(outcome) {
    if (!Object.values(ANSWER_OUTCOMES).includes(outcome)) {
        console.error(`Invalid answer outcome: ${outcome}`);
        return;
    }
    
    quiz.state.current = GAME_STATES.ANSWER;

    updatePerformanceStats(outcome);
    prepareAnswerUI(outcome);
    await playSFXSafe(`${SFX_DIRECTORY}${SFX_FILENAMES[outcome]}`);
    await syncAudioAndText();

    const finalQuestion = quiz.questions.currentIndex === quiz.questions.count - 1

    if (finalQuestion) {
        elements.gameplayControls.playAudio.disabled = true;
        if (await safeDelay(1000)) return;
        endQuiz();
    } else {
        elements.gameplayControls.nextQuestion.disabled = false;  
    }
}

function updatePerformanceStats(outcome) {
    if (outcome === ANSWER_OUTCOMES.OUT_OF_TIME || outcome === ANSWER_OUTCOMES.OUT_OF_ATTEMPTS) {
        outcome = 'incorrect';
    }

    quiz.stats.score[outcome]++;

    quiz.stats.streak.current = outcome === 'correct' ? quiz.stats.streak.current + 1 : 0;
    
    quiz.stats.streak.longest = Math.max(quiz.stats.streak.current, quiz.stats.streak.longest);

    if (quiz.settings.useTimer && outcome !== ANSWER_OUTCOMES.SHOW_ANSWER) {
        const timeElapsed = roundXDP((quiz.settings.timePerQuestion - timer.timeRemaining) / 1000, 4);
        quiz.stats.answerTimes.list.push(timeElapsed);
    }
}

async function endQuiz() {
    quiz.state.current = GAME_STATES.END;

    const correctRatio = quiz.stats.score.correctRatio;
    const completionMessage = getCompletionMessage(correctRatio);

    prepareGameEndUI(correctRatio, completionMessage);
    await playSFXSafe(`${SFX_DIRECTORY}${SFX_FILENAMES[quiz.stats.score.correct === 0 ? 'quizFailed' : 'quizCompleted']}`);

    elements.endGameUI.reviewButton.disabled = false;
}

function outOfTime() {
    elements.statusBars.countdownTimer.fill.style.width = '0%';

    hideValidationMessages();
    addFlashEffect(
        elements.statusBars.countdownTimer.bar,
        COLORS.redTransparent,
        'background'
    );
    handleAnswer(ANSWER_OUTCOMES.OUT_OF_TIME);
}

async function handleWrongAttempt() {
    if (quiz.settings.limitAttempts) {
        updateAttemptsRemainingBar();

        if (!quiz.currentQuestion.attemptsRemaining) {
            handleAnswer(ANSWER_OUTCOMES.OUT_OF_ATTEMPTS);
            return;
        }
    }

    focusFirstEmptyInput();
    playSFXSafe(`${SFX_DIRECTORY}${SFX_FILENAMES.incorrect}`)
}

export function reviewQuiz() {
    quiz.state.current = GAME_STATES.REVIEW;
    
    prepareReviewUI();
    changeQuestionIndex(0);
}

export function pauseGame() {
    quiz.state.previous = quiz.state.current;
    quiz.state.current = GAME_STATES.PAUSED;

    pauseTimer();
    pauseAllSFX();
    
    if (!elements.vocabAudio.paused) {
        elements.vocabAudio.pause();
    }

    elements.dialogs.pause.showModal();
}

export function resumeGame() {
    quiz.state.current = quiz.state.previous;
    quiz.state.previous = null;

    const audio = elements.vocabAudio;

    if (audio.paused && audio.currentTime > 0 && audio.currentTime < audio.duration) {
        elements.vocabAudio.play().catch(error => console.warn(`Failed to resume audio: ${error}`));
    }

    resumeAllSFX();

    if (quiz.state.current === GAME_STATES.QUESTION) startTimer();
}

export function stopGameplay() {
    pauseTimer();
    stopAllSFX();
    stopAudio(elements.vocabAudio)
    resetGame();
}