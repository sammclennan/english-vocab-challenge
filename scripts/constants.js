// Global constant declarations
export const VOCAB_DATA_DIRECTORY = './data/';
export const VOCAB_DATA_FILENAME = 'vocab_data';
export const IMAGE_DIRECTORY = './media/images/english/';
export const AUDIO_DIRECTORY = './media/audio/english/';
export const SFX_DIRECTORY = './media/audio/sound_effects/';

export const GAME_STATES = {
    MENU: 'menu',
    QUESTION: 'question',
    ANSWER: 'answer',
    END: 'end',
    REVIEW: 'review',
    PAUSED: 'paused',
}

export const DEFAULT_SETTINGS = {
    duplicateQuestions: false,
    defaultQuestionCount: 25,
    minAnswerTime: 5,
    maxAnswerTime: 60,
    defaultAnswerTime: 20,
    defaultAttempts: 3,
    minAttempts: 1,
    maxAttempts: 10,
    timeWarningThreshold: 3,
    defaultEffectiveDuration: 0.5,
}

export const ANSWER_OUTCOMES = {
    CORRECT: 'correct',
    OUT_OF_ATTEMPTS: 'outOfAttempts',
    OUT_OF_TIME: 'outOfTime',
    SHOW_ANSWER: 'showAnswer',
}

export const SFX_FILENAMES = {
    incorrect: 'incorrect.mp3',
    buttonClick: 'button_click.mp3',
    checkboxClick: 'checkbox_click.mp3',
    correct: 'correct.mp3',
    navButtonClick: 'nav_button_click.mp3',
    outOfAttempts: 'out_of_attempts.mp3',
    outOfTime: 'out_of_time.mp3',
    quizCompleted: 'quiz_completed.mp3',
    quizFailed: 'quiz_failed.mp3',
    showAnswer: 'show_answer.mp3',
    spinnerClick: 'spinner_click.mp3',
    timeWarning: 'time_warning.mp3',
}

export const COMPLETION_MESSAGES = {
    zero: 'おやおや！答えが逃げちゃったかな？',
    low: 'まだウォーミングアップ中！次は本気でいこう！',
    average: 'なかなかやるね！次はもっと上を目指そう！',
    high: '素晴らしい！あともう少しで満点だ！',
    perfect: 'Wow! 100点満点！あなたは天才だ！',
}

export const VALIDATION_MESSAGES = {
    emptyField: '入力してください',
    missingCharacter: '文字の数が足りません',
}

export const COLORS = {
    redTransparent: 'rgba(255, 0, 0, 0.3)',
    greenTransparent: 'rgba(0, 255, 0, 0.3)',
    yellowTransparent: 'rgba(255, 255, 0, 0.3)',
}