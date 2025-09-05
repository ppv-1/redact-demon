import pandas as pd
import random
import string

# -------------------------
# Load Data
# -------------------------
addresses = pd.read_csv(r".\training\training data\augmented_addresses.csv")
names = pd.read_csv(r".\training\training data\sg_names.csv")

address_list = addresses["augmented"].dropna().tolist()
name_list = names["name"].dropna().tolist()

NAME_PREFIXES = ["Dr.", "Mr.", "Ms.", "Mrs.", "Prof.", "Sir", "Madam"]

# -------------------------
# Templates (Contextual PII)
# -------------------------

PII_TEMPLATES = {
    "per": [
        "My name is {name}.",
        "Please contact {name} for more details.",
        "The medical record belongs to {name}.",
        "The case notes refer to {name}.",
        "The discharge summary was prepared for {name}.",
        "The diagnosis was confirmed by Dr. {name}.",
        "The patient file lists {name}.",
        "The legal document is signed by {name}.",
        "The witness is identified as {name}.",
        "The court case is filed under {name}.",
        "The lawyer is representing {name}.",
        "The financial statement is issued to {name}.",
        "The loan account belongs to {name}.",
        "The tax return is under {name}.",
        "The insurance claim was filed by {name}.",
        "The prescription was written for {name}.",
        "The hospital admitted {name}.",
        "The payment record shows {name}.",
        "The ID card is issued to {name}.",
        "The criminal record is linked to {name}.",
        "The utility bill belongs to {name}.",
        "The credit report is under {name}.",
        "The complaint was filed by {name}.",
        "The service contract is signed by {name}.",
        "The membership ID belongs to {name}.",
        "The official report cites {name}.",
        "The exam registration is under {name}.",
        "The employee file lists {name}.",
        "The payroll record is for {name}.",
        "The benefits claim was made by {name}.",
        "The immigration file lists {name}.",
        "The bank account holder is {name}.",
        "The patient chart shows {name}.",
        "The police report names {name}.",
        "The transaction receipt belongs to {name}.",
        "The scholarship was awarded to {name}.",
        "The housing lease is signed by {name}.",
        "The rental agreement lists {name}.",
        "The driving license belongs to {name}.",
        "The case record was submitted by {name}.",
        "The pension account is under {name}.",
        "The medical insurance lists {name}.",
        "The child vaccination record lists {name}.",
        "The adoption file is for {name}.",
        "The arrest warrant lists {name}.",
        "The DNA report belongs to {name}.",
        "The accident report lists {name}.",
        "The settlement is signed by {name}.",
        "The corporate filing lists {name}.",
        "The property deed belongs to {name}.",
    ],
    "loc": [
        "This is my address: {address}.",
        "Please deliver to {address}.",
        "You can reach me at {address}.",
        "The billing address is {address}.",
        "The hospital record lists home as {address}.",
        "The clinic registered {address} for the patient.",
        "The discharge letter shows {address}.",
        "The insurance form records {address}.",
        "The tax form shows {address}.",
        "The property title lists {address}.",
        "The lease agreement states {address}.",
        "The mortgage file lists {address}.",
        "The credit card billing is {address}.",
        "The police report notes {address}.",
        "The court file shows {address}.",
        "The arrest report mentions {address}.",
        "The immigration file lists {address}.",
        "The utility contract is linked to {address}.",
        "The service subscription is tied to {address}.",
        "The pension account lists {address}.",
        "The shipping address is {address}.",
        "The driver’s license lists {address}.",
        "The warranty card shows {address}.",
        "The loan application records {address}.",
        "The voter registration lists {address}.",
        "The marriage certificate lists {address}.",
        "The employment file has {address}.",
        "The company registry lists {address}.",
        "The hospital emergency contact lists {address}.",
        "The adoption file lists {address}.",
        "The patient referral form shows {address}.",
        "The student file records {address}.",
        "The grant application lists {address}.",
        "The subsidy record lists {address}.",
        "The eviction notice was sent to {address}.",
        "The hospital sent the bill to {address}.",
        "The pension fund records {address}.",
        "The land record lists {address}.",
        "The business license lists {address}.",
        "The charity donor form records {address}.",
        "The income declaration lists {address}.",
        "The medical insurance lists {address}.",
        "The government file notes {address}.",
        "The disciplinary file records {address}.",
        "The foster care record lists {address}.",
        "The accident report records {address}.",
        "The refugee application lists {address}.",
        "The disability claim lists {address}.",
        "The relief aid form records {address}.",
        "The electoral roll lists {address}.",
    ],
    "per_loc": [
        "The hospital admitted {name} at {address}.",
        "The patient {name} lives at {address}.",
        "The prescription for {name} is linked to {address}.",
        "The medical file of {name} lists {address}.",
        "The case notes for {name} show {address}.",
        "The court record lists {name} at {address}.",
        "The legal notice for {name} was sent to {address}.",
        "The financial record of {name} lists {address}.",
        "The tax return of {name} lists {address}.",
        "The loan application of {name} shows {address}.",
        "The mortgage of {name} is tied to {address}.",
        "The property deed of {name} lists {address}.",
        "The voter registration of {name} lists {address}.",
        "The police report records {name} at {address}.",
        "The complaint against {name} lists {address}.",
        "The accident report names {name} at {address}.",
        "The refugee file lists {name} at {address}.",
        "The pension record of {name} lists {address}.",
        "The payroll record for {name} lists {address}.",
        "The immigration file lists {name} at {address}.",
        "The grant application of {name} lists {address}.",
        "The disciplinary record names {name} at {address}.",
        "The charity donor {name} lives at {address}.",
        "The insurance claim of {name} lists {address}.",
        "The company registration lists {name} at {address}.",
        "The business filing names {name} at {address}.",
        "The housing lease for {name} is {address}.",
        "The rental agreement for {name} lists {address}.",
        "The adoption file lists {name} at {address}.",
        "The arrest report lists {name} at {address}.",
        "The summons for {name} lists {address}.",
        "The will of {name} lists {address}.",
        "The marriage file lists {name} at {address}.",
        "The bank record of {name} lists {address}.",
        "The savings account of {name} is at {address}.",
        "The contract of {name} is tied to {address}.",
        "The scholarship for {name} is linked to {address}.",
        "The pension file of {name} is tied to {address}.",
        "The official record lists {name} at {address}.",
        "The disciplinary notes mention {name} at {address}.",
        "The social worker file lists {name} at {address}.",
        "The subsidy application of {name} lists {address}.",
        "The legal filing shows {name} at {address}.",
        "The relief record lists {name} at {address}.",
        "The accident victim {name} is at {address}.",
        "The care report names {name} at {address}.",
        "The donor record of {name} lists {address}.",
        "The event registry lists {name} at {address}.",
        "The corporate filing names {name} at {address}.",
    ],
}

