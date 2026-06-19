#!/data/data/com.termux/files/usr/bin/python3.13
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from database import init_db, seed_defaults, get_all, get_by_id, create, update, delete, get_stats
import os, re

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

app = Flask(__name__, static_folder=None)
CORS(app)

def slugify(text):
    s = text.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

@app.route("/api/anime", methods=["GET"])
def api_get_all():
    data = get_all()
    q = request.args.get("q", "").strip().lower()
    cat = request.args.get("category", "").strip().lower()
    audio = request.args.get("audio", "").strip().lower()
    if q:
        data = [a for a in data if q in a["title"].lower() or any(q in c for c in a["categories"])]
    if cat:
        data = [a for a in data if cat in a["categories"]]
    if audio:
        data = [a for a in data if a["audio"] == audio]
    return jsonify({"success": True, "data": data})

@app.route("/api/anime/<int:aid>", methods=["GET"])
def api_get_one(aid):
    anime = get_by_id(aid)
    if not anime:
        return jsonify({"success": False, "error": "Not found"}), 404
    return jsonify({"success": True, "data": anime})

@app.route("/api/anime", methods=["POST"])
def api_create():
    body = request.get_json()
    if not body:
        return jsonify({"success": False, "error": "Invalid JSON"}), 400
    title = (body.get("title") or "").strip()
    slug = (body.get("slug") or "").strip()
    image = (body.get("image") or "").strip()
    categories = body.get("categories") or []
    audio = body.get("audio") or "hindi-dubbed"
    episodes = int(body.get("episodes") or 0)
    if not title:
        return jsonify({"success": False, "error": "Title is required"}), 400
    if not slug:
        slug = slugify(title)
    if not image:
        return jsonify({"success": False, "error": "Image URL is required"}), 400
    if episodes < 1:
        return jsonify({"success": False, "error": "Episodes must be at least 1"}), 400
    try:
        new_anime = create(title, slug, image, categories, audio, episodes)
        return jsonify({"success": True, "data": new_anime}), 201
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 409

@app.route("/api/anime/<int:aid>", methods=["PUT"])
def api_update(aid):
    body = request.get_json()
    if not body:
        return jsonify({"success": False, "error": "Invalid JSON"}), 400
    title = (body.get("title") or "").strip()
    slug = (body.get("slug") or "").strip()
    image = (body.get("image") or "").strip()
    categories = body.get("categories") or []
    audio = body.get("audio") or "hindi-dubbed"
    episodes = int(body.get("episodes") or 0)
    if not title:
        return jsonify({"success": False, "error": "Title is required"}), 400
    if not slug:
        slug = slugify(title)
    if not image:
        return jsonify({"success": False, "error": "Image URL is required"}), 400
    if episodes < 1:
        return jsonify({"success": False, "error": "Episodes must be at least 1"}), 400
    existing = get_by_id(aid)
    if not existing:
        return jsonify({"success": False, "error": "Not found"}), 404
    try:
        updated = update(aid, title, slug, image, categories, audio, episodes)
        return jsonify({"success": True, "data": updated})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 409

@app.route("/api/anime/<int:aid>", methods=["DELETE"])
def api_delete(aid):
    existing = get_by_id(aid)
    if not existing:
        return jsonify({"success": False, "error": "Not found"}), 404
    delete(aid)
    return jsonify({"success": True, "message": "Deleted"})

@app.route("/api/stats", methods=["GET"])
def api_stats():
    return jsonify({"success": True, "data": get_stats()})

@app.route("/")
def serve_index():
    return send_from_directory(BASE_DIR, "index.html")

@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(BASE_DIR, path)

if __name__ == "__main__":
    init_db()
    seed_defaults()
    port = int(os.environ.get("PORT", 5000))
    print(f"Server running on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
