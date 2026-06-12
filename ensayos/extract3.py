import fitz
import json
import re

doc = fitz.open("2026 paes-invierno-oficial-matematica1-p2026 (5).pdf")
text = ""
for page in doc:
    text += page.get_text() + "\n"

parts = re.split(r'\n(?=\d{1,2}\.\s)', "\n" + text)

questions = []
for part in parts:
    part = part.strip()
    if not part: continue
    
    match = re.match(r'^(\d{1,2})\.\s(.*)', part, re.DOTALL)
    if match:
        q_num = match.group(1)
        content = match.group(2)
        
        # Stop at 65 questions
        if int(q_num) > 65: continue
        
        # Split A) B) C) D) E)
        opt_matches = list(re.finditer(r'\n([A-E])\)(.*?)(?=\n[A-E]\)|$)', content, re.DOTALL))
        
        q_text = content
        options = []
        if opt_matches:
            q_text = content[:opt_matches[0].start()].strip()
            for m in opt_matches:
                options.append(m.group(2).strip().replace('\n', ' '))
                
        # Fix formatting for the text
        q_text = q_text.replace('\n', '<br>')
        
        # If no options found, supply dummy ones
        if len(options) < 2:
            options = ["Falta Alternativa A", "Falta Alternativa B", "Falta Alternativa C", "Falta Alternativa D"]
            
        questions.append({
            "text": f"<b>{q_num}.</b> {q_text}",
            "options": options,
            "correctAnswer": 0,
            "solution": "<i>Solución pendiente...</i>",
            "level": "Secundaria",
            "axis": "Números", # Default, user will classify
            "source": "DEMRE",
            "topic": "Otro",
            "skill": "Resolver problemas"
        })

# Keep exactly 65 if possible
questions = questions[:65]

with open("importar_paes_65.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"File created successfully with {len(questions)} questions.")
