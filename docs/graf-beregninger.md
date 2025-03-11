# Grafberegninger i AI Transkribering

Dette dokument beskriver beregningerne brugt i de forskellige grafer i applikationen.

## Generelt for alle grafer
Alle grafer bruger en fælles funktion `groupDataByTimeScale` til at gruppere data efter forskellige tidsperioder:
- Dage
- Uger
- Måneder
- Kvartaler
- År

## 1. Gennemsnitlige Sektionsændringer (AverageSectionChangesChart)

Denne graf viser det gennemsnitlige antal ændringer i hver sektion over tid.

### Beregningsformel:
```javascript
gennemsnit = Math.round((værdi / antalSamtaler) * 10) / 10
```

### Sektioner der trackes:
- "Vi har aftalt"
- "Vi har i dag talt om"
- "Din jobsøgning indtil nu"

Eksempel:
- Hvis der er 10 samtaler i en periode, og der er 50 ændringer i "Vi har aftalt" sektionen
- Gennemsnit = Math.round((50 / 10) * 10) / 10 = 5.0 ændringer i gennemsnit

## 2. Ændringsstatistik (ChangesStatisticsChart)

Viser det totale antal samtaler over tid.

### Beregning:
- Simpel optælling af samtaler per tidsperiode via `totalCount`
- Grupperet efter valgt tidsperiode (dag/uge/måned/kvartal/år)

## 3. Samtaletyper Fordeling (ConversationTypesChart)

Viser den procentvise fordeling af forskellige samtaletyper.

### Beregninger:
1. Total antal samtaler:
```javascript
totalAntalSamtaler = data.reduce((total, item) => total + (item.count || 1), 0)
```

2. Procentvis fordeling:
```javascript
procent = ((værdi / totalAntalSamtaler) * 100).toFixed(1)
```

## 4. Thumbs Up/Down Statistik (FeedbackChart)

Viser fordelingen af positive og negative tilbagemeldinger over tid.

### Beregninger:
1. Find maksimumværdi for y-aksen:
```javascript
maksimumVærdi = Math.max(
    ...data.flatMap(item => [
        item.positiveFeedback || 0,
        item.negativeFeedback || 0
    ])
)
```

2. Afrunding til nærmeste hele tal:
```javascript
afrundetMaksimum = Math.ceil(maksimumVærdi)
```

## 5. Tidsstatistik (TimeStatisticsChart)

Viser gennemsnitlige behandlingstider for AI-rapport og godkendelse.

### Beregninger:
1. Maksimum godkendelsestid:
```javascript
maksGodkendelseTid = Math.max(
    ...grupperedeData.map(item => {
        const værdi = Number(item.avgTimeToApproval);
        return !isNaN(værdi) && værdi > 0 && værdi < 1000 ? værdi : 0;
    })
)
```

2. Maksimum AI-rapport tid:
```javascript
maksAIRapportTid = Math.max(
    ...grupperedeData.map(item => {
        const værdi = Number(item.avgTimeToAiReport);
        return !isNaN(værdi) && værdi > 0 && værdi < 1000 ? værdi : 0;
    })
)
```

3. Samlet maksimum (for y-aksens øvre grænse):
```javascript
samletMaksimum = Math.max(maksGodkendelseTid, maksAIRapportTid, 100)
```

Bemærk: Værdier over 1000 minutter eller negative værdier filtreres fra for at undgå ekstreme udsving i grafen.