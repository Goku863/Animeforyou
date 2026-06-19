import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "animevault.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS anime (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            image TEXT NOT NULL DEFAULT '',
            categories TEXT NOT NULL DEFAULT '[]',
            audio TEXT NOT NULL DEFAULT 'hindi-dubbed',
            episodes INTEGER NOT NULL DEFAULT 12,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_anime_slug ON anime(slug);
        CREATE INDEX IF NOT EXISTS idx_anime_audio ON anime(audio);
    """)
    conn.commit()
    conn.close()

def seed_defaults():
    conn = get_conn()
    count = conn.execute("SELECT COUNT(*) FROM anime").fetchone()[0]
    if count > 0:
        conn.close()
        return
    defaults = [
        ("Haikyu!! (Season 4) Hindi Dubbed", "haikyu-s04-hindi", "https://image.tmdb.org/t/p/w500/zfOWZf3rMkgaXXNKOSTL33RBchx.jpg", json.dumps(["animation","anime-hindi-dubbed","comedy","drama","sports"]), "hindi-dubbed", 25),
        ("The Ramparts of Ice S1 Triple Audio", "ramparts-of-ice-s01", "https://image.tmdb.org/t/p/w500/rke9UC2QrogvxiQD9TGpbvqDosi.jpg", json.dumps(["animation","anime-hindi-dubbed","romance"]), "hindi-dubbed", 12),
        ("Dr. Stone (Season 4) Triple Audio", "dr-stone-s04", "https://catimages.org/images/2025/01/12/drs4.jpg", json.dumps(["action","adventure","animation","sci-fi"]), "hindi-dubbed", 24),
        ("Baki-Dou: The Invincible Samurai S1 P2", "baki-dou-s01-p2", "https://m.media-amazon.com/images/M/MV5BYmVjZTgzYjQtOTFhMS00NzRmLTkwMzctYmQ3MzE2YTBhZTQ1XkEyXkFqcGc@._V1_SX500.jpg", json.dumps(["action","animation","sports","thriller"]), "hindi-dubbed", 13),
        ("Fullmetal Alchemist: Brotherhood S1", "fma-brotherhood-s01", "https://image.tmdb.org/t/p/w500/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg", json.dumps(["action","adventure","animation","fantasy"]), "hindi-dubbed", 64),
        ("Attack on Titan Final Season", "aot-final-season", "https://image.tmdb.org/t/p/w500/6Ff2w1z6tJ4fHjWkYWv2y3z5Kx.jpg", json.dumps(["action","animation","drama","fantasy","thriller"]), "english-dubbed", 28),
        ("Demon Slayer: Entertainment District", "demon-slayer-entertainment", "https://image.tmdb.org/t/p/w500/5H5BvA1W5b6Vg9yCV9QK5K5Z5b.jpg", json.dumps(["action","animation","fantasy"]), "english-dubbed", 11),
        ("Jujutsu Kaisen Season 2", "jujutsu-kaisen-s2", "https://image.tmdb.org/t/p/w500/7d3Z5r3C5e4xNvXjPXx3V7xQjL.jpg", json.dumps(["action","animation","fantasy"]), "english-dubbed", 23),
        ("One Piece Hindi Dubbed", "one-piece-hindi", "https://image.tmdb.org/t/p/w500/3M8Fk7K73vkzV7MJKawyr2FVu1.jpg", json.dumps(["action","adventure","animation","comedy","fantasy"]), "hindi-dubbed", 1000),
        ("Naruto Shippuden Hindi Dubbed", "naruto-shippuden-hindi", "https://image.tmdb.org/t/p/w500/7d3Z5r3C5e4xNvXjPXx3V7xQjL.jpg", json.dumps(["action","adventure","animation","anime-hindi-dubbed"]), "hindi-dubbed", 500),
        ("Solo Leveling", "solo-leveling", "https://image.tmdb.org/t/p/w500/5L2Y7G7G7G7G7G7G7G7G7G7G7G.jpg", json.dumps(["action","adventure","animation","fantasy"]), "subbed", 12),
        ("Dragon Ball Daima", "dragon-ball-daima", "https://image.tmdb.org/t/p/w500/7d3Z5r3C5e4xNvXjPXx3V7xQjL.jpg", json.dumps(["action","adventure","animation","comedy","fantasy"]), "hindi-dubbed", 20),
    ]
    conn.executemany("INSERT INTO anime (title, slug, image, categories, audio, episodes) VALUES (?, ?, ?, ?, ?, ?)", defaults)
    conn.commit()
    conn.close()

def row_to_dict(row):
    d = dict(row)
    d["categories"] = json.loads(d["categories"])
    return d

def get_all():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM anime ORDER BY created_at DESC").fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]

def get_by_id(aid):
    conn = get_conn()
    row = conn.execute("SELECT * FROM anime WHERE id=?", (aid,)).fetchone()
    conn.close()
    return row_to_dict(row) if row else None

def create(title, slug, image, categories, audio, episodes):
    conn = get_conn()
    try:
        cur = conn.execute(
            "INSERT INTO anime (title, slug, image, categories, audio, episodes) VALUES (?, ?, ?, ?, ?, ?)",
            (title, slug, image, json.dumps(categories), audio, episodes)
        )
        conn.commit()
        aid = cur.lastrowid
        conn.close()
        return get_by_id(aid)
    except sqlite3.IntegrityError as e:
        conn.close()
        raise ValueError(f"Slug '{slug}' already exists")

def update(aid, title, slug, image, categories, audio, episodes):
    conn = get_conn()
    try:
        conn.execute(
            "UPDATE anime SET title=?, slug=?, image=?, categories=?, audio=?, episodes=? WHERE id=?",
            (title, slug, image, json.dumps(categories), audio, episodes, aid)
        )
        conn.commit()
        conn.close()
        return get_by_id(aid)
    except sqlite3.IntegrityError as e:
        conn.close()
        raise ValueError(f"Slug '{slug}' already exists")

def delete(aid):
    conn = get_conn()
    conn.execute("DELETE FROM anime WHERE id=?", (aid,))
    conn.commit()
    conn.close()

def get_stats():
    conn = get_conn()
    total = conn.execute("SELECT COUNT(*) FROM anime").fetchone()[0]
    hindi = conn.execute("SELECT COUNT(*) FROM anime WHERE audio='hindi-dubbed'").fetchone()[0]
    english = conn.execute("SELECT COUNT(*) FROM anime WHERE audio='english-dubbed'").fetchone()[0]
    subbed = conn.execute("SELECT COUNT(*) FROM anime WHERE audio='subbed'").fetchone()[0]
    eps = conn.execute("SELECT COALESCE(SUM(episodes),0) FROM anime").fetchone()[0]
    conn.close()
    return {"total": total, "hindi_dubbed": hindi, "english_dubbed": english, "subbed": subbed, "total_episodes": eps}

if __name__ == "__main__":
    init_db()
    seed_defaults()
    print("Database initialized at", DB_PATH)
