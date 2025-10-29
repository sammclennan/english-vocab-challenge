// Module imports
import { SFX_DIRECTORY, DEFAULT_SETTINGS, SFX_FILENAMES } from './constants.js';
import { elements } from './elements.js';
import { quiz, checkAnswer } from './quiz.js';
import { updateTimerDisplay } from './ui.js';
import { playSFXSafe } from './audioManager.js';

// Timer object
export const timer = {};

// Function declarations
export function resetTimerObjectValues() {
    Object.assign(timer, {
        timerRunning: false,
        timeRemaining: 0,
        startTime: null,
        pausedTime: null,
        animationFrameID: null,
        playingTimeWarning: false,
    });
}

export function startTimer() {
    if (timer.timerRunning || !quiz.settings.useTimer) return;
    timer.timerRunning = true;

    const timeLimit = quiz.settings.timePerQuestion;

    if (!timer.timeRemaining) {
        timer.timeRemaining = timeLimit;
    }

    const now = performance.now();
    timer.startTime = now - (timer.pausedTime || 0);

    function animateCountdown(now) {
        const elapsed = now - timer.startTime;
        timer.timeRemaining = Math.max(timeLimit - elapsed, 0);

        updateTimerDisplay();

        if (!timer.playingTimeWarning && timer.timeRemaining <= DEFAULT_SETTINGS.timeWarningThreshold * 1000) {
            timer.playingTimeWarning = true;
            playSFXSafe(`${SFX_DIRECTORY}${SFX_FILENAMES.timeWarning}`);
        }
        
        if (timer.timeRemaining > 0) {
            timer.animationFrameID = requestAnimationFrame(animateCountdown);
        } else {
            checkAnswer(true);
        }
    }

    timer.animationFrameID = requestAnimationFrame(animateCountdown);
}

export function pauseTimer() {
    if (!timer.timerRunning || !quiz.settings.useTimer) return;
    
    if (timer.animationFrameID) {
        cancelAnimationFrame(timer.animationFrameID);
        timer.animationFrameID = null;
    }

    timer.pausedTime = performance.now() - timer.startTime;
    timer.timerRunning = false;

    elements.statusBars.countdownTimer.bar.classList.remove('pulsing');
}

export function resetTimer() {
    pauseTimer();

    timer.timeRemaining = quiz.settings.timePerQuestion;
    timer.startTime = null;
    timer.pausedTime = null;
    timer.playingTimeWarning = false;

    updateTimerDisplay();
}