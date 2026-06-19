const API_BASE = window.location.port === "5000" || window.location.port === "5001"
  ? "" : "http://" + window.location.hostname + ":5000";

async function api(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "API error");
  return data;
}

function apiGetAll(q, category, audio) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (audio) params.set("audio", audio);
  const qs = params.toString();
  return api("GET", "/api/anime" + (qs ? "?" + qs : ""));
}

function apiGetOne(id) {
  return api("GET", "/api/anime/" + id);
}

function apiCreate(anime) {
  return api("POST", "/api/anime", anime);
}

function apiUpdate(id, anime) {
  return api("PUT", "/api/anime/" + id, anime);
}

function apiDelete(id) {
  return api("DELETE", "/api/anime/" + id);
}

function apiGetStats() {
  return api("GET", "/api/stats");
}

async function apiCheck() {
  try {
    await apiGetStats();
    return true;
  } catch {
    return false;
  }
}
