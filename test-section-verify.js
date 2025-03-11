const testData = require('./test-section-changes');
const diffWords = require('diff').diffWords;

function extractSection(text, startMarker, endMarker) {
    try {
        const startIndex = text.indexOf(startMarker);
        if (startIndex === -1) return '';
        
        const contentStart = startIndex + startMarker.length;
        const endIndex = text.indexOf(endMarker, contentStart);
        const contentEnd = endIndex === -1 ? text.length : endIndex;
        
        return text.slice(contentStart, contentEnd).trim();
    } catch (error) {
        console.error('Error extracting section:', error);
        return '';
    }
}

function calculateChanges(text1, text2) {
    const diff = diffWords(text1, text2);
    const changes = diff.filter(part => part.added || part.removed);
    return changes.length;
}

function verifySectionChanges(interview) {
    const sections = {
        'Vi har aftalt': ['Vi har aftalt:', 'Vi har i dag talt om:'],
        'Vi har i dag talt om': ['Vi har i dag talt om:', 'Din jobsøgning indtil nu:'],
        'Din jobsøgning indtil nu': ['Din jobsøgning indtil nu:', 'Andet']
    };

    const results = {};

    for (const [sectionName, [startMarker, endMarker]] of Object.entries(sections)) {
        const aiSection = extractSection(interview.aiReferat, startMarker, endMarker);
        const humanSection = extractSection(interview.referat, startMarker, endMarker);
        const changes = calculateChanges(aiSection, humanSection);
        results[sectionName] = changes;
    }

    return results;
}

// Test alle interviews
console.log('=== December 17, 2024 ===');
console.log('Interview 1:');
const changes1 = verifySectionChanges(testData.interview1);
console.log(changes1);

console.log('\nInterview 2:');
const changes2 = verifySectionChanges(testData.interview2);
console.log(changes2);

console.log('\nTotal for December 17:');
console.log({
    'Vi har aftalt': changes1['Vi har aftalt'] + changes2['Vi har aftalt'],
    'Vi har i dag talt om': changes1['Vi har i dag talt om'] + changes2['Vi har i dag talt om'],
    'Din jobsøgning indtil nu': changes1['Din jobsøgning indtil nu'] + changes2['Din jobsøgning indtil nu']
});

console.log('\n=== February 6, 2025 ===');
const changes3 = verifySectionChanges(testData.interview3);
console.log(changes3);

console.log('\n=== February 10, 2025 ===');
const changes4 = verifySectionChanges(testData.interview4);
console.log(changes4);

/*
Forventede resultater:

December 17, 2024:
Interview 1 + Interview 2 = Total
"Vi har aftalt": 2 + 2 = 4
"Vi har i dag talt om": 6 + 6 = 12
"Din jobsøgning indtil nu": 4 + 4 = 8

February 6, 2025:
"Vi har aftalt": 2
"Vi har i dag talt om": 3
"Din jobsøgning indtil nu": 1

February 10, 2025:
"Vi har aftalt": 5
"Vi har i dag talt om": 5
"Din jobsøgning indtil nu": 2
*/