import pandas as pd
import random
import re

# -------------------------
# Helpers for augmentation
# -------------------------

# Synonyms for road types
ROAD_SYNONYMS = {
    "Road": ["Rd", "rd", "ROAD"],
    "Avenue": ["Ave", "ave", "AVENUE"],
    "Lane": ["Ln", "ln"],
    "Street": ["St", "st"],
    "Drive": ["Dr", "dr"],
    "Boulevard": ["Blvd", "blvd"],
    "Place": ["Pl", "pl"]
}

# Extra tokens for noise
NOISE_TOKENS = [
    "(Opposite Gate 3)",
    "(Near Exit A)",
    "(Behind Carpark)",
    "(Beside MRT)",
    "(Opposite XXX)",
    "(Near Gate 3)"
]

# Case jitter
def jitter_case(s: str) -> str:
    return "".join(
        c.upper() if random.random() > 0.7 else c.lower()
        for c in s
    )

# Road synonym substitution
def synonymize_road(s) -> str:
    if pd.isna(s) or s == "":
        return ""  # skip NaN / empty
    s = str(s)
    for k, v in ROAD_SYNONYMS.items():
        if k in s:
            return s.replace(k, random.choice(v))
    return s

# Unit number variants
def augment_unit(s: str) -> str:
    if pd.isna(s) or s == "":
        return ""
    s = str(s)
    unit_match = re.search(r"#\d{2}-\d{2,4}", s)
    if unit_match:
        unit = unit_match.group()
        base = unit.replace("#", "")
        variants = [
            unit,
            f"#{int(base.split('-')[0]):d}-{base.split('-')[1]}",
            f"#{base.split('-')[0]}-{base.split('-')[1][:2]}"
        ]
        return s.replace(unit, random.choice(variants))
    return s

# Postal variants
def augment_postal(zip_code) -> str:
    if pd.isna(zip_code) or zip_code == "":
        return ""
    zip_code = str(zip_code)
    formats = [
        f"S{zip_code}",
        f"S({zip_code})",
        f"Singapore {zip_code}",
        f"SG {zip_code}",
        zip_code
    ]
    return random.choice(formats)

# Character noise in building names (skip numeric/postal/unit)
def char_noise(s: str) -> str:
    if pd.isna(s) or s == "":
        return ""
    s = str(s)
    words = s.split()
    if not words:
        return s
    i = random.randrange(len(words))
    if re.match(r"(\d+|S\d+|\#\d+-\d+)", words[i]):
        return s
    word = words[i]
    if len(word) > 3:
        pos = random.randrange(len(word))
        word = word[:pos] + random.choice("abcdefghijklmnopqrstuvwxyz") + word[pos+1:]
    words[i] = word
    return " ".join(words)

# -------------------------
# Augmentation pipeline
# -------------------------

def augment_address(street, zip_code) -> str:
    if pd.isna(street) or street == "":
        return ""  # skip empty streets
    addr = str(street)

    if random.random() > 0.3:
        addr = synonymize_road(addr)
    if random.random() > 0.5:
        addr = augment_unit(addr)
    if random.random() > 0.5:
        addr = jitter_case(addr)
    if random.random() > 0.5:
        addr = addr.replace(",", " ")
    if random.random() > 0.5:
        addr = re.sub(r"\s+", " ", addr)
    if random.random() > 0.2:
        addr = f"{addr} {augment_postal(zip_code)}"
    if random.random() > 0.7:
        addr += " " + random.choice(NOISE_TOKENS)
    if random.random() > 0.6:
        addr = char_noise(addr)

    return addr

# -------------------------
# Run over dataset
# -------------------------

df = pd.read_csv("addresses.csv")  # Make sure columns: street, zip_code exist
augmented = []

for _, row in df.iterrows():
    street = row.get("street", "")
    zip_code = row.get("zip_code", "")

    # Skip empty streets
    if pd.isna(street) or street == "":
        continue

    street_str = str(street)
    zip_str = str(zip_code)

    for _ in range(3):  # generate multiple variants per row
        augmented.append({
            "original": f"{street_str} {zip_str}",
            "augmented": augment_address(street_str, zip_str)
        })

out_df = pd.DataFrame(augmented)
out_df.to_csv("augmented_addresses.csv", index=False)

print("Augmented dataset saved")