# Non-PII examples (fictional, story/game contexts)
NONPII_TEMPLATES = {
    "per": [
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
        "I named my plant {name}.",
        "The dog is called {name}.",
        "The robot is named {name}.",
        "The toy line features {name}.",
        "Cartoon hero {name} saved the day.",
        "The comic book has a hero called {name}.",
        "My laptop is named {name}.",
        "I call my guitar {name}.",
        "The video game character {name} is popular.",
        "The classroom roleplay had {name} as teacher.",
        "The D&D character is called {name}.",
        "In the story, {name} was a brave knight.",
        "The puppet show had a puppet named {name}.",
        "The fantasy tale featured {name}.",
        "The fan fiction stars {name}.",
        "The folk tale mentions {name}.",
        "The movie director added {name} as a cameo.",
        "My favorite plush toy is called {name}.",
        "The ship was christened {name}.",
        "I painted my car and named it {name}.",
        "My gaming alias is {name}.",
        "The club mascot is called {name}.",
        "The art project was titled {name}.",
        "The riddle mentions {name}.",
        "The school play cast {name} as the lead.",
        "The short story features {name}.",
        "The campfire tale told of {name}.",
        "The myth talks about {name}.",
        "The new AI model is called {name}.",
        "The alien in the sci-fi movie was {name}.",
        "The fantasy RPG quest giver is {name}.",
        "The VR avatar is called {name}.",
        "The old sword was named {name}.",
        "The music album is titled {name}.",
        "The Pokémon trainer is called {name}.",
        "The fairy godmother was {name}.",
        "The play script includes {name}.",
        "The spell was cast by {name}.",
        "The sculpture is titled {name}.",
    ],
    "loc": [
        "The concert will be held at {address}.",
        "The sports match is happening at {address}.",
        "The art exhibition is at {address}.",
        "The food festival is hosted at {address}.",
        "The book fair is set up at {address}.",
        "The science expo is at {address}.",
        "The open house will be at {address}.",
        "The carnival takes place at {address}.",
        "The theatre play is staged at {address}.",
        "The farmers’ market is at {address}.",
        "The marathon passes through {address}.",
        "The parade goes by {address}.",
        "The outdoor cinema is at {address}.",
        "The band is performing at {address}.",
        "The election rally is at {address}.",
        "The art class is at {address}.",
        "The kids’ camp is at {address}.",
        "The tech meetup is hosted at {address}.",
        "The poetry slam is at {address}.",
        "The chess tournament is at {address}.",
        "The comic convention is at {address}.",
        "The cosplay show is at {address}.",
        "The flea market is set up at {address}.",
        "The food truck park is at {address}.",
        "The outdoor picnic is at {address}.",
        "The dance class is held at {address}.",
        "The acting workshop is at {address}.",
        "The debate contest is at {address}.",
        "The music rehearsal is at {address}.",
        "The painting class is at {address}.",
        "The yoga class is at {address}.",
        "The meditation retreat is at {address}.",
        "The choir practice is at {address}.",
        "The holiday party is at {address}.",
        "The wedding reception is at {address}.",
        "The birthday celebration is at {address}.",
        "The reunion dinner is at {address}.",
        "The farewell party is at {address}.",
        "The film screening is at {address}.",
        "The cultural show is at {address}.",
        "The charity fundraiser is at {address}.",
        "The game launch is at {address}.",
        "The talent show is at {address}.",
        "The school fair is at {address}.",
        "The fun run is at {address}.",
        "The treasure hunt starts at {address}.",
        "The photography walk begins at {address}.",
        "The street performance is at {address}.",
        "The lantern festival is at {address}.",
    ],
    "per_loc": [
        "{name} attended the concert at {address}.",
        "{name} joined the marathon at {address}.",
        "{name} performed in the play at {address}.",
        "{name} painted a mural at {address}.",
        "{name} gave a speech at {address}.",
        "{name} taught a class at {address}.",
        "{name} played a football game at {address}.",
        "{name} visited the art show at {address}.",
        "{name} joined the carnival at {address}.",
        "{name} presented a project at {address}.",
        "{name} sang in the choir at {address}.",
        "{name} danced at the wedding in {address}.",
        "{name} attended a birthday at {address}.",
        "{name} filmed a scene at {address}.",
        "{name} attended a reunion at {address}.",
        "{name} joined the book fair at {address}.",
        "{name} played in the chess match at {address}.",
        "{name} recited a poem at {address}.",
        "{name} hosted the cosplay show at {address}.",
        "{name} was in the parade at {address}.",
        "{name} set up a food stall at {address}.",
        "{name} organized the festival at {address}.",
        "{name} joined the tech meetup at {address}.",
        "{name} staged a concert at {address}.",
        "{name} ran a workshop at {address}.",
        "{name} recorded music at {address}.",
        "{name} acted in the drama at {address}.",
        "{name} rehearsed at {address}.",
        "{name} took photos at {address}.",
        "{name} painted at {address}.",
        "{name} sculpted at {address}.",
        "{name} exhibited art at {address}.",
        "{name} performed magic at {address}.",
        "{name} narrated a story at {address}.",
        "{name} was the mascot at {address}.",
        "{name} launched a game at {address}.",
        "{name} trained students at {address}.",
        "{name} led a camp at {address}.",
        "{name} acted in a short film at {address}.",
        "{name} attended yoga at {address}.",
        "{name} played violin at {address}.",
        "{name} organized a debate at {address}.",
        "{name} participated in cosplay at {address}.",
        "{name} made a speech at {address}.",
        "{name} gave a lecture at {address}.",
        "{name} attended a ceremony at {address}.",
        "{name} conducted research at {address}.",
        "{name} joined a hackathon at {address}.",
    ],
}



