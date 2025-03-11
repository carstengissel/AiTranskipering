const { diffWords } = require('diff');
const { compareAllSections } = require('./src/utils/sectionComparison');

// Test data for 10. februar 2025
const testData = {
  aiText: `
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
- 1 samtale i næste uge`,

  humanText: `
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
- jobsamtale planlagt`
};

// Test hver sektion individuelt
function testSection(aiText, humanText, startMarker, endMarker) {
  // Udtræk sektioner
  const startIdxAi = aiText.indexOf(startMarker);
  const endIdxAi = aiText.indexOf(endMarker, startIdxAi + startMarker.length);
  const aiSection = aiText.slice(startIdxAi + startMarker.length, endIdxAi).trim();

  const startIdxHuman = humanText.indexOf(startMarker);
  const endIdxHuman = humanText.indexOf(endMarker, startIdxHuman + startMarker.length);
  const humanSection = humanText.slice(startIdxHuman + startMarker.length, endIdxHuman).trim();

  // Få bullet points
  const aiPoints = aiSection
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-'))
    .map(line => line.substring(1).trim());

  const humanPoints = humanSection
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-'))
    .map(line => line.substring(1).trim());

  // Log detaljer
  console.log(`\n=== ${startMarker.slice(0, -1)} ===`);
  console.log('AI punkter:', aiPoints);
  console.log('Human punkter:', humanPoints);

  // Find ændringer
  const commonPoints = aiPoints.filter(p => 
    humanPoints.some(hp => hp.toLowerCase() === p.toLowerCase())
  );
  const addedPoints = humanPoints.filter(p => 
    !aiPoints.some(ap => ap.toLowerCase() === p.toLowerCase())
  );
  const removedPoints = aiPoints.filter(p => 
    !humanPoints.some(hp => hp.toLowerCase() === p.toLowerCase())
  );

  console.log('\nÆndringer:');
  console.log('Fælles punkter:', commonPoints);
  console.log('Tilføjede punkter:', addedPoints);
  console.log('Fjernede punkter:', removedPoints);
  console.log('Total antal ændringer:', addedPoints.length + removedPoints.length);

  return addedPoints.length + removedPoints.length;
}

// Test alle sektioner
console.log('=== TEST AF SEKTIONSÆNDRINGER ===');

const sections = [
  ['Vi har aftalt:', 'Vi har i dag talt om:'],
  ['Vi har i dag talt om:', 'Din jobsøgning indtil nu:'],
  ['Din jobsøgning indtil nu:', 'Andet']
];

const changes = {};
sections.forEach(([start, end]) => {
  changes[start.slice(0, -1)] = testSection(testData.aiText, testData.humanText, start, end);
});

console.log('\n=== SAMLEDE RESULTATER ===');
console.log(changes);

// Test med compareAllSections funktionen
console.log('\n=== TEST AF compareAllSections ===');
const compareResults = compareAllSections(testData.aiText, testData.humanText);
console.log(compareResults);

// Verificer at resultaterne matcher
console.log('\n=== VERIFICATION ===');
console.log('Resultater skulle være:');
console.log('Vi har aftalt: 5 ændringer');
console.log('Vi har i dag talt om: 5 ændringer');
console.log('Din jobsøgning indtil nu: 2 ændringer');