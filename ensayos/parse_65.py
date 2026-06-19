import re
import json

with open('competencias_extracted.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# The real questions start after "SÍMBOLOS MATEMÁTICOS" or near "1. Un número natural"
start_idx = text.find("Un número natural recibe")
if start_idx != -1:
    # Go back a bit to include "1. "
    text = text[start_idx-20:]

questions = []

for i in range(1, 66):
    # Find start of current question. Looking for "\n1. ", "\n2. ", etc.
    start_match = re.search(r'\n\s*' + str(i) + r'\.\s', text)
    if not start_match:
        # Fallback without newline if it's the very first one
        start_match = re.search(r'^' + str(i) + r'\.\s', text)
        if not start_match:
            print(f"Warning: Could not find question {i}")
            continue
        
    start_pos = start_match.start()
    
    # Find start of next question
    if i < 65:
        end_match = re.search(r'\n\s*' + str(i+1) + r'\.\s', text[start_pos + 5:])
        end_pos = start_pos + 5 + end_match.start() if end_match else len(text)
    else:
        end_pos = len(text)
        
    q_chunk = text[start_pos:end_pos].strip()
    
    # Strip the "1. " part
    q_chunk = re.sub(r'^\s*' + str(i) + r'\.\s*', '', q_chunk).strip()
    
    # Now parse options A), B), C), D)
    options = []
    opt_matches = list(re.finditer(r'\n\s*([A-E])\)(.*?)(?=\n\s*[A-E]\)|$)', q_chunk, re.DOTALL))
    
    if opt_matches:
        q_text = q_chunk[:opt_matches[0].start()].strip()
        for m in opt_matches:
            options.append(m.group(2).strip().replace('\n', ' '))
    else:
        # Fallback if no options found via standard regex
        q_text = q_chunk
        options = ["Falta Opción A", "Falta Opción B", "Falta Opción C", "Falta Opción D"]
        
    q_text = q_text.replace('\n', '<br>')
    
    # Axis detection heuristics
    axis = "Números"
    text_lower = q_text.lower()
    if any(keyword in text_lower for keyword in ['probabilidad', 'estadística', 'promedio', 'gráfico', 'azar', 'frecuencia', 'muestra', 'encuesta']):
        axis = "Probabilidad y Estadística"
    elif any(keyword in text_lower for keyword in ['función', 'ecuación', 'recta', 'incógnita', 'y =', ' f(x)', 'proporcional']):
        axis = "Álgebra y Funciones"
    elif any(keyword in text_lower for keyword in ['área', 'perímetro', 'volumen', 'triángulo', 'cuadrado', 'rectángulo', 'cilindro', 'rotación', 'traslación', 'vértice', 'cm', 'metros']):
        axis = "Geometría"
        
    questions.append({
        "text": f"<b>Pregunta {i}.</b><br>{q_text}",
        "options": options[:4] if len(options) >= 4 else options + [""] * (4 - len(options)),
        "correctAnswer": 0,
        "solution": "<i>Solución pendiente de revisión...</i>",
        "level": "Secundaria",
        "axis": axis,
        "source": "DEMRE",
        "topic": "Otro",
        "skill": "Resolver problemas",
        "examReference": "PAES Competencias Matemáticas",
        "questionNumber": str(i)
    })

with open('lote_competencias_matematicas.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"Successfully extracted {len(questions)} questions.")
