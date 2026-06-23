import os
import re
import json
import fitz  # PyMuPDF
import glob

def ensure_dirs():
    os.makedirs('scripts', exist_ok=True)
    os.makedirs('public/ensayos_images', exist_ok=True)
    os.makedirs('src/data', exist_ok=True)

def clean_text(text):
    # Remove footer patterns like "- 31 - FORMA 111 \uFFFD 2024" or similar
    text = re.sub(r'-\s*\d+\s*-\s*FORMA\s*\d+.*?\d{4}', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Also clean any standalone FORMA text
    text = re.sub(r'FORMA\s*\d+\s*.*?\d{4}', '', text, flags=re.IGNORECASE | re.DOTALL)
    return text.strip()

def extract_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    
    questions = []
    current_q = None
    
    q_pattern = re.compile(r'^\s*(\d+)\.\s*(.*)')
    opt_pattern = re.compile(r'^\s*([A-E])\)(.*)')
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        blocks = page.get_text("blocks")
        
        blocks.sort(key=lambda b: (b[1], b[0]))
        
        image_list = page.get_images(full=True)
        saved_images = []
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            img_filename = f"{base_name}_p{page_num+1}_{img_index+1}.{image_ext}"
            img_filepath = os.path.join('public', 'ensayos_images', img_filename)
            with open(img_filepath, "wb") as img_file:
                img_file.write(image_bytes)
            saved_images.append(img_filename)
            
        page_questions = []
            
        for b in blocks:
            text = b[4].strip()
            if not text:
                continue
                
            q_match = q_pattern.match(text)
            if q_match:
                if current_q:
                    questions.append(current_q)
                current_q = {
                    "id": f"{base_name}_{q_match.group(1)}",
                    "text": text,
                    "options": [],
                    "images": [],
                    "subject": "Matemática 1" if "matematica1" in base_name else "Matemática"
                }
                page_questions.append(current_q)
                continue
                
            opt_match = opt_pattern.match(text)
            if opt_match:
                if current_q:
                    current_q["options"].append(text)
                continue
                
            if current_q:
                if len(current_q["options"]) > 0:
                    current_q["options"][-1] += " " + text
                else:
                    current_q["text"] += " " + text

        if saved_images and page_questions:
            for img_name in saved_images:
                page_questions[0]["images"].append(img_name)
                
    if current_q:
        questions.append(current_q)
        
    final_output = []
    for q in questions:
        # Skip items without options (usually instructions)
        if not q["options"]:
            continue
            
        q_text = clean_text(q["text"])
        for img_name in q["images"]:
            q_text += f"\n<img src='/ensayos_images/{img_name}' alt='Figura' className='w-full max-w-md my-4 rounded-lg shadow-sm' />"
            
        parsed_options = {}
        for opt in q["options"]:
            cleaned_opt = clean_text(opt)
            m = re.match(r'^\s*([A-E])\)\s*(.*)', cleaned_opt, flags=re.DOTALL)
            if m:
                parsed_options[m.group(1)] = m.group(2).strip()
                
        final_output.append({
            "id": q["id"],
            "text": q_text,
            "options": parsed_options if parsed_options else q["options"],
            "subject": q["subject"]
        })
        
    return final_output

if __name__ == "__main__":
    ensure_dirs()
    # Find up to 2 PDFs
    pdfs = glob.glob("ensayos/*matematica1*.pdf")[:2]
    all_questions = []
    
    for pdf_file in pdfs:
        print(f"Processing {pdf_file}...")
        all_questions.extend(extract_pdf(pdf_file))
        
    out_file = "src/data/paes_questions_v2.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)
        
    print(f"Done! Processed {len(pdfs)} PDFs. Total questions extracted: {len(all_questions)}.")
