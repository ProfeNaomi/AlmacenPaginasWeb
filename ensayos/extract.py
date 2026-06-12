import sys
import subprocess

try:
    import pypdf
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf"])
    import pypdf

reader = pypdf.PdfReader("2026 paes-invierno-oficial-matematica1-p2026 (5).pdf")
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n---PAGE_BREAK---\n"

with open("extracted_paes.txt", "w", encoding="utf-8") as f:
    f.write(text)

print("Extraction complete.")
