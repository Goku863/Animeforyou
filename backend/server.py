#!/data/data/com.termux/files/usr/bin/python3.13
import json
import os
import sqlite3
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'animevault.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    from database import SCHEMA, SEED_DATA
    conn = get_db()
    conn.executescript(SCHEMA)
    count = conn.execute('SELECT COUNT(*) FROM anime').fetchone()[0]
    if count == 0:
        for a in SEED_DATA:
            conn.execute('''INSERT INTO anime (id,title,poster,banner,synopsis,rating,year,studio,status,type,totalEpisodes,trending,genres,audio,subs)
                           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                        (a['id'],a['title'],a['poster'],a['banner'],a['synopsis'],a['rating'],a['year'],a['studio'],a['status'],a['type'],a['totalEpisodes'],a['trending'],json.dumps(a['genres']),json.dumps(a['audio']),json.dumps(a['subs'])))
        conn.commit()
    conn.close()

@app.route('/')
def index():
    return send_from_directory('..', 'index.html')

@app.route('/admin')
def admin():
    return send_from_directory('..', 'admin.html')

@app.route('/api/anime', methods=['GET'])
def get_all():
    conn = get_db()
    rows = conn.execute('SELECT * FROM anime ORDER BY trending DESC').fetchall()
    conn.close()
    return jsonify([{**dict(r), 'genres': json.loads(r['genres']), 'audio': json.loads(r['audio']), 'subs': json.loads(r['subs'])} for r in rows])

@app.route('/api/anime/<id>', methods=['GET'])
def get_one(id):
    conn = get_db()
    r = conn.execute('SELECT * FROM anime WHERE id=?', (id,)).fetchone()
    conn.close()
    if not r: return jsonify({'error':'Not found'}), 404
    return jsonify({**dict(r), 'genres': json.loads(r['genres']), 'audio': json.loads(r['audio']), 'subs': json.loads(r['subs'])})

@app.route('/api/anime/search', methods=['GET'])
def search():
    q = request.args.get('q', '').lower()
    conn = get_db()
    rows = conn.execute('SELECT * FROM anime WHERE LOWER(title) LIKE ? OR LOWER(synopsis) LIKE ? ORDER BY trending DESC',
                        (f'%{q}%', f'%{q}%')).fetchall()
    conn.close()
    return jsonify([{**dict(r), 'genres': json.loads(r['genres']), 'audio': json.loads(r['audio']), 'subs': json.loads(r['subs'])} for r in rows])

@app.route('/api/anime/genre/<genre>', methods=['GET'])
def by_genre(genre):
    conn = get_db()
    rows = conn.execute('SELECT * FROM anime WHERE genres LIKE ? ORDER BY trending DESC', (f'%"{genre}"%',)).fetchall()
    conn.close()
    return jsonify([{**dict(r), 'genres': json.loads(r['genres']), 'audio': json.loads(r['audio']), 'subs': json.loads(r['subs'])} for r in rows])

@app.route('/api/anime', methods=['POST'])
def create():
    data = request.json
    conn = get_db()
    conn.execute('''INSERT OR REPLACE INTO anime (id,title,poster,banner,synopsis,rating,year,studio,status,type,totalEpisodes,trending,genres,audio,subs)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                (data['id'],data['title'],data['poster'],data['banner'],data['synopsis'],data['rating'],data['year'],data['studio'],data['status'],data['type'],data['totalEpisodes'],data.get('trending',0),json.dumps(data['genres']),json.dumps(data['audio']),json.dumps(data['subs'])))
    conn.commit()
    conn.close()
    return jsonify({'ok':True})

@app.route('/api/anime/<id>', methods=['PUT'])
def update(id):
    data = request.json
    conn = get_db()
    conn.execute('''UPDATE anime SET title=?,poster=?,banner=?,synopsis=?,rating=?,year=?,studio=?,status=?,type=?,totalEpisodes=?,trending=?,genres=?,audio=?,subs=? WHERE id=?''',
                (data['title'],data['poster'],data['banner'],data['synopsis'],data['rating'],data['year'],data['studio'],data['status'],data['type'],data['totalEpisodes'],data.get('trending',0),json.dumps(data['genres']),json.dumps(data['audio']),json.dumps(data['subs']),id))
    conn.commit()
    conn.close()
    return jsonify({'ok':True})

@app.route('/api/anime/<id>', methods=['DELETE'])
def delete(id):
    conn = get_db()
    conn.execute('DELETE FROM anime WHERE id=?', (id,))
    conn.commit()
    conn.close()
    return jsonify({'ok':True})

@app.route('/api/stats', methods=['GET'])
def stats():
    conn = get_db()
    total = conn.execute('SELECT COUNT(*) FROM anime').fetchone()[0]
    eps = conn.execute('SELECT COALESCE(SUM(totalEpisodes),0) FROM anime').fetchone()[0]
    genres = conn.execute("SELECT DISTINCT genres FROM anime").fetchall()
    all_g = set()
    for r in genres:
        for g in json.loads(r[0]): all_g.add(g)
    avg = conn.execute('SELECT COALESCE(AVG(rating),0) FROM anime').fetchone()[0]
    conn.close()
    return jsonify({'totalAnime':total,'totalEpisodes':eps,'totalGenres':len(all_g),'avgRating':round(avg,1)})

@app.route('/api/anime/import', methods=['POST'])
def import_data():
    data = request.json.get('data', [])
    conn = get_db()
    for a in data:
        conn.execute('''INSERT OR REPLACE INTO anime (id,title,poster,banner,synopsis,rating,year,studio,status,type,totalEpisodes,trending,genres,audio,subs)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                    (a['id'],a['title'],a['poster'],a['banner'],a['synopsis'],a['rating'],a['year'],a['studio'],a['status'],a['type'],a['totalEpisodes'],a.get('trending',0),json.dumps(a['genres']),json.dumps(a['audio']),json.dumps(a['subs'])))
    conn.commit()
    conn.close()
    return jsonify({'ok':True,'imported':len(data)})

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
