from faker import Faker
from faker.providers import BaseProvider
from pypinyin import lazy_pinyin
import random

# Set up Faker for English + Chinese
fake_en = Faker("en_US")
fake_cn = Faker("zh_CN")

# ---------- Malay Provider ----------
class MalayNameProvider(BaseProvider):

    male_first = [
        "Ahmad", "Mohd", "Muhammad", "Faiz", "Hafiz", "Rahman", "Azlan", "Syafiq",
        "Firdaus", "Imran", "Hakim", "Irfan", "Danish", "Aiman", "Ridwan", "Shahrul",
        "Zul", "Nabil", "Haziq", "Khairul", "Anwar", "Roslan", "Fadzil", "Zulkifli",
        "Syahril", "Afiq", "Ashraf", "Iskandar", "Shafiq", "Helmi", "Faris", "Amir",
        "Farhan", "Adnan", "Rashid", "Azim", "Hisham", "Khairi", "Najmi", "Faizal",
        "Azhar", "Saiful", "Tarmizi", "Sulaiman", "Zaki", "Rafiq", "Fauzi", "Aizat",
        "Hilmi", "Shazwan"
    ]

    female_first = [
        "Siti", "Nur", "Aisyah", "Amirah", "Hana", "Farah", "Nadiah", "Zahra",
        "Hidayah", "Sabrina", "Liyana", "Aqilah", "Balqis", "Fatin", "Amalina",
        "Maisarah", "Raihanah", "Nurlina", "Syahirah", "Sofea", "Maryam", "Izzah",
        "Khairunnisa", "Aina", "Alia", "Anis", "Nadia", "Amirah", "Husna", "Azizah",
        "Intan", "Syafiqa", "Fauziah", "Norain", "Hanis", "Nurul", "Shaffira",
        "Adibah", "Nadira", "Fauzana", "Shahirah", "Maisara", "Aminah", "Amira",
        "Ruqayyah", "Zulaikha", "Qistina", "Alyaa", "Nur Hidayah"
    ]

    father_names = [
        "Abdullah", "Ismail", "Hussain", "Rahim", "Yusof", "Osman", "Ali", "Ibrahim",
        "Salleh", "Ahmad", "Jamal", "Latif", "Razak", "Basri", "Khalid", "Haron",
        "Mazlan", "Shamsuddin", "Rosli", "Hamid", "Kassim", "Shahrin", "Rahman",
        "Mustafa", "Zainal", "Fadzil", "Johari", "Mahmud", "Sulaiman", "Idris",
        "Nasir", "Zulkarnain", "Rashid", "Farid", "Firdaus", "Amran", "Hafiz",
        "Syed", "Hakim", "Azlan", "Saiful", "Shukri", "Tarmizi", "Nordin", "Munir",
        "Amin", "Asraf", "Hilmi", "Azhar"
    ]


    def malay_name(self):
        if random.random() < 0.5:  # male
            first = self.random_element(self.male_first)
            father = self.random_element(self.father_names)
            return f"{first} bin {father}"
        else:  # female
            first = self.random_element(self.female_first)
            father = self.random_element(self.father_names)
            return f"{first} binti {father}"

# ---------- Tamil Provider ----------
class TamilNameProvider(BaseProvider):

    male_first = [
        "Arun", "Kumar", "Rajesh", "Suresh", "Vijay", "Mani", "Ravi", "Shankar",
        "Ganesh", "Prakash", "Ramesh", "Murali", "Hari", "Raghu", "Ajay", "Karthik",
        "Santhosh", "Anand", "Dinesh", "Vasanth", "Aravind", "Balaji", "Jagannath",
        "Selvan", "Sathish", "Naveen", "Kannan", "Bhaskar", "Pradeep", "Sekar",
        "Raghavan", "Sundar", "Saravanan", "Mohan", "Ranjith", "Vijayan", "Rohit",
        "Ashok", "Rajkumar", "Manikandan"
    ]

    female_first = [
        "Priya", "Lakshmi", "Anitha", "Deepa", "Kavitha", "Revathi", "Meena",
        "Divya", "Radha", "Nandini", "Rajeswari", "Sangeetha", "Bhavani", "Shanthi",
        "Vijaya", "Malathi", "Uma", "Janani", "Latha", "Chitra", "Aishwarya",
        "Saranya", "Thulasi", "Rekha", "Gowri", "Padma", "Keerthi", "Nila", "Kanthi",
        "Suhasini", "Harini", "Ranjitha", "Vaishnavi", "Poornima", "Jayanthi",
        "Yamuna", "Arpana", "Sowmya", "Anjali"
    ]

    father_names = [
        "Rajendran", "Ganesan", "Subramaniam", "Muthukrishnan", "Balakrishnan",
        "Ramasamy", "Sivakumar", "Manickam", "Venkatesan", "Krishnan", "Raghavan",
        "Natarajan", "Chidambaram", "Thangavel", "Palani", "Anandan", "Murugan",
        "Vijayan", "Sundaram", "Jagadeesan", "Shanmugam", "Sivanesan", "Kannan",
        "Arumugam", "Bhaskaran", "Selvan", "Perumal", "Raman", "Rajkumar", "Saravanan",
        "Velu", "Dinesh", "Vasanth", "Sekar", "Rohit", "Pradeep", "Ajay", "Ashok",
        "Manikandan", "Sathish"
    ]


    def tamil_name(self):
        if random.random() < 0.5:  # male
            first = self.random_element(self.male_first)
            father = self.random_element(self.father_names)
            return f"{first} s/o {father}"
        else:  # female
            first = self.random_element(self.female_first)
            father = self.random_element(self.father_names)
            return f"{first} d/o {father}"

# ---------- Helper for Pinyin ----------
def format_pinyin(name):
    return " ".join(word.capitalize() for word in lazy_pinyin(name))

# ---------- Chinese Names ----------
def sg_chinese_name(mixed=True):
    cn = fake_cn.name()      # e.g. 陈小明
    surname = cn[0]          # 陈
    given = cn[1:]           # 小明
    surname_pinyin = lazy_pinyin(surname)[0].capitalize()
    given_pinyin = " ".join(w.capitalize() for w in lazy_pinyin(given))
    
    if mixed:  # Mixed English + Chinese
        eng = fake_en.first_name()
        return f"{eng} {surname_pinyin} {given_pinyin}"
    else:      # Pure Chinese in Pinyin
        return f"{surname_pinyin} {given_pinyin}"

# ---------- English Names ----------
def sg_english_name():
    return fake_en.name()

# ---------- Combine All ----------
fake = Faker()
fake.add_provider(MalayNameProvider)
fake.add_provider(TamilNameProvider)

def sg_name():
    group = random.choices(
        ["chinese_mixed", "chinese_pure", "malay", "tamil", "english"],
        weights=[40, 20, 15, 10, 15],  # adjust proportions
        k=1
    )[0]

    if group == "chinese_mixed":
        return sg_chinese_name(mixed=True)
    elif group == "chinese_pure":
        return sg_chinese_name(mixed=False)
    elif group == "malay":
        return fake.malay_name()
    elif group == "tamil":
        return fake.tamil_name()
    else:
        return sg_english_name()

# ---------- Demo ----------
for _ in range(15):
    print(sg_name())
