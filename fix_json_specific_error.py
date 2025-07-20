import json
import os
import re

# Chemin vers le fichier JSON à corriger
json_file_path = os.path.join('backend', 'firebase_import', 'quizzes.json')
output_path = os.path.join('backend', 'firebase_import', 'quizzes_manually_fixed.json')

try:
    # Lire le contenu du fichier
    with open(json_file_path, 'r', encoding='utf-8') as file:
        content = file.readlines()
    
    # Créer un nouveau fichier avec la structure correcte
    with open(output_path, 'w', encoding='utf-8') as out_file:
        # Écrire l'en-tête du JSON
        out_file.write('{\n  "quizzes": {\n    "facile": {\n')
        
        # Écrire les sections existantes correctement
        in_section = False
        current_section = None
        
        for i, line in enumerate(content):
            # Ignorer les premières lignes d'en-tête que nous avons déjà écrites
            if i < 3:
                continue
                
            # Détecter le début d'une nouvelle section
            if '"maladies_' in line and ':' in line:
                if in_section:
                    # Fermer la section précédente
                    out_file.write('      ],\n')
                
                in_section = True
                current_section = line.strip()
                out_file.write('      ' + current_section + ' [\n')
                
            # Détecter la section maladies_hematologiques qui n'est pas correctement formatée
            elif i > 2000 and '"quizId": "maladies_hematologiques_quiz_1"' in line and not current_section == '"maladies_hematologiques":':
                if in_section:
                    # Fermer la section précédente
                    out_file.write('      ],\n')
                
                in_section = True
                current_section = '"maladies_hematologiques":'
                out_file.write('      ' + current_section + ' [\n')
                out_file.write('        {\n')
                out_file.write('          "quizId": "maladies_hematologiques_quiz_1",\n')
                
            # Écrire les lignes normales
            elif in_section:
                out_file.write(line)
        
        # Fermer la dernière section et la structure JSON
        out_file.write('      ]\n    }\n  }\n}')
    
    # Vérifier si le JSON résultant est valide
    try:
        with open(output_path, 'r', encoding='utf-8') as check_file:
            json_data = json.load(check_file)
        print("Le JSON est valide après correction manuelle!")
        print(f"Correction terminée. Fichier sauvegardé sous {output_path}")
    except json.JSONDecodeError as e:
        print(f"Le JSON est toujours invalide après correction manuelle: {e}")
    
except Exception as e:
    print(f"Erreur lors de la correction du fichier JSON: {e}") 