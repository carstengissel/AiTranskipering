const { compareAllSections } = require('../utils/sectionComparison');
const { diffWords } = require('diff');

// Test data fra en faktisk referat fra 10. februar 2025
const testData = {
    aiReferat: `
Vi har aftalt:
- følge op på ansøgninger
- opdatere CV
- netværk på LinkedIn
- søge bredt
- kigge jobannoncer dagligt

Vi har i dag talt om:
- status på jobsøgning
- kompetenceprofil
- jobmuligheder
- ansøgningsteknik
- karriereveje

Din jobsøgning indtil nu:
- 3 aktive ansøgninger
- 1 samtale i næste uge
`,
    humanReferat: `
Vi har aftalt:
- følge op på alle ansøgninger
- CV revision
- LinkedIn optimering
- bred jobsøgning
- daglig jobsøgning

Vi har i dag talt om:
- jobsøgningsstatus
- faglige kompetencer
- relevante stillinger
- ansøgninger
- karriereudvikling

Din jobsøgning indtil nu:
- 3 ansøgninger i proces
- jobsamtale planlagt
`
};

// Test funktion
function runTest() {
    console.log('Kører test af sektionsberegninger...\n');

    // Log de fulde tekster først
    console.log('AI Referat:');
    console.log(testData.aiReferat);
    console.log('\nHuman Referat:');
    console.log(testData.humanReferat);

    // Beregn ændringer
    const changes = compareAllSections(testData.aiReferat, testData.humanReferat);
    console.log('\nBeregnede ændringer:');
    console.log(changes);

    // Vis detaljer for hver sektion
    const sections = {
        'Vi har aftalt:': ['Vi har aftalt:', 'Vi har i dag talt om:'],
        'Vi har i dag talt om:': ['Vi har i dag talt om:', 'Din jobsøgning indtil nu:'],
        'Din jobsøgning indtil nu:': ['Din jobsøgning indtil nu:', 'Andet']
    };

    Object.entries(sections).forEach(([name, [start, end]]) => {
        console.log(`\n=== ${name} ===`);
        const text1 = extractSection(testData.aiReferat, start, end);
        const text2 = extractSection(testData.humanReferat, start, end);
        
        console.log('\nAI bullet points:');
        console.log(getBulletPoints(text1));
        
        console.log('\nHuman bullet points:');
        console.log(getBulletPoints(text2));
        
        console.log('\nDiff resultat:');
        const diff = diffWords(text1, text2);
        diff.forEach(part => {
            if (part.added) {
                console.log('Tilføjet:', part.value);
            } else if (part.removed) {
                console.log('Fjernet:', part.value);
            }
        });
    });
}

// Hjælpefunktioner
function extractSection(text, start, end) {
    const startIndex = text.indexOf(start);
    if (startIndex === -1) return '';
    
    const contentStart = startIndex + start.length;
    const endIndex = text.indexOf(end, contentStart);
    const contentEnd = endIndex === -1 ? text.length : endIndex;
    
    return text.slice(contentStart, contentEnd).trim();
}

function getBulletPoints(text) {
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.substring(1).trim());
}

// Kør testen
runTest();