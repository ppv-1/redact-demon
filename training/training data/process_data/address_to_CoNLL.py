import pandas as pd
import nltk
import random
nltk.download("punkt")
nltk.download("punkt_tab")  

# Load CSV
df = pd.read_csv("augmented_addresses.csv")

# Sentence templates
templates = [
    "Please send the package to {}.",
    "The meeting will be held at {}.",
    "I recently moved to {}.",
    "Contact me at {} for further details.",
    "Our office is located at {}, Singapore."
]

# Open file to write CoNLL
with open("addresses_context_conll.txt", "w", encoding="utf-8") as f:
    for addr in df["augmented"]:
        # Pick a random template
        sentence = random.choice(templates).format(addr)
        tokens = nltk.word_tokenize(sentence)
        
        # Tokenize the address
        addr_tokens = nltk.word_tokenize(addr)
        len_addr = len(addr_tokens)
        
        i = 0
        while i < len(tokens):
            # Check if the slice matches the address tokens
            if tokens[i:i+len_addr] == addr_tokens:
                for j, t in enumerate(addr_tokens):
                    label = "B-PII" if j == 0 else "I-PII"
                    f.write(f"{t} {label}\n")
                i += len_addr  # skip past the address tokens
            else:
                f.write(f"{tokens[i]} O\n")
                i += 1
        f.write("\n")

