const { diffWords } = require('diff');

// Funktion til at udtrække bullet points
const extractBulletPoints = (text, startMarker, endMarker) => {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return [];
  
  const contentStart = startIndex + startMarker.length;
  const endIndex = text.indexOf(endMarker, contentStart);
  const contentEnd = endIndex === -1 ? text.length : endIndex;
  
  const sectionText = text.slice(contentStart, contentEnd).trim();
  
  return sectionText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-'))
    .map(line => line.substring(1).trim());
};

// Funktion til at beregne ændringer
const calculateChanges = (points1, points2) => {
  // Sammenlign hver bullet point
  let changes = 0;
  const commonPoints = new Set();

  // Find fælles punkter
  points1.forEach(p1 => {
    if (points2.includes(p1)) {
      commonPoints.add(p1);
    }
  });

  // Tæl ændringer (tilføjede + fjernede punkter)
  changes = (points1.length - commonPoints.size) + (points2.length - commonPoints.size);

  return changes;
};

// Test data fra 10. februar 2025
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

// Test hver sektion
const sections = {
  'Vi har aftalt': ['Vi har aftalt:', 'Vi har i dag talt om:'],
  'Vi har i dag talt om': ['Vi har i dag talt om:', 'Din jobsøgning indtil nu:'],
  'Din jobsøgning indtil nu': ['Din jobsøgning indtil nu:', 'Andet']
};

console.log('=== Test af sektionsændringer ===\n');

Object.entries(sections).forEach(([sectionName, [start, end]]) => {
  console.log(`Testing sektion: ${sectionName}`);
  
  const aiPoints = extractBulletPoints(testData.aiText, start, end);
  const humanPoints = extractBulletPoints(testData.humanText, start, end);
  
  console.log('\nAI bullet points:', aiPoints);
  console.log('Human bullet points:', humanPoints);
  
  const changes = calculateChanges(aiPoints, humanPoints);
  console.log(`\nAntal ændringer: ${changes}`);
  
  // Vis detaljerede ændringer
  console.log('\nDetaljerede ændringer:');
  const commonPoints = aiPoints.filter(p => humanPoints.includes(p));
  const removedPoints = aiPoints.filter(p => !humanPoints.includes(p));
  const addedPoints = humanPoints.filter(p => !aiPoints.includes(p));
  
  console.log('Fælles punkter:', commonPoints);
  console.log('Fjernede punkter:', removedPoints);
  console.log('Tilføjede punkter:', addedPoints);
  console.log('\n-------------------\n');
});