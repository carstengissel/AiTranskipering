const { diffWords } = require('diff');

// Function to parse referat sections
function parseReferat(referat) {
  if (!referat) {
    return {
      viHarAftalt: '',
      viHarIDagTaltOm: '',
      dinJobsogningIndtilNu: ''
    };
  }

  try {
    const text = typeof referat === 'string' ? referat : '';
    const sections = {
      viHarAftalt: '',
      viHarIDagTaltOm: '',
      dinJobsogningIndtilNu: ''
    };

    // Extract sections using regex
    const viHarAftaltMatch = text.match(/Vi har aftalt[^]*?([\s\S]*?)(?=Vi har i dag talt om|Din jobsøgning indtil nu|$)/i);
    const viHarTaltOmMatch = text.match(/Vi har i dag talt om[^]*?([\s\S]*?)(?=Vi har aftalt|Din jobsøgning indtil nu|$)/i);
    const jobsogningMatch = text.match(/Din jobsøgning indtil nu[^]*?([\s\S]*?)(?=Vi har aftalt|Vi har i dag talt om|$)/i);

    if (viHarAftaltMatch) sections.viHarAftalt = viHarAftaltMatch[1].trim();
    if (viHarTaltOmMatch) sections.viHarIDagTaltOm = viHarTaltOmMatch[1].trim();
    if (jobsogningMatch) sections.dinJobsogningIndtilNu = jobsogningMatch[1].trim();

    return sections;
  } catch (err) {
    console.error('Error parsing referat:', err);
    return {
      viHarAftalt: '',
      viHarIDagTaltOm: '',
      dinJobsogningIndtilNu: ''
    };
  }
}

// Function to count changes between sections
function countChangedSections(originalReferat, aiReferat) {
  const originalSections = parseReferat(originalReferat);
  const aiSections = parseReferat(aiReferat);

  const changes = {
    viHarAftalt: 0,
    viHarIDagTaltOm: 0,
    dinJobsogningIndtilNu: 0
  };

  // Calculate changes for each section using diffWords
  if (originalSections.viHarAftalt !== aiSections.viHarAftalt) {
    const diff = diffWords(aiSections.viHarAftalt, originalSections.viHarAftalt);
    changes.viHarAftalt = diff.filter(part => part.added || part.removed).length;
  }

  if (originalSections.viHarIDagTaltOm !== aiSections.viHarIDagTaltOm) {
    const diff = diffWords(aiSections.viHarIDagTaltOm, originalSections.viHarIDagTaltOm);
    changes.viHarIDagTaltOm = diff.filter(part => part.added || part.removed).length;
  }

  if (originalSections.dinJobsogningIndtilNu !== aiSections.dinJobsogningIndtilNu) {
    const diff = diffWords(aiSections.dinJobsogningIndtilNu, originalSections.dinJobsogningIndtilNu);
    changes.dinJobsogningIndtilNu = diff.filter(part => part.added || part.removed).length;
  }

  return changes;
}

// Test data for February 6, 2025
const feb6Original = `Vi har aftalt
- Du følger op på din henvendelse om virksomhedspraktik ved ungdomsskolen i Syddjurs Kommune og kontakter dem igen for at få en afklaring.
- Du undersøger mulighederne for jobrettet uddannelse herunder akademiuddannelser og kurser som kan styrke dine kompetencer inden for ledelse og koordination.
- Du kontakter uddannelsessteder for at høre om mulighederne for at lave en uddannelsesplan og få styrket dine kompetencer.
- Du sender ansøgningen om jobrettet uddannelse (AR 237) til os når du har fundet relevante kurser.
- Du fortsætter med at søge opslåede stillinger og sender uopfordrede ansøgninger hvor det giver mening.

Vi har i dag talt om
 Din oplevelse med at have søgt et job hvor ansøgningen blev trukket tilbage og hvordan du kan håndtere skuffelsen.
- Muligheden for at få virksomhedspraktik ved ungdomsskolen i Syddjurs Kommune og vigtigheden af at følge op på din henvendelse.
- Dine drømme og ønsker for fremtidige jobmuligheder herunder arbejde inden for ungdomsområdet og ledelsesroller.
- Mulighederne for jobrettet uddannelse og hvordan du kan styrke dine kompetencer gennem kurser og uddannelsesplaner.
- Hvordan du kan bruge din erfaring og kvalifikationer til at søge bredere og målrette dine ansøgninger.

Din jobsøgning indtil nu
- Du har søgt flere stillinger herunder en stilling som pædagogisk assistent i Syddjurs Kommune.
- Du har sendt uopfordrede ansøgninger og fulgt op på dem hvor det har været relevant.
- Du har undersøgt mulighederne for at tage jobrettet uddannelse og deltaget i webinarer for at få inspiration til din jobsøgning.
- Du har opdateret dit CV og tilføjet dine kvalifikationer og erfaringer for at gøre det mere attraktivt for potentielle arbejdsgivere.
- Du har været aktiv i at kontakte arbejdsgivere og følge op på dine henvendelser for at øge dine chancer for at få en samtale.

Kære Gabriele, hvis du spørgsmål til referatet, hører jeg gerne fra dig.

Tak for samtalen.`;

