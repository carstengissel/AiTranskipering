import difflib
import json
import pyodbc
from typing import Dict, List, Tuple
from diff_match_patch import diff_match_patch

class TextComparison:
    def __init__(self):
        self.sections = {
            'viHarAftalt': ('Vi har aftalt', 'Vi har i dag talt om'),
            'viHarIDagTaltOm': ('Vi har i dag talt om', 'Din jobsøgning indtil nu'),
            'dinJobsogningIndtilNu': ('Din jobsøgning indtil nu', 'Andet')
        }
        self.dmp = diff_match_patch()  # Google's diff-match-patch for præcis samme algoritme som diffWords

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

    def get_word_changes(self, text1: str, text2: str) -> Tuple[List[str], List[str], float]:
        """
        Bruger Google's diff-match-patch til at finde ændringer på samme måde som diffWords.
        Dette sikrer at vi får præcis samme resultat som i frontend.
        """
        # Lav diff
        diffs = self.dmp.diff_main(text1, text2)
        self.dmp.diff_cleanupSemantic(diffs)  # Cleanup for bedre ord-baseret diff
        
        added = []
        removed = []
        total_words = len(text2.split())
        changes = 0
        
        for op, text in diffs:
            words = text.split()
            if op == -1:  # Removed
                removed.extend(words)
                changes += len(words)
            elif op == 1:  # Added
                added.extend(words)
                changes += len(words)
        
        # Beregn procent på samme måde som i ReportDetail.js
        percentage = 0
        if total_words > 0:
            raw_percentage = (changes / (total_words * 2)) * 100  # Gang med 2 da vi tæller både tilføjelser og fjernelser
            percentage = min(100, round(raw_percentage))
        
        return added, removed, percentage

    def compare_sections(self, ai_text: str, human_text: str) -> Dict:
        """
        Sammenligner sektioner mellem AI og menneske-redigeret tekst.
        Bruger samme diff-algoritme som frontend for konsistente resultater.
        """
        results = {}
        
        for section_name, (start_marker, end_marker) in self.sections.items():
            # Udtræk sektioner
            ai_section = self.extract_section(ai_text, start_marker, end_marker)
            human_section = self.extract_section(human_text, start_marker, end_marker)
            
            # Find forskelle med samme metode som frontend
            added, removed, percentage = self.get_word_changes(ai_section, human_section)
            
            results[section_name] = {
                'added_words': added,
                'removed_words': removed,
                'change_percentage': percentage,
                'ai_text': ai_section,
                'human_text': human_section
            }
        
        return results

    def save_to_database(self, referat_id: int, comparison_results: Dict) -> None:
        """Gem sammenligningsresultater i databasen"""
        try:
            conn = pyodbc.connect('DRIVER={SQL Server};SERVER=your_server;DATABASE=your_db;UID=your_username;PWD=your_password')
            cursor = conn.cursor()
            
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
    
    # For at verificere at procenterne matcher frontend:
    print("\nVerifikation af ændringsprocenter:")
    for section, data in results.items():
        print(f"{section}: {data['change_percentage']}% - skulle matche Cards på frontend")

if __name__ == "__main__":
    main()