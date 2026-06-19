#!/data/data/com.termux/files/usr/bin/python3.13
import json
import os
import re
import sqlite3
from flask import Flask, jsonify, request, send_from_directory, abort
from flask_cors import CORS

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'animevault.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def sanitize_input(s):
    if not isinstance(s, str): return s
    return re.sub(r'[<>"\']', '', s)[:500]

def init_db():
    from database import SCHEMA, SEED_DATA
    conn = get_db()
    conn.executescript(SCHEMA)
    count = conn.execute('SELECT COUNT(*) FROM anime').fetchone()[0]
    if count == 0:
        for a in SEED_DATA:
            conn.execute('''INSERT OR REPLACE INTO anime (id,title,poster,banner,synopsis,rating,year,studio,status,type,totalEpisodes,trending,genres,audio,subs)
                           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                        (a['id'],a['title'],a['poster'],a['banner'],a['synopsis'],a['rating'],a['year'],a['studio'],a['status'],a['type'],a['totalEpisodes'],a['trending'],json.dumps(a['genres']),json.dumps(a['audio']),json.dumps(a['subs'])))
        conn.commit()
    conn.close()

@app.errorhandler(404)
def not_found(e): return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(e): return jsonify({'error': 'Internal server error'}), 500

@app.route('/')
def index(): return send_from_directory('..', 'index.html')

@app.route('/admin')
def admin(): return send_from_directory('..', 'admin.html')

@app.route('/api/anime', methods=['GET'])
def get_all():
    try:
        conn = get_db()
        rows = conn.execute('SELECT * FROM anime ORDER BY trending DESC').fetchall()
        conn.close()
        return jsonify([{**dict(r), 'genres': json.loads(r['genres']), 'audio': json.loads(r['audio']), 'subs': json.loads(r['subs'])} for r in rows])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/anime/<id>', methods=['GET'])
def get_one(id):
    try:
        id = sanitize_input(id)
        conn = get_db()
        r = conn.execute('SELECT * FROM anime WHERE id=?', (id,)).fetchone()
        conn.close()
        if not r: return jsonify({'error': 'Not found'}), 404
        return jsonify({**dict(r), 'genres': json.loads(r['genres']), 'audio': json.loads(r['audio']), 'subs': json.loads(r['subs'])})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/anime/search', methods=['GET'])
def search():
    try:
        q = sanitize_input(request.args.get('q', '').lower())
        conn = get_db()
        rows = conn.execute('SELECT * FROM anime WHERE LOWER(title) LIKE ? OR LOWER(synopsis) LIKE ? ORDER BY trending DESC',
                            (f'%{q}%', f'%{q}%')).fetchall()
        conn.close()
        return jsonify([{**dict(r), 'genres': json.loads(r['genres']), 'audio': json.loads(r['audio']), 'subs': json.loads(r['subs'])} for r in rows])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/anime/genre/<genre>', methods=['GET'])
def by_genre(genre):
    try:
        genre = sanitize_input(genre)
        conn = get_db()
        rows = conn.execute('SELECT * FROM anime WHERE genres LIKE ? ORDER BY trending DESC', (f'%"{genre}"%',)).fetchall()
        conn.close()
        return jsonify([{**dict(r), 'genres': json.loads(r['genres']), 'audio': json.loads(r['audio']), 'subs': json.loads(r['subs'])} for r in rows])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/anime', methods=['POST'])
def create():
    try:
        data = request.json
        if not data or not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400
        required = ['id','title','poster','banner','synopsis','rating','year','studio','status','type','totalEpisodes']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        conn = get_db()
        conn.execute('''INSERT OR REPLACE INTO anime (id,title,poster,banner,synopsis,rating,year,studio,status,type,totalEpisodes,trending,genres,audio,subs)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                    (sanitize_input(data['id']),sanitize_input(data['title']),data['poster'],data['banner'],data['synopsis'],float(data['rating']),int(data['year']),sanitize_input(data['studio']),data['status'],data['type'],int(data['totalEpisodes']),int(data.get('trending',0)),json.dumps(data.get('genres',[])),json.dumps(data.get('audio',[])),json.dumps(data.get('subs',[]))))
        conn.commit()
        conn.close()
        return jsonify({'ok': True}), 201
    except (ValueError, TypeError) as e:
        return jsonify({'error': f'Invalid data: {e}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/anime/<id>', methods=['PUT'])
def update(id):
    try:
        id = sanitize_input(id)
        data = request.json
        if not data: return jsonify({'error': 'No data provided'}), 400
        conn = get_db()
        conn.execute('''UPDATE anime SET title=?,poster=?,banner=?,synopsis=?,rating=?,year=?,studio=?,status=?,type=?,totalEpisodes=?,trending=?,genres=?,audio=?,subs=? WHERE id=?''',
                    (sanitize_input(data.get('title','')),data.get('poster',''),data.get('banner',''),data.get('synopsis',''),float(data.get('rating',0)),int(data.get('year',2024)),sanitize_input(data.get('studio','')),data.get('status','Airing'),data.get('type','TV'),int(data.get('totalEpisodes',1)),int(data.get('trending',0)),json.dumps(data.get('genres',[])),json.dumps(data.get('audio',[])),json.dumps(data.get('subs',[])),id))
        conn.commit()
        conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/anime/<id>', methods=['DELETE'])
def delete(id):
    try:
        id = sanitize_input(id)
        conn = get_db()
        conn.execute('DELETE FROM anime WHERE id=?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def stats():
    try:
        conn = get_db()
        total = conn.execute('SELECT COUNT(*) FROM anime').fetchone()[0]
        eps = conn.execute('SELECT COALESCE(SUM(totalEpisodes),0) FROM anime').fetchone()[0]
        genres = conn.execute("SELECT DISTINCT genres FROM anime").fetchall()
        all_g = set()
        for r in genres:
            for g in json.loads(r[0]): all_g.add(g)
        avg = conn.execute('SELECT COALESCE(AVG(rating),0) FROM anime').fetchone()[0]
        conn.close()
        return jsonify({'totalAnime': total, 'totalEpisodes': eps, 'totalGenres': len(all_g), 'avgRating': round(avg, 1)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/anime/import', methods=['POST'])
def import_data():
    try:
        data = request.json.get('data', [])
        if not isinstance(data, list):
            return jsonify({'error': 'Data must be an array'}), 400
        conn = get_db()
        count = 0
        for a in data[:1000]:
            if not a.get('id') or not a.get('title'): continue
            conn.execute('''INSERT OR REPLACE INTO anime (id,title,poster,banner,synopsis,rating,year,studio,status,type,totalEpisodes,trending,genres,audio,subs)
                            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                        (sanitize_input(a['id']),sanitize_input(a['title']),a.get('poster',''),a.get('banner',''),a.get('synopsis',''),float(a.get('rating',0)),int(a.get('year',2024)),sanitize_input(a.get('studio','Unknown')),a.get('status','Airing'),a.get('type','TV'),int(a.get('totalEpisodes',1)),int(a.get('trending',0)),json.dumps(a.get('genres',[])),json.dumps(a.get('audio',[])),json.dumps(a.get('subs',[]))))
            count += 1
        conn.commit()
        conn.close()
        return jsonify({'ok': True, 'imported': count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=False)