const feb6AI = `**Vi har aftalt**
- Du følger op på din henvendelse om virksomhedspraktik ved ungdomsskolen i Sours Kommune og kontakter dem igen for at få en afklaring.
- Du undersøger mulighederne for jobrettet uddannelse herunder akademiuddannelser og kurser som kan styrke dine kompetencer inden for ledelse og koordination.
- Du kontakter uddannelsessteder for at høre om mulighederne for at lave en uddannelsesplan og få styrket dine kompetencer.
- Du sender ansøgningen om jobrettet uddannelse (AR 237) til os når du har fundet relevante kurser.
- Du fortsætter med at søge opslåede stillinger og sender uopfordrede ansøgninger hvor det giver mening.

**Vi har i dag talt om**
- Din oplevelse med at have søgt et job hvor ansøgningen blev trukket tilbage og hvordan du kan håndtere skuffelsen.
- Muligheden for at få virksomhedspraktik ved ungdomsskolen i Sours Kommune og vigtigheden af at følge op på din henvendelse.
- Dine drømme og ønsker for fremtidige jobmuligheder herunder arbejde inden for ungdomsområdet og ledelsesroller.
- Mulighederne for jobrettet uddannelse og hvordan du kan styrke dine kompetencer gennem kurser og uddannelsesplaner.
- Hvordan du kan bruge din erfaring og kvalifikationer til at søge bredere og målrette dine ansøgninger.

**Din jobsøgning indtil nu**
- Du har søgt flere stillinger herunder en stilling som pædagogisk assistent i Syddjurs Kommune.
- Du har sendt uopfordrede ansøgninger og fulgt op på dem hvor det har været relevant.
- Du har undersøgt mulighederne for at tage jobrettet uddannelse og deltaget i webinarer for at få inspiration til din jobsøgning.
- Du har opdateret dit CV og tilføjet dine kvalifikationer og erfaringer for at gøre det mere attraktivt for potentielle arbejdsgivere.
- Du har været aktiv i at kontakte arbejdsgivere og følge op på dine henvendelser for at øge dine chancer for at få en samtale.`;

// Test data for February 10, 2025
const feb10Original = `Vi har aftalt
- Du kontakter DSB for at undersøge mulighederne for at blive billetkontrollør og tilbyder 4 ugers virksomhedspraktik som en del af din ansøgning.
- Du følger op på de ansøgninger, hvor du ikke har modtaget svar, for at få feedback på, hvorfor du ikke kom i betragtning.
- Du fortsætter med at bruge ansøgningshjælperen Frost AI til at forbedre dine ansøgninger.
- Du booker din næste samtale til den 24. marts kl. 09:00, hvor Britta vil kontakte dig via Teams.
- Du tager screenshots af din joblog, da der er tekniske problemer med at se den online.

Vi har i dag talt om
- Muligheden for at blive billetkontrollør hos DSB og hvordan du kan tilbyde virksomhedspraktik for at afprøve jobbet.
- Brug af supplerende dagpenge i op til 30 uger, hvis du får deltidsarbejde.
- Vigtigheden af at følge op på ansøgninger, hvor du ikke har modtaget svar, for at få feedback og forbedre dine fremtidige ansøgninger.
- Brug af ansøgningshjælperen Frost AI, som du allerede har haft succes med.
- Muligheden for at tage 6 ugers jobrettet uddannelse og hvordan du kan tilmelde dig kurser, der kan forbedre dine jobmuligheder.

Din jobsøgning indtil nu
- Du har søgt bredt og blandt andet søgt stillinger hos Dagrofa i Hjørring.
- Du har overvejet at blive billetkontrollør hos DSB, men har haft svært ved at finde information om kravene.
- Du har oplevet udfordringer med at få svar på dine ansøgninger og føler dig til tider diskrimineret på grund af din alder.
- Du har brugt ansøgningshjælperen Frost AI til at lave ansøgninger og har fundet den meget nyttig.
- Du har tekniske problemer med at opdatere din joblog online, men vil tage screenshots som en midlertidig løsning.`;

const feb10AI = `**Vi har aftalt**
- Du kontakter DSB for at undersøge mulighederne for at blive billetkontrollør og tilbyder 4 ugers virksomhedspraktik som en del af din ansøgning.
- Du følger op på de ansøgninger hvor du ikke har modtaget svar for at få feedback på hvorfor du ikke kom i betragtning.
- Du fortsætter med at bruge ansøgningshjælperen Frost AI til at forbedre dine ansøgninger.
- Du booker din næste samtale til den 24. marts kl. 09:00 hvor Britta vil kontakte dig via Teams.
- Du tager screenshots af din joblog da der er tekniske problemer med at se den online.

**Vi har i dag talt om**
- Muligheden for at blive billetkontrollør hos DSB og hvordan du kan tilbyde virksomhedspraktik for at afprøve jobbet.
- Brug af supplerende dagpenge i op til 30 uger hvis du får deltidsarbejde.
- Vigtigheden af at følge op på ansøgninger hvor du ikke har modtaget svar for at få feedback og forbedre dine fremtidige ansøgninger.
- Brug af ansøgningshjælperen Frost AI som du allerede har haft succes med.
- Muligheden for at tage 6 ugers jobrettet uddannelse og hvordan du kan tilmelde dig kurser der kan forbedre dine jobmuligheder.

**Din jobsøgning indtil nu**
- Du har søgt bredt og blandt andet søgt stillinger hos Dagrofa i Hjørring.
- Du har overvejet at blive billetkontrollør hos DSB men har haft svært ved at finde information om kravene.
- Du har oplevet udfordringer med at få svar på dine ansøgninger og føler dig til tider diskrimineret på grund af din alder.
- Du har brugt ansøgningshjælperen Frost AI til at lave ansøgninger og har fundet den meget nyttig.
- Du har tekniske problemer med at opdatere din joblog online men vil tage screenshots som en midlertidig løsning.`;

// Calculate changes for February 6, 2025
const feb6Changes = countChangedSections(feb6Original, feb6AI);
console.log('February 6, 2025 changes:');
console.log(feb6Changes);

// Calculate changes for February 10, 2025
const feb10Changes = countChangedSections(feb10Original, feb10AI);
console.log('February 10, 2025 changes:');
console.log(feb10Changes);