# -------------------------
# Helper functions
# -------------------------
def normalize_token(tok):
    """Lowercase and strip punctuation for reliable matching."""
    return tok.lower().strip(string.punctuation)

def match_span(tokens, span_tokens):
    """Find start index of span_tokens in tokens, ignoring punctuation/case."""
    span_tokens_norm = [normalize_token(t) for t in span_tokens]
    for i in range(len(tokens) - len(span_tokens) + 1):
        window = [normalize_token(t) for t in tokens[i:i+len(span_tokens)]]
        if window == span_tokens_norm:
            return i
    return -1

def sentence_to_conll(sentence, name=None, address=None, pii=True):
    tokens = sentence.split()
    labels = ["O"] * len(tokens)
    pii_flags = ["PII" if pii else "NONPII"] * len(tokens)

    # Label PER
    if name:
        name_tokens = name.split()
        for prefix in NAME_PREFIXES:
            full_name_tokens = (prefix.split() + name_tokens) if sentence.find(prefix) != -1 else name_tokens
            start_idx = match_span(tokens, full_name_tokens)
            if start_idx != -1:
                labels[start_idx] = "B-PER"
                pii_flags[start_idx] = "PII" if pii else "NONPII"
                for j in range(1, len(full_name_tokens)):
                    labels[start_idx + j] = "I-PER"
                    pii_flags[start_idx + j] = "PII" if pii else "NONPII"
                break
        else:  # no prefix matched
            start_idx = match_span(tokens, name_tokens)
            if start_idx != -1:
                labels[start_idx] = "B-PER"
                pii_flags[start_idx] = "PII" if pii else "NONPII"
                for j in range(1, len(name_tokens)):
                    labels[start_idx + j] = "I-PER"
                    pii_flags[start_idx + j] = "PII" if pii else "NONPII"

    # Label LOC
    if address:
        addr_tokens = address.split()
        start_idx = match_span(tokens, addr_tokens)
        if start_idx != -1:
            labels[start_idx] = "B-LOC"
            pii_flags[start_idx] = "PII" if pii else "NONPII"
            for j in range(1, len(addr_tokens)):
                labels[start_idx + j] = "I-LOC"
                pii_flags[start_idx + j] = "PII" if pii else "NONPII"

    return "\n".join([f"{tok}\t{lab}\t{flag}" for tok, lab, flag in zip(tokens, labels, pii_flags)]) + "\n"

