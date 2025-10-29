// DOM elements object
export const elements = {
    interfaces: {
        menu: document.querySelector('#menu-interface'),
        quiz: document.querySelector('#quiz-interface'),
    },
    menu: {
        dataSelect: {
            form: document.querySelector('#data-select-form'),
        },
        settings: {
            form: document.querySelector('#settings-form'),
            returnButton: document.querySelector('#settings-return-button'),
            questionCount: document.querySelector('#question-count-setting'),
            useAllQuestions: document.querySelector('#use-all-questions-setting'),
            useTimer: document.querySelector('#use-timer-setting'),
            timePerQuestion: document.querySelector('#time-per-question-setting'),
            limitAttempts: document.querySelector('#limit-attempts-setting'),
            attemptsPerQuestion: document.querySelector('#attempts-per-question-setting'),
        },
    },
    gameplayWidget: {
        widget: document.querySelector('#gameplay-widget'),
        sections: {
            top: document.querySelector('.gameplay-widget-section--top'),
            middle: document.querySelector('.gameplay-widget-section--middle'),
            bottom: document.querySelector('.gameplay-widget-section--bottom'),
        }
    },
    navButtons: {
        home: document.querySelector('#home-button'),
        pause: document.querySelector('#pause-button'),
    },
    statusBars: {
        attemptsRemaining: {
            bar: document.querySelector('#attempts-remaining-bar'),
            fill: document.querySelector('#attempts-remaining-bar .status-bar-fill'),
        },
        countdownTimer: {
            bar: document.querySelector('#countdown-timer-bar'),
            fill: document.querySelector('#countdown-timer-bar .status-bar-fill'),
        },
        quizProgress: {
            bar: document.querySelector('#quiz-progress-bar'),
            segments: null,
        },
    },
    countdownTimer: document.querySelector('.countdown-timer'),
    vocabImage: {
        container: document.querySelector('.image-container'),
        image: document.querySelector('#main-image'),
        attribution: document.querySelector('#image-attribution'),
    },
    vocabDisplay: {
        container: document.querySelector('.vocab-display'),
        jp: document.querySelector('#vocab-jp'),
        eng: {
            container: document.querySelector('#vocab-eng'),
            textDisplays: null,
            inputs: null
        }
    },
    endGameUI: {
        container: document.querySelector('.end-game-container'),
        finalScore: document.querySelector('#final-score'),
        questionCount: document.querySelector('#question-count'),
        message: document.querySelector('#completion-message'),
        reviewButton: document.querySelector('#review-quiz-button'),
        fireworksBackground: document.querySelector('.fireworks-background'),
    },
    gameplayControls: {
        container: document.querySelector('.gameplay-controls'),
        prevReview: document.querySelector('#prev-review-button'),
        playAudio: document.querySelector('#play-audio-button'),
        showAnswer: document.querySelector('#show-answer-button'),
        submitAnswer: document.querySelector('#submit-answer-button'),
        nextQuestion: document.querySelector('#next-question-button'),
        nextReview: document.querySelector('#next-review-button'),
    },
    performanceStats: {
        wrappers: document.querySelectorAll('.performance-stat-wrapper'),
        correctCount: document.querySelector('#correct-count'),
        incorrectCount: document.querySelector('#incorrect-count'),
        showAnswerCount: document.querySelector('#show-answer-count'),
        accuracy: document.querySelector('#accuracy'),
        currentStreak: document.querySelector('#current-streak'),
        avgAnswerTime: document.querySelector('#average-answer-time'),
    },
    dialogs: {
        dataMenu: document.querySelector('#data-menu-dialog'),
        pause: document.querySelector('#pause-dialog'),
    },
    vocabAudio: document.querySelector('#vocab-audio'),
}

elements.menu.settings.numberInputs = elements.menu.settings.form.querySelectorAll('input[type="number"]');
elements.menu.settings.numberSpinButtons = elements.menu.settings.form.querySelectorAll('.number-spin-button');