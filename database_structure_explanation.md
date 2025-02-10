# Database Struktur Ændring - Samtale Transskription System

## Ny Tabelstruktur

Den nye tabel `samtale_transcription_statisics` erstatter de tidligere tabeller `samind_ai_referat` og `samind_referat`. Denne tabel repræsenterer en komplet workflow for håndtering af samtaler, fra transskription til AI-behandling og endelig godkendelse.

## Proces Flow

### 1. Start af processen
- En samtale transskriberes
- Når transskriberingen er færdig, registreres tiden i `transcription_recieved_at`

### 2. AI-behandling
- Efter transskriberingen sendes teksten til AI-behandling
- AI genererer et referat som gemmes i `ai_referat`
- Tidspunktet for AI's færdiggørelse gemmes i `ai_referat_recieved_at`

### 3. Menneskelig behandling
- En sagsbehandler gennemgår og retter AI-referatet
- Det godkendte referat gemmes i `referat`
- Godkendelsestidspunktet gemmes i `referat_godkendt_at`

### 4. Versionering og sporbarhed
- `reg_init` indeholder initialerne på det program der har oprettet/opdateret rækken
- `reg_tid` registrerer tidspunktet for oprettelse eller opdatering
- `reg_vers_nr` holder styr på versioner hvis en række ændres
- `regenerated` (j/n) indikerer om AI-referatet er blevet regenereret

## Forbedringer i forhold til gamle tabeller

### 1. Bedre processporing
- Hvor de gamle tabeller havde separate rækker for AI og menneskeligt referat, samles det nu i én række
- Der er nu præcis sporing af hver fase i processen med separate tidsstempler
- Man kan nemt se hele flowet fra transskription til godkendelse

### 2. Simplificeret struktur
- Fjernelse af `medl_ident` og `samind_lbnr` indikerer at tabellen fokuserer på selve processen
- Feedback er forenklet til et enkelt ja/nej felt
- Regenerering er også forenklet til et ja/nej felt (j/n) i stedet for en dato

### 3. Bedre datakvalitet
- Brug af `nvarchar` i stedet for `nchar` giver mere effektiv lagring
- NOT NULL på kritiske felter sikrer datakvalitet
- Mere struktureret versionering med `reg_vers_nr`

## Tabel Definition

```sql
CREATE TABLE [dbo].[samtale_transcription_statisics](
   referat nvarchar(3000) NOT NULL,
   ai_referat nvarchar(3000) NOT NULL,
   transcription_recieved_at [datetime2](7),
   ai_referat_recieved_at [datetime2](7),
   referat_godkendt_at [datetime2](7),
   feedback nvarchar(1),
   samtyp_type nvarchar(4) NOT NULL,
   regenerated nvarchar(1) NOT NULL,
   referat_started_at [datetime2](7),
   reg_init nvarchar(12) NOT NULL,
   reg_tid [datetime2](7) NOT NULL,
   reg_vers_nr int NOT NULL
)
```
