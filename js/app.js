/* ==========================================================================
   APLIKASI ADMIN & GURU — inti: sesi, data lokal, Outbox, router SPA, login
   Prinsip: UI berubah seketika (optimistis), server disinkronkan di latar.
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, icon } = U;
  const A = window.App = {};
  const LS_SESI = 'ahe_sesi_v1', LS_DATA = 'ahe_data_v1_', LS_OUT = 'ahe_outbox_v1', LS_GURU = 'ahe_guru_login_v1';
  A.S = { role: null, token: null, data: null, user: null, lastSync: 0 };
  A.ui = {};          // keadaan UI per halaman (filter, pilihan, halaman tabel)
  A.pages = {};
  A.hasil = {};       // penanganan hasil op dari server: A.hasil[op](op, data)
  A.page = (nama, def) => { A.pages[nama] = def; };
  A.go = (h) => { if (location.hash !== '#' + h) location.hash = h; else A.render(); };
  const appEl = $('#app');

  // ======================================================================
  // DATA LOKAL
  // ======================================================================
  const simpanCache = U.debounce(() => {
    if (!A.S.data || !A.S.role) return;
    if (!U.ls.set(LS_DATA + A.S.role, A.S.data)) {
      // penyimpanan penuh: buang bagian besar yang bisa dimuat ulang
      const ringan = Object.assign({}, A.S.data, { hadirSiswa: [], logWA: [] });
      U.ls.set(LS_DATA + A.S.role, ringan);
    }
  }, 500);
  A.mut = (fn, opt) => {
    fn(A.S.data);
    Rules.invalidate();
    simpanCache();
    if (!opt || opt.render !== false) A.refresh();
  };
  function terimaData(d) {
    A.S.data = d;
    A.S.lastSync = Date.now();
    Rules.bind(d);
    U.applyTheme((d.settings || {}).warna_utama);
    simpanCache();
    if (d.role === 'admin') pastikanUrlFrontend();
  }
  // Simpan alamat frontend agar link kuitansi di WA otomatis benar
  function pastikanUrlFrontend() {
    const base = U.urlBaseFrontend().replace(/\/+$/, '');
    if (!/^https?:/.test(base) || (A.S.data.settings || {}).url_frontend === base) return;
    A.S.data.settings.url_frontend = base;
    A.kirim({ op: 'saveSetting', key: 'url_frontend', value: base, _diam: true });
  }

  // ======================================================================
  // OUTBOX — antrean perubahan, dikirim per batch di latar belakang
  // ======================================================================
  const OB = A.outbox = { q: U.ls.get(LS_OUT, []) || [], sending: false, gagal: 0, timer: null, net: true };
  const simpanOB = () => U.ls.set(LS_OUT, OB.q);
  A.kirim = (op) => {
    op.opId = op.opId || U.uid();
    // Penanda "versi data": perubahan yang dibuat sebelum data dikosongkan admin akan dibuang server
    if (op.ep === undefined && A.S.data) op.ep = A.S.data.epoch || '';
    OB.q.push(op); simpanOB(); pill(); jadwalKirim(30);
    return op;
  };
  function jadwalKirim(ms) { clearTimeout(OB.timer); OB.timer = setTimeout(kirimBatch, ms); }
  async function kirimBatch() {
    if (OB.sending || !OB.q.length || !A.S.token) { pill(); return; }
    if (!navigator.onLine) { OB.net = false; pill(); return; }
    OB.sending = true; pill();
    const batch = OB.q.slice(0, 100);
    try {
      const r = await U.api('sync', { token: A.S.token, ops: batch.map((o) => { const c = Object.assign({}, o); Object.keys(c).forEach((k) => { if (k[0] === '_') delete c[k]; }); return c; }) });
      OB.gagal = 0; OB.net = true;
      const byId = {};
      r.results.forEach((x) => { byId[x.opId] = x; });
      let adaGagal = false, dibuang = 0;
      batch.forEach((op) => {
        const x = byId[op.opId];
        if (!x) return;
        if (!x.success && x.epoch) { dibuang++; return; }
        if (x.success) { if (A.hasil[op.op]) { try { A.hasil[op.op](op, x.data); } catch (e) { console.error(e); } } }
        else { adaGagal = true; U.toast((op._label || 'Perubahan') + ' gagal disimpan: ' + x.message, 'bad', 7000); }
      });
      OB.q = OB.q.filter((op) => !byId[op.opId]);
      simpanOB();
      if (adaGagal || dibuang) A._perluSegar = true;
      if (dibuang) U.toast('Data aplikasi telah dikosongkan admin — ' + dibuang + ' perubahan lama tidak disimpan.', 'warn', 8000);
    } catch (e) {
      if (e.kode === 'AUTH') { OB.sending = false; sesiHabis(); return; }
      OB.gagal++; OB.net = e.kode !== 'NET' ? OB.net : false;
      if (e.kode === 'CONFIG') U.toast(e.message, 'bad');
      jadwalKirim(Math.min(60000, 1500 * Math.pow(2, OB.gagal)));
    } finally {
      OB.sending = false; pill();
    }
    if (OB.q.length && OB.gagal === 0) jadwalKirim(20);
    if (!OB.q.length && A._perluSegar) { A._perluSegar = false; A.segarkan(); }
  }
  window.addEventListener('online', () => { OB.net = true; OB.gagal = 0; jadwalKirim(10); });
  window.addEventListener('offline', () => { OB.net = false; pill(); });
  window.addEventListener('beforeunload', (e) => { if (OB.q.length && navigator.onLine) { kirimBatch(); } });

  function pill() {
    const st = !navigator.onLine || !OB.net ? 'offline' : (OB.q.length || OB.sending ? 'saving' : 'ok');
    const teks = { ok: 'Tersimpan', saving: 'Menyimpan…', offline: 'Offline' }[st];
    $$('[data-sync]').forEach((el) => {
      el.className = 'sync ' + (st === 'ok' ? '' : st);
      el.innerHTML = `<span class="dot"></span>${teks}${st === 'offline' && OB.q.length ? ' · ' + OB.q.length : ''}`;
      el.title = st === 'offline' ? 'Perubahan tersimpan di perangkat dan akan dikirim otomatis saat online' : '';
    });
  }
  A.pill = pill;
  // Bersihkan data & antrean di perangkat ini (setelah data server dikosongkan / diisi ulang)
  A.resetLokal = () => { ['admin', 'guru', 'wakil'].forEach((r) => U.ls.del(LS_DATA + r)); OB.q = []; simpanOB(); };
  A.sebagaiGuru = () => A.S.role === 'guru' || A.S.role === 'wakil';
  A.NAMA_PERAN = { admin: 'Admin', guru: 'Guru', wakil: 'Wakil Admin' };

  // Muat ulang data dari server (latar belakang)
  A.segarkan = async () => {
    if (!A.S.token) return;
    if (OB.q.length || OB.sending) { A._perluSegar = true; jadwalKirim(10); return; }
    try {
      const t = A.S.token;
      const d = await U.api('bootstrap', { token: t });
      if (A.S.token !== t) return; // sudah keluar / berganti akun
      if (OB.q.length) { A._perluSegar = true; return; }
      terimaData(d);
      A.S.user = d.user;
      A.refresh(true);
    } catch (e) {
      if (e.kode === 'AUTH' && A.S.token) sesiHabis();
    }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && A.S.token && Date.now() - A.S.lastSync > 60000) { U.ping(); A.segarkan(); }
  });

  // ======================================================================
  // SESI & LOGIN
  // ======================================================================
  function sesiHabis() {
    U.ls.del(LS_SESI);
    A.S.token = null;
    U.toast('Sesi berakhir. Silakan masuk lagi — perubahan Anda tetap tersimpan.', 'warn', 6000);
    tampilLogin();
  }
  A.keluar = async () => {
    const nama = (A.S.user && (A.S.user.panggilan || A.S.user.nama)) || '';
    const draf = A.sebagaiGuru() && A.drafAbsen && A.drafAbsen.ada();
    const ok = await U.confirm({
      title: 'Keluar dari aplikasi?',
      text: 'Anda akan keluar dari akun <b>' + esc(A.NAMA_PERAN[A.S.role] || 'Guru') + (nama ? ' · ' + esc(nama) : '') + '</b>. Untuk masuk lagi diperlukan kata sandi.' +
        (draf ? '<br><br>Centangan absen yang belum disimpan tetap aman sebagai <b>draf</b> di perangkat ini.' : ''),
      ok: 'Iya, keluar', batal: 'Tidak'
    });
    if (!ok) return;
    if (OB.q.length) {
      U.toast('Mengirim perubahan terakhir…', 'info');
      await kirimBatch();
      if (OB.q.length && !(await U.confirm({ title: 'Masih ada perubahan belum terkirim', text: 'Ada ' + OB.q.length + ' perubahan yang belum terkirim ke server. Keluar sekarang akan menyimpannya di perangkat ini dan mengirimnya setelah Anda masuk lagi.', ok: 'Tetap keluar' }))) return;
    }
    akhiriSesi();
    location.hash = '';
    tampilLogin();
  };
  // Hapus sesi & data tersimpan di perangkat (token juga dicabut di server)
  function akhiriSesi(sesi) {
    sesi = sesi || { token: A.S.token, role: A.S.role };
    if (sesi.token) U.api('logout', { token: sesi.token }).catch(() => { });
    U.ls.del(LS_SESI);
    if (sesi.role) U.ls.del(LS_DATA + sesi.role);
    A.S = { role: null, token: null, data: null, user: null, lastSync: 0 };
    A.ui = {};
  }

  function tampilLogin(opsi) {
    opsi = opsi || {};
    document.body.classList.remove('logged');
    const guruList = U.ls.get(LS_GURU, []) || [];
    const ui = A.ui._login = A.ui._login || { peran: 'guru', guruId: '', buka: false };
    const cache = U.ls.get(LS_DATA + 'admin', null) || U.ls.get(LS_DATA + 'wakil', null) || U.ls.get(LS_DATA + 'guru', null);
    const set = (cache && cache.settings) || U.ls.get('ahe_landing_v1', {}).settings || {};
    U.applyTheme(set.warna_utama);
    const render = () => {
      const g = guruList.find((x) => x.id === ui.guruId);
      appEl.innerHTML = `<div class="login-wrap"><span class="deco" style="font-size:140px;top:2%;left:4%">A</span><span class="deco" style="font-size:120px;bottom:6%;right:6%">3</span><span class="deco" style="font-size:90px;top:30%;right:10%">1</span>
        <div class="login-box"><div class="login-logo">${U.logoHtml(set, '<span style="font-family:var(--f-head);font-weight:900;font-size:44px">A</span>')}<span class="star">${icon('star', 'ic-sm ic-fill')}</span></div>
          <div class="login-title"><h1>${esc(set.nama_aplikasi || 'Ahe & Ala')}</h1><p class="muted">Manajemen Les Baca & Berhitung</p></div>
          <div class="card card-pad" style="padding:22px">
            <div class="seg full mb-16"><button class="${ui.peran === 'guru' ? 'on' : ''}" data-peran="guru">${icon('graduation-cap')} Guru</button><button class="${ui.peran === 'admin' ? 'on' : ''}" data-peran="admin">${icon('shield-check')} Admin</button></div>
            <form id="flogin" class="form-stack" autocomplete="on">
              ${ui.peran === 'guru' ? `<div class="field"><div class="row-gap"><label class="label">Nama Guru <span class="req">*</span></label><span class="spacer"></span><span class="chip chip-ala chip-sm" id="jml-guru">${guruList.length ? guruList.length + ' guru aktif' : 'memuat…'}</span></div>
                <div class="picker"><button type="button" class="picker-btn" data-pick>${g ? U.avatar(g.nama, g.id, 'av-sm') + `<b style="flex:1">${esc(g.panggilan || g.nama)}</b>` : `<span class="ph">Pilih nama Anda</span>`}${icon(ui.buka ? 'chevron-up' : 'chevron-down')}</button>
                ${ui.buka ? `<div class="picker-list">${guruList.length ? guruList.map((x) => `<button type="button" data-g="${esc(x.id)}" class="${x.id === ui.guruId ? 'on' : ''}">${U.avatar(x.nama, x.id, 'av-sm')}<span style="flex:1"><b>${esc(x.panggilan || x.nama)}</b><br><small class="muted">${esc(x.nama)}</small></span>${x.id === ui.guruId ? icon('circle-check', 'ok') : ''}</button>`).join('') : '<p class="small muted" style="padding:10px">Belum ada guru. Admin perlu menambahkan data guru dan kata sandinya.</p>'}</div>` : ''}</div></div>`
                : `<div class="field"><label for="l-user">Username <span class="req">*</span></label><div class="input-icon">${icon('user')}<input class="input" id="l-user" name="username" autocomplete="username" required></div></div>`}
              <div class="field"><label for="l-pass">Kata Sandi <span class="req">*</span></label><div class="input-icon">${icon('lock')}<input class="input" id="l-pass" name="password" type="password" autocomplete="current-password" required><button type="button" class="btn btn-ghost btn-icon btn-sm btn-eye" data-eye aria-label="Lihat sandi">${icon('eye')}</button></div>
                ${ui.peran === 'guru' ? `<span class="help">${icon('info', 'ic-sm')} Kata sandi awal dari Admin — bisa Anda ganti di menu Akun Saya.</span>` : ''}</div>
              <button class="btn btn-primary btn-lg btn-block" type="submit" id="btn-login">Masuk sebagai ${ui.peran === 'guru' ? 'Guru' : 'Admin'} ${icon('log-out')}</button>
            </form>
            ${ui.peran === 'guru' && set.wa_admin ? `<p class="small muted mt-16" style="text-align:center">Lupa kata sandi? <a target="_blank" rel="noopener" href="${U.waLink(set.wa_admin, 'Assalamu\'alaikum Admin, saya lupa kata sandi aplikasi les.')}" style="color:var(--wa);font-weight:700">${icon('message-circle', 'ic-sm')} Hubungi Admin</a></p>` : ''}
          </div>
          ${!U.siapApi() ? `<div class="note-box bad mt-16">${icon('triangle-alert')}<span><b>URL backend belum diisi.</b> Isi GAS_URL di file js/config.js dengan URL Web App Apps Script (berakhiran /exec).</span></div>` : ''}
          <p class="mt-16" style="text-align:center"><a href="index.html" class="small strong">${icon('arrow-left', 'ic-sm')} Kembali ke halaman utama</a></p>
        </div></div>`;
      $$('[data-peran]').forEach((b) => b.onclick = () => { ui.peran = b.dataset.peran; render(); });
      const pk = $('[data-pick]'); if (pk) pk.onclick = () => { ui.buka = !ui.buka; render(); };
      $$('[data-g]').forEach((b) => b.onclick = () => { ui.guruId = b.dataset.g; ui.buka = false; render(); setTimeout(() => $('#l-pass').focus(), 30); });
      $('[data-eye]').onclick = (e) => { const p = $('#l-pass'); p.type = p.type === 'password' ? 'text' : 'password'; e.currentTarget.innerHTML = icon(p.type === 'password' ? 'eye' : 'eye-off'); };
      $('#flogin').onsubmit = async (e) => {
        e.preventDefault();
        const btn = $('#btn-login');
        const f = e.target;
        if (ui.peran === 'guru' && !ui.guruId) { U.toast('Pilih nama Anda terlebih dahulu', 'warn'); ui.buka = true; render(); return; }
        if (!f.password.value) { U.toast('Isi kata sandi', 'warn'); return; }
        btn.disabled = true; btn.innerHTML = `${icon('loader-circle', 'spin')} Memeriksa…`;
        try {
          const d = await U.api('login', { peran: ui.peran, guruId: ui.guruId, username: f.username ? f.username.value.trim() : '', password: f.password.value });
          masuk(d);
        } catch (err) {
          U.toast(err.message, 'bad');
          btn.disabled = false; btn.innerHTML = `Masuk sebagai ${ui.peran === 'guru' ? 'Guru' : 'Admin'} ${icon('log-out')}`;
        }
      };
    };
    render();
    U.ping();
    if (U.siapApi()) U.apiGet({ action: 'getGuruLogin' }).then((l) => {
      U.ls.set(LS_GURU, l);
      if (A.S.token) return;
      const adaSebelum = ui.guruId && guruList.some((x) => x.id === ui.guruId);
      guruList.length = 0; l.forEach((x) => guruList.push(x));
      const j = $('#jml-guru'); if (j) j.textContent = l.length + ' guru aktif';
      if (ui.guruId && !l.some((x) => x.id === ui.guruId)) { ui.guruId = ''; render(); return; }
      if (ui.buka || (ui.guruId && !adaSebelum)) { const pw = $('#l-pass') && $('#l-pass').value; render(); if (pw && $('#l-pass')) $('#l-pass').value = pw; }
    }).catch(() => { });
  }

  function masuk(d) {
    const role = d.role;
    A.S.token = d.token; A.S.role = role; A.S.user = d.user;
    U.ls.set(LS_SESI, { token: d.token, role, user: d.user });
    delete d.token;
    // data milik akun lain di perangkat ini dibuang
    ['admin', 'guru', 'wakil'].filter((r) => r !== role).forEach((r) => U.ls.del(LS_DATA + r));
    terimaData(d);
    A.ui = {};
    location.hash = role === 'admin' ? '#/dashboard' : '#/absen';
    mulaiApp();
    if (OB.q.length) jadwalKirim(50);
    if (role === 'admin' && d.user.mustChange) setTimeout(() => A.gantiAkun(true), 300);
  }

  // Ganti username & sandi admin (wajib saat login pertama)
  A.gantiAkun = (wajib) => {
    const m = U.modal({
      kunci: !!wajib,
      title: wajib ? 'Ganti akun bawaan' : 'Ganti username & kata sandi', icon: 'key-round',
      sub: wajib ? 'Demi keamanan, akun bawaan wajib diganti sebelum aplikasi dipakai.' : '',
      body: `<form class="form-stack" id="fakun" autocomplete="off">
        <div class="field"><label>Username baru</label><input class="input" name="u" value="${esc(A.S.user && A.S.user.username || '')}" minlength="3" maxlength="40" required><span class="help">3–40 karakter: huruf, angka, titik, garis bawah, strip</span></div>
        <div class="field"><label>Kata sandi lama</label><input class="input" type="password" name="o" required></div>
        <div class="field"><label>Kata sandi baru</label><input class="input" type="password" name="n" minlength="8" required><span class="help">Minimal 8 karakter</span></div>
        <div class="field"><label>Ulangi kata sandi baru</label><input class="input" type="password" name="n2" required></div></form>`,
      foot: `${wajib ? '' : '<button class="btn btn-light" data-n>Batal</button>'}<button class="btn btn-primary" data-y>${icon('save')} Simpan Akun</button>`
    });
    if (!wajib) m.$('[data-n]').onclick = () => m.close();
    m.$('[data-y]').onclick = async (e) => {
      const f = m.$('#fakun');
      if (f.n.value !== f.n2.value) return U.toast('Ulangi kata sandi tidak sama', 'warn');
      if (f.n.value.length < 8) return U.toast('Kata sandi baru minimal 8 karakter', 'warn');
      const b = e.currentTarget; b.disabled = true;
      try {
        const r = await U.api('changeAccount', { token: A.S.token, newUsername: f.u.value.trim(), oldPassword: f.o.value, newPassword: f.n.value });
        A.S.user.username = r.username; A.S.user.mustChange = false;
        U.ls.set(LS_SESI, { token: A.S.token, role: A.S.role, user: A.S.user });
        U.toast('Akun berhasil diganti');
        m.close();
      } catch (err) { U.toast(err.message, 'bad'); b.disabled = false; }
    };
  };

  // ======================================================================
  // KERANGKA (SHELL) & ROUTER
  // ======================================================================
  const NAV_ADMIN = [
    ['dashboard', 'Dashboard', 'layout-dashboard'], ['pendaftar', 'Pendaftar Baru', 'user-plus'], ['siswa', 'Siswa', 'graduation-cap'],
    ['guru', 'Guru', 'users'], ['kehadiran', 'Kehadiran', 'calendar-check'], ['spp', 'SPP & Kuitansi', 'receipt'],
    ['piagam', 'Piagam', 'award'], ['libur', 'Hari Libur', 'calendar-x'], ['landing', 'Landing Page', 'layout-template'], ['promosi', 'Promosi', 'sparkles'], ['pengaturan', 'Pengaturan', 'settings']
  ];
  const NAV_GURU = [['absen', 'Absen Hari Ini', 'calendar-check'], ['riwayat', 'Riwayat Saya', 'history'], ['akun', 'Akun Saya', 'key-round']];
  // Wakil admin: menu guru + sebagian menu admin
  const NAV_WAKIL = [['absen', 'Absen Hari Ini', 'calendar-check'], ['riwayat', 'Riwayat Saya', 'history'], ['spp', 'SPP (Draf)', 'receipt'], ['piagam', 'Cetak Piagam', 'award'],
    ['libur', 'Hari Libur', 'calendar-x'], ['landing', 'Landing Page', 'layout-template'], ['promosi', 'Promosi', 'sparkles'], ['akun', 'Akun Saya', 'key-round']];
  A.badge = (k) => {
    const d = A.S.data;
    if (!d || A.S.role !== 'admin') return 0;
    if (k === 'pendaftar') return (d.siswa || []).filter((s) => s.statusDaftar === 'menunggu').length;
    if (k === 'piagam') return Rules.peringatan().piagam.length;
    if (k === 'spp') return (d.drafSpp || []).filter((x) => x.status === 'menunggu').length;
    return 0;
  };

  function shell() {
    const d = A.S.data, set = d.settings || {};
    const admin = A.S.role === 'admin', wakil = A.S.role === 'wakil';
    const nav = admin ? NAV_ADMIN : wakil ? NAV_WAKIL : NAV_GURU;
    appEl.innerHTML = `<div class="app-shell">
      <aside class="sidebar"><div class="brand"><span class="logo">${U.logoHtml(set, '<span style="color:var(--p);font-weight:900;font-size:22px;font-family:var(--f-head)">A</span>')}</span><div style="min-width:0"><div class="t1 ellipsis">${esc(set.nama_aplikasi || 'Ahe & Ala')}</div><div class="t2">Les Baca & Berhitung</div></div></div>
        <div class="nav-sec">${admin ? 'Navigasi Utama' : wakil ? 'Menu Wakil Admin' : 'Menu Guru'}</div>
        <nav class="nav" id="snav">${nav.map(([k, l, ic]) => `<a href="#/${k}" data-nav="${k}">${icon(ic)}<span>${l}</span><span class="count hidden" data-count="${k}"></span></a>`).join('')}</nav>
        <div class="side-user">${U.avatar(A.S.user.nama, A.S.user.id || 'admin', 'av-sm')}<div class="who">${esc(A.S.user.nama)}<small>${admin ? 'Admin Utama' : wakil ? 'Wakil Admin' : 'Guru'} · ${esc(set.nama_unit || '')}</small></div><button data-keluar title="Keluar" aria-label="Keluar">${icon('log-out')}</button></div>
      </aside>
      <div class="main">
        ${set.mode_demo === 'ya' ? `<div class="demo-bar">${icon('sparkles', 'ic-sm')}<span><b>Mode Demo</b><span class="d-only"> — semua data adalah contoh. WA untuk orang tua dialihkan ke nomor admin.</span><span class="m-only"> · data contoh</span></span>${admin ? '<a href="#/pengaturan/demo">Akhiri mode demo</a>' : ''}</div>` : ''}
        <header class="topbar"><span class="tb-logo">${U.logoHtml(set, '<span style="font-weight:900;font-family:var(--f-head)">A</span>')}</span>
          <div class="crumb" id="crumb"></div><span class="sync" data-sync></span>
          ${admin ? `<a class="btn btn-ghost btn-icon btn-sm d-only" href="#/dashboard" title="Peringatan">${icon('bell')}</a>` : ''}
          <button class="btn btn-ghost btn-icon btn-sm m-only" data-keluar aria-label="Keluar" title="Keluar">${icon('log-out')}</button></header>
        <main class="view" id="view"></main>
      </div>
      <nav class="bnav" id="bnav">${admin || wakil
        ? (admin ? [['dashboard', 'Dashboard', 'layout-dashboard'], ['siswa', 'Siswa', 'graduation-cap'], ['kehadiran', 'Kehadiran', 'calendar-check'], ['spp', 'SPP', 'receipt']] : [['absen', 'Absen', 'calendar-check'], ['riwayat', 'Riwayat', 'history'], ['spp', 'SPP', 'receipt'], ['piagam', 'Piagam', 'award']]).map(([k, l, ic]) => `<a href="#/${k}" data-nav="${k}">${icon(ic)}${l}</a>`).join('') + `<button data-lainnya>${icon('menu')}Lainnya<span class="count hidden" data-count="lainnya"></span></button>`
        : NAV_GURU.map(([k, l, ic]) => `<a href="#/${k}" data-nav="${k}">${icon(ic)}${l.split(' ')[0]}</a>`).join('') + `<button data-keluar>${icon('log-out')}Keluar</button>`}</nav>
    </div>`;
    $$('[data-keluar]').forEach((b) => b.onclick = A.keluar);
    const l = $('[data-lainnya]');
    if (l) l.onclick = () => {
      const m = U.modal({
        title: 'Menu lainnya', icon: 'menu', foot: false,
        body: `<div class="more-grid">${(admin ? NAV_ADMIN : NAV_WAKIL).map(([k, lb, ic]) => { const c = A.badge(k); return `<a href="#/${k}" data-m>${c ? `<span class="count">${c}</span>` : ''}<span class="icon-dot">${icon(ic)}</span>${lb}</a>`; }).join('')}</div>
          <button class="btn btn-danger-ghost btn-block mt-16" data-k>${icon('log-out')} Keluar</button>`
      });
      m.$$('[data-m]').forEach((a) => a.onclick = () => m.close());
      m.$('[data-k]').onclick = () => { m.close(); A.keluar(); };
    };
    pill();
  }
  function navAktif(k) {
    $$('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === k));
    if (A.S.role !== 'admin') return;
    let lain = 0;
    ['pendaftar', 'piagam', 'spp'].forEach((x) => {
      const c = A.badge(x); lain += c;
      $$(`[data-count="${x}"]`).forEach((el) => { el.textContent = c; el.classList.toggle('hidden', !c); });
    });
    $$('[data-count="lainnya"]').forEach((el) => { el.textContent = lain; el.classList.toggle('hidden', !lain); });
  }

  let rute = { nama: '', params: [] };
  A.rute = () => rute;
  A.render = () => {
    if (!A.S.token || !A.S.data) return;
    const h = location.hash.replace(/^#\/?/, '');
    const [jalur, qs] = h.split('?');
    const seg = jalur.split('/').filter(Boolean).map(decodeURIComponent);
    let nama = seg[0] || (A.S.role === 'admin' ? 'dashboard' : 'absen');
    if (A.S.role === 'wakil' && nama === 'pengaturan' && seg[1] === 'piagam') nama = '__tolak'; // atur template piagam: admin utama saja
    let params = seg.slice(1);
    if (nama === 'siswa' && params[0] === 'impor') { nama = 'impor'; params = []; }
    else if (nama === 'siswa' && params[0]) { nama = 'detail'; }
    const pg = A.pages[nama];
    const peranHal = pg && (pg.role || 'admin');
    const izin = pg && (peranHal === A.S.role || (A.S.role === 'wakil' && (peranHal === 'guru' || pg.wakil)));
    if (!izin) { location.replace('#/' + (A.S.role === 'admin' ? 'dashboard' : 'absen')); return; }
    const ganti = rute.nama !== nama || rute.params.join('/') !== params.join('/');
    rute = { nama, params, qs: new URLSearchParams(qs || '') };
    const view = $('#view');
    if (!view) { shell(); return A.render(); }
    const crumb = typeof pg.crumb === 'function' ? pg.crumb(params) : (pg.crumb || pg.title);
    $('#crumb').innerHTML = `<small>${A.NAMA_PERAN[A.S.role] || 'Guru'}${crumb !== pg.title ? ' / ' + esc(pg.title) : ''}</small><b>${esc(crumb)}</b>`;
    document.title = crumb + ' · ' + ((A.S.data.settings || {}).nama_aplikasi || 'Ahe & Ala');
    navAktif(pg.nav || nama);
    try { pg.render(view, params, rute.qs); }
    catch (e) { console.error(e); view.innerHTML = `<div class="card card-pad"><div class="empty"><div class="art">${icon('triangle-alert')}</div><h4>Halaman gagal ditampilkan</h4><p>${esc(e.message)}</p></div></div>`; }
    if (ganti) { view.style.animation = 'none'; void view.offsetWidth; view.style.animation = ''; window.scrollTo(0, 0); }
  };
  // Render ulang halaman aktif setelah data berubah (tidak mengganggu yang sedang mengetik)
  let tundaRefresh = false;
  A.refresh = (paksa) => {
    const ae = document.activeElement;
    if (!paksa && ae && $('#view') && $('#view').contains(ae) && /INPUT|TEXTAREA|SELECT/.test(ae.tagName) && ae.type !== 'checkbox') {
      if (!tundaRefresh) { tundaRefresh = true; ae.addEventListener('blur', () => { tundaRefresh = false; setTimeout(() => A.refresh(), 0); }, { once: true }); }
      navAktif(A.pages[rute.nama] ? (A.pages[rute.nama].nav || rute.nama) : '');
      return;
    }
    const y = window.scrollY;
    A.render();
    window.scrollTo(0, y);
  };
  window.addEventListener('hashchange', A.render);

  function mulaiApp() {
    document.body.classList.add('logged');
    shell();
    A.render();
  }

  // ======================================================================
  // KOMPONEN BERSAMA
  // ======================================================================
  A.chipProg = (p, singkat) => !p ? '<span class="chip chip-outline">Belum ditentukan</span>'
    : `<span class="chip ${p.program === 'ala' ? 'chip-ala' : 'chip-ahe'}">${icon(p.program === 'ala' ? 'calculator' : 'book-open')} ${singkat ? Rules.SINGKAT[p.program] : Rules.LABEL[p.program]}${singkat ? ' · Lv ' + esc(p.level) : ''}</span>`;
  A.chipStatus = (st) => ({
    aktif: `<span class="chip chip-ok"><span class="dot"></span>Aktif</span>`, rehat: `<span class="chip"><span class="dot"></span>Rehat</span>`,
    lulus: `<span class="chip chip-lulus">${icon('star')}Lulus</span>`, menunggu: `<span class="chip chip-warn">Menunggu</span>`,
    belum: `<span class="chip chip-outline">Belum ada program</span>`
  }[st] || '');
  A.chipBuku = (p) => !p ? '' : p.buku === 'ya' ? `<span class="chip chip-ok">${icon('check')} Sudah</span>` : `<span class="chip chip-warn">${icon('x')} Belum</span>`;
  A.kosong = (ic, judul, teks, aksi) => `<div class="empty"><div class="art">${icon(ic)}</div><h4>${esc(judul)}</h4>${teks ? `<p>${teks}</p>` : ''}${aksi || ''}</div>`;
  // Kotak centang tampilan saja (dipakai di daftar yang seluruh barisnya bisa diketuk) — tidak menangkap klik
  A.cekVis = (checked, disabled) => `<span class="check" aria-hidden="true" style="pointer-events:none"><input type="checkbox" tabindex="-1" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span class="box">${icon('check')}</span></span>`;
  A.cek = (attr, checked, disabled) => `<label class="check" onclick="event.stopPropagation()"><input type="checkbox" ${attr || ''} ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span class="box">${icon('check')}</span></label>`;
  A.pager = (total, hal, per) => {
    const n = Math.max(1, Math.ceil(total / per));
    if (total <= per) return total ? `<div class="pager"><span>Menampilkan ${total} data</span></div>` : '';
    const btns = [];
    for (let i = 1; i <= n; i++) if (i === 1 || i === n || Math.abs(i - hal) <= 1) btns.push(i); else if (btns[btns.length - 1] !== '…') btns.push('…');
    return `<div class="pager"><span>Menampilkan ${(hal - 1) * per + 1}–${Math.min(total, hal * per)} dari ${total}</span><div class="pg">
      <button data-pg="${hal - 1}" ${hal <= 1 ? 'disabled' : ''} aria-label="Sebelumnya">${icon('chevron-left', 'ic-sm')}</button>
      ${btns.map((b) => b === '…' ? '<span style="padding:6px">…</span>' : `<button data-pg="${b}" class="${b === hal ? 'on' : ''}">${b}</button>`).join('')}
      <button data-pg="${hal + 1}" ${hal >= n ? 'disabled' : ''} aria-label="Berikutnya">${icon('chevron-right', 'ic-sm')}</button></div></div>`;
  };
  A.foto = {}; // cache foto siswa/guru yang sudah dimuat

  // ======================================================================
  // HALAMAN GURU
  // ======================================================================
  // Draf absen: centangan yang belum disimpan tetap aman di perangkat (mis. aplikasi tertutup tidak sengaja)
  const LS_DRAF = 'ahe_absen_draf_v1';
  A.drafAbsen = {
    baca() { const d = U.ls.get(LS_DRAF, null); return d && A.S.user && d.guruId === A.S.user.id && d.tgl === U.today() ? d : null; },
    simpan(sel) { if (A.S.user) U.ls.set(LS_DRAF, { guruId: A.S.user.id, tgl: U.today(), sel: Array.from(sel), waktu: Date.now() }); },
    hapus() { U.ls.del(LS_DRAF); },
    ada() { return !!A.drafAbsen.baca(); }
  };
  const samaSet = (a, b) => a.size === b.size && Array.from(a).every((x) => b.has(x));
  A.page('absen', {
    role: 'guru', title: 'Absen Hari Ini', crumb: 'Absen Hari Ini',
    render(view) {
      const d = A.S.data, me = A.S.user, t = U.today();
      const ui = A.ui.absen = A.ui.absen || { q: '', tab: 'semua', sel: null, dirty: false };
      const milikSaya = (d.hadirHariIni || []).filter((h) => h.guruId === me.id).map((h) => h.siswaId);
      const lain = {};
      (d.hadirHariIni || []).forEach((h) => { if (h.guruId !== me.id) lain[h.siswaId] = d.namaGuru[h.guruId] || 'guru lain'; });
      if (!ui.sel || (!ui.dirty && ui.tgl !== t) || (ui.dirty && ui.tgl !== t)) {
        ui.sel = new Set(milikSaya); ui.tgl = t; ui.dirty = false; ui.dipulihkan = 0;
        // Pulihkan draf (centangan yang belum sempat disimpan)
        const dr = A.drafAbsen.baca();
        if (dr) {
          const ada = new Set((d.siswaAktif || []).map((s) => s.id));
          const sel = new Set(dr.sel.filter((id) => ada.has(id) && !lain[id]));
          if (!samaSet(sel, ui.sel)) { ui.sel = sel; ui.dirty = true; ui.dipulihkan = Date.now(); }
          else A.drafAbsen.hapus();
        } else if (U.ls.get(LS_DRAF, null)) {
          const lama = U.ls.get(LS_DRAF, null);
          if (lama.guruId === me.id) A.drafAbsen.hapus(); // draf hari sebelumnya sudah tidak berlaku
        }
      }
      const libur = Rules.libur(t, d.libur);
      const hariLes = Rules.hariLes(t, d.libur);
      const semua = (d.siswaAktif || []).slice().sort((a, b) => a.nama.localeCompare(b.nama));
      const jml = { semua: semua.length, ahe: semua.filter((s) => s.program === 'ahe').length, ala: semua.filter((s) => s.program === 'ala').length };
      const head = `<div class="hero-guru"><span class="sync badge-sync" data-sync></span><div class="small" style="opacity:.8;font-weight:700;letter-spacing:.05em;text-transform:uppercase">Guru Pembimbing</div>
        <h2>Halo, ${esc(me.nama)} 👋</h2><div class="sub">${icon('calendar')} ${esc(U.tglHari(t))}</div></div>`;
      if (!hariLes) {
        view.innerHTML = head + `<div class="card mt-16">${A.kosong('calendar-x', 'Hari ini tidak ada jadwal les', libur ? `<b>${esc(libur.keterangan)}</b>${libur.tglMasuk ? '<br>Les masuk kembali ' + esc(U.tglHari(libur.tglMasuk)) : ''}` : 'Les berlangsung Senin – Jumat. Selamat beristirahat!', `<a class="btn btn-soft" href="#/riwayat">${icon('history')} Lihat riwayat mengajar</a>`)}</div>`;
        pill(); return;
      }
      view.innerHTML = head + `
        ${ui.dirty && ui.dipulihkan ? `<div class="note-box warn mt-16" id="draf-info">${icon('notebook-pen')}<span style="flex:1 1 220px"><b>Draf absen dipulihkan.</b> Centangan Anda sebelumnya (${ui.sel.size} siswa) belum disimpan. Periksa lalu tekan <b>Simpan Kehadiran</b>.</span><button class="btn btn-light btn-sm" id="draf-buang">${icon('rotate-ccw')} Buang draf</button></div>` : ''}
        <div class="note-box mt-16">${icon('info')}<span>Pilih siswa yang Anda ajar hari ini. Menyimpan absen sekaligus mencatat <b>kehadiran Anda</b> dan <b>kehadiran siswa</b>.</span></div>
        <div class="input-icon mt-16">${icon('search')}<input class="input" id="cari" placeholder="Cari nama / panggilan siswa…" value="${esc(ui.q)}" autocomplete="off"></div>
        <div class="row-gap mt-12"><div class="tabs" style="flex:1">${[['semua', 'Semua'], ['ahe', 'Baca'], ['ala', 'Berhitung']].map(([k, l]) => `<button class="tab ${ui.tab === k ? 'on' : ''}" data-tab="${k}">${l} <span class="n">${jml[k]}</span></button>`).join('')}</div>
          <span class="chip chip-ahe" id="jml-pilih">Terpilih: ${ui.sel.size}</span></div>
        <div class="slist mt-12" id="slist"></div>
        <div class="sticky-act"><button class="btn btn-accent btn-lg btn-block btn-pill" id="btn-simpan"></button>
          <p class="tiny muted mt-8" style="text-align:center" id="draf-ket"></p></div>`;
      const daftar = () => {
        const q = ui.q.trim().toLowerCase();
        const rows = semua.filter((s) => (ui.tab === 'semua' || s.program === ui.tab) && (!q || (s.nama + ' ' + s.panggilan).toLowerCase().includes(q)));
        $('#slist').innerHTML = rows.length ? rows.map((s) => {
          const kunci = !!lain[s.id];
          const on = ui.sel.has(s.id);
          return `<div class="sitem ${on ? 'on' : ''} ${kunci ? 'lock' : ''}" data-s="${esc(s.id)}" role="checkbox" aria-checked="${on}" tabindex="0">
            ${A.cekVis(on, kunci)}${U.avatar(s.nama, s.id)}
            <div class="meta"><div class="nm ellipsis">${esc(s.nama)} ${s.panggilan ? `<small>(${esc(s.panggilan)})</small>` : ''}</div>
            ${kunci ? `<div class="note">${icon('lock', 'ic-sm')} Sudah dicatat oleh ${esc(lain[s.id])}</div>` : ''}</div>
            <span class="chip ${s.program === 'ala' ? 'chip-ala' : 'chip-ahe'}">${Rules.SINGKAT[s.program]} · Lv ${esc(s.level)}${(s.program === 'ahe' && +s.level === 7) || (s.program === 'ala' && (+s.level === 6 || +s.level === 16)) ? ' ★' : ''}</span></div>`;
        }).join('') : A.kosong('search', 'Siswa tidak ditemukan', 'Coba kata kunci lain.');
        tombol();
      };
      const tombol = () => {
        const b = $('#btn-simpan');
        const sudah = milikSaya.length > 0;
        const sama = !ui.dirty;
        b.disabled = !ui.sel.size && !sudah;
        b.innerHTML = sama && sudah ? `${icon('circle-check')} Kehadiran tersimpan (${ui.sel.size} siswa)` : `${icon('circle-check')} ${sudah ? 'Perbarui' : 'Simpan'} Kehadiran (${ui.sel.size} siswa)`;
        b.classList.toggle('btn-accent', !(sama && sudah)); b.classList.toggle('btn-soft', sama && sudah);
        $('#jml-pilih').textContent = 'Terpilih: ' + ui.sel.size;
        $('#draf-ket').innerHTML = ui.dirty
          ? `${icon('notebook-pen', 'ic-sm')} <b>Draf tersimpan di perangkat</b> — aman walau aplikasi tertutup. Tekan Simpan agar tercatat.`
          : `${icon('cloud', 'ic-sm')} Tersimpan di perangkat seketika, dikirim otomatis walau sinyal putus`;
      };
      const catatDraf = () => {
        if (samaSet(ui.sel, new Set(milikSaya))) { A.drafAbsen.hapus(); ui.dirty = false; }
        else A.drafAbsen.simpan(ui.sel);
      };
      const toggle = (el) => {
        if (el.classList.contains('lock')) { U.toast('Siswa ini sudah dicatat guru lain hari ini', 'info'); return; }
        const id = el.dataset.s;
        if (ui.sel.has(id)) ui.sel.delete(id); else ui.sel.add(id);
        ui.dirty = true;
        catatDraf();
        el.classList.toggle('on'); el.setAttribute('aria-checked', ui.sel.has(id));
        $('input', el).checked = ui.sel.has(id);
        tombol();
      };
      $('#slist').addEventListener('click', (e) => { const el = e.target.closest('[data-s]'); if (el) { e.preventDefault(); toggle(el); } });
      $('#slist').addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && e.target.dataset.s) { e.preventDefault(); toggle(e.target); } });
      $('#cari').addEventListener('input', U.debounce((e) => { ui.q = e.target.value; daftar(); }, 120));
      $$('[data-tab]').forEach((b) => b.onclick = () => { ui.tab = b.dataset.tab; $$('[data-tab]').forEach((x) => x.classList.toggle('on', x === b)); daftar(); });
      $('#btn-simpan').onclick = () => {
        if (!ui.dirty && milikSaya.length) { U.toast('Kehadiran hari ini sudah tersimpan'); return; }
        const pilih = Array.from(ui.sel).filter((id) => !lain[id]);
        const peta = {}; semua.forEach((s) => { peta[s.id] = s; });
        A.kirim({ op: 'hadir', tanggal: t, siswa: pilih.map((id) => ({ siswaId: id, programId: (peta[id] || {}).programId })), _label: 'Kehadiran' });
        A.mut((dd) => {
          dd.hadirHariIni = (dd.hadirHariIni || []).filter((h) => h.guruId !== me.id).concat(pilih.map((id) => ({ siswaId: id, guruId: me.id })));
          const ym = t.slice(0, 7);
          const r = dd.riwayat[ym] = dd.riwayat[ym] || { hari: 0, siswa: 0, banyak: 0, tanggal: [] };
          r.tanggal = r.tanggal.filter((x) => x[0] !== t);
          if (pilih.length) r.tanggal.push([t, pilih.length]);
          r.hari = r.tanggal.length; r.siswa = r.tanggal.reduce((a, x) => a + x[1], 0);
          r.banyak = r.tanggal.filter((x) => x[1] > (+dd.settings.ambang_siswa_banyak || 10)).length;
        }, { render: false });
        ui.dirty = false; ui.dipulihkan = 0;
        A.drafAbsen.hapus();
        U.toast(pilih.length ? `Kehadiran ${pilih.length} siswa tersimpan` : 'Kehadiran hari ini dikosongkan');
        A.render();
      };
      const buang = $('#draf-buang');
      if (buang) buang.onclick = () => { A.drafAbsen.hapus(); ui.sel = new Set(milikSaya); ui.dirty = false; ui.dipulihkan = 0; U.toast('Draf absen dibuang'); A.render(); };
      daftar();
      pill();
    }
  });
  A.hasil.hadir = (op, data) => {
    if (!A.sebagaiGuru() || !data) return;
    if (data.ditolak && data.ditolak.length) {
      const nama = data.ditolak.map((id) => ((A.S.data.siswaAktif || []).find((s) => s.id === id) || {}).nama).filter(Boolean);
      U.toast(nama.join(', ') + ' sudah dicatat guru lain hari ini', 'warn', 7000);
      if (A.ui.absen && A.ui.absen.sel) data.ditolak.forEach((id) => A.ui.absen.sel.delete(id));
      A.segarkan();
    }
  };

  A.page('riwayat', {
    role: 'guru', title: 'Riwayat Saya', crumb: 'Riwayat Mengajar',
    render(view) {
      const d = A.S.data;
      const ui = A.ui.riwayat = A.ui.riwayat || { bulan: U.ymNow() };
      const bulan = Object.keys(d.riwayat || {}).sort();
      const r = (d.riwayat || {})[ui.bulan] || { hari: 0, siswa: 0, banyak: 0, tanggal: [] };
      const ambang = +d.settings.ambang_siswa_banyak || 10;
      view.innerHTML = `<div class="page-head"><div><h1>Riwayat Mengajar</h1><p>Rekap hari mengajar dan jumlah siswa yang Anda bimbing.</p></div></div>
        <div class="tabs mb-16">${bulan.map((b) => `<button class="tab ${b === ui.bulan ? 'on' : ''}" data-b="${b}">${U.bulan(b)}</button>`).join('')}</div>
        <div class="stats">
          <div class="card stat"><div class="top"><span class="lbl">Hari mengajar</span><span class="icon-dot sm">${icon('calendar-check')}</span></div><div class="val">${r.hari}</div><div class="sub">dari ${Rules.hariLesBulan(ui.bulan, d.libur).length} hari les</div></div>
          <div class="card stat"><div class="top"><span class="lbl">Total siswa</span><span class="icon-dot sm ala">${icon('users')}</span></div><div class="val">${r.siswa}</div><div class="sub">${r.hari ? 'rata-rata ' + Math.round(r.siswa / r.hari) + ' / hari' : '-'}</div></div>
          <div class="card stat"><div class="top"><span class="lbl">Hari &gt; ${ambang} siswa</span><span class="icon-dot sm sun">${icon('star')}</span></div><div class="val">${r.banyak}</div><div class="sub">hari dengan siswa banyak</div></div>
        </div>
        <div class="card mt-16"><div class="card-head"><h3>${icon('list')} Rincian ${U.bulan(ui.bulan)}</h3></div>
          ${r.tanggal.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tanggal</th><th class="t-right">Jumlah siswa</th></tr></thead><tbody>
          ${r.tanggal.slice().sort((a, b) => b[0].localeCompare(a[0])).map(([t, n]) => `<tr><td>${esc(U.tglHari(t))}</td><td class="t-right"><b>${n}</b> ${n > ambang ? `<span class="chip chip-acc chip-sm">${icon('star')} &gt;${ambang}</span>` : ''}</td></tr>`).join('')}</tbody></table></div>`
          : A.kosong('calendar', 'Belum ada catatan mengajar', 'Catatan muncul setelah Anda menyimpan absen.')}</div>`;
      $$('[data-b]').forEach((b) => b.onclick = () => { ui.bulan = b.dataset.b; A.render(); });
    }
  });

  // ======================================================================
  // MULAI
  // ======================================================================
  async function boot() {
    const sesi = U.ls.get(LS_SESI, null);
    // Dibuka dari tombol "Masuk" di landing page → sesi lama di perangkat ini DIAKHIRI dan halaman login tampil.
    // (Mencegah pengunjung masuk ke akun admin/guru yang lupa keluar.)
    const qs = new URLSearchParams(location.search);
    const minta = qs.has('masuk');
    // Link login dari admin: app.html?login=guru[&g=<idGuru>] atau ?login=admin (bisa dijadikan kode QR)
    const login = qs.get('login'), gId = qs.get('g') || '';
    if (minta || login) history.replaceState(null, '', location.pathname);
    if (login === 'guru' || login === 'admin') {
      const cocok = sesi && sesi.token && (sesi.role === login || (login === 'guru' && sesi.role === 'wakil')) && (!gId || ((sesi.user || {}).id === gId));
      if (cocok) { lanjutSesi(sesi); return; } // sudah masuk di HP sendiri → langsung buka aplikasi
      if (sesi && sesi.token) akhiriSesi(sesi);
      A.ui._login = { peran: login, guruId: login === 'guru' ? gId : '', buka: false };
      tampilLogin();
      if (login === 'admin') setTimeout(() => { const u = $('#l-user'); if (u) u.focus(); }, 60);
      else if (gId) setTimeout(() => { const pw = $('#l-pass'); if (pw) pw.focus(); }, 60);
      return;
    }
    if (sesi && sesi.token && minta) {
      if (OB.q.length && navigator.onLine) { // kirim dulu perubahan yang masih antre
        A.S.token = sesi.token; A.S.role = sesi.role;
        appEl.innerHTML = `<div class="login-wrap"><div class="empty">${icon('loader-circle', 'ic-xl spin')}<p>Menyiapkan halaman login…</p></div></div>`;
        A._perluSegar = false;
        try { await Promise.race([kirimBatch(), new Promise((r) => setTimeout(r, 8000))]); } catch (e) { /* lanjut */ }
        A._perluSegar = false;
      }
      akhiriSesi(sesi);
      tampilLogin();
      return;
    }
    lanjutSesi(sesi);
  }
  function lanjutSesi(sesi) {
    if (sesi && sesi.token) {
      const cache = U.ls.get(LS_DATA + sesi.role, null);
      A.S.token = sesi.token; A.S.role = sesi.role; A.S.user = sesi.user;
      if (cache) {
        terimaData(cache);
        mulaiApp();
        A.segarkan();
        if (OB.q.length) jadwalKirim(300);
        return;
      }
      appEl.innerHTML = `<div class="login-wrap"><div class="empty">${icon('loader-circle', 'ic-xl spin')}<p>Memuat data…</p></div></div>`;
      U.api('bootstrap', { token: sesi.token }).then((d) => { terimaData(d); A.S.user = d.user; mulaiApp(); }).catch((e) => { if (e.kode === 'AUTH') sesiHabis(); else { U.toast(e.message, 'bad'); tampilLogin(); } });
      return;
    }
    tampilLogin();
  }
  // ---------------- Guru: ganti kata sandi sendiri ----------------
  A.page('akun', {
    role: 'guru', title: 'Akun Saya', crumb: 'Akun Saya',
    render(view) {
      const me = A.S.user;
      const fld = (id, label, ac) => `<div class="field"><label for="${id}">${label} <span class="req">*</span></label><div class="input-icon">${icon('lock')}<input class="input" id="${id}" type="password" autocomplete="${ac}" required minlength="${id === 'ks-lama' ? 1 : 6}"><button type="button" class="btn btn-ghost btn-icon btn-sm btn-eye" data-lihat="${id}" aria-label="Lihat sandi">${icon('eye')}</button></div></div>`;
      view.innerHTML = `<div class="page-head"><div><h1>Akun Saya</h1><p>Ganti kata sandi yang Anda pakai untuk login absen.</p></div></div>
        <div class="card card-pad" style="max-width:520px"><div class="row-gap mb-16">${U.avatar(me.nama, me.id)}<div><b>${esc(me.nama)}</b><div class="small muted">Guru Pembimbing</div></div></div>
          <form id="f-sandi" class="form-stack" novalidate>
            ${fld('ks-lama', 'Kata sandi saat ini', 'current-password')}
            ${fld('ks-baru', 'Kata sandi baru', 'new-password')}
            ${fld('ks-ulang', 'Ulangi kata sandi baru', 'new-password')}
            <p class="tiny muted">${icon('info', 'ic-sm')} Minimal 6 karakter. Lupa kata sandi? Minta Admin meresetnya.</p>
            <button class="btn btn-primary btn-lg btn-block" id="ks-simpan">${icon('save')} Simpan kata sandi baru</button></form></div>`;
      $$('[data-lihat]').forEach((b) => b.onclick = () => { const i = $('#' + b.dataset.lihat); i.type = i.type === 'password' ? 'text' : 'password'; b.innerHTML = icon(i.type === 'password' ? 'eye' : 'eye-off'); });
      $('#f-sandi').onsubmit = async (e) => {
        e.preventDefault();
        const lama = $('#ks-lama').value, baru = $('#ks-baru').value, ulang = $('#ks-ulang').value;
        if (!lama) return U.toast('Isi kata sandi saat ini', 'warn');
        if (baru.length < 6) return U.toast('Kata sandi baru minimal 6 karakter', 'warn');
        if (baru !== ulang) return U.toast('Ulangan kata sandi baru tidak sama', 'warn');
        if (baru === lama) return U.toast('Kata sandi baru harus berbeda', 'warn');
        const b = $('#ks-simpan'); const asli = b.innerHTML;
        b.disabled = true; b.innerHTML = `${icon('loader-circle', 'spin')} Menyimpan…`;
        try {
          await U.api('gantiSandiSaya', { token: A.S.token, sandiLama: lama, sandiBaru: baru });
          U.toast('Kata sandi berhasil diganti. Gunakan sandi baru saat login berikutnya.', 'ok', 6000);
          e.target.reset();
        } catch (er) { U.toast(er.message, 'bad'); }
        b.disabled = false; b.innerHTML = asli;
      };
    }
  });

  A.boot = boot;
  document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0));
})();
