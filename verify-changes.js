const { compareAllSections } = require('./src/utils/sectionComparison');

// Test data for alle tre datoer
const testData = {
  // 17. december 2024 - Interview 1
  dec17_1: {
    aiText: `
Vi har aftalt:
- opfølgning næste uge
- kontakt virksomhed X
- opdater LinkedIn profil

Vi har i dag talt om:
- status på ansøgninger
- jobmuligheder
- kompetenceudvikling
- netværksaktiviteter
- CV opdatering
- karrierevalg

Din jobsøgning indtil nu:
- 3 aktive ansøgninger
- netværksmøder planlagt
- CV opdateret
- LinkedIn profil forbedret`,

    humanText: `
Vi har aftalt:
- opfølgning om 14 dage
- kontakt tre virksomheder
- optimér LinkedIn profil

Vi har i dag talt om:
- fremdrift i jobsøgning
- relevante stillinger
- kompetencebehov
- netværksstrategi
- CV forbedringer
- karrieremuligheder

Din jobsøgning indtil nu:
- 5 ansøgninger sendt
- to netværksmøder booket
- nyt CV klar
- professionel LinkedIn profil`
  },

  // 6. februar 2025
  feb6: {
    aiText: `
Vi har aftalt:
- møde i marts
- fokus på IT-jobs

Vi har i dag talt om:
- jobmarkedet
- tekniske krav
- ansøgningsstrategi

Din jobsøgning indtil nu:
- 2 ansøgninger sendt
- afventer svar`,

    humanText: `
Vi har aftalt:
- møde start april
- bred IT-jobsøgning

Vi har i dag talt om:
- aktuelle jobmuligheder
- kompetencekrav
- målrettet ansøgning

Din jobsøgning indtil nu:
- 3 ansøgninger i proces
- et afslag modtaget`
  },

  // 10. februar 2025
  feb10: {
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
  }
};

// Test funktion
function verifyChanges(date, data) {
  console.log(`\n=== Test af ${date} ===`);
  const changes = compareAllSections(data.aiText, data.humanText);
  console.log('Beregnede ændringer:', changes);
  return changes;
}

// Kør tests
console.log('=== VERIFICERING AF SEKTIONSÆNDRINGER ===');

const dec17_1_changes = verifyChanges('17. december 2024 (Interview 1)', testData.dec17_1);
const feb6_changes = verifyChanges('6. februar 2025', testData.feb6);
const feb10_changes = verifyChanges('10. februar 2025', testData.feb10);

// Verificer resultater
console.log('\n=== VERIFICERING AF RESULTATER ===');
console.log('17. december skulle vise:', {
  viHarAftalt: 2,
  viHarIDagTaltOm: 6,
  dinJobsogningIndtilNu: 4
});

console.log('6. februar skulle vise:', {
  viHarAftalt: 2,
  viHarIDagTaltOm: 3,
  dinJobsogningIndtilNu: 1
});

console.log('10. februar skulle vise:', {
  viHarAftalt: 5,
  viHarIDagTaltOm: 5,
  dinJobsogningIndtilNu: 2
});

// Check om resultaterne matcher
const matches = {
  dec17: JSON.stringify(dec17_1_changes) === JSON.stringify({
    viHarAftalt: 2,
    viHarIDagTaltOm: 6,
    dinJobsogningIndtilNu: 4
  }),
  feb6: JSON.stringify(feb6_changes) === JSON.stringify({
    viHarAftalt: 2,
    viHarIDagTaltOm: 3,
    dinJobsogningIndtilNu: 1
  }),
  feb10: JSON.stringify(feb10_changes) === JSON.stringify({
    viHarAftalt: 5,
    viHarIDagTaltOm: 5,
    dinJobsogningIndtilNu: 2
  })
};

console.log('\n=== TEST RESULTATER ===');
console.log('17. december matcher:', matches.dec17 ? 'JA ✓' : 'NEJ ✗');
console.log('6. februar matcher:', matches.feb6 ? 'JA ✓' : 'NEJ ✗');
console.log('10. februar matcher:', matches.feb10 ? 'JA ✓' : 'NEJ ✗');