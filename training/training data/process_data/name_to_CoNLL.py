import pandas as pd
import random

# Load CSV of names
df = pd.read_csv("sg_names.csv") 

# Expanded templates for context-aware training
TEMPLATES = {
    "pii": [
        "My name is {name}.",
        "Please contact {name} for more details.",
        "{name} lives in Singapore.",
        "The document was signed by {name}.",
        "I work with {name} at the office.",
        "{name} will join the meeting today.",
        "Have you met {name} before?",
        "Send the report to {name}.",
        "{name} is listed in the employee directory.",
        "The insurance policy holder is {name}.",
        "Dr {name} treated the patient {name}.",
        "The medical certificate was issued to {name}.",
        "The statement was signed by {name}.",
        "The payroll file lists {name}.",
        "The HR officer is {name}.",
        "The claim was filed by {name}.",
        "The medical record belongs to {name}.",
        "The case notes refer to {name}.",
        "The discharge summary was prepared for {name}.",
        "The diagnosis was confirmed by Dr. {name}.",
        "Manager {name} interviewed candidate {name}.",
        "Nurse {name} assisted patient {name}.",
        "Judge {name} questioned witness {name}.",
    ],
    "non_pii": [
        "{name} is my cat.",
        "{name} scored a goal in the game.",
        "Have you read the book by {name}?",
        "{name} is a character in the story.",
        "{name} is the strongest character in the game.",
        "{name} is mentioned in the novel.",
        "The movie featured {name} in a small role.",
        "Wizard {name} battled dragon {name}.",
        "Coach {name} trained player {name}.",
        "Captain {name} sailed with first mate {name}.",
        "Teacher {name} taught student {name} in the story.",
        "Hero {name} fought villain {name}.",
        "{name} appears as a side character.",
        "The series finale focuses on {name}.",
        "The board game was designed by {name}.",
        "The comic features a superhero called {name}.",
        "{name} is a legend in the lore.",
    ]
}

# Store all sentences before shuffling
all_sentences = []

for _, row in df.iterrows():
    name = row["name"].strip()
    
    # Generate 2-3 positive and 2-3 negative sentences per name
    for _ in range(random.randint(2, 3)):
        template = random.choice(TEMPLATES["pii"])
        sentence = template.format(name=name)
        all_sentences.append((sentence, name, True))
    for _ in range(random.randint(2, 3)):
        template = random.choice(TEMPLATES["non_pii"])
        sentence = template.format(name=name)
        all_sentences.append((sentence, name, False))

# Shuffle all sentences
random.shuffle(all_sentences)

conll_lines = []

for sentence, name, is_pii in all_sentences:
    words = sentence.split()
    
    if is_pii:
        labels = ["O"] * len(words)
        name_tokens = name.split()
        n = len(name_tokens)

        # Look for all occurrences of the name in the sentence
        for i in range(len(words) - n + 1):
            if words[i:i+n] == name_tokens:
                labels[i] = "B-PER"
                for j in range(1, n):
                    labels[i+j] = "I-PER"
        
        for word, label in zip(words, labels):
            conll_lines.append(f"{word} {label}")
    else:
        # Label all tokens as O
        for word in words:
            conll_lines.append(f"{word} O")
    
    conll_lines.append("")  # blank line to separate sentences

# Write to CoNLL file
with open("names_conll_shuffled.conll", "w", encoding="utf-8") as f:
    f.write("\n".join(conll_lines))

print("Shuffled and diverse CoNLL file created: names_conll_shuffled.conll")
