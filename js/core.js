/* ==========================================================================
   CORE — utilitas bersama halaman publik & aplikasi
   ========================================================================== */
(function () {
  'use strict';
  const U = {};
  window.U = U;

  // ---------------- DOM & teks ----------------
  U.$ = (s, r) => (r || document).querySelector(s);
  U.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  U.esc = (v) => String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.icon = (n, cls) => `<svg class="ic ${cls || ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  U.uid = () => {
    const a = new Uint8Array(9); crypto.getRandomValues(a);
    return Array.from(a, (b) => (b % 36).toString(36)).join('') + Date.now().toString(36).slice(-3);
  };
  U.token = () => { const a = new Uint8Array(24); crypto.getRandomValues(a); return Array.from(a, (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'[b % 56]).join('') + 'x' + Date.now().toString(36); };
  U.debounce = (fn, ms) => { let t; return function () { clearTimeout(t); const a = arguments; t = setTimeout(() => fn.apply(this, a), ms); }; };
  U.inisial = (nama) => String(nama || '?').replace(/^(bu|pak|ibu|bpk\.?)\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  U.avClass = (s) => { let h = 0; String(s || '').split('').forEach((c) => { h = (h * 31 + c.charCodeAt(0)) | 0; }); return 'av-' + (Math.abs(h) % 6); };
  U.avatar = (nama, id, cls, foto) => `<span class="av ${cls || ''} ${U.avClass(id || nama)}">${foto ? `<img src="${U.esc(foto)}" alt="">` : U.esc(U.inisial(nama))}</span>`;
  U.hurufKata = (s) => String(s || '').toLowerCase().replace(/(^|[\s\-/(])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).trim();
  U.normWa = (v) => { let d = String(v || '').replace(/\D/g, ''); if (!d) return ''; if (d[0] === '0') d = '62' + d.slice(1); else if (d[0] === '8') d = '62' + d; return d; };
  U.tampilWa = (v) => { const d = U.normWa(v); return d ? '0' + d.slice(2).replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3') : ''; };
  U.waLink = (wa, pesan) => 'https://wa.me/' + U.normWa(wa) + (pesan ? '?text=' + encodeURIComponent(pesan) : '');

  // ---------------- Angka & tanggal ----------------
  U.rp = (n) => 'Rp' + Math.round(+n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  U.angka = (n) => Math.round(+n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  U.BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  U.BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  U.HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  U.HR = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  // Hari ini menurut WITA (UTC+8), berdasarkan jam perangkat
  U.today = () => { const d = new Date(Date.now() + 8 * 3600000); return d.toISOString().slice(0, 10); };
  U.nowIso = () => new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 19);
  U.ymNow = () => U.today().slice(0, 7);
  U.utc = (s) => { const p = s.split('-'); return Date.UTC(+p[0], +p[1] - 1, +(p[2] || 1)); };
  U.fromUtc = (t) => new Date(t).toISOString().slice(0, 10);
  U.addDays = (s, n) => U.fromUtc(U.utc(s) + n * 86400000);
  U.dow = (s) => new Date(U.utc(s)).getUTCDay();
  U.addMonths = (ym, n) => { let y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return y + '-' + String(m + 1).padStart(2, '0'); };
  U.daysInMonth = (ym) => new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)).getUTCDate();
  U.isTgl = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
  // Format tanggal tampilan: dd-mm-yyyy
  U.tgl = (s) => U.isTgl(s) ? s.slice(8, 10) + '-' + s.slice(5, 7) + '-' + s.slice(0, 4) : (s ? String(s) : '-');
  U.dariTeksTgl = (t) => { const m = String(t || '').trim().match(/^(\d{1,2})[-\/. ](\d{1,2})[-\/. ](\d{4})$/); if (!m) return ''; const d = +m[1], b = +m[2], y = +m[3]; const dt = new Date(Date.UTC(y, b - 1, d)); return dt.getUTCFullYear() === y && dt.getUTCMonth() === b - 1 && dt.getUTCDate() === d ? y + '-' + String(b).padStart(2, '0') + '-' + String(d).padStart(2, '0') : ''; };
  U.tglPanjang = (s) => U.isTgl(s) ? (+s.slice(8, 10)) + ' ' + U.BULAN[+s.slice(5, 7) - 1] + ' ' + s.slice(0, 4) : '-';
  U.tglHari = (s) => U.isTgl(s) ? U.HARI[U.dow(s)] + ', ' + U.tglPanjang(s) : '-';
  U.bulan = (ym) => ym ? U.BULAN[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4) : '-';
  U.bln = (ym) => ym ? U.BLN[+ym.slice(5, 7) - 1] + (ym.slice(0, 4) !== U.today().slice(0, 4) ? ' ' + ym.slice(2, 4) : '') : '-';
  U.daftarBulan = (list) => {
    const u = list.slice().sort();
    if (!u.length) return '-';
    if (u.length === 1) return U.bulan(u[0]);
    if (u.every((b) => b.slice(0, 4) === u[0].slice(0, 4))) {
      const n = u.map((b) => U.BULAN[+b.slice(5, 7) - 1]);
      return n.slice(0, -1).join(', ') + ' & ' + n[n.length - 1] + ' ' + u[0].slice(0, 4);
    }
    return u.map(U.bulan).join(', ');
  };
  U.umur = (tgl, acuan) => {
    if (!U.isTgl(tgl)) return '';
    const a = (acuan || U.today()).split('-').map(Number), b = tgl.split('-').map(Number);
    let y = a[0] - b[0]; if (a[1] < b[1] || (a[1] === b[1] && a[2] < b[2])) y--;
    return y >= 0 ? y + ' thn' : '';
  };
  // Lama mengajar: "2 tahun 3 bulan"
  U.masa = (dari, sampai) => {
    if (!U.isTgl(dari)) return '-';
    const s = U.isTgl(sampai) ? sampai : U.today();
    const a = dari.split('-').map(Number), b = s.split('-').map(Number);
    let bln = (b[0] - a[0]) * 12 + (b[1] - a[1]);
    if (b[2] < a[2]) { const akhir = U.daysInMonth(s.slice(0, 7)); if (!(b[2] === akhir && a[2] > akhir)) bln--; }
    if (bln < 0) return 'Belum mulai';
    if (bln === 0) return 'Kurang dari 1 bulan';
    const t = Math.floor(bln / 12), m = bln % 12;
    return [t ? t + ' tahun' : '', m ? m + ' bulan' : ''].filter(Boolean).join(' ');
  };
  U.terbilang = (n) => {
    n = Math.floor(+n || 0);
    const s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    const t = (x) => {
      if (x < 12) return s[x];
      if (x < 20) return t(x - 10) + ' belas';
      if (x < 100) return t(Math.floor(x / 10)) + ' puluh' + (x % 10 ? ' ' + t(x % 10) : '');
      if (x < 200) return 'seratus' + (x - 100 ? ' ' + t(x - 100) : '');
      if (x < 1000) return t(Math.floor(x / 100)) + ' ratus' + (x % 100 ? ' ' + t(x % 100) : '');
      if (x < 2000) return 'seribu' + (x - 1000 ? ' ' + t(x - 1000) : '');
      if (x < 1e6) return t(Math.floor(x / 1000)) + ' ribu' + (x % 1000 ? ' ' + t(x % 1000) : '');
      if (x < 1e9) return t(Math.floor(x / 1e6)) + ' juta' + (x % 1e6 ? ' ' + t(x % 1e6) : '');
      return t(Math.floor(x / 1e9)) + ' miliar' + (x % 1e9 ? ' ' + t(x % 1e9) : '');
    };
    const r = n === 0 ? 'nol' : t(n);
    return r.charAt(0).toUpperCase() + r.slice(1) + ' rupiah';
  };

  // ---------------- Tema warna dinamis ----------------
  const hexRgb = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
  const rgbHex = (r) => '#' + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const lum = (rgb) => { const c = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  U.kontras = (a, b) => { const x = lum(hexRgb(a)), y = lum(hexRgb(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  U.applyTheme = (hex) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex || '')) hex = '#6B2F8F';
    const c = hexRgb(hex), w = [255, 255, 255], k = [12, 4, 20];
    const v = {
      '--p': hex, '--p-50': rgbHex(mix(c, w, 0.93)), '--p-100': rgbHex(mix(c, w, 0.87)), '--p-200': rgbHex(mix(c, w, 0.74)),
      '--p-300': rgbHex(mix(c, w, 0.5)), '--p-600': rgbHex(mix(c, k, 0.12)), '--p-700': rgbHex(mix(c, k, 0.27)),
      '--p-800': rgbHex(mix(c, k, 0.4)), '--p-900': rgbHex(mix(c, k, 0.6)),
      '--on-p': U.kontras(hex, '#FFFFFF') >= 3.6 ? '#FFFFFF' : '#2B1B3D'
    };
    const st = document.documentElement.style;
    Object.keys(v).forEach((k2) => st.setProperty(k2, v[k2]));
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = hex;
  };

  // Warna latar landing page (kosong = bawaan krem)
  U.LATAR_BAWAAN = '#FFF8E7';
  U.terang = (hex) => /^#[0-9a-f]{6}$/i.test(hex || '') && lum(hexRgb(hex)) >= 0.6;
  U.campur = (hex, t) => /^#[0-9a-f]{6}$/i.test(hex || '') ? rgbHex(mix(hexRgb(hex), [255, 255, 255], t)) : '';
  U.applyLatar = (hex) => {
    const st = document.documentElement.style;
    if (U.terang(hex)) st.setProperty('--bg-public', hex); else st.removeProperty('--bg-public');
  };

  // ---------------- Penyimpanan lokal aman ----------------
  U.ls = {
    get(k, def) { try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* */ } }
  };
  // IndexedDB sederhana (template piagam & gambar besar)
  U.idb = (() => {
    let dbp;
    const db = () => dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open('ahe-ala', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }));
    const tx = (mode, fn) => db().then((d) => new Promise((res, rej) => { const t = d.transaction('kv', mode); const s = t.objectStore('kv'); const r = fn(s); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }));
    return { get: (k) => tx('readonly', (s) => s.get(k)).catch(() => null), set: (k, v) => tx('readwrite', (s) => s.put(v, k)).catch(() => null), del: (k) => tx('readwrite', (s) => s.delete(k)).catch(() => null) };
  })();

  // ---------------- API ke Google Apps Script ----------------
  U.gasUrl = () => (window.APP_CONFIG && window.APP_CONFIG.GAS_URL) || '';
  U.siapApi = () => /^https:\/\/script\.google(usercontent)?\.com\//.test(U.gasUrl()) && !/GANTI_DENGAN/.test(U.gasUrl()) || /^http:\/\/(localhost|127\.0\.0\.1)/.test(U.gasUrl());
  // Baca respons Apps Script. Bila bukan JSON (halaman error Google), jelaskan penyebab & cara memperbaikinya.
  async function bacaJson(res) {
    const teks = await res.text();
    try { return JSON.parse(teks); } catch (e) { /* bukan JSON */ }
    console.error('Respons Apps Script bukan JSON (HTTP ' + res.status + '):\n' + teks.slice(0, 3000));
    const t = teks.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&#39;|&quot;/g, "'").replace(/\s+/g, ' ').trim();
    let pesan;
    if (/already been declared|sudah dideklarasikan|has already been declared/i.test(t)) pesan = 'Kode.gs tertempel dua kali (ada dua file berisi kode yang sama di Apps Script). Hapus salah satunya, simpan, lalu deploy Versi baru.';
    else if (/(doPost|doGet)/.test(t) && /(not found|tidak ditemukan|tidak dapat ditemukan)/i.test(t)) pesan = 'Fungsi doPost tidak ada di versi yang sedang di-deploy. Pastikan seluruh Kode.gs sudah ditempel & disimpan (Ctrl+S), lalu Terapkan → Kelola deployment → ✏️ → Versi baru → Terapkan.';
    else if (/authoriz|otorisasi|perlu izin|izin diperlukan/i.test(t)) pesan = 'Apps Script belum diberi izin. Di editor, jalankan setupAplikasi sekali (Tinjau izin → Izinkan), lalu deploy Versi baru.';
    else if (res.status === 404 || /unable to open the file|tidak dapat membuka file|file tidak dapat dibuka|page not found|halaman tidak ditemukan/i.test(t)) pesan = 'Alamat Apps Script tidak ditemukan. Periksa GAS_URL di js/config.js — harus URL Aplikasi web yang berakhiran /exec.';
    else if (/accounts\.google\.com|ServiceLogin/i.test(teks) || /sign in|login|masuk ke akun/i.test(t)) pesan = 'Web App meminta login Google. Ubah deployment: Jalankan sebagai "Saya", Akses "Siapa saja", lalu deploy Versi baru.';
    else pesan = 'Apps Script mengirim halaman error' + (t ? ': "' + t.slice(0, 180) + '"' : '') + '. Cek deployment Apps Script.';
    throw Object.assign(new Error(pesan), { kode: 'SERVER', detail: teks.slice(0, 3000) });
  }
  U.api = async (action, payload, opt) => {
    opt = opt || {};
    if (!U.siapApi()) throw Object.assign(new Error('URL backend belum diisi di js/config.js'), { kode: 'CONFIG' });
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), opt.timeout || 45000);
    let res;
    try {
      res = await fetch(U.gasUrl(), {
        method: 'POST', redirect: 'follow', signal: ctrl.signal,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ action }, payload || {}))
      });
    } catch (e) {
      throw Object.assign(new Error(e.name === 'AbortError' ? 'Server terlalu lama merespons' : 'Tidak ada koneksi internet'), { kode: 'NET' });
    } finally { clearTimeout(to); }
    const j = await bacaJson(res);
    if (!j.success) throw Object.assign(new Error(j.message || 'Terjadi kesalahan'), { kode: j.code || 'APP', data: j.data });
    return j.data;
  };
  U.apiGet = async (params, opt) => {
    if (!U.siapApi()) throw Object.assign(new Error('URL backend belum diisi di js/config.js'), { kode: 'CONFIG' });
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), (opt && opt.timeout) || 30000);
    try {
      const res = await fetch(U.gasUrl() + '?' + new URLSearchParams(params).toString(), { signal: ctrl.signal, redirect: 'follow' });
      const j = await bacaJson(res);
      if (!j.success) throw Object.assign(new Error(j.message || 'Terjadi kesalahan'), { kode: j.code || 'APP' });
      return j.data;
    } catch (e) {
      if (e.kode) throw e;
      throw Object.assign(new Error('Tidak ada koneksi internet'), { kode: 'NET' });
    } finally { clearTimeout(to); }
  };
  U.ping = () => { if (U.siapApi()) fetch(U.gasUrl() + '?action=ping', { redirect: 'follow' }).catch(() => { }); };

  // ---------------- Input tanggal dd-mm-yyyy ----------------
  // Semua <input type="date"> otomatis diganti tampilan teks dd-mm-yyyy + tombol kalender.
  // Input asli (format yyyy-mm-dd) tetap ada & tersembunyi, jadi kode lain tetap membaca .value seperti biasa.
  const setVal = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  U.perkayaTgl = (root) => {
    (root || document).querySelectorAll('input[type="date"]:not([data-tgl-ok])').forEach((asli) => {
      asli.setAttribute('data-tgl-ok', '1');
      const bungkus = document.createElement('div');
      bungkus.className = 'date-in';
      asli.parentNode.insertBefore(bungkus, asli);
      const teks = document.createElement('input');
      teks.type = 'text'; teks.className = asli.className || 'input'; teks.inputMode = 'numeric';
      teks.placeholder = 'dd-mm-yyyy'; teks.maxLength = 10; teks.autocomplete = 'off';
      teks.setAttribute('aria-label', (asli.getAttribute('aria-label') || asli.name || 'Tanggal') + ' (dd-mm-yyyy)');
      if (asli.id) { teks.id = asli.id + '-teks'; const lb = document.querySelector('label[for="' + asli.id + '"]'); if (lb) lb.htmlFor = teks.id; }
      if (asli.disabled) teks.disabled = true;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'date-btn'; btn.tabIndex = -1; btn.setAttribute('aria-label', 'Buka kalender');
      btn.innerHTML = U.icon('calendar');
      bungkus.appendChild(teks); bungkus.appendChild(btn); bungkus.appendChild(asli);
      asli.classList.add('date-native'); asli.tabIndex = -1;
      const tampil = () => { const v = setVal.get.call(asli); teks.value = v ? U.tgl(v) : ''; };
      Object.defineProperty(asli, 'value', { configurable: true, get() { return setVal.get.call(this); }, set(v) { setVal.set.call(this, v); tampil(); } });
      tampil();
      const kirim = () => { asli.dispatchEvent(new Event('input', { bubbles: true })); asli.dispatchEvent(new Event('change', { bubbles: true })); };
      teks.addEventListener('input', () => {
        // sisipkan tanda "-" otomatis saat mengetik angka
        const raw = teks.value;
        const dashOk = /^[\d-]*$/.test(raw) && raw.split('').every((ch, i) => ch !== '-' || i === 2 || i === 5);
        if (dashOk) {
          let v = raw.replace(/\D/g, '').slice(0, 8);
          if (v.length > 4) v = v.slice(0, 2) + '-' + v.slice(2, 4) + '-' + v.slice(4); else if (v.length > 2) v = v.slice(0, 2) + '-' + v.slice(2);
          if (raw !== v && !(raw.endsWith('-') && raw.length === v.length + 1)) teks.value = v;
        }
        const iso = U.dariTeksTgl(teks.value);
        teks.classList.toggle('invalid', !!teks.value && teks.value.length === 10 && !iso);
        if (iso && iso !== setVal.get.call(asli)) { setVal.set.call(asli, iso); kirim(); }
        else if (!teks.value && setVal.get.call(asli)) { setVal.set.call(asli, ''); kirim(); }
      });
      teks.addEventListener('blur', () => { if (teks.value && !U.dariTeksTgl(teks.value)) { teks.classList.add('invalid'); } else tampil(); });
      asli.addEventListener('change', tampil);
      btn.addEventListener('click', () => { try { asli.showPicker(); } catch (e) { teks.focus(); } });
    });
  };
  if (window.MutationObserver) {
    new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && (n.matches('input[type="date"]') || n.querySelector('input[type="date"]'))) { U.perkayaTgl(document); return; } })
      .observe(document.documentElement, { childList: true, subtree: true });
  }

  // ---------------- Pemilih periode: 1 bulan, rentang bulan, atau 1 tahun ----------------
  U.labelPeriode = (d, s) => {
    if (!d) return '-'; s = s || d;
    if (d === s) return U.bulan(d);
    const y1 = d.slice(0, 4), y2 = s.slice(0, 4), m1 = +d.slice(5, 7) - 1, m2 = +s.slice(5, 7) - 1;
    if (y1 === y2 && m1 === 0 && m2 === 11) return 'Tahun ' + y1;
    if (y1 === y2) return U.BLN[m1] + ' – ' + U.BLN[m2] + ' ' + y1;
    return U.BLN[m1] + ' ' + y1 + ' – ' + U.BLN[m2] + ' ' + y2;
  };
  U.tombolPeriode = (id, d, s) => `<button type="button" class="btn btn-light periode-btn" id="${id}">${U.icon('calendar')}<span>${U.esc(U.labelPeriode(d, s))}</span>${U.icon('chevron-down', 'ic-sm')}</button>`;
  U.pilihPeriode = (o) => new Promise((resolve) => {
    const min = o.min || '2020-01', max = o.max || U.addMonths(U.ymNow(), 12), batas = o.maksBulan || 24;
    let a = o.dari || U.ymNow(), b = o.sampai || a, tahun = +(b || a).slice(0, 4), tahap = 0;
    const jumlah = (x, y) => (+y.slice(0, 4) - +x.slice(0, 4)) * 12 + (+y.slice(5, 7) - +x.slice(5, 7)) + 1;
    const m = U.modal({
      title: 'Pilih periode', icon: 'calendar', size: 'sm',
      body: `<div class="per-year"><button type="button" class="btn btn-light btn-icon btn-sm" data-y="-1" aria-label="Tahun sebelumnya">${U.icon('chevron-left')}</button><b id="per-th"></b><button type="button" class="btn btn-light btn-icon btn-sm" data-y="1" aria-label="Tahun berikutnya">${U.icon('chevron-right')}</button></div>
        <div class="per-grid" id="per-grid"></div>
        <div class="per-quick"><button type="button" class="btn btn-soft btn-sm" data-q="tahun"></button><button type="button" class="btn btn-light btn-sm" data-q="ini">Bulan ini</button><button type="button" class="btn btn-light btn-sm" data-q="3">3 bulan terakhir</button><button type="button" class="btn btn-light btn-sm" data-q="6">6 bulan terakhir</button></div>
        <p class="tiny muted mt-12">${U.icon('info', 'ic-sm')} Klik <b>satu bulan</b>, atau klik <b>bulan awal</b> lalu <b>bulan akhir</b> untuk rentang (maks. ${batas} bulan). Bisa pindah tahun di antara dua klik.</p>
        <div class="per-sel" id="per-sel"></div>`,
      foot: `<button class="btn btn-light" data-n>Batal</button><button class="btn btn-primary" data-ok>${U.icon('check')} Terapkan</button>`,
      onClose: () => resolve(null)
    });
    const gambar = () => {
      m.$('#per-th').textContent = tahun;
      m.$('#per-grid').innerHTML = U.BLN.map((nm, i) => {
        const ym = tahun + '-' + String(i + 1).padStart(2, '0');
        const mati = ym < min || ym > max;
        const cls = (ym >= a && ym <= b ? 'in ' : '') + (ym === a ? 'awal ' : '') + (ym === b ? 'akhir ' : '') + (ym === U.ymNow() ? 'kini' : '');
        return `<button type="button" class="per-m ${cls}" data-m="${ym}" ${mati ? 'disabled' : ''}>${nm}</button>`;
      }).join('');
      m.$('[data-q=tahun]').textContent = 'Satu tahun ' + tahun;
      m.$('#per-sel').innerHTML = `Dipilih: <b>${U.esc(U.labelPeriode(a, b))}</b>${a !== b ? ` <span class="muted">(${jumlah(a, b)} bulan)</span>` : ''}${tahap === 1 ? ' <span class="chip chip-sm chip-warn">pilih bulan akhir…</span>' : ''}`;
      m.$$('[data-m]').forEach((x) => x.onclick = () => {
        const v = x.dataset.m;
        if (tahap === 0) { a = b = v; tahap = 1; }
        else { if (v < a) { b = a; a = v; } else b = v; tahap = 0; if (jumlah(a, b) > batas) { b = U.addMonths(a, batas - 1); U.toast('Rentang maksimal ' + batas + ' bulan', 'warn'); } }
        gambar();
      });
    };
    m.$$('[data-y]').forEach((x) => x.onclick = () => { tahun += +x.dataset.y; gambar(); });
    m.$$('[data-q]').forEach((x) => x.onclick = () => {
      const q = x.dataset.q, kini = U.ymNow();
      if (q === 'tahun') { a = tahun + '-01'; b = tahun + '-12'; }
      else if (q === 'ini') { a = b = kini; tahun = +kini.slice(0, 4); }
      else { b = kini; a = U.addMonths(kini, 1 - +q); tahun = +kini.slice(0, 4); }
      if (a < min) a = min; if (b > max) b = max; if (b < a) b = a;
      tahap = 0; gambar();
    });
    m.$('[data-n]').onclick = () => m.close();
    m.$('[data-ok]').onclick = () => { if (a < min) a = min; if (b > max) b = max; resolve({ dari: a, sampai: b < a ? a : b }); m.close(true); };
    gambar();
  });

  // ---------------- Menu aksi (tombol ⋯ → daftar pilihan) ----------------
  U.menu = (btn, items) => {
    const lama = U._menu;
    if (lama) { lama.tutup(); if (lama.btn === btn) return; }
    const m = document.createElement('div');
    m.className = 'popmenu'; m.setAttribute('role', 'menu');
    m.innerHTML = items.map((it, i) => !it ? '' : it === '-' ? '<hr>' : `<button type="button" role="menuitem" data-i="${i}" class="${it.danger ? 'danger' : ''}">${U.icon(it.icon || 'chevron-right')}<span>${U.esc(it.label)}</span></button>`).join('');
    document.body.appendChild(m);
    const r = btn.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight;
    let top = r.bottom + 6; if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
    m.style.left = Math.min(window.innerWidth - w - 8, Math.max(8, r.right - w)) + 'px';
    m.style.top = top + 'px';
    btn.setAttribute('aria-expanded', 'true');
    const luar = (e) => { if (!m.contains(e.target) && !btn.contains(e.target)) tutup(); };
    const kunci = (e) => { if (e.key === 'Escape') { tutup(); btn.focus(); } };
    function tutup() {
      m.remove(); btn.setAttribute('aria-expanded', 'false'); U._menu = null;
      document.removeEventListener('pointerdown', luar, true); document.removeEventListener('keydown', kunci);
      window.removeEventListener('scroll', tutup, true); window.removeEventListener('resize', tutup);
    }
    U._menu = { btn, tutup };
    setTimeout(() => {
      document.addEventListener('pointerdown', luar, true); document.addEventListener('keydown', kunci);
      window.addEventListener('scroll', tutup, true); window.addEventListener('resize', tutup);
    }, 0);
    m.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (!b) return; tutup(); items[+b.dataset.i].onClick(); });
    const pertama = m.querySelector('button'); if (pertama) pertama.focus({ preventScroll: true });
  };

  // ---------------- Toast ----------------
  U.toast = (msg, type, ms) => {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const ic = { ok: 'circle-check', bad: 'circle-alert', warn: 'triangle-alert', info: 'info' }[type || 'ok'] || 'info';
    const el = document.createElement('div');
    el.className = 'toast ' + (type || 'ok');
    el.innerHTML = U.icon(ic) + '<span>' + U.esc(msg) + '</span>';
    box.appendChild(el);
    const tutup = () => { el.classList.add('out'); setTimeout(() => el.remove(), 220); };
    el.onclick = tutup;
    setTimeout(tutup, ms || (type === 'bad' ? Math.max(5200, String(msg).length * 70) : 3000));
  };

  // ---------------- Modal / drawer / konfirmasi ----------------
  U.modal = (o) => {
    const ov = document.createElement('div');
    ov.className = 'ov' + (o.drawer ? ' drawer' : '');
    ov.innerHTML = `<div class="modal ${o.size || ''}" role="dialog" aria-modal="true">
      <div class="modal-head">${o.icon ? `<span class="icon-dot sm ${o.iconCls || ''}">${U.icon(o.icon)}</span>` : ''}<h3>${U.esc(o.title || '')}${o.sub ? `<div class="sub">${o.sub}</div>` : ''}</h3>
      <button class="btn btn-ghost btn-icon btn-sm" data-x aria-label="Tutup">${U.icon('x')}</button></div>
      <div class="modal-body">${o.body || ''}</div>${o.foot !== false ? `<div class="modal-foot">${o.foot || ''}</div>` : ''}</div>`;
    const prevFocus = document.activeElement;
    const close = (v) => {
      if (ov._closed) return; ov._closed = true;
      ov.classList.add('closing');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => { ov.remove(); if (prevFocus && prevFocus.focus) prevFocus.focus(); }, 150);
      if (o.onClose) o.onClose(v);
    };
    const onKey = (e) => { if (e.key === 'Escape' && !o.kunci) close(); };
    document.addEventListener('keydown', onKey);
    if (!o.kunci) ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
    if (o.kunci) ov.querySelector('[data-x]').remove(); else ov.querySelector('[data-x]').onclick = () => close();
    document.body.appendChild(ov);
    const f = ov.querySelector('[autofocus]') || ov.querySelector('.modal-body input:not([type=hidden]):not([type=checkbox]), .modal-body select, .modal-body textarea');
    if (f && window.innerWidth > 767) setTimeout(() => f.focus(), 60);
    const api = { el: ov, body: ov.querySelector('.modal-body'), foot: ov.querySelector('.modal-foot'), close, $: (s) => ov.querySelector(s), $$: (s) => Array.from(ov.querySelectorAll(s)) };
    if (o.onOpen) o.onOpen(api);
    return api;
  };
  U.confirm = (o) => new Promise((resolve) => {
    if (typeof o === 'string') o = { text: o };
    const m = U.modal({
      title: o.title || 'Konfirmasi', icon: o.danger ? 'triangle-alert' : 'info', iconCls: o.danger ? 'bad' : '',
      body: `<p>${o.text || ''}</p>${o.cek ? `<label class="check mt-16"><input type="checkbox" data-cek ${o.cek.checked ? 'checked' : ''} ${o.cek.disabled ? 'disabled' : ''}><span class="box">${U.icon('check')}</span><span>${o.cek.label}</span></label>` : ''}${o.ketik ? `<div class="field mt-16"><label>Ketik <b>${U.esc(o.ketik)}</b> untuk melanjutkan</label><input class="input" data-k autocomplete="off"></div>` : ''}`,
      foot: `<button class="btn btn-light" data-n>${U.esc(o.batal || 'Batal')}</button><button class="btn ${o.danger ? 'btn-danger' : 'btn-primary'}" data-y ${o.ketik ? 'disabled' : ''}>${U.esc(o.ok || 'Ya, lanjutkan')}</button>`,
      onClose: () => resolve(false)
    });
    const y = m.$('[data-y]');
    if (o.ketik) m.$('[data-k]').oninput = (e) => { y.disabled = e.target.value.trim().toLowerCase() !== o.ketik.trim().toLowerCase(); };
    m.$('[data-n]').onclick = () => m.close();
    y.onclick = () => { if (o.cek) o.cek.nilai = !!(m.$('[data-cek]') || {}).checked; resolve(true); m.close(true); };
  });
  U.prompt = (o) => new Promise((resolve) => {
    let hasil = null;
    const m = U.modal({
      title: o.title, icon: o.icon, body: `<div class="field"><label>${U.esc(o.label || '')}</label>${o.input || `<input class="input" data-v value="${U.esc(o.value || '')}" autofocus>`}</div>${o.help ? `<p class="help mt-8">${o.help}</p>` : ''}`,
      foot: `<button class="btn btn-light" data-n>Batal</button><button class="btn btn-primary" data-y>${U.esc(o.ok || 'Simpan')}</button>`,
      onClose: () => resolve(hasil)
    });
    m.$('[data-n]').onclick = () => m.close();
    m.$('[data-y]').onclick = () => { hasil = m.$('[data-v]').value; m.close(); };
    m.$('[data-v]').onkeydown = (e) => { if (e.key === 'Enter') m.$('[data-y]').click(); };
  });

  // ---------------- Gambar ----------------
  U.bacaFile = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  U.muatGambar = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Gambar tidak dapat dibaca')); i.src = src; });
  // Kompres gambar di perangkat sebelum dikirim
  U.kompres = async (fileOrUrl, maxSisi, mutu, mime) => {
    const src = typeof fileOrUrl === 'string' ? fileOrUrl : await U.bacaFile(fileOrUrl);
    const img = await U.muatGambar(src);
    const s = Math.min(1, maxSisi / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
    const ctx = c.getContext('2d');
    if ((mime || 'image/jpeg') === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL(mime || 'image/jpeg', mutu || 0.85);
    return { dataUrl, base64: dataUrl.split(',')[1], mime: mime || 'image/jpeg', w: c.width, h: c.height };
  };
  // Alamat lengkap lembaga dari pengaturan identitas
  U.alamatLengkap = (l) => { l = l || {}; return [l.alamat, l.desa, l.kecamatan ? 'Kec. ' + l.kecamatan : ''].map((x) => String(x || '').trim()).filter(Boolean).join(', '); };
  // Olah gambar tanda tangan: latar putih/terang → transparan, potong tepi kosong, kecilkan (PNG ≤ ±33 KB)
  U.olahTtd = async (file) => {
    const img = await U.muatGambar(await U.bacaFile(file));
    const sk = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * sk); c.height = Math.round(img.naturalHeight * sk);
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    let minX = c.width, minY = c.height, maxX = -1, maxY = -1;
    for (let i = 0; i < p.length; i += 4) {
      const lum = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
      if (lum > 215) p[i + 3] = 0; // latar kertas
      else if (lum > 170) p[i + 3] = Math.round(p[i + 3] * (215 - lum) / 45); // tepi halus
      if (p[i + 3] > 24) { const k = i / 4, px = k % c.width, py = (k - px) / c.width; if (px < minX) minX = px; if (px > maxX) maxX = px; if (py < minY) minY = py; if (py > maxY) maxY = py; }
    }
    if (maxX < 0) throw new Error('Tanda tangan tidak terdeteksi. Gunakan gambar tinta gelap di atas latar putih/transparan.');
    x.putImageData(d, 0, 0);
    const pad = 6, w = maxX - minX + 1 + pad * 2, h = maxY - minY + 1 + pad * 2;
    for (const lebar of [420, 340, 280, 220, 170]) {
      const s2 = Math.min(1, lebar / w);
      const o = document.createElement('canvas'); o.width = Math.max(1, Math.round(w * s2)); o.height = Math.max(1, Math.round(h * s2));
      o.getContext('2d').drawImage(c, minX - pad, minY - pad, w, h, 0, 0, o.width, o.height);
      const url = o.toDataURL('image/png');
      if (url.length <= 45000) return url;
    }
    throw new Error('Gambar tanda tangan terlalu rumit. Coba foto/scan yang lebih bersih.');
  };
  U.pilihFile = (accept) => new Promise((res) => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = accept || 'image/*';
    i.onchange = () => res(i.files[0] || null); i.click();
  });

  // ---------------- Pustaka eksternal (dimuat saat dibutuhkan) ----------------
  const CDN = {
    chart: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js',
    jspdf: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
    autotable: 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js',
    xlsx: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
    qr: 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'
  };
  const muat = {};
  U.script = (url) => muat[url] || (muat[url] = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = url; s.async = true;
    s.onload = res; s.onerror = () => { delete muat[url]; rej(new Error('Gagal memuat pustaka. Periksa koneksi internet.')); };
    document.head.appendChild(s);
  }));
  U.lib = {
    chart: () => U.script(CDN.chart).then(() => window.Chart),
    pdf: () => U.script(CDN.jspdf).then(() => window.jspdf.jsPDF),
    pdfTable: () => U.script(CDN.jspdf).then(() => U.script(CDN.autotable)).then(() => window.jspdf.jsPDF),
    xlsx: () => U.script(CDN.xlsx).then(() => window.XLSX),
    qr: () => U.script(CDN.qr).then(() => window.qrcode)
  };
  // Gambar kode QR ke canvas (ukuran sisi px, dengan tepi putih)
  U.qrCanvas = async (teks, sisi) => {
    const qrcode = await U.lib.qr();
    const q = qrcode(0, 'M'); q.addData(teks); q.make();
    const n = q.getModuleCount(), tepi = 4, sel = Math.max(1, Math.floor((sisi || 600) / (n + tepi * 2)));
    const c = document.createElement('canvas'); c.width = c.height = sel * (n + tepi * 2);
    const g = c.getContext('2d'); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#111111';
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) g.fillRect((k + tepi) * sel, (r + tepi) * sel, sel, sel);
    return c;
  };
  U.unduhBlob = (blob, nama) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nama;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };
  U.namaFile = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 _-]/g, '').trim().replace(/\s+/g, '_');
  U.salin = async (teks) => {
    try { await navigator.clipboard.writeText(teks); return true; } catch (e) {
      const t = document.createElement('textarea'); t.value = teks; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.focus(); t.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      t.remove(); return ok;
    }
  };
  U.logoHtml = (set, fallback) => set && set.logo_data ? `<img src="${U.esc(set.logo_data)}" alt="Logo">` : (fallback || '<span style="font-family:var(--f-head);font-weight:900;font-size:22px">A</span>');
  // Rapikan link video Facebook agar bisa diputar pemutar resmi Facebook (m./web. → www., buang parameter pelacak)
  U.fbVideoUrl = (url) => {
    let u = String(url || '').trim();
    if (!/facebook\.com|fb\.watch/i.test(u)) return u;
    u = u.replace(/^http:\/\//i, 'https://').replace(/^(https:\/\/)(m|mbasic|web|touch|id-id)\.facebook\.com/i, '$1www.facebook.com').replace(/^https:\/\/facebook\.com/i, 'https://www.facebook.com');
    const v = u.match(/[?&]v=(\d+)/);
    if (/\/watch\/?\?/.test(u) && v) return 'https://www.facebook.com/watch/?v=' + v[1];
    if (/\/(videos|reel|share)\//.test(u)) u = u.split('?')[0];
    return u;
  };
  U.fbEmbed = (url, auto) => 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(U.fbVideoUrl(url)) + '&show_text=false&width=734' + (auto ? '&autoplay=true' : '');
  // Kenali sumber video dari link apa saja (YouTube, Facebook, TikTok, Instagram, Google Drive, Vimeo, file video, lainnya)
  U.video = (url) => {
    const u = String(url || '').trim();
    const yt = U.ytId(u);
    if (yt) return { sumber: 'youtube', label: 'YouTube', embed: (a) => `https://www.youtube.com/embed/${yt}?rel=0${a ? '&autoplay=1' : ''}`, thumb: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`, link: u };
    if (/facebook\.com|fb\.watch/i.test(u)) return { sumber: 'facebook', label: 'Facebook', embed: (a) => U.fbEmbed(u, a), link: U.fbVideoUrl(u) };
    let m = u.match(/tiktok\.com\/(?:@[^/]+\/video|v|embed(?:\/v2)?|player\/v1)\/(\d{8,})/i);
    if (m) return { sumber: 'tiktok', label: 'TikTok', tegak: true, embed: (a) => `https://www.tiktok.com/player/v1/${m[1]}?rel=0&description=0${a ? '&autoplay=1' : ''}`, link: u };
    if (/tiktok\.com/i.test(u)) return { sumber: 'lain', label: 'TikTok', link: u };
    m = u.match(/instagram\.com\/(reels?|p|tv)\/([A-Za-z0-9_-]+)/i);
    if (m) return { sumber: 'instagram', label: 'Instagram', tegak: true, embed: () => `https://www.instagram.com/${m[1] === 'reels' ? 'reel' : m[1]}/${m[2]}/embed`, link: u };
    m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([A-Za-z0-9_-]{10,})/i);
    if (m) return { sumber: 'drive', label: 'Google Drive', embed: () => `https://drive.google.com/file/d/${m[1]}/preview`, link: u };
    m = u.match(/vimeo\.com\/(?:video\/)?(\d{5,})/i);
    if (m) return { sumber: 'vimeo', label: 'Vimeo', embed: (a) => `https://player.vimeo.com/video/${m[1]}${a ? '?autoplay=1' : ''}`, link: u };
    if (/\.(mp4|webm|ogv|ogg|mov|m4v)(\?|#|$)/i.test(u)) return { sumber: 'file', label: 'Video', file: u, link: u };
    let host = ''; try { host = new URL(u).hostname.replace(/^www\./, ''); } catch (e) { /* biarkan */ }
    return { sumber: 'lain', label: host || 'Tautan', link: u };
  };
  U.ytId = (url) => { if (!/youtu\.?be/i.test(String(url || ''))) return ''; const m = String(url || '').match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{6,})/); return m ? m[1] : ''; };
  U.urlBaseFrontend = () => location.origin + location.pathname.replace(/[^/]*$/, '');
})();
