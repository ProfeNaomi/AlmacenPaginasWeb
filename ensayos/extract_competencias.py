import sys
import pypdf

reader = pypdf.PdfReader("Competencias matematica.pdf")
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n---PAGE_BREAK---\n"

with open("competencias_extracted.txt", "w", encoding="utf-8") as f:
    f.write(text)

print("Extraction complete.")
