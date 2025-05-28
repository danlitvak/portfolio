# NOTE: if this file name / path changes, to update it in the .git/hooks/pre-commit file go to 
#       Files: Exclude in vscode settings to show the .git folder

import os
from bs4 import BeautifulSoup
import json

# Configuration
INPUT_DIR = 'blogs'
OUTPUT_FILE = 'data/blog-word-count.json'

def count_words_in_html(file_path):
    print(f"[READ] Reading: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')
        text = soup.get_text(separator=' ', strip=True)
        words = text.split()
        word_count = len(words)
        print(f"    [COUNT] Word count: {word_count}")
        return word_count

def get_word_counts(directory):
    counts = {}
    html_files = [f for f in os.listdir(directory) if f.endswith('.html')]
    
    if not html_files:
        print("[WARN] No HTML files found in", directory)

    for filename in html_files:
        filepath = os.path.join(directory, filename)
        key = os.path.splitext(filename)[0]  # strip .html extension
        counts[key] = count_words_in_html(filepath)

    return counts

def main():
    print("[INFO] Generating word counts...")
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    word_counts = get_word_counts(INPUT_DIR)

    # Save to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(word_counts, f, indent=2)
    
    print(f"\n[SUCCESS] Saved word counts to {OUTPUT_FILE}")
    print("[RESULT] Final output:")
    for key, count in word_counts.items():
        print(f"  - {key}: {count} words")

if __name__ == "__main__":
    main()