# -------------------------
# Balanced Dataset Generation
# -------------------------
TOTAL_SENTENCES = 12000
SCENARIOS = ["per", "loc", "per_loc"]
TYPES = ["pii", "non_pii"]

num_per_combo = TOTAL_SENTENCES // (len(SCENARIOS) * len(TYPES))  # 12000/6 = 2000

conll_data = []

for scenario in SCENARIOS:
    for ttype in TYPES:
        for _ in range(num_per_combo):
            name = random.choice(name_list)
            address = random.choice(address_list)
            template = random.choice(PII_TEMPLATES[scenario] if ttype=="pii" else NONPII_TEMPLATES[scenario])
            sentence = template.format(name=name, address=address)
            pii_flag = True if ttype=="pii" else False

            if scenario == "per":
                conll_sentence = sentence_to_conll(sentence, name=name, pii=pii_flag)
            elif scenario == "loc":
                conll_sentence = sentence_to_conll(sentence, address=address, pii=pii_flag)
            else:
                conll_sentence = sentence_to_conll(sentence, name=name, address=address, pii=pii_flag)

            conll_data.append(conll_sentence)

# Shuffle dataset
random.shuffle(conll_data)

# -------------------------
# Save to CoNLL file
# -------------------------
with open("synthetic_contextual_balanced.conll", "w", encoding="utf-8") as f:
    for item in conll_data:
        f.write(item + "\n")

print("Dataset generation complete: synthetic_dataset_contextual_balanced.conll")