import os
import json

# === Отримуємо абсолютний шлях до папки, де лежить скрипт ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

music_folder = os.path.join(BASE_DIR, "assets", "music")
image_folder = os.path.join(BASE_DIR, "assets", "images")
output_file = os.path.join(music_folder, "tracks.js")  # <-- генеруємо JS

# Переконуємось, що папки існують
if not os.path.exists(music_folder):
    raise FileNotFoundError(f"❌ Папка не знайдена: {music_folder}")
if not os.path.exists(image_folder):
    raise FileNotFoundError(f"❌ Папка не знайдена: {image_folder}")

tracks = []

for filename in os.listdir(music_folder):
    if filename.lower().endswith(".mp3"):
        title = os.path.splitext(filename)[0]

        possible_artworks = [f"{title}.jpg", f"{title}.png", f"{title}.jpeg"]
        artwork_file = None
        for art in possible_artworks:
            if art in os.listdir(image_folder):
                artwork_file = art
                break

        if not artwork_file:
            artwork_file = "default.jpg"

        # Розбираємо "Artist_-_Title" або "Artist - Title"
        if "_-_" in title:
            artist, song = title.split("_-_", 1)
        elif " - " in title:
            artist, song = title.split(" - ", 1)
        else:
            artist, song = "Unknown", title

        tracks.append({
            "title": song,
            "artist": artist,
            "file": f"assets/music/{filename}",
            "artwork": f"assets/images/{artwork_file}"
        })

# Генеруємо JS із красивим форматуванням
with open(output_file, "w", encoding="utf-8") as f:
    f.write("const playlist = ")
    f.write(json.dumps(tracks, indent=4, ensure_ascii=False))
    f.write(";")

print(f"✅ Файл {output_file} успішно згенеровано ({len(tracks)} треків).")
