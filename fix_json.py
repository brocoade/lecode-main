import json
import os
import re

# Chemin vers le fichier JSON à corriger
json_file_path = os.path.join('backend', 'firebase_import', 'quizzes.json')
output_path = os.path.join('backend', 'firebase_import', 'quizzes_fixed_python.json')

try:
    # Lire le contenu du fichier
    with open(json_file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Premières corrections manuelles
    # 1. Ajouter la section maladies_hematologiques
    content = re.sub(r'],\s*\n\s*{(?=\s*"quizId": "maladies_hematologiques_quiz_1")', 
                     '],\n      "maladies_hematologiques": [\n  {', 
                     content)
    
    # 2. Compléter la structure JSON à la fin
    if not content.strip().endswith('}'):
        content = re.sub(r'}\s*$', '}\n      ]\n    }\n  }\n}', content)
    
    # Tenter de parser le JSON corrigé
    try:
        json_data = json.loads(content)
        print("Le JSON est valide après correction!")
        
        # Écrire le contenu corrigé et formaté
        with open(output_path, 'w', encoding='utf-8') as out_file:
            json.dump(json_data, out_file, indent=2, ensure_ascii=False)
        
        print(f"Correction terminée. Fichier sauvegardé sous {output_path}")
        
    except json.JSONDecodeError as e:
        print(f"Le JSON est toujours invalide après correction: {e}")
        print(f"Position de l'erreur: {e.pos}")
        
        # Extraire les 50 caractères autour de la position d'erreur pour aider au débogage
        error_context = content[max(0, e.pos - 25):min(len(content), e.pos + 25)]
        print(f"Contexte de l'erreur: \n{error_context}")
        
        # Sauvegarder le contenu partiellement corrigé pour débogage
        with open(output_path + '.debug', 'w', encoding='utf-8') as debug_file:
            debug_file.write(content)
        
        print(f"JSON partiellement corrigé sauvegardé pour débogage sous {output_path}.debug")
    
except Exception as e:
    print(f"Erreur lors de la correction du fichier JSON: {e}") 