import fitz # PyMuPDF
import json
import re

doc = fitz.open("2026 paes-invierno-oficial-matematica1-p2026 (5).pdf")
text = ""
for page in doc:
    text += page.get_text() + "\n"

with open("extracted_paes2.txt", "w", encoding="utf-8") as f:
    f.write(text)

# Attempt a basic regex parse to isolate questions
# PAES format usually starts with "1. ", "2. ", etc., and has "A)", "B)", "C)", "D)"
questions = []
# split text by digits followed by a dot, e.g., "\n1. " or "^1. "
parts = re.split(r'\n(?=\d{1,2}\.\s)', "\n" + text)

for part in parts:
    part = part.strip()
    if not part:
        continue
    
    # check if it starts with a number
    match = re.match(r'^(\d{1,2})\.\s(.*)', part, re.DOTALL)
    if match:
        q_num = match.group(1)
        content = match.group(2)
        
        # Now find options A), B), C), D)
        # Split by A), B), C), D)
        opt_matches = list(re.finditer(r'\n([A-E])\)(.*?)(?=\n[A-E]\)|$)', content, re.DOTALL))
        
        q_text = content
        options = []
        if opt_matches:
            # text before first option is the question
            q_text = content[:opt_matches[0].start()].strip()
            for m in opt_matches:
                opt_letter = m.group(1)
                opt_text = m.group(2).strip()
                options.append(opt_text)
                
        # Clean up text a bit
        q_text = q_text.replace('\n', '<br>')
        
        # Set dummy correct answer (0 = A)
        correctAnswer = 0
        
        questions.append({
            "text": f"<b>Pregunta {q_num}.</b><br>{q_text}",
            "options": options if options else ["Falta Opción A", "Falta Opción B", "Falta Opción C", "Falta Opción D"],
            "correctAnswer": 0,
            "solution": "<i>Solución pendiente de revisión...</i>",
            "level": "Secundaria",
            "axis": "Números",
            "source": "DEMRE",
            "topic": "Otro",
            "skill": "Resolver problemas"
        })

# ensure exactly 65 questions, or just save whatever we found
# Write JSON
with open("paes_parsed.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(questions)} questions.")
