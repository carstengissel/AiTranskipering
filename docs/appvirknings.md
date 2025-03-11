# App Virkemåde

## Database
Appen bruger en SQL Server database med tabellen `ai_statistik` der indeholder:
- `referat`: Det godkendte referat
- `ai_referat`: Det AI-genererede referat
- `referat_godkendt_at`: Tidspunkt for godkendelse
- Andre metadata felter (feedback, tidspunkter, samtaletype osv.)

## Frontend Komponenter

### Cards (ReportDetail)
- Viser detaljeret sammenligning mellem AI og godkendt referat
- Bruger diffWords til at beregne ændringer i hver sektion:
  * "Vi har aftalt"
  * "Vi har i dag talt om" 
  * "Din jobsøgning indtil nu"
- Viser det præcise antal ændringer mellem versionerne

### Grafer
1. "Sektionsændringer over tid"
   - Viser antal ændringer per sektion over tid
   - X-akse: Datoer
   - Y-akse: Antal ændringer
   - Grupperet efter godkendelsesdato (referat_godkendt_at)

2. "Gns. Sektionsændringer over tid"
   - Viser gennemsnitlige ændringer per sektion
   - Beregnes som total ændringer / antal referater per dag
   - Samme sektioner som i Cards

## Backend API
- `/api/timeline-stats`: Henter data til graferne
- `/api/kpi-stats`: Henter overordnede statistikker
- `/api/samind_referat`: Henter detaljerede referat data

## Nuværende Problem
Graferne bruger SQL til at beregne ændringer, mens Cards bruger diffWords. Dette giver forskellige resultater. Vi skal:

1. Fjerne SQL beregninger
2. Implementere samme diffWords logik som i Cards
3. Beholde alt eksisterende design og funktionalitet
4. Kun opdatere beregningslogikken i graferne

## Løsningsstrategi
1. Identificere den eksisterende diffWords implementering i Cards
2. Genbruge denne logik i backend API'et
3. Opdatere grafer til at bruge de nye beregninger
4. Bevare alt eksisterende UI/UX

## Forventet Resultat
- Samme antal ændringer vises i både Cards og grafer
- Konsistent beregningsmetode på tværs af appen
- Uændret brugeroplevelse og design