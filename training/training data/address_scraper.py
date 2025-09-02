from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time, csv, random, threading
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm

# --- CONFIG ---
URL = "https://www.bestrandoms.com/random-address-in-sg"
TOTAL_ADDRESSES = 6000
NUM_WORKERS = 4
DELAY = (3, 5)  # delay after actions

# --- PROGRESS BAR ---
progress_bar = tqdm(total=TOTAL_ADDRESSES, desc="Scraping", unit="addr")
lock = threading.Lock()


def scrape_addresses(chunk_size):
    """Scrape 'chunk_size' addresses in one browser session"""
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--disable-logging")
    options.add_experimental_option("excludeSwitches", ["enable-logging"])

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    addresses = []

    try:
        driver.get(URL)
        time.sleep(random.uniform(*DELAY))

        while len(addresses) < chunk_size:
            # Scrape all addresses currently on the page
            items = driver.find_elements(By.CSS_SELECTOR, "li.col-sm-6")
            for item in items:
                text = item.text
                street, zip_code = "", ""
                for line in text.splitlines():
                    if line.startswith("Street:"):
                        street = line.replace("Street:", "").strip()
                    elif line.startswith("Zip code:"):
                        zip_code = line.replace("Zip code:", "").strip()
                addresses.append({"street": street, "zip_code": zip_code})

                # Update progress bar safely
                with lock:
                    progress_bar.update(1)

                if len(addresses) >= chunk_size:
                    break

            # Refresh the page to get new addresses
            if len(addresses) < chunk_size:
                driver.refresh()
                time.sleep(random.uniform(*DELAY))

    finally:
        driver.quit()

    return addresses


# --- PARALLEL EXECUTION ---
chunk_size = TOTAL_ADDRESSES // NUM_WORKERS
all_addresses = []

with ThreadPoolExecutor(max_workers=NUM_WORKERS) as executor:
    futures = [executor.submit(scrape_addresses, chunk_size) for _ in range(NUM_WORKERS)]
    for f in futures:
        all_addresses.extend(f.result())

progress_bar.close()

# --- SAVE TO CSV ---
with open("addresses.csv", mode="w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["street", "zip_code"])
    writer.writeheader()
    writer.writerows(all_addresses)

print(f"Saved {len(all_addresses)} addresses to addresses.csv")

