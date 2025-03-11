import difflib
import json
import pyodbc
from typing import Dict, List, Tuple

"""
Dette program implementerer både den visuelle sammenligning og procentberegning, sammen med database-integration.

Hovedfunktioner:
- extract_section: Udtrækker tekst mellem sektionsmarkører
- get_word_diff: Finder tilføjede/fjernede ord og beregner ændringsprocent
- compare_sections: Sammenligner alle sektioner
- save_to_database: Gemmer resultater i databasen

Eksempel på brug:
    comparator = TextComparison()
    results = comparator.compare_sections(ai_text, human_text)
    comparator.save_to_database(referat_id, results)
"""

class TextComparison:
    def __init__(self):
        # Sektioner der skal sammenlignes
        self.sections = {
            'viHarAftalt': ('Vi har aftalt', 'Vi har i dag talt om'),
            'viHarIDagTaltOm': ('Vi har i dag talt om', 'Din jobsøgning indtil nu'),
            'dinJobsogningIndtilNu': ('Din jobsøgning indtil nu', 'Andet')
        }

    def extract_section(self, text: str, start_marker: str, end_marker: str) -> str:
        """Udtræk tekst mellem to markører"""
        try:
            start = text.index(start_marker) + len(start_marker)
            try:
                end = text.index(end_marker, start)
            except ValueError:
                end = len(text)
            return text[start:end].strip()
        except ValueError:
            return ""

    def get_word_diff(self, text1: str, text2: str) -> Tuple[List[str], List[str], float]:
        """
        Sammenligner to tekster og returnerer tilføjede og fjernede ord samt ændringsprocent.
        
        Bruger Python's difflib til at implementere samme funktionalitet som 'diffWords' i JavaScript.
        Markerer tilføjede ord med grøn baggrund og fjernede ord med rød baggrund i output.
        
        Returns:
            Tuple indeholdende:
            - Liste af tilføjede ord
            - Liste af fjernede ord
            - Ændringsprocent (skaleret med 0.25 som i JavaScript)
        """
        # Split tekster i ord
        words1 = text1.split()
        words2 = text2.split()
        
        # Brug difflib til at finde forskelle
        differ = difflib.Differ()
        diff = list(differ.compare(words1, words2))
        
        # Find tilføjede og fjernede ord
        added = [word[2:] for word in diff if word.startswith('+ ')]
        removed = [word[2:] for word in diff if word.startswith('- ')]
        
        # Beregn ændringsprocent
        total_words = len(words2) if words2 else 1  # Undgå division med 0
        changes = len(added) + len(removed)
        
        # Skaler procenten ned med 0.25 som i JavaScript-implementeringen
        percentage = min(100, round((changes / total_words) * 25))
        
        return added, removed, percentage

    def compare_sections(self, ai_text: str, human_text: str) -> Dict:
        """
        Sammenligner sektioner mellem AI og menneske-redigeret tekst.
        Returnerer et dictionary med resultater for hver sektion.
        """
        results = {}
        
        for section_name, (start_marker, end_marker) in self.sections.items():
            # Udtræk sektioner
            ai_section = self.extract_section(ai_text, start_marker, end_marker)
            human_section = self.extract_section(human_text, start_marker, end_marker)
            
            # Find forskelle
            added, removed, percentage = self.get_word_diff(ai_section, human_section)
            
            results[section_name] = {
                'added_words': added,
                'removed_words': removed,
                'change_percentage': percentage,
                'ai_text': ai_section,
                'human_text': human_section
            }
        
        return results

    def save_to_database(self, referat_id: int, comparison_results: Dict) -> None:
        """
        Gem sammenligningsresultater i databasen.
        Resultaterne gemmes i SectionComparisons tabellen defineret i schema.sql.
        """
        try:
            # Opret forbindelse til databasen (tilpas connection string efter behov)
            conn = pyodbc.connect('DRIVER={SQL Server};SERVER=your_server;DATABASE=your_db;UID=your_username;PWD=your_password')
            cursor = conn.cursor()
            
            # Indsæt resultater for hver sektion
            for section_name, results in comparison_results.items():
                cursor.execute("""
                    INSERT INTO SectionComparisons (
                        referat_id,
                        section_name,
                        change_percentage,
                        added_words,
                        removed_words,
                        ai_text,
                        human_text
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    referat_id,
                    section_name,
                    results['change_percentage'],
                    json.dumps(results['added_words']),
                    json.dumps(results['removed_words']),
                    results['ai_text'],
                    results['human_text']
                ))
            
            conn.commit()
            print(f"Gemt sammenligningsresultater for referat {referat_id}")
            
        except Exception as e:
            print(f"Fejl ved gemning til database: {str(e)}")
            conn.rollback()
        finally:
            conn.close()

def main():
    # Eksempel på brug
    comparator = TextComparison()
    
    # Eksempel tekster
    ai_text = """
    Vi har aftalt:
    - møde næste tirsdag kl 10
    - følge op på jobansøgninger
    
    Vi har i dag talt om:
    - status på jobsøgning
    - nye muligheder
    
    Din jobsøgning indtil nu:
    - 5 ansøgninger sendt
    - 2 samtaler planlagt
    """
    
    human_text = """
    Vi har aftalt:
    - møde næste onsdag kl 11
    - følge op på jobansøgninger
    - lave ny handlingsplan
    
    Vi har i dag talt om:
    - status på jobsøgning
    - nye jobmuligheder
    - kompetenceudvikling
    
    Din jobsøgning indtil nu:
    - 5 ansøgninger sendt
    - 2 samtaler planlagt
    - positiv feedback modtaget
    """
    
    # Lav sammenligning
    results = comparator.compare_sections(ai_text, human_text)
    
    # Udskriv resultater
    for section, data in results.items():
        print(f"\nSektion: {section}")
        print(f"Ændringsprocent: {data['change_percentage']}%")
        print("Tilføjede ord:", data['added_words'])
        print("Fjernede ord:", data['removed_words'])
    
    # Gem i database (kommenter ud hvis database ikke er konfigureret)
    # comparator.save_to_database(1, results)

if __name__ == "__main__":
    main()