// Module imports
import { elements } from './elements.js';

// Fireworks animation properties
export const fireworks = {
    minStars: 50,
    maxStars: 300,
    maxHueVariation: 50,
    maxLightnessVariation: 20,
    minPctDiameter: 30,
    maxPctDiameter: 100,
    maxDuration: 3,
    minDelay: 200,
    maxDelay: 2000,
    minCorrectRatio: 0.25,
    animationFrameID: null,
}

// Function declarations
function spawnFirework(backgroundElement) {
    const fireworkXPos = Math.random() * 100;
    const fireworkYPos = Math.random() * 100;

    const starCount = Math.floor(Math.random() * (fireworks.maxStars - fireworks.minStars + 1)) + fireworks.minStars;

    const firework = document.createElement('div');
    firework.classList.add('firework'); 
    firework.style.left = `${fireworkXPos}%`;
    firework.style.top = `${fireworkYPos}%`;

    let backgroundLayers = [];

    const baseHue = Math.floor(Math.random() * 360);

    for (let i = 0; i < starCount; i++) {
        const starXPos = Math.floor(Math.random() * 100);
        const starYPos = Math.floor(Math.random() * 100);

        const hueOffset = Math.floor(
            Math.random() * (fireworks.maxHueVariation + 1) - fireworks.maxHueVariation / 2
        );
        
        const lightness = Math.floor(Math.random() * fireworks.maxLightnessVariation) + 50;

        const star = `radial-gradient(circle, hsl(${baseHue + hueOffset}, 100%, ${lightness}%) var(--star-size), transparent 70%) ${starXPos}% ${starYPos}%`;

        backgroundLayers.push(star);
    }

    firework.style.background = backgroundLayers.join(', ');
    firework.style.backgroundRepeat = 'no-repeat';
    firework.style.backgroundSize = 'calc(var(--star-size) * 2) calc(var(--star-size) * 2)';

    const explosionDiameter = Math.floor(Math.random() * (fireworks.maxPctDiameter - fireworks.minPctDiameter)) + fireworks.minPctDiameter;

    firework.style.setProperty('--pct-diameter', `${explosionDiameter}%`);
    firework.style.setProperty('--duration', `${fireworks.maxDuration * explosionDiameter / 100}s`);
    
    firework.addEventListener('animationend', (event) => {
        if (event.animationName === 'explode-firework') {
            firework.remove();
        }
    });

    backgroundElement.appendChild(firework);
}

export function startFireworksDisplay() {
    function getRandomDelay() {
        return Math.floor(Math.random() * (fireworks.maxDelay - fireworks.minDelay)) + fireworks.minDelay;
    }

    function animateFireworks(now) {
        if (now - lastFireworkTime > randomDelay) {
            spawnFirework(elements.endGameUI.fireworksBackground);

            lastFireworkTime = now;
            randomDelay = getRandomDelay();
        }
        fireworks.animationFrameID = requestAnimationFrame(animateFireworks);
    }

    let lastFireworkTime = performance.now();
    let randomDelay = getRandomDelay();

    fireworks.animationFrameID = requestAnimationFrame(animateFireworks)
}