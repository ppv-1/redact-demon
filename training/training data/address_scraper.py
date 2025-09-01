from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import csv
import random

# --- CONFIG ---
URL = "https://www.bestrandoms.com/random-address-in-sg"
TOTAL_ADDRESSES = 600
BATCH_SIZE = 6  # the page generates 6 addresses per load
DELAY = (1, 2)  # shorter random delay to speed things up

# --- SETUP CHROME OPTIONS ---
options = webdriver.ChromeOptions()
options.add_argument("--headless")  # run in background
options.add_argument("--log-level=3")  # suppress INFO/WARNING
options.add_argument("--disable-logging")
options.add_experimental_option("excludeSwitches", ["enable-logging"])
options.add_argument("--disable-blink-features=AutomationControlled")  # optional, avoids detection

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

addresses = []

try:
    driver.get(URL)
    time.sleep(random.uniform(*DELAY))

    while len(addresses) < TOTAL_ADDRESSES:
        # Find all <li class="col-sm-6"> elements
        items = driver.find_elements(By.CSS_SELECTOR, "li.col-sm-6")
        for item in items:
            text = item.text
            street = ""
            zip_code = ""
            for line in text.splitlines():
                if line.startswith("Street:"):
                    street = line.replace("Street:", "").strip()
                elif line.startswith("Zip code:"):
                    zip_code = line.replace("Zip code:", "").strip()

            addresses.append({"street": street, "zip_code": zip_code})
            if len(addresses) >= TOTAL_ADDRESSES:
                break

        if len(addresses) < TOTAL_ADDRESSES:
            # Click the "New Random Address" button
            refresh_btn = driver.find_element(By.CSS_SELECTOR, "p.text-center.refresh-btn a")
            refresh_btn.click()
            time.sleep(random.uniform(*DELAY))

finally:
    driver.quit()

# --- SAVE TO CSV ---
with open("addresses.csv", mode="w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["street", "zip_code"])
    writer.writeheader()
    writer.writerows(addresses)

print(f"✅ Saved {len(addresses)} addresses to addresses.csv")

