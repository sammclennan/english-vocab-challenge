// Function declarations
export async function loadVocabJSON(filename, directory) {
    const path = `${directory}${filename}.json`
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.statusText}`);
    }

    return await response.json();
}

export function roundXDP(number, dp) {
    const factor = 10 ** dp;
    return Math.round(number * factor) / factor;
}

export function verifyIntegerInput(inputValue, inputName, minValue, maxValue = Infinity) {
    const parsedValue = parseInt(inputValue, 10);

    if (isNaN(parsedValue) || parsedValue < minValue || parsedValue > maxValue) {
        console.error(`Invalid value for ${inputName}: ${inputValue}`);
        return null;
    }

    return parsedValue;
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [hours ? hours : null, minutes, secs]
        .filter(unit => unit !== null)
        .map(unit => String(unit).padStart(2, '0'))
        .join(':');
}