// Wichteln: kleiner Server ohne Abhaengigkeiten. Speichert alles in /data/data.json
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 80;
const DATA_FILE = process.env.DATA_FILE || '/data/data.json';
const ADMIN = process.env.ADMIN_PASSWORD;
if (!ADMIN) { console.error('ADMIN_PASSWORD fehlt'); process.exit(1); }

let db = { people: [], wishes: {} }; // people: [{name, token, target}], wishes: {name: text}
try { db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) {}
const save = () => {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE + '.tmp', JSON.stringify(db));
  fs.renameSync(DATA_FILE + '.tmp', DATA_FILE);
};

const same = (a, b) => {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};

function draw(names, banned) {
  const bad = (a, b) => a === b || banned.has(a + '|' + b);
  for (let t = 0; t < 5000; t++) {
    const p = [...names];
    for (let i = p.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [p[i], p[j]] = [p[j], p[i]]; }
    if (names.every((n, i) => !bad(n, p[i]))) return p;
  }
  return null;
}

function body(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', c => { s += c; if (s.length > 100000) { reject(new Error('zu gross')); req.destroy(); } });
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } });
  });
}

const send = (res, code, obj) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
};

const html = fs.readFileSync(path.join(__dirname, 'index.html'));

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Referrer-Policy': 'no-referrer' });
      return res.end(html);
    }
    if (!url.pathname.startsWith('/api/')) return send(res, 404, { error: 'nicht gefunden' });

    // --- Teilnehmer ---
    if (url.pathname === '/api/me' && req.method === 'GET') {
      const me = db.people.find(p => same(p.token, url.searchParams.get('t') || ''));
      if (!me) return send(res, 404, { error: 'Link ungueltig' });
      return send(res, 200, { name: me.name, target: me.target, targetWish: db.wishes[me.target] || '', myWish: db.wishes[me.name] || '' });
    }
    if (url.pathname === '/api/wish' && req.method === 'PUT') {
      const me = db.people.find(p => same(p.token, url.searchParams.get('t') || ''));
      if (!me) return send(res, 404, { error: 'Link ungueltig' });
      const b = await body(req);
      db.wishes[me.name] = String(b.wish || '').slice(0, 2000);
      save();
      return send(res, 200, { ok: true });
    }

    // --- Admin ---
    if (!same(req.headers['x-admin'] || '', ADMIN)) return send(res, 401, { error: 'falsches Passwort' });
    if (url.pathname === '/api/admin/list' && req.method === 'GET') {
      return send(res, 200, { people: db.people.map(({ name, token }) => ({ name, token })) });
    }
    if (url.pathname === '/api/admin/draw' && req.method === 'POST') {
      const b = await body(req);
      const names = [...new Set((b.names || []).map(s => String(s).trim()).filter(Boolean))];
      if (names.length < 3) return send(res, 400, { error: 'Mindestens 3 Teilnehmer' });
      const banned = new Set();
      (b.excl || []).forEach(l => {
        const [x, y] = String(l).split('-').map(s => s.trim());
        if (x && y) { banned.add(x + '|' + y); banned.add(y + '|' + x); }
      });
      const res2 = draw(names, banned);
      if (!res2) return send(res, 400, { error: 'Auslosung geht mit diesen Regeln nicht auf' });
      db.people = names.map((name, i) => ({ name, target: res2[i], token: crypto.randomBytes(9).toString('hex') }));
      save();
      return send(res, 200, { people: db.people.map(({ name, token }) => ({ name, token })) });
    }
    send(res, 404, { error: 'nicht gefunden' });
  } catch (e) {
    send(res, 400, { error: 'Fehler' });
  }
}).listen(PORT, () => console.log('Wichteln laeuft auf Port ' + PORT));
