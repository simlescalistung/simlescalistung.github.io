/* ==========================================================================
   ADMIN (2/3) — Guru, Kehadiran (rekap & koreksi), SPP & Kuitansi
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, icon } = U;
  const A = App;
  const R = Rules;
  const D = () => A.S.data;
  const guruAktif = (g) => !g.tglKeluar || g.tglKeluar > U.today();

  // ======================================================================
  // GURU
  // ======================================================================
  A.page('guru', {
    title: 'Guru', crumb: 'Data Guru',
    render(view) {
      const d = D();
      const ui = A.ui.guru = A.ui.guru || { tab: 'aktif', q: '' };
      const ym = U.ymNow();
      const hari = {}; (d.hadirGuru || []).forEach((h) => { if (h.tanggal.slice(0, 7) === ym) hari[h.guruId] = (hari[h.guruId] || 0) + 1; });
      const semua = (d.guru || []).slice().sort((a, b) => a.nama.localeCompare(b.nama));
      const aktif = semua.filter(guruAktif), berhenti = semua.filter((g) => !guruAktif(g));
      const q = ui.q.toLowerCase();
      const rows = (ui.tab === 'aktif' ? aktif : berhenti).filter((g) => !q || (g.nama + ' ' + g.panggilan + ' ' + g.tempatLahir).toLowerCase().includes(q));
      view.innerHTML = `<div class="page-head"><div><h1>Data Guru</h1><p>Kelola guru, masa mengajar, dan akses login absen harian.</p></div>
        <div class="actions"><button class="btn btn-primary" id="g-tambah">${icon('user-plus')} Tambah Guru</button></div></div>
        <div class="stats four mb-16"><div class="card stat"><div class="top"><span class="lbl">Guru aktif</span><span class="icon-dot sm">${icon('users')}</span></div><div class="val">${aktif.length}</div><div class="sub">${berhenti.length} sudah berhenti</div></div>
          <div class="card stat"><div class="top"><span class="lbl">Hadir hari ini</span><span class="icon-dot sm ala">${icon('calendar-check')}</span></div><div class="val">${(d.hadirGuru || []).filter((h) => h.tanggal === U.today()).length}</div><div class="sub">${esc(U.tglHari(U.today()))}</div></div>
          <div class="card stat"><div class="top"><span class="lbl">Hari mengajar ${U.bln(ym)}</span><span class="icon-dot sm acc">${icon('chart-column')}</span></div><div class="val">${Object.values(hari).reduce((a, b) => a + b, 0)}</div><div class="sub">total semua guru</div></div>
          <div class="card stat"><div class="top"><span class="lbl">Belum punya sandi</span><span class="icon-dot sm bad">${icon('key-round')}</span></div><div class="val">${aktif.filter((g) => !g.punyaSandi).length}</div><div class="sub">tidak bisa login absen</div></div></div>
        <div class="row-gap mb-12"><div class="tabs"><button class="tab ${ui.tab === 'aktif' ? 'on' : ''}" data-tab="aktif">Aktif <span class="n">${aktif.length}</span></button><button class="tab ${ui.tab === 'berhenti' ? 'on' : ''}" data-tab="berhenti">Berhenti <span class="n">${berhenti.length}</span></button></div>
          <div class="input-icon spacer" style="min-width:220px">${icon('search')}<input class="input" id="g-q" placeholder="Cari nama guru…" value="${esc(ui.q)}" style="min-height:42px"></div></div>
        <div class="card">${rows.length ? `<div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr><th>Guru</th><th>Tempat, tgl lahir</th><th>Masa mengajar</th><th>Mengajar ${U.bln(ym)}</th><th>Akses</th><th class="t-right" style="width:96px">Aksi</th></tr></thead><tbody>
          ${rows.map((g) => `<tr><td class="t-main"><div class="person">${U.avatar(g.nama, g.id, '', A.foto['g_' + g.id])}<div><div class="t-name">${esc(g.nama)}${d.settings.wakil_guru_id === g.id ? ` <span class="chip chip-sm chip-acc">${icon('shield-check', 'ic-sm')} Wakil Admin</span>` : ''}</div><div class="t-sub">${esc(g.panggilan || '')}${g.wa ? ' · ' + esc(U.tampilWa(g.wa)) : ''}</div></div></div></td>
            <td data-l="Lahir">${esc([g.tempatLahir, U.tgl(g.tglLahir)].filter((x) => x && x !== '-').join(', ') || '-')}${g.tglLahir ? `<div class="t-sub">${U.umur(g.tglLahir)}</div>` : ''}</td>
            <td data-l="Masa mengajar"><span class="chip chip-ahe">${esc(U.masa(g.tglMasuk, g.tglKeluar || null))}</span><div class="t-sub">Masuk ${esc(U.tgl(g.tglMasuk))}${g.tglKeluar ? ' · keluar ' + esc(U.tgl(g.tglKeluar)) : ''}</div></td>
            <td data-l="Hari mengajar"><b>${hari[g.id] || 0}</b> hari</td>
            <td data-l="Akses">${guruAktif(g) ? (g.punyaSandi ? `<span class="chip chip-ok">${icon('check')} Bisa login</span>` : `<span class="chip chip-bad">${icon('lock')} Belum ada sandi</span>`) : '<span class="chip">Nonaktif</span>'}</td>
            <td class="t-actions t-right"><button class="btn btn-light btn-sm" data-aksi="${g.id}" aria-haspopup="menu" aria-expanded="false">${icon('ellipsis')} Aksi</button></td></tr>`).join('')}
          </tbody></table></div>` : A.kosong('users', ui.tab === 'aktif' ? 'Belum ada guru aktif' : 'Tidak ada guru berhenti', ui.tab === 'aktif' ? 'Tambahkan guru beserta kata sandinya agar bisa login untuk absen.' : '', ui.tab === 'aktif' ? '<button class="btn btn-primary" data-tambah2>' + icon('user-plus') + ' Tambah guru</button>' : '')}</div>`;
      $$('[data-tab]').forEach((b) => b.onclick = () => { ui.tab = b.dataset.tab; A.render(); });
      $('#g-q').oninput = U.debounce((e) => { ui.q = e.target.value; A.refresh(true); const i = $('#g-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200);
      $('#g-tambah').onclick = () => formGuru(null);
      const t2 = $('[data-tambah2]'); if (t2) t2.onclick = () => formGuru(null);
      $$('[data-aksi]').forEach((b) => b.onclick = () => {
        const g = R.idx().guru[b.dataset.aksi]; if (!g) return;
        U.menu(b, [
          { icon: 'pencil', label: 'Edit data guru', onClick: () => formGuru(g) },
          guruAktif(g) ? { icon: 'key-round', label: (g.punyaSandi ? 'Reset' : 'Buat') + ' kata sandi', onClick: () => resetSandi(g) } : null,
          guruAktif(g) ? { icon: 'qr-code', label: 'Link login & kode QR', onClick: () => A.bagikanLinkLogin('guru', g) } : null,
          guruAktif(g) ? (D().settings.wakil_guru_id === g.id ? { icon: 'shield-check', label: 'Cabut hak Wakil Admin', onClick: () => aturWakil(g, false) } : { icon: 'shield-check', label: 'Jadikan Wakil Admin', onClick: () => aturWakil(g, true) }) : null,
          '-',
          { icon: 'trash-2', label: 'Hapus guru', danger: true, onClick: () => hapusGuru(g) }
        ]);
      });
    }
  });
  function sandiAcak() { const h = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const a = new Uint8Array(8); crypto.getRandomValues(a); return Array.from(a, (b) => h[b % h.length]).join('').replace(/^(.{4})/, '$1-'); }
  function tampilSandi(g, sandi) {
    const pesan = `Assalamu'alaikum ${g.panggilan || g.nama}. Akun absen aplikasi les Anda:\nNama: ${g.panggilan || g.nama}\nKata sandi: ${sandi}\nLink login: ${A.linkLogin('guru', g.id)}`;
    const m = U.modal({
      title: 'Kata sandi untuk ' + (g.panggilan || g.nama), icon: 'key-round', iconCls: 'sun',
      body: `<div class="code-box">${esc(sandi)}</div><div class="note-box bad mt-12">${icon('triangle-alert')}<span>Kata sandi hanya ditampilkan sekali. Kirim langsung ke guru yang bersangkutan.</span></div>`,
      foot: `<button class="btn btn-light" data-c>${icon('copy')} Salin sandi</button>${g.wa ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${U.waLink(g.wa, pesan)}">${icon('message-circle')} Kirim via WA</a>` : ''}<button class="btn btn-primary" data-n>Selesai</button>`
    });
    m.$('[data-c]').onclick = async () => { if (await U.salin(sandi)) U.toast('Kata sandi disalin'); };
    m.$('[data-n]').onclick = () => m.close();
  }
  // Wakil admin: satu guru dengan akses tambahan terbatas
  async function aturWakil(g, jadikan) {
    const lama = R.idx().guru[D().settings.wakil_guru_id];
    const li = (ok, t) => `<li><span class="ic" style="color:var(--${ok ? 'ok-700' : 'bad'})">${icon(ok ? 'check' : 'x', 'ic-sm')}</span><span>${t}</span></li>`;
    const teks = jadikan
      ? `<b>${esc(g.nama)}</b> tetap bisa absen seperti biasa, dan mendapat akses tambahan:<ul class="demo-list mt-12">${li(1, 'Membuat prompt poster hari libur (tanpa menambah/mengubah hari libur)')}${li(1, 'Mencatat pembayaran SPP sebagai <b>draf</b> — lunas & kuitansi tetap oleh admin utama')}${li(1, 'Prompt poster/banner promosi & mengelola landing page')}${li(1, 'Membuat & mencetak piagam (template & posisi teks tetap oleh admin utama)')}${li(0, 'Tidak bisa mengubah siswa, guru, kehadiran guru lain, pengaturan, backup')}</ul>${lama && lama.id !== g.id ? `<p class="small mt-12">Wakil admin saat ini (<b>${esc(lama.nama)}</b>) akan diganti — hanya boleh 1 wakil.</p>` : ''}<p class="small muted mt-12">${esc(g.panggilan || g.nama)} perlu <b>keluar lalu masuk lagi</b> agar menu wakil admin muncul.</p>`
      : `<b>${esc(g.nama)}</b> kembali menjadi guru biasa. Sesi wakil admin-nya langsung berakhir dan perlu masuk lagi.`;
    if (!(await U.confirm({ title: jadikan ? 'Jadikan ' + (g.panggilan || g.nama) + ' Wakil Admin?' : 'Cabut hak Wakil Admin?', text: teks, ok: jadikan ? 'Iya, jadikan wakil' : 'Iya, cabut', batal: 'Tidak', danger: !jadikan }))) return;
    A.mut((d) => { d.settings.wakil_guru_id = jadikan ? g.id : ''; });
    A.kirim({ op: 'saveSettings', values: { wakil_guru_id: jadikan ? g.id : '' }, _label: 'Wakil admin' });
    U.toast(jadikan ? g.nama + ' sekarang Wakil Admin' : 'Hak wakil admin dicabut');
  }
  async function resetSandi(g) {
    if (!(await U.confirm({ title: (g.punyaSandi ? 'Reset' : 'Buat') + ' kata sandi ' + (g.panggilan || g.nama) + '?', text: g.punyaSandi ? 'Kata sandi lama tidak berlaku lagi.' : 'Guru bisa langsung login absen setelah menerima sandi ini.', ok: g.punyaSandi ? 'Reset sandi' : 'Buat sandi' }))) return;
    try {
      const r = await U.api('resetSandiGuru', { token: A.S.token, guruId: g.id });
      A.mut((d) => { const x = d.guru.find((y) => y.id === g.id); if (x) x.punyaSandi = true; });
      tampilSandi(g, r.sandiBaru);
    } catch (e) { U.toast(e.message, 'bad'); }
  }
  async function hapusGuru(g) {
    const punyaRiwayat = (D().hadirGuru || []).some((h) => h.guruId === g.id);
    if (guruAktif(g) && punyaRiwayat) {
      const m = U.modal({
        title: 'Hapus ' + g.nama + '?', icon: 'triangle-alert', iconCls: 'bad',
        body: `<p>Guru ini memiliki riwayat mengajar. Disarankan mengisi <b>tanggal keluar</b> agar guru tidak bisa login namun rekap tetap utuh.</p>`,
        foot: `<button class="btn btn-danger-ghost" data-perm>Hapus permanen</button><span class="spacer"></span><button class="btn btn-primary" data-keluar>${icon('calendar-x')} Isi tanggal keluar hari ini</button>`
      });
      m.$('[data-keluar]').onclick = () => { m.close(); simpanGuru(Object.assign({}, g, { tglKeluar: U.today() })); U.toast(g.nama + ' dinonaktifkan'); };
      m.$('[data-perm]').onclick = async () => { m.close(); hapusPermanen(g); };
      return;
    }
    hapusPermanen(g);
  }
  async function hapusPermanen(g) {
    if (!(await U.confirm({ danger: true, title: 'Hapus permanen ' + g.nama + '?', text: 'Data guru dihapus. Rekap kehadiran lama tetap menampilkan nama guru.', ketik: g.panggilan || g.nama, ok: 'Hapus' }))) return;
    A.mut((d) => { d.guru = d.guru.filter((x) => x.id !== g.id); });
    A.kirim({ op: 'deleteGuru', id: g.id, _label: 'Hapus guru' });
    U.toast('Guru dihapus');
  }
  function simpanGuru(x, sandi) {
    A.mut((d) => {
      const ada = d.guru.find((y) => y.id === x.id);
      if (ada) Object.assign(ada, x, { updatedAt: U.nowIso() }); else d.guru.push(Object.assign({ createdAt: U.nowIso(), punyaSandi: !!sandi }, x));
      if (sandi) { const g = d.guru.find((y) => y.id === x.id); g.punyaSandi = true; }
    });
    const g = Object.assign({}, x); delete g.punyaSandi;
    A.kirim({ op: 'upsertGuru', guru: g, sandi: sandi || undefined, _label: 'Data guru' });
  }
  function formGuru(g) {
    const baru = !g; g = g || {};
    const m = U.modal({
      drawer: true, title: baru ? 'Tambah Guru' : 'Edit Data Guru', icon: baru ? 'user-plus' : 'square-pen', sub: baru ? 'Isi identitas guru dan kata sandi untuk login absen.' : 'Data profil ' + esc(g.nama),
      body: `<form class="form-stack" id="fguru" autocomplete="off">
        <div class="field"><label>Foto (opsional)</label><div class="row-gap"><span id="g-foto">${U.avatar(g.nama || '?', g.id || 'x', 'av-lg', A.foto['g_' + g.id])}</span><button type="button" class="btn btn-light btn-sm" data-foto>${icon('image-plus')} Unggah foto</button></div></div>
        <div class="field"><label>Nama lengkap & gelar <span class="req">*</span></label><input class="input" name="nama" value="${esc(g.nama || '')}" required></div>
        <div class="field"><label>Nama panggilan <span class="req">*</span></label><input class="input" name="panggilan" value="${esc(g.panggilan || '')}" placeholder="Contoh: Bu Rina"><span class="help">Ditampilkan di daftar login dan rekap</span></div>
        <div class="grid-2"><div class="field"><label>Tempat lahir</label><input class="input" name="tempatLahir" value="${esc(g.tempatLahir || '')}"></div><div class="field"><label>Tanggal lahir</label><input class="input" type="date" name="tglLahir" value="${esc(g.tglLahir || '')}"></div></div>
        <div class="field"><label>Tanggal masuk mengajar <span class="req">*</span></label><input class="input" type="date" name="tglMasuk" value="${esc(g.tglMasuk || U.today())}"></div>
        <div class="note-box" id="g-masa">${icon('clock')}<span></span></div>
        <div class="field"><label>Tanggal keluar (bila berhenti)</label><input class="input" type="date" name="tglKeluar" value="${esc(g.tglKeluar || '')}"><span class="help">Jika diisi, guru otomatis tidak bisa login, riwayat mengajar tetap tersimpan.</span></div>
        <div class="field"><label>Nomor WhatsApp</label><div class="input-group"><span class="prefix">+62</span><input class="input" name="wa" inputmode="tel" value="${esc(g.wa ? '0' + U.normWa(g.wa).slice(2) : '')}"></div></div>
        ${baru ? `<div class="field"><label>Kata sandi login absen <span class="req">*</span></label><div class="row-gap"><input class="input" name="sandi" value="${sandiAcak()}" style="flex:1;font-family:ui-monospace,monospace"><button type="button" class="btn btn-light btn-sm" data-acak>${icon('refresh-cw')} Buat otomatis</button></div><span class="help">Minimal 6 karakter. Sandi bisa direset kapan saja.</span></div>` : ''}
      </form>`,
      foot: `<button class="btn btn-light" data-n>Batal</button><button class="btn btn-primary" data-ok>${icon('save')} Simpan Data Guru</button>`
    });
    const f = m.$('#fguru');
    let foto;
    const masa = () => { m.$('#g-masa span').innerHTML = `<b>Masa mengajar: ${esc(U.masa(f.tglMasuk.value, f.tglKeluar.value || null))}</b> · dihitung otomatis dari tanggal masuk`; };
    masa(); f.tglMasuk.oninput = masa; f.tglKeluar.oninput = masa;
    f.tempatLahir.onblur = () => { f.tempatLahir.value = U.hurufKata(f.tempatLahir.value); };
    if (baru) m.$('[data-acak]').onclick = () => { f.sandi.value = sandiAcak(); };
    m.$('[data-foto]').onclick = async () => { const fl = await U.pilihFile('image/*'); if (!fl) return; const k = await U.kompres(fl, 160, 0.8); foto = k.dataUrl; m.$('#g-foto').innerHTML = U.avatar('', '', 'av-lg', foto); };
    m.$('[data-n]').onclick = () => m.close();
    m.$('[data-ok]').onclick = () => {
      const x = { id: g.id || U.uid() };
      ['nama', 'panggilan', 'tempatLahir', 'tglLahir', 'tglMasuk', 'tglKeluar'].forEach((k) => { x[k] = f[k].value.trim(); });
      x.wa = U.normWa(f.wa.value);
      if (!x.nama) return U.toast('Nama guru wajib diisi', 'warn');
      if (!x.panggilan) x.panggilan = x.nama.split(' ')[0];
      if (baru && f.sandi.value.length < 6) return U.toast('Kata sandi minimal 6 karakter', 'warn');
      simpanGuru(x, baru ? f.sandi.value : null);
      if (foto) { A.foto['g_' + x.id] = foto; A.kirim({ op: 'foto', id: 'g_' + x.id, data: foto }); }
      m.close();
      if (baru) tampilSandi(x, f.sandi.value); else U.toast('Data guru disimpan');
    };
  }

  // ======================================================================
  // KEHADIRAN — rekap guru, guru >10 siswa, rekap siswa, koreksi
  // ======================================================================
  A.page('kehadiran', {
    title: 'Kehadiran', crumb: 'Kehadiran & Presensi',
    render(view, params) {
      const d = D();
      const ui = A.ui.hadir = A.ui.hadir || { dari: U.ymNow(), sampai: U.ymNow(), bulan: U.ymNow(), q: '', prog: '', absen: false, kTgl: U.today(), kGuru: '' };
      const tab = params[0] || 'siswa';
      const ambang = +d.settings.ambang_siswa_banyak || 10;
      if (ui.bulan < ui.dari || ui.bulan > ui.sampai) ui.bulan = ui.sampai;
      view.innerHTML = `<div class="page-head"><div><h1>Kehadiran & Presensi</h1><p>Rekap hari les Senin–Jumat (hari libur khusus tidak dihitung). Unduh dalam Excel atau PDF.</p></div>
        <div class="actions">${tab !== 'hari' && tab !== 'koreksi' ? U.tombolPeriode('h-per', ui.dari, ui.sampai) : ''}
          ${tab !== 'koreksi' && tab !== 'hari' ? `<button class="btn btn-light btn-sm" data-ex="xlsx" style="color:#15803D">${icon('file-spreadsheet')} Excel</button><button class="btn btn-light btn-sm" data-ex="pdf" style="color:var(--bad-700)">${icon('file-text')} PDF</button>` : ''}</div></div>
        <div class="utabs mb-16">${[['hari', 'Per Hari', 'calendar'], ['guru', 'Rekap Guru', 'users'], ['khusus', 'Guru > ' + ambang + ' Siswa/Hari', 'star'], ['siswa', 'Rekap Siswa', 'graduation-cap'], ['koreksi', 'Koreksi', 'square-pen']].map(([k, l, ic]) => `<a class="utab ${tab === k ? 'on' : ''}" href="#/kehadiran/${k}">${icon(ic)} ${l}</a>`).join('')}</div>
        ${d.settings.arsip_hadir_sebelum && tab !== 'koreksi' && (tab === 'hari' ? (ui.hTgl || U.today()) < d.settings.arsip_hadir_sebelum : ui.dari + '-01' < d.settings.arsip_hadir_sebelum) ? `<div class="note-box warn mb-16">${icon('archive')}<span>Kehadiran sebelum <b>${esc(U.tgl(d.settings.arsip_hadir_sebelum))}</b> sudah diarsipkan ke Google Drive. Lihat <a href="#/pengaturan/backup" style="font-weight:700">Pengaturan → Backup Data</a>.</span></div>` : ''}
        <div id="h-isi"><div class="stack"><div class="sk" style="height:110px"></div><div class="sk" style="height:300px"></div></div></div>`;
      const hp = $('#h-per'); if (hp) hp.onclick = async () => { const r = await U.pilihPeriode({ dari: ui.dari, sampai: ui.sampai, max: U.ymNow().slice(0, 4) + '-12', min: '2020-01' }); if (r) { ui.dari = r.dari; ui.sampai = r.sampai; ui.bulan = r.sampai > U.ymNow() ? (r.dari > U.ymNow() ? r.dari : U.ymNow()) : r.sampai; A.render(); } };
      $$('[data-ex]').forEach((b) => b.onclick = () => ekspor(tab, b.dataset.ex));
      if (tab === 'koreksi') return koreksi($('#h-isi'), ui);
      if (tab === 'hari') return perHari($('#h-isi'), ui);
      A.ambilRekap(ui.dari, ui.sampai).then((data) => {
        const el = $('#h-isi'); if (!el || A.rute().nama !== 'kehadiran') return;
        A._rekapTerakhir = data;
        ({ guru: rekapGuru, khusus: rekapKhusus, siswa: rekapSiswa }[tab] || rekapSiswa)(el, data, ui);
      }).catch((e) => { const el = $('#h-isi'); if (el) el.innerHTML = `<div class="card">${A.kosong('cloud-off', 'Data tidak dapat dimuat', esc(e.message), '<button class="btn btn-primary" onclick="App.render()">Coba lagi</button>')}</div>`; });
    }
  });
  const bulanRentang = (ui) => { const o = []; for (let b = ui.dari; b <= ui.sampai; b = U.addMonths(b, 1)) o.push(b); return o; };
  const namaGuru = (id, fallback) => { const g = R.idx().guru[id]; return g ? (g.panggilan || g.nama) : (fallback || 'Guru (dihapus)'); };
  function hitungGuru(data, ui) {
    const ambang = +D().settings.ambang_siswa_banyak || 10;
    const per = {};
    data.hadirGuru.forEach((h) => {
      const ym = h.tanggal.slice(0, 7);
      const x = per[h.guruId + '|' + ym] = per[h.guruId + '|' + ym] || { guruId: h.guruId, nama: namaGuru(h.guruId, h.namaGuru), ym, hari: 0, siswa: 0, banyak: 0, tgl: [] };
      x.hari++; x.siswa += +h.jumlahSiswa || 0; if (+h.jumlahSiswa > ambang) x.banyak++; x.tgl.push(h);
    });
    return Object.values(per).sort((a, b) => a.ym.localeCompare(b.ym) || b.hari - a.hari);
  }
  function rekapGuru(el, data, ui) {
    const rows = hitungGuru(data, ui);
    const tot = { hari: rows.reduce((a, r) => a + r.hari, 0), siswa: rows.reduce((a, r) => a + r.siswa, 0) };
    const hl = bulanRentang(ui).reduce((a, b) => a + R.hariLesBulan(b).length, 0);
    el.innerHTML = `<div class="stats four mb-16"><div class="card stat"><div class="top"><span class="lbl">Hari les</span><span class="icon-dot sm">${icon('calendar')}</span></div><div class="val">${hl}</div><div class="sub">${esc(U.bulan(ui.dari))}${ui.dari !== ui.sampai ? ' – ' + esc(U.bulan(ui.sampai)) : ''}</div></div>
      <div class="card stat"><div class="top"><span class="lbl">Total hari mengajar</span><span class="icon-dot sm ala">${icon('calendar-check')}</span></div><div class="val">${tot.hari}</div><div class="sub">semua guru</div></div>
      <div class="card stat"><div class="top"><span class="lbl">Total siswa diajar</span><span class="icon-dot sm acc">${icon('users')}</span></div><div class="val">${tot.siswa}</div><div class="sub">${tot.hari ? Math.round(tot.siswa / tot.hari) + ' / hari' : '-'}</div></div>
      <div class="card stat"><div class="top"><span class="lbl">Guru aktif</span><span class="icon-dot sm sun">${icon('star')}</span></div><div class="val">${(D().guru || []).filter(guruAktif).length}</div><div class="sub">saat ini</div></div></div>
      <div class="card">${rows.length ? `<div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr><th>Bulan</th><th>Guru</th><th class="t-right">Hari mengajar</th><th class="t-right">Total siswa</th><th class="t-right">Rata-rata/hari</th><th class="t-right">Hari &gt; ${+D().settings.ambang_siswa_banyak || 10} siswa</th></tr></thead><tbody>
        ${rows.map((r) => `<tr><td data-l="Bulan">${U.bulan(r.ym)}</td><td class="t-main"><div class="person">${U.avatar(r.nama, r.guruId, 'av-sm')}<b>${esc(r.nama)}</b></div></td><td data-l="Hari" class="t-right"><b>${r.hari}</b> <span class="muted small">/ ${R.hariLesBulan(r.ym).length}</span></td><td data-l="Siswa" class="t-right">${r.siswa}</td><td data-l="Rata-rata" class="t-right">${Math.round(r.siswa / r.hari)}</td><td data-l="> ambang" class="t-right">${r.banyak ? `<span class="chip chip-acc">${icon('star')} ${r.banyak} hari</span>` : '0'}</td></tr>`).join('')}
      </tbody></table></div>` : A.kosong('calendar', 'Belum ada catatan mengajar', 'Data muncul setelah guru menyimpan absen.')}</div>`;
  }
  function rekapKhusus(el, data) {
    const ambang = +D().settings.ambang_siswa_banyak || 10;
    const rows = data.hadirGuru.filter((h) => +h.jumlahSiswa > ambang).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    const per = {}; rows.forEach((h) => { per[h.guruId] = (per[h.guruId] || 0) + 1; });
    el.innerHTML = `<div class="note-box mb-16" style="background:var(--sun-50);color:#7A5600">${icon('star')}<span>Daftar hari ketika seorang guru mengajar <b>lebih dari ${ambang} siswa</b>. Ambang bisa diubah di Pengaturan → Kehadiran.</span></div>
      <div class="split r"><div class="card card-pad"><h4 class="mb-12">Ringkasan per guru</h4>${Object.keys(per).length ? Object.keys(per).sort((a, b) => per[b] - per[a]).map((g) => `<div class="row-gap mb-12">${U.avatar(namaGuru(g), g, 'av-sm')}<b style="flex:1">${esc(namaGuru(g))}</b><span class="chip chip-acc">${per[g]} hari</span></div>`).join('') : '<p class="small muted">Belum ada.</p>'}</div>
      <div class="card">${rows.length ? `<div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr><th>Tanggal</th><th>Guru</th><th class="t-right">Jumlah siswa</th></tr></thead><tbody>${rows.map((h) => `<tr><td class="t-main">${esc(U.tglHari(h.tanggal))}</td><td data-l="Guru">${esc(namaGuru(h.guruId, h.namaGuru))}</td><td data-l="Siswa" class="t-right"><span class="chip chip-acc">${icon('users')} ${h.jumlahSiswa} siswa</span></td></tr>`).join('')}</tbody></table></div>` : A.kosong('star', 'Tidak ada hari dengan siswa > ' + ambang, 'Pada rentang bulan ini.')}</div></div>`;
  }
  function matriksSiswa(data, ym, ui) {
    const hari = []; const n = U.daysInMonth(ym);
    for (let i = 1; i <= n; i++) { const t = ym + '-' + String(i).padStart(2, '0'); const w = U.dow(t); if (w !== 0 && w !== 6) hari.push(t); }
    const hadir = {}; data.hadirSiswa.forEach((h) => { if (h[0].slice(0, 7) === ym) (hadir[h[1]] = hadir[h[1]] || {})[h[0]] = true; });
    const pr = R.peringatan(); const absen = {}; pr.absen.forEach((x) => { absen[x.s.id] = x.a.hari; });
    const q = (ui.q || '').toLowerCase();
    const siswa = R.siswaTerdaftar().filter((s) => {
      const p = R.prog(s.id);
      const pernah = !!hadir[s.id];
      if (!pernah && (!p || p.status !== 'aktif')) return false;
      if (ui.prog && (!p || p.program !== ui.prog)) return false;
      if (ui.absen && !absen[s.id]) return false;
      return !q || (s.nama + ' ' + s.panggilan + ' ' + s.kode).toLowerCase().includes(q);
    }).sort((a, b) => a.nama.localeCompare(b.nama));
    const adaHariIni = data.hadirSiswa.some((h) => h[0] === U.today());
    const hariLes = hari.filter((t) => R.hariLes(t) && (t < U.today() || (t === U.today() && adaHariIni)));
    return { hari, hadir, siswa, absen, hariLes };
  }
  function rekapSiswa(el, data, ui) {
    const ym = ui.bulan;
    const M = matriksSiswa(data, ym, ui);
    const totalHadir = M.siswa.reduce((a, s) => a + Object.keys(M.hadir[s.id] || {}).length, 0);
    const rata = M.siswa.length && M.hariLes.length ? totalHadir / (M.siswa.length * M.hariLes.length) * 100 : 0;
    const libur = M.hari.filter((t) => R.libur(t));
    el.innerHTML = `<div class="stats four mb-16"><div class="card stat"><div class="top"><span class="lbl">Hari les ${U.bln(ym)}</span><span class="icon-dot sm">${icon('calendar')}</span></div><div class="val">${R.hariLesBulan(ym).length}</div><div class="sub">Senin–Jumat dikurangi libur</div></div>
      <div class="card stat"><div class="top"><span class="lbl">Libur khusus</span><span class="icon-dot sm acc">${icon('calendar-x')}</span></div><div class="val">${libur.length}</div><div class="sub">${libur.length ? esc((R.libur(libur[0]) || {}).keterangan) : 'Tidak ada'}</div></div>
      <div class="card stat"><div class="top"><span class="lbl">Rata-rata kehadiran</span><span class="icon-dot sm ala">${icon('trending-up')}</span></div><div class="val">${rata.toFixed(1).replace('.', ',')}%</div><div class="sub">${M.siswa.length} siswa · s/d hari ini</div></div>
      <div class="card stat click" data-absen><div class="top"><span class="lbl">Absen &gt; 2 minggu</span><span class="icon-dot sm bad">${icon('clock')}</span></div><div class="val">${Object.keys(M.absen).length}</div><div class="sub">ketuk untuk memfilter</div></div></div>
      <div class="card mb-12"><div class="filters"><div class="input-icon search">${icon('search')}<input class="input" id="h-q" placeholder="Cari nama siswa…" value="${esc(ui.q)}"></div>
        <select class="input" id="h-prog"><option value="">Semua program</option><option value="ahe" ${ui.prog === 'ahe' ? 'selected' : ''}>Baca (Ahe)</option><option value="ala" ${ui.prog === 'ala' ? 'selected' : ''}>Berhitung (Ala)</option></select>
        <select class="input" id="h-bulan" style="min-width:200px">${bulanRentang(ui).map((b) => `<option value="${b}" ${b === ym ? 'selected' : ''}>Tampil: ${U.bulan(b)}</option>`).join('')}</select>
        <label class="switch"><input type="checkbox" id="h-absen" ${ui.absen ? 'checked' : ''}><span class="track"></span><span class="small strong">Absen &gt; 2 minggu</span></label>
        <span class="spacer"></span><div class="legend"><span><span class="ck" style="display:inline-grid;width:16px;height:16px;border-radius:50%;background:var(--ok);vertical-align:-3px;margin-right:6px"></span>Hadir</span><span><i style="background:var(--line-2);border-radius:50%"></i>Tidak hadir</span><span><b class="muted">L</b> Libur</span></div></div></div>
      <div class="card">${M.siswa.length ? `<div class="tbl-wrap"><table class="tbl matrix"><thead><tr><th class="mx-nama">Nama siswa & program</th>${M.hari.map((t) => `<th class="dc ${R.libur(t) ? 'L' : ''}" title="${esc(U.tglHari(t))}"><span class="hr">${U.HR[U.dow(t)]}</span>${+t.slice(8)}</th>`).join('')}<th class="mx-tot">Total</th><th class="mx-pct">%</th></tr></thead><tbody>
        ${M.siswa.map((s) => { const p = R.prog(s.id); const h = M.hadir[s.id] || {}; const n = Object.keys(h).length; const pct = M.hariLes.length ? Math.round(n / M.hariLes.length * 100) : 0; return `<tr class="${M.absen[s.id] ? 'row-bad' : ''}"><td><div class="t-name">${esc(s.nama)}</div><div class="t-sub">${p ? `<span class="chip chip-sm ${p.program === 'ala' ? 'chip-ala' : 'chip-ahe'}">${p.program === 'ala' ? 'ALA' : 'AHE'} · LV ${esc(p.level)}</span>` : ''} ${M.absen[s.id] ? `<span class="chip chip-bad chip-sm">${icon('triangle-alert')} Absen ${M.absen[s.id]} hari</span>` : ''}</div><div class="mx-strip">${M.hari.map((t) => `<i class="${R.libur(t) ? 'l' : h[t] ? 'h' : M.hariLes.includes(t) ? 'x' : 'n'}" title="${+t.slice(8)} ${esc(U.bln(ym))}${h[t] ? ' · hadir' : ''}"></i>`).join('')}</div></td>
          ${M.hari.map((t) => R.libur(t) ? '<td class="dc L"><span class="lb">L</span></td>' : h[t] ? `<td class="dc"><span class="ck">${icon('check')}</span></td>` : !M.hariLes.includes(t) ? '<td class="dc"></td>' : '<td class="dc"><span class="no"></span></td>').join('')}
          <td><b>${n}</b>/${M.hariLes.length}</td><td><b style="color:${pct >= 75 ? 'var(--ok-700)' : pct >= 50 ? 'var(--warn-700)' : 'var(--bad-700)'}">${pct}%</b></td></tr>`; }).join('')}
      </tbody></table></div>` : A.kosong('graduation-cap', 'Tidak ada siswa untuk ditampilkan', 'Ubah filter atau bulan.')}</div>
      <div class="note-box mt-16">${icon('info')}<span>Sabtu, Minggu, dan hari libur khusus tidak dihitung sebagai hari les. Siswa tidak hadir ≥ ${+D().settings.ambang_absen_hari || 10} hari les berturut-turut ditandai merah dan admin menerima WA.</span></div>`;
      const ul = () => rekapSiswa(el, data, ui);
      $('#h-q', el).oninput = U.debounce((e) => { ui.q = e.target.value; ul(); const i = $('#h-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200);
      $('#h-prog', el).onchange = (e) => { ui.prog = e.target.value; ul(); };
      $('#h-bulan', el).onchange = (e) => { ui.bulan = e.target.value; ul(); };
      $('#h-absen', el).onchange = (e) => { ui.absen = e.target.checked; ul(); };
      $('[data-absen]', el).onclick = () => { ui.absen = !ui.absen; ul(); };
  }
  // Kehadiran per hari: berapa siswa yang diajar setiap guru pada tanggal tertentu
  function perHari(el, ui) {
    if (!ui.hTgl) ui.hTgl = U.today();
    const t = ui.hTgl, ym = t.slice(0, 7);
    const ambang = +D().settings.ambang_siswa_banyak || 10;
    const sumber = ym === D().hadirBulan ? Promise.resolve({ hadirGuru: D().hadirGuru || [], hadirSiswa: D().hadirSiswa || [] }) : A.ambilRekap(ym, ym);
    el.innerHTML = `<div class="card card-pad mb-16"><div class="row-gap" style="flex-wrap:wrap"><div class="row-gap" style="gap:6px"><button class="btn btn-light btn-icon" data-geser="-1" aria-label="Hari sebelumnya">${icon('chevron-left')}</button>
        <div style="width:170px"><input class="input" type="date" id="ph-tgl" value="${t}" max="${U.today()}"></div><button class="btn btn-light btn-icon" data-geser="1" aria-label="Hari berikutnya" ${t >= U.today() ? 'disabled' : ''}>${icon('chevron-right')}</button></div>
        ${t !== U.today() ? `<button class="btn btn-soft btn-sm" id="ph-kini">${icon('calendar-check')} Hari ini</button>` : ''}<span class="spacer"></span><b>${esc(U.tglHari(t))}</b></div></div><div id="ph-isi"><div class="sk" style="height:220px"></div></div>`;
    const geser = (n) => { let x = U.addDays(t, n); let g = 0; while (!R.hariLes(x) && g++ < 10 && x < U.today()) x = U.addDays(x, n); ui.hTgl = x > U.today() ? U.today() : x; perHari(el, ui); };
    $$('[data-geser]', el).forEach((b) => b.onclick = () => geser(+b.dataset.geser));
    $('#ph-tgl', el).addEventListener('change', (e) => { if (e.target.value) { ui.hTgl = e.target.value; perHari(el, ui); } });
    const kini = $('#ph-kini', el); if (kini) kini.onclick = () => { ui.hTgl = U.today(); perHari(el, ui); };
    sumber.then((data) => {
      const box = $('#ph-isi', el); if (!box) return;
      const libur = R.libur(t);
      if (!R.hariLes(t)) { box.innerHTML = `<div class="card">${A.kosong('calendar-x', 'Bukan hari les', libur ? esc(libur.keterangan) : 'Sabtu & Minggu tidak ada les.')}</div>`; return; }
      const siswa = data.hadirSiswa.filter((h) => h[0] === t);
      const per = {};
      siswa.forEach((h) => { (per[h[2]] = per[h[2]] || []).push(h); });
      const jam = {}; data.hadirGuru.filter((g) => g.tanggal === t).forEach((g) => { jam[g.guruId] = g.jamIsi; if (!per[g.guruId]) per[g.guruId] = []; });
      const guruAktifHari = (D().guru || []).filter((g) => (!g.tglMasuk || g.tglMasuk <= t) && (!g.tglKeluar || g.tglKeluar > t));
      guruAktifHari.forEach((g) => { if (!per[g.id]) per[g.id] = null; });
      const ids = Object.keys(per).sort((a, b) => ((per[b] || []).length - (per[a] || []).length) || namaGuru(a).localeCompare(namaGuru(b)));
      const mengajar = ids.filter((id) => per[id] && per[id].length);
      const maks = Math.max(1, ...mengajar.map((id) => per[id].length));
      box.innerHTML = `<div class="stats four mb-16">
          <div class="card stat"><div class="top"><span class="lbl">Siswa hadir</span><span class="icon-dot sm ala">${icon('graduation-cap')}</span></div><div class="val">${siswa.length}</div><div class="sub">dari ${R.siswaTerdaftar().filter((s) => R.status(s.id) === 'aktif').length} siswa aktif</div></div>
          <div class="card stat"><div class="top"><span class="lbl">Guru mengajar</span><span class="icon-dot sm">${icon('users')}</span></div><div class="val">${mengajar.length}</div><div class="sub">dari ${guruAktifHari.length} guru aktif</div></div>
          <div class="card stat"><div class="top"><span class="lbl">Rata-rata</span><span class="icon-dot sm acc">${icon('chart-column')}</span></div><div class="val">${mengajar.length ? Math.round(siswa.length / mengajar.length) : 0}</div><div class="sub">siswa per guru</div></div>
          <div class="card stat"><div class="top"><span class="lbl">Guru &gt; ${ambang} siswa</span><span class="icon-dot sm sun">${icon('star')}</span></div><div class="val">${mengajar.filter((id) => per[id].length > ambang).length}</div><div class="sub">pada hari ini</div></div></div>
        <div class="ph-grid">${ids.map((id) => {
          const l = per[id] || []; const n = l.length;
          const nama = l.map((h) => { const s = R.idx().siswa[h[1]]; return s ? s.nama : '(siswa dihapus)'; }).sort((a, b) => a.localeCompare(b));
          return `<div class="card card-pad ph-card ${n ? '' : 'kosong'}"><div class="row-gap">${U.avatar(namaGuru(id), id)}<div style="flex:1;min-width:0"><b class="ellipsis" style="display:block">${esc(namaGuru(id))}</b><div class="tiny muted">${n ? (jam[id] ? 'Absen diisi ' + esc(jam[id]) : 'Tercatat') : 'Belum / tidak mengajar'}</div></div>
            <div class="ph-n ${n > ambang ? 'banyak' : ''}"><b>${n}</b><small>siswa</small></div></div>
            <div class="bar mt-12 ${n > ambang ? 'warn' : ''}"><i style="width:${n / maks * 100}%"></i></div>
            ${n ? `<details class="mt-12"><summary class="small strong" style="cursor:pointer">Lihat ${n} siswa</summary><div class="ph-list mt-8">${nama.map((x) => `<span class="chip chip-sm">${esc(x)}</span>`).join('')}</div></details>` : ''}</div>`;
        }).join('') || A.kosong('users', 'Belum ada guru', '')}</div>`;
    }).catch((e) => { const box = $('#ph-isi', el); if (box) box.innerHTML = `<div class="card">${A.kosong('cloud-off', 'Gagal memuat', esc(e.message))}</div>`; });
  }

  // Koreksi kehadiran oleh Admin (tanggal mana pun)
  function koreksi(el, ui) {
    const guru = (D().guru || []).filter((g) => guruAktif(g) || g.id === ui.kGuru);
    if (!ui.kGuru && guru[0]) ui.kGuru = guru[0].id;
    const ym = ui.kTgl.slice(0, 7);
    el.innerHTML = `<div class="card card-pad mb-16"><div class="grid-2"><div class="field"><label>Tanggal</label><input class="input" type="date" id="k-tgl" value="${ui.kTgl}" max="${U.today()}"></div>
      <div class="field"><label>Guru</label><select class="input" id="k-guru">${guru.map((g) => `<option value="${g.id}" ${g.id === ui.kGuru ? 'selected' : ''}>${esc(g.panggilan || g.nama)}</option>`).join('')}</select></div></div>
      <p class="help mt-8">${icon('info', 'ic-sm')} Centang siswa yang diajar guru tersebut pada tanggal itu, lalu simpan. Siswa yang dicatat guru lain tidak bisa dipilih.</p></div><div id="k-list"><div class="sk" style="height:200px"></div></div>`;
    $('#k-tgl').onchange = (e) => { ui.kTgl = e.target.value || U.today(); koreksi(el, ui); };
    $('#k-guru').onchange = (e) => { ui.kGuru = e.target.value; koreksi(el, ui); };
    if (!guru.length) { $('#k-list').innerHTML = `<div class="card">${A.kosong('users', 'Belum ada guru')}</div>`; return; }
    if (!R.hariLes(ui.kTgl)) { const l = R.libur(ui.kTgl); $('#k-list').innerHTML = `<div class="card">${A.kosong('calendar-x', 'Bukan hari les', l ? esc(l.keterangan) : 'Sabtu/Minggu')}</div>`; return; }
    A.ambilRekap(ym, ym).then((data) => {
      const hari = data.hadirSiswa.filter((h) => h[0] === ui.kTgl);
      const pemilik = {}; hari.forEach((h) => { pemilik[h[1]] = h[2]; });
      const sel = new Set(hari.filter((h) => h[2] === ui.kGuru).map((h) => h[1]));
      const siswa = R.siswaTerdaftar().filter((s) => { const p = R.prog(s.id); return pemilik[s.id] || (p && (p.status === 'aktif')); }).sort((a, b) => a.nama.localeCompare(b.nama));
      const box = $('#k-list'); if (!box) return;
      const gambar = () => {
        box.innerHTML = `<div class="slist">${siswa.map((s) => { const p = R.prog(s.id); const lain = pemilik[s.id] && pemilik[s.id] !== ui.kGuru; return `<div class="sitem ${sel.has(s.id) ? 'on' : ''} ${lain ? 'lock' : ''}" data-s="${s.id}">${A.cekVis(sel.has(s.id), lain)}${U.avatar(s.nama, s.id)}<div class="meta"><div class="nm">${esc(s.nama)}</div>${lain ? `<div class="note">${icon('lock', 'ic-sm')} Dicatat oleh ${esc(namaGuru(pemilik[s.id]))}</div>` : ''}</div>${p ? A.chipProg(p, true) : ''}</div>`; }).join('')}</div>
          <div class="sticky-act"><button class="btn btn-primary btn-lg btn-block" id="k-simpan">${icon('save')} Simpan koreksi (${sel.size} siswa) · ${esc(namaGuru(ui.kGuru))} · ${esc(U.tgl(ui.kTgl))}</button></div>`;
        const tbl = $('#k-simpan');
        const label = () => { tbl.innerHTML = `${icon('save')} Simpan koreksi (${sel.size} siswa) · ${esc(namaGuru(ui.kGuru))} · ${esc(U.tgl(ui.kTgl))}`; };
        $$('[data-s]', box).forEach((it) => it.onclick = (e) => {
          e.preventDefault(); if (it.classList.contains('lock')) return;
          const id = it.dataset.s; sel.has(id) ? sel.delete(id) : sel.add(id);
          const on = sel.has(id); it.classList.toggle('on', on); $('input', it).checked = on; label();
        });
        $('#k-simpan').onclick = () => {
          const pilih = Array.from(sel);
          const g = R.idx().guru[ui.kGuru];
          A.kirim({ op: 'hadir', tanggal: ui.kTgl, guruId: ui.kGuru, siswa: pilih.map((id) => ({ siswaId: id, programId: (R.prog(id) || {}).id })), _label: 'Koreksi kehadiran' });
          // Perbarui data lokal (bulan berjalan atau cache rekap)
          const src = ym === D().hadirBulan ? D() : A.rekapCache[ym];
          if (src) {
            src.hadirSiswa = (src.hadirSiswa || []).filter((h) => !(h[0] === ui.kTgl && h[2] === ui.kGuru)).concat(pilih.map((id) => { const p = R.prog(id) || {}; return [ui.kTgl, id, ui.kGuru, p.program || '', p.level || '']; }));
            src.hadirGuru = (src.hadirGuru || []).filter((h) => !(h.tanggal === ui.kTgl && h.guruId === ui.kGuru));
            if (pilih.length) src.hadirGuru.push({ id: ui.kTgl + '_' + ui.kGuru, tanggal: ui.kTgl, guruId: ui.kGuru, namaGuru: g ? g.panggilan || g.nama : '', jamIsi: '', jumlahSiswa: String(pilih.length), diubahOleh: 'admin' });
          }
          A.mut((dd) => { pilih.forEach((id) => { if (!dd.lastHadir[id] || dd.lastHadir[id] < ui.kTgl) dd.lastHadir[id] = ui.kTgl; }); });
          U.toast('Koreksi kehadiran disimpan');
        };
      };
      gambar();
    }).catch((e) => { const box = $('#k-list'); if (box) box.innerHTML = `<div class="card">${A.kosong('cloud-off', 'Gagal memuat', esc(e.message))}</div>`; });
  }

  // ---------- Ekspor rekap ----------
  async function ekspor(tab, fmt) {
    const ui = A.ui.hadir;
    U.toast('Menyiapkan berkas…', 'info');
    try {
      const data = await A.ambilRekap(ui.dari, ui.sampai);
      const set = D().settings;
      const rentang = ui.dari === ui.sampai ? ui.dari : ui.dari + '_sd_' + ui.sampai;
      const judulRentang = U.bulan(ui.dari) + (ui.dari !== ui.sampai ? ' – ' + U.bulan(ui.sampai) : '');
      const ambang = +set.ambang_siswa_banyak || 10;
      let lembar = [];
      if (tab === 'guru') {
        const rows = hitungGuru(data, ui);
        lembar = bulanRentang(ui).map((b) => ({ nama: U.bulan(b), judul: 'Rekap Kehadiran Guru — ' + U.bulan(b), head: ['No', 'Nama Guru', 'Hari Mengajar', 'Hari Les', 'Total Siswa', 'Rata-rata/Hari', 'Hari > ' + ambang + ' Siswa'],
          body: rows.filter((r) => r.ym === b).map((r, i) => [i + 1, r.nama, r.hari, R.hariLesBulan(b).length, r.siswa, Math.round(r.siswa / r.hari), r.banyak]) }));
      } else if (tab === 'khusus') {
        const rows = data.hadirGuru.filter((h) => +h.jumlahSiswa > ambang).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
        lembar = [{ nama: 'Guru lebih ' + ambang, judul: 'Rekap Guru Mengajar Lebih dari ' + ambang + ' Siswa — ' + judulRentang, head: ['No', 'Tanggal', 'Hari', 'Nama Guru', 'Jumlah Siswa'],
          body: rows.map((h, i) => [i + 1, U.tgl(h.tanggal), U.HARI[U.dow(h.tanggal)], namaGuru(h.guruId, h.namaGuru), +h.jumlahSiswa]) }];
      } else {
        lembar = bulanRentang(ui).map((b) => {
          const M = matriksSiswa(data, b, Object.assign({}, ui, { q: '', absen: false }));
          return { nama: U.bulan(b), judul: 'Rekap Kehadiran Siswa — ' + U.bulan(b), head: ['No', 'Nama Siswa', 'Program', 'Lv'].concat(M.hari.map((t) => String(+t.slice(8)))).concat(['Hadir', 'Hari Les', '%']),
            body: M.siswa.map((s, i) => { const p = R.prog(s.id) || {}; const h = M.hadir[s.id] || {}; const n = Object.keys(h).length; return [i + 1, s.nama, p.program === 'ala' ? 'Ala' : p.program === 'ahe' ? 'Ahe' : '-', p.level || '-'].concat(M.hari.map((t) => R.libur(t) ? 'L' : h[t] ? 'v' : '')).concat([n, M.hariLes.length, M.hariLes.length ? Math.round(n / M.hariLes.length * 100) : 0]); }) };
        });
      }
      const namaFile = { guru: 'Rekap-Hadir-Guru', khusus: 'Rekap-Guru-Lebih-' + ambang + '-Siswa', siswa: 'Rekap-Hadir-Siswa' }[tab] + '_' + rentang;
      if (fmt === 'xlsx') await A.unduhExcel(lembar, namaFile);
      else await A.unduhPdf(lembar, namaFile);
    } catch (e) { U.toast(e.message, 'bad'); }
  }
  A.unduhExcel = async (lembar, namaFile) => {
    const X = await U.lib.xlsx();
    const set = D().settings;
    const wb = X.utils.book_new();
    lembar.forEach((l) => {
      const aoa = [[set.nama_lembaga || set.nama_aplikasi || ''], [l.judul], [], l.head].concat(l.body.length ? l.body : [['(tidak ada data)']]);
      const ws = X.utils.aoa_to_sheet(aoa);
      ws['!cols'] = l.head.map((h, i) => ({ wch: i === 1 ? 26 : Math.max(5, String(h).length + 2) }));
      X.utils.book_append_sheet(wb, ws, String(l.nama).slice(0, 31));
    });
    X.writeFile(wb, namaFile + '.xlsx');
    U.toast('Excel diunduh: ' + namaFile + '.xlsx');
  };
  A.unduhPdf = async (lembar, namaFile) => {
    const JsPDF = await U.lib.pdfTable();
    const set = D().settings;
    const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297;
    const hex = (h) => [1, 3, 5].map((i) => parseInt((h || '#6B2F8F').substr(i, 2), 16));
    const pc = hex(set.warna_utama);
    lembar.forEach((l, i) => {
      if (i) doc.addPage();
      doc.setFillColor(pc[0], pc[1], pc[2]); doc.rect(0, 0, W, 20, 'F');
      let x = 10;
      if (set.logo_data) { try { doc.setFillColor(255, 255, 255); doc.roundedRect(10, 3, 14, 14, 2, 2, 'F'); doc.addImage(set.logo_data, /png/.test(set.logo_data) ? 'PNG' : 'JPEG', 11, 4, 12, 12); x = 28; } catch (e) { x = 10; } }
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text(String(set.nama_lembaga || set.nama_aplikasi || ''), x, 10);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text([set.nama_unit, set.alamat].filter(Boolean).join(' • '), x, 15);
      doc.setTextColor(43, 27, 61); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(l.judul, 10, 29);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(107, 95, 120); doc.text('Dicetak ' + U.tglPanjang(U.today()), W - 10, 29, { align: 'right' });
      const banyakKol = l.head.length > 12;
      doc.autoTable({ startY: 33, head: [l.head], body: l.body.length ? l.body : [['Tidak ada data']], theme: 'grid', margin: { left: 8, right: 8 },
        styles: { fontSize: banyakKol ? 6.5 : 9, cellPadding: banyakKol ? 1 : 2, halign: banyakKol ? 'center' : 'left', lineColor: [234, 223, 200] },
        headStyles: { fillColor: [Math.round(pc[0] * 0.75), Math.round(pc[1] * 0.75), Math.round(pc[2] * 0.75)], textColor: 255, halign: 'center' },
        columnStyles: { 1: { halign: 'left', cellWidth: banyakKol ? 42 : 'auto' } }, alternateRowStyles: { fillColor: [251, 246, 236] } });
    });
    doc.save(namaFile + '.pdf');
    U.toast('PDF diunduh: ' + namaFile + '.pdf');
  };

  // ======================================================================
  // SPP & KUITANSI
  // ======================================================================
  A.page('spp', {
    title: 'SPP & Kuitansi', crumb: 'SPP & Kuitansi', nav: 'spp', wakil: true,
    render(view, params, qs) {
      if (A.S.role === 'wakil') return sppWakil(view);
      const d = D();
      const ui = A.ui.spp = A.ui.spp || { q: '', prog: '', st: '', tunggak: false, sel: new Set(), wa: true, qsKey: '', hal: 1 };
      const rg = /^(\d{4}-\d{2})_(\d{4}-\d{2})$/.exec(params[0] || '');
      if (rg && rg[1] !== rg[2]) return sppRentang(view, rg[1] < rg[2] ? rg[1] : rg[2], rg[1] < rg[2] ? rg[2] : rg[1], qs);
      const ym = /^\d{4}-\d{2}$/.test(params[0] || '') ? params[0] : rg ? rg[1] : U.ymNow();
      if (qs.toString() && qs.toString() !== ui.qsKey) { ui.qsKey = qs.toString(); if (qs.get('f') === 'tunggak') { ui.tunggak = true; ui.st = 'belum'; } }
      const tarif = R.tarif(ym);
      const pr = R.peringatan(); const dua = new Set(pr.tunggakan.map((x) => x.s.id));
      const semua = R.siswaTerdaftar().filter((s) => R.lunas(s.id, ym) || R.ditagih(s, ym));
      const q = ui.q.toLowerCase();
      const rows = semua.map((s) => ({ s, p: R.prog(s.id), l: R.lunas(s.id, ym), tg: R.tunggakan(s) })).filter((x) => {
        if (ui.prog && (!x.p || x.p.program !== ui.prog)) return false;
        if (ui.st === 'lunas' && !x.l) return false; if (ui.st === 'belum' && x.l) return false;
        if (ui.tunggak && !dua.has(x.s.id)) return false;
        return !q || [x.s.nama, x.s.panggilan, x.s.kode, x.s.ortu, x.s.wa].join(' ').toLowerCase().includes(q);
      }).sort((a, b) => (a.l ? 1 : 0) - (b.l ? 1 : 0) || a.s.nama.localeCompare(b.s.nama));
      ui.sel = new Set(Array.from(ui.sel).filter((id) => rows.some((r) => r.s.id === id && !r.l)));
      const PER = 25, nHal = Math.max(1, Math.ceil(rows.length / PER));
      if (ui.ym !== ym) { ui.ym = ym; ui.hal = 1; }
      if (ui.hal > nHal) ui.hal = nHal;
      const halRows = rows.slice((ui.hal - 1) * PER, ui.hal * PER);
      const rk = A.ringkasSpp(ym);
      const persen = rk.wajib ? Math.round(rk.lunasN / rk.wajib * 1000) / 10 : 0;
      view.innerHTML = `<div class="page-head"><div><h1>SPP & Kuitansi</h1><p>Tandai pembayaran, terbitkan kuitansi resmi, dan pantau tunggakan.</p></div>
        <div class="actions"><div class="row-gap" style="gap:4px"><a class="btn btn-light btn-icon btn-sm" href="#/spp/${U.addMonths(ym, -1)}" aria-label="Bulan sebelumnya">${icon('chevron-left')}</a>${U.tombolPeriode('s-per', ym, ym)}<a class="btn btn-light btn-icon btn-sm" href="#/spp/${U.addMonths(ym, 1)}" aria-label="Bulan berikutnya">${icon('chevron-right')}</a></div>
          <button class="btn btn-light btn-sm" id="s-tarif">${icon('settings')} Atur Tarif</button><button class="btn btn-light btn-sm" data-ex="xlsx" style="color:#15803D">${icon('file-spreadsheet')} Excel</button><button class="btn btn-light btn-sm" data-ex="pdf" style="color:var(--bad-700)">${icon('file-text')} PDF</button></div></div>
        ${kartuDraf()}
        ${tarif ? '' : `<div class="note-box warn mb-16">${icon('triangle-alert')}<span><b>Tarif SPP untuk ${U.bulan(ym)} belum diatur.</b> Tagihan dan peringatan tunggakan baru dihitung setelah tarif ditetapkan. <a href="#" id="s-tarif2" style="font-weight:700">Atur tarif sekarang</a></span></div>`}
        <div class="stats four mb-16"><div class="card stat"><div class="top"><span class="lbl">Tarif aktif</span><span class="icon-dot sm">${icon('wallet')}</span></div><div class="val sm">${U.rp(tarif)}<span class="small muted">/bln</span></div><div class="sub">Jatuh tempo tgl ${+d.settings.spp_jatuh_tempo || 10}</div></div>
          <div class="card stat"><div class="top"><span class="lbl">Wajib bayar</span><span class="icon-dot sm ala">${icon('users')}</span></div><div class="val">${rk.wajib}</div><div class="sub">siswa aktif bulan ini</div></div>
          <div class="card stat"><div class="top"><span class="lbl">Sudah lunas</span><span class="icon-dot sm ok">${icon('circle-check')}</span></div><div class="val">${rk.lunasN}</div><div class="sub">${U.rp(rk.lunas)} masuk</div></div>
          <div class="card stat"><div class="top"><span class="lbl">Belum bayar</span><span class="icon-dot sm bad">${icon('circle-alert')}</span></div><div class="val">${rk.wajib - rk.lunasN}</div><div class="sub">${U.rp(rk.belum)} · ${persen}% terkumpul</div><div class="bar ok"><i style="width:${persen}%"></i></div></div></div>
        <div class="card mb-12"><div class="filters"><div class="input-icon search">${icon('search')}<input class="input" id="s-q" placeholder="Cari siswa, kode, orang tua…" value="${esc(ui.q)}"></div>
          <select class="input" id="s-prog"><option value="">Semua program</option><option value="ahe" ${ui.prog === 'ahe' ? 'selected' : ''}>Baca (Ahe)</option><option value="ala" ${ui.prog === 'ala' ? 'selected' : ''}>Berhitung (Ala)</option></select>
          <select class="input" id="s-st"><option value="">Semua status</option><option value="lunas" ${ui.st === 'lunas' ? 'selected' : ''}>Lunas</option><option value="belum" ${ui.st === 'belum' ? 'selected' : ''}>Belum bayar</option></select>
          <button class="tab ${ui.tunggak ? 'on' : ''}" id="s-tg" style="border-color:var(--bad);${ui.tunggak ? 'background:var(--bad)' : 'color:var(--bad-700)'}">${icon('triangle-alert', 'ic-sm')} Menunggak ≥ 2 bulan <span class="n">${dua.size}</span></button></div></div>
        <div class="card">${rows.length ? `<div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr><th class="w-check">${A.cek('data-all', ui.sel.size && halRows.filter((r) => !r.l).every((r) => ui.sel.has(r.s.id)))}</th><th>Siswa</th><th>Program</th><th>Status</th><th>Tunggakan</th><th class="t-right">Aksi</th></tr></thead><tbody>
          ${halRows.map(({ s, p, l, tg }) => { const kw = l && R.idx().kw[l.kuitansiId]; return `<tr class="${ui.sel.has(s.id) ? 'sel' : ''} ${dua.has(s.id) && !l ? 'row-bad' : ''}">
            <td class="w-check">${l ? '' : A.cek(`data-sel="${s.id}"`, ui.sel.has(s.id))}</td>
            <td class="t-main"><div class="person">${U.avatar(s.nama, s.id)}<div><a class="t-name" href="#/siswa/${s.id}">${esc(s.nama)}</a> ${s.panggilan ? `<span class="small muted">(${esc(s.panggilan)})</span>` : ''}<div class="t-sub">${esc(s.kode)}${s.ortu ? ' · Ortu: ' + esc(s.ortu) : ''}</div></div></div></td>
            <td data-l="Program">${A.chipProg(p, true)}</td>
            <td data-l="Status">${l ? `<span class="chip chip-ok">${icon('check')} Lunas</span><div class="t-sub nowrap">${esc(U.tgl(l.tglBayar))}${kw ? ' · <span class="num">' + esc(kw.nomor || 'menunggu…') + '</span>' : ''}</div>` : `<span class="chip chip-bad">${icon('circle-alert')} Belum bayar</span>`}</td>
            <td data-l="Tunggakan">${tg.belum.length ? `<span class="chip ${tg.dua ? 'chip-bad' : 'chip-warn'}">${tg.belum.length} bln: ${esc(tg.belum.map(U.bln).join(', '))}</span>` : '<span class="chip">Lancar</span>'}</td>
            <td class="t-actions t-right"><div class="row-gap" style="justify-content:flex-end">${l ? (kw ? `<button class="btn btn-light btn-sm" data-kw="${kw.id}">${icon('printer')} Kuitansi</button>` : '') + `<button class="btn btn-ghost btn-icon btn-sm" data-batal="${s.id}" title="Batalkan lunas">${icon('undo-2')}</button>`
              : `<button class="btn btn-accent btn-sm" data-bayar="${s.id}">${icon('wallet')} Tandai Lunas</button>${tg.belum.length && s.wa ? `<button class="btn btn-wa btn-icon btn-sm" data-ingat="${s.id}" title="Kirim pengingat WA">${icon('message-circle')}</button>` : ''}`}</div></td></tr>`; }).join('')}
          </tbody></table></div>${A.pager(rows.length, ui.hal, PER)}${rows.some((r) => !r.l) ? `<div style="padding:0 16px 14px"><button class="btn btn-ghost btn-sm" id="s-pilih-semua">${icon('circle-check')} Pilih semua yang belum bayar (${rows.filter((r) => !r.l).length})</button></div>` : ''}` : A.kosong('receipt', semua.length ? 'Tidak ada data yang cocok' : 'Belum ada tagihan bulan ini', semua.length ? 'Ubah filter.' : 'Tagihan muncul untuk siswa aktif setelah tarif SPP diatur.')}</div>
        ${ui.sel.size ? `<div class="bulk"><span class="n">${icon('circle-check')} ${ui.sel.size} siswa dipilih</span><div class="acts">
          <label class="check" style="color:#fff"><input type="checkbox" id="b-wa" ${ui.wa && A.tplAktif('tpl_wa_kuitansi') ? 'checked' : ''} ${A.tplAktif('tpl_wa_kuitansi') ? '' : 'disabled'}><span class="box">${icon('check')}</span><span class="small">Kirim link kuitansi via WA</span></label></div>
          <button class="btn hl" id="b-lunas">${icon('circle-check')} Tandai Lunas ${U.bulan(ym)}</button><button class="btn x btn-icon" data-clear aria-label="Batal">${icon('x')}</button></div>` : ''}`;
      const ul = () => A.refresh(true);
      $('#s-q').oninput = U.debounce((e) => { ui.q = e.target.value; ui.hal = 1; ul(); const i = $('#s-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200);
      $('#s-prog').onchange = (e) => { ui.prog = e.target.value; ul(); };
      $('#s-st').onchange = (e) => { ui.st = e.target.value; ul(); };
      $('#s-tg').onclick = () => { ui.tunggak = !ui.tunggak; ul(); };
      $('#s-per').onclick = () => pilihPeriodeSpp(ym, ym);
      pasangDraf(); $('#s-tarif').onclick = aturTarif; const t2 = $('#s-tarif2'); if (t2) t2.onclick = (e) => { e.preventDefault(); aturTarif(); };
      $$('[data-sel]').forEach((c) => c.onchange = () => { c.checked ? ui.sel.add(c.dataset.sel) : ui.sel.delete(c.dataset.sel); ul(); });
      const all = $('[data-all]'); if (all) all.onchange = () => { halRows.filter((r) => !r.l).forEach((r) => all.checked ? ui.sel.add(r.s.id) : ui.sel.delete(r.s.id)); ul(); };
      const ps = $('#s-pilih-semua'); if (ps) ps.onclick = () => { rows.filter((r) => !r.l).forEach((r) => ui.sel.add(r.s.id)); ul(); };
      $$('[data-pg]').forEach((b) => b.onclick = () => { ui.hal = +b.dataset.pg; A.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      $$('[data-bayar]').forEach((b) => b.onclick = () => A.bayarSiswa(R.idx().siswa[b.dataset.bayar], ym));
      $$('[data-kw]').forEach((b) => b.onclick = () => A.lihatKuitansi(R.idx().kw[b.dataset.kw]));
      $$('[data-batal]').forEach((b) => b.onclick = () => batalLunas(R.idx().siswa[b.dataset.batal], ym));
      $$('[data-ingat]').forEach((b) => b.onclick = () => ingatkan(R.idx().siswa[b.dataset.ingat]));
      $$('[data-ex]').forEach((b) => b.onclick = () => eksporSpp(ym, b.dataset.ex));
      const cl = $('[data-clear]'); if (cl) cl.onclick = () => { ui.sel.clear(); ul(); };
      const bw = $('#b-wa'); if (bw) bw.onchange = () => { ui.wa = bw.checked; };
      const bl = $('#b-lunas'); if (bl) bl.onclick = () => {
        const ids = Array.from(ui.sel);
        ids.forEach((id) => catatBayar(R.idx().siswa[id], [ym], { metode: 'Tunai', tglBayar: U.today(), kirimWA: ui.wa && A.tplAktif('tpl_wa_kuitansi') }));
        U.toast(`${ids.length} siswa ditandai lunas ${U.bulan(ym)}${ui.wa ? ' · link kuitansi dikirim via WA' : ''}`);
        ui.sel.clear(); A.render();
      };
    }
  });
  async function pilihPeriodeSpp(dari, sampai) {
    const r = await U.pilihPeriode({ dari, sampai, min: '2020-01', max: U.ymNow().slice(0, 4) + '-12' > U.addMonths(U.ymNow(), 6) ? U.ymNow().slice(0, 4) + '-12' : U.addMonths(U.ymNow(), 6) });
    if (!r) return;
    try { if (await A.pastikanSpp(r.dari)) U.toast('Data SPP lama dimuat', 'info'); } catch (e) { U.toast(e.message, 'bad'); }
    A.go('/spp/' + (r.dari === r.sampai ? r.dari : r.dari + '_' + r.sampai));
  }
  // Rekap SPP beberapa bulan / satu tahun
  function sppRentang(view, dari, sampai, qs) {
    const ui = A.ui.sppR = A.ui.sppR || { q: '', prog: '', st: '', hal: 1 };
    if (ui.kunci !== dari + sampai) { ui.kunci = dari + sampai; ui.hal = 1; }
    const bulan = []; for (let b = dari; b <= sampai; b = U.addMonths(b, 1)) bulan.push(b);
    const kini = U.ymNow();
    const semua = R.siswaTerdaftar().map((s) => {
      const sel = bulan.map((b) => { const l = R.lunas(s.id, b); return { b, l, tagih: !l && R.ditagih(s, b) && b <= kini }; });
      const dibayar = sel.filter((x) => x.l).reduce((t, x) => t + (+x.l.nominal || 0), 0);
      const belumB = sel.filter((x) => x.tagih);
      return { s, p: R.prog(s.id), sel, dibayar, belumB, belum: belumB.reduce((t, x) => t + R.tarif(x.b), 0), nLunas: sel.filter((x) => x.l).length };
    }).filter((x) => x.nLunas || x.belumB.length);
    const q = ui.q.toLowerCase();
    const rows = semua.filter((x) => (!ui.prog || (x.p && x.p.program === ui.prog)) && (!ui.st || (ui.st === 'lunas' ? !x.belumB.length : x.belumB.length)) && (!q || [x.s.nama, x.s.panggilan, x.s.kode, x.s.ortu].join(' ').toLowerCase().includes(q)))
      .sort((a, b) => b.belumB.length - a.belumB.length || a.s.nama.localeCompare(b.s.nama));
    const tot = semua.reduce((t, x) => ({ dibayar: t.dibayar + x.dibayar, belum: t.belum + x.belum, nL: t.nL + x.nLunas, nB: t.nB + x.belumB.length }), { dibayar: 0, belum: 0, nL: 0, nB: 0 });
    const persen = tot.dibayar + tot.belum ? Math.round(tot.dibayar / (tot.dibayar + tot.belum) * 1000) / 10 : 0;
    const PER = 25, nHal = Math.max(1, Math.ceil(rows.length / PER)); if (ui.hal > nHal) ui.hal = nHal;
    const hal = rows.slice((ui.hal - 1) * PER, ui.hal * PER);
    view.innerHTML = `<div class="page-head"><div><h1>SPP & Kuitansi</h1><p>Rekap pembayaran ${esc(U.labelPeriode(dari, sampai))} (${bulan.length} bulan).</p></div>
      <div class="actions">${U.tombolPeriode('s-per', dari, sampai)}<a class="btn btn-light btn-sm" href="#/spp/${kini}">${icon('calendar-check')} Bulan ini</a><button class="btn btn-light btn-sm" data-ex="xlsx" style="color:#15803D">${icon('file-spreadsheet')} Excel</button><button class="btn btn-light btn-sm" data-ex="pdf" style="color:var(--bad-700)">${icon('file-text')} PDF</button></div></div>
      <div class="stats four mb-16"><div class="card stat"><div class="top"><span class="lbl">Total tagihan</span><span class="icon-dot sm">${icon('wallet')}</span></div><div class="val sm num">${U.rp(tot.dibayar + tot.belum)}</div><div class="sub">${tot.nL + tot.nB} tagihan siswa-bulan</div></div>
        <div class="card stat"><div class="top"><span class="lbl">Sudah dibayar</span><span class="icon-dot sm ok">${icon('circle-check')}</span></div><div class="val sm num">${U.rp(tot.dibayar)}</div><div class="sub">${tot.nL} pembayaran</div></div>
        <div class="card stat"><div class="top"><span class="lbl">Belum dibayar</span><span class="icon-dot sm bad">${icon('circle-alert')}</span></div><div class="val sm num">${U.rp(tot.belum)}</div><div class="sub">${tot.nB} bulan tertunggak</div></div>
        <div class="card stat"><div class="top"><span class="lbl">Terkumpul</span><span class="icon-dot sm ala">${icon('trending-up')}</span></div><div class="val">${String(persen).replace('.', ',')}%</div><div class="bar ok"><i style="width:${persen}%"></i></div></div></div>
      <div class="card mb-12"><div class="filters"><div class="input-icon search">${icon('search')}<input class="input" id="r-q" placeholder="Cari siswa, kode, orang tua…" value="${esc(ui.q)}"></div>
        <select class="input" id="r-prog"><option value="">Semua program</option><option value="ahe" ${ui.prog === 'ahe' ? 'selected' : ''}>Baca (Ahe)</option><option value="ala" ${ui.prog === 'ala' ? 'selected' : ''}>Berhitung (Ala)</option></select>
        <select class="input" id="r-st"><option value="">Semua status</option><option value="lunas" ${ui.st === 'lunas' ? 'selected' : ''}>Lunas semua</option><option value="belum" ${ui.st === 'belum' ? 'selected' : ''}>Ada yang belum</option></select>
        <span class="spacer"></span><div class="legend"><span><i style="background:var(--ok)"></i>Lunas</span><span><i style="background:var(--bad)"></i>Belum</span><span><i style="background:var(--line-2)"></i>Tidak ditagih</span></div></div></div>
      <div class="card">${hal.length ? `<div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr><th>Siswa</th><th>Program</th><th>Status per bulan</th><th class="t-right">Dibayar</th><th class="t-right">Belum</th><th class="t-right">Aksi</th></tr></thead><tbody>
        ${hal.map((x) => `<tr class="${x.belumB.length >= 2 ? 'row-bad' : ''}"><td class="t-main"><div class="person">${U.avatar(x.s.nama, x.s.id)}<div><a class="t-name" href="#/siswa/${x.s.id}">${esc(x.s.nama)}</a><div class="t-sub">${esc(x.s.kode || '')}</div></div></div></td>
          <td data-l="Program">${A.chipProg(x.p, true)}</td>
          <td data-l="Per bulan"><div class="mstrip">${x.sel.map((m) => `<span class="mchip ${m.l ? 'ok' : m.tagih ? 'no' : ''}" title="${esc(U.bulan(m.b))}: ${m.l ? 'lunas ' + esc(U.tgl(m.l.tglBayar)) : m.tagih ? 'belum bayar' : 'tidak ditagih'}">${U.BLN[+m.b.slice(5, 7) - 1]}${bulan.length > 12 || m.b.slice(0, 4) !== sampai.slice(0, 4) ? ' ' + m.b.slice(2, 4) : ''}</span>`).join('')}</div></td>
          <td data-l="Dibayar" class="t-right num">${U.rp(x.dibayar)}</td><td data-l="Belum" class="t-right num">${x.belum ? `<b style="color:var(--bad-700)">${U.rp(x.belum)}</b>` : '—'}</td>
          <td class="t-actions t-right">${x.belumB.length ? `<button class="btn btn-accent btn-sm" data-bayar="${x.s.id}" data-bln="${x.belumB.map((m) => m.b).join(',')}">${icon('wallet')} Bayar</button>` : `<span class="chip chip-ok">${icon('check')} Lunas</span>`}</td></tr>`).join('')}
      </tbody></table></div>${A.pager(rows.length, ui.hal, PER)}` : A.kosong('receipt', 'Tidak ada data', 'Ubah filter atau periode.')}</div>`;
    const ul = () => A.refresh(true);
    $('#s-per').onclick = () => pilihPeriodeSpp(dari, sampai);
    $('#r-q').oninput = U.debounce((e) => { ui.q = e.target.value; ui.hal = 1; ul(); const i = $('#r-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200);
    $('#r-prog').onchange = (e) => { ui.prog = e.target.value; ui.hal = 1; ul(); };
    $('#r-st').onchange = (e) => { ui.st = e.target.value; ui.hal = 1; ul(); };
    $$('[data-pg]').forEach((b) => b.onclick = () => { ui.hal = +b.dataset.pg; A.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    $$('[data-bayar]').forEach((b) => b.onclick = () => A.bayarSiswa(R.idx().siswa[b.dataset.bayar], b.dataset.bln.split(',')));
    $$('[data-ex]').forEach((b) => b.onclick = async () => {
      const head = ['No', 'Nama Siswa', 'Kode', 'Program'].concat(bulan.map((m) => U.BLN[+m.slice(5, 7) - 1] + ' ' + m.slice(2, 4))).concat(['Dibayar', 'Belum']);
      const body = rows.map((x, i) => [i + 1, x.s.nama, x.s.kode, x.p ? (x.p.program === 'ala' ? 'Ala' : 'Ahe') : '-'].concat(x.sel.map((m) => m.l ? 'Lunas' : m.tagih ? 'Belum' : '-')).concat([x.dibayar, x.belum]));
      body.push(['', 'TOTAL', '', ''].concat(bulan.map(() => '')).concat([tot.dibayar, tot.belum]));
      const lembar = [{ nama: 'Rekap SPP', judul: 'Rekap SPP — ' + U.labelPeriode(dari, sampai), head, body }];
      const nf = 'Rekap-SPP_' + dari + '_sd_' + sampai;
      try { if (b.dataset.ex === 'xlsx') await A.unduhExcel(lembar, nf); else await A.unduhPdf(lembar, nf); } catch (e) { U.toast(e.message, 'bad'); }
    });
  }
  // Catat pembayaran: optimistis + satu kuitansi per siswa
  function catatBayar(s, bulan, o) {
    const items = bulan.filter((b) => !R.lunas(s.id, b)).map((b) => ({ bulan: b, nominal: R.tarif(b) }));
    if (!items.length) return null;
    const kw = { id: U.uid(), token: U.token(), nomor: '', siswaId: s.id, bulan: items.map((i) => i.bulan).sort().join(','), total: String(items.reduce((a, i) => a + i.nominal, 0)), tglBayar: o.tglBayar, metode: o.metode, penerima: D().settings.kuitansi_penerima || 'Admin', createdAt: U.nowIso() };
    A.mut((d) => {
      items.forEach((i) => d.spp.push({ id: s.id + '_' + i.bulan, siswaId: s.id, bulan: i.bulan, nominal: String(i.nominal), status: 'lunas', tglBayar: o.tglBayar, kuitansiId: kw.id, metode: o.metode }));
      d.kuitansi.push(kw);
      if (A.detailCache[s.id]) { A.detailCache[s.id].kuitansi.push(kw); items.forEach((i) => A.detailCache[s.id].spp.push({ id: s.id + '_' + i.bulan, siswaId: s.id, bulan: i.bulan, nominal: String(i.nominal), tglBayar: o.tglBayar, kuitansiId: kw.id })); }
    });
    A.kirim({ op: 'bayarSPP', siswaId: s.id, items, kuitansi: { id: kw.id, token: kw.token }, tglBayar: o.tglBayar, metode: o.metode, kirimWA: !!(o.kirimWA && s.wa), _label: 'Pembayaran SPP ' + s.nama });
    return kw;
  }
  A.hasil.bayarSPP = (op, data) => {
    if (!data || !data.kuitansi) return;
    A.mut((d) => {
      const k = d.kuitansi.find((x) => x.id === data.kuitansi.id); if (k) Object.assign(k, data.kuitansi);
      const c = A.detailCache[op.siswaId]; if (c) { const k2 = c.kuitansi.find((x) => x.id === data.kuitansi.id); if (k2) Object.assign(k2, data.kuitansi); }
    });
    if (data.wa && data.wa.status === 'gagal') U.toast('Kuitansi tersimpan, tetapi WA gagal: ' + data.wa.respon, 'warn', 6000);
    const terbuka = $('[data-kw-modal="' + data.kuitansi.id + '"]');
    if (terbuka && A._kwModal) A._kwModal.refresh();
  };
  // mode: biasa (admin) | 'draf' (wakil admin mencatat, menunggu persetujuan) | 'setujui' (admin menyetujui draf)
  A.bayarSiswa = (s, ymAwal, opsiMode) => {
    if (!s) return;
    const om = opsiMode || {}, draf = om.mode === 'draf', setujui = om.mode === 'setujui', df = om.draf || null;
    const tg = R.tunggakan(s);
    const now = U.ymNow();
    const opsi = new Set(tg.belum);
    for (let i = -2; i <= 2; i++) { const b = U.addMonths(now, i); if (R.ditagih(s, b) || (i >= 0 && R.tarif(b) > 0)) opsi.add(b); }
    const awal = df ? String(df.bulan).split(',').filter(Boolean) : Array.isArray(ymAwal) ? ymAwal : ymAwal ? [ymAwal] : null;
    if (awal) awal.forEach((b) => opsi.add(b));
    const list = Array.from(opsi).filter((b) => R.tarif(b) > 0).sort();
    if (!list.length) { U.toast('Tarif SPP belum diatur', 'warn'); return A.S.role === 'admin' ? aturTarif() : null; }
    const pilihAwal = new Set(awal || (tg.belum.length ? tg.belum : [now]));
    // bulan yang sudah ada di draf lain yang masih menunggu
    const diDraf = {};
    (D().drafSpp || []).forEach((x) => { if (x.status === 'menunggu' && x.siswaId === s.id && (!df || x.id !== df.id)) String(x.bulan).split(',').forEach((b) => { diDraf[b] = x; }); });
    const m = U.modal({
      title: (draf ? 'Catat Pembayaran (Draf) — ' : setujui ? 'Setujui Draf — ' : 'Bayar SPP — ') + s.nama, icon: 'receipt',
      sub: esc(s.kode) + (R.prog(s.id) ? ' · ' + esc(R.LABEL[R.prog(s.id).program]) + ' Level ' + esc(R.prog(s.id).level) : ''),
      body: `${draf ? `<div class="note-box mb-12">${icon('info')}<span>Pembayaran dicatat sebagai <b>draf</b>. Status lunas & kuitansi baru terbit setelah <b>disetujui admin utama</b>.</span></div>` : ''}
        ${setujui ? `<div class="note-box mb-12">${icon('user-check')}<span>Dicatat oleh <b>${esc(df.namaPembuat || '-')}</b> · ${esc(U.tgl(String(df.createdAt).slice(0, 10)))}${df.catatan ? '<br>Catatan: ' + esc(df.catatan) : ''}</span></div>` : ''}
        <div class="tiny strong muted mb-12" style="letter-spacing:.06em">PILIH BULAN YANG DIBAYAR</div><div class="stack-sm" id="by-list">${list.map((b) => { const l = R.lunas(s.id, b); const tunggak = tg.belum.includes(b); const dd = draf && diDraf[b]; return `<label class="card card-pad row-gap" style="padding:12px 14px;cursor:${l || dd ? 'default' : 'pointer'};${tunggak ? 'background:#FFF6F6;border-color:#FBD5D5' : ''}">
          <span class="check"><input type="checkbox" value="${b}" ${l ? 'disabled checked' : dd ? 'disabled' : pilihAwal.has(b) ? 'checked' : ''}><span class="box">${icon('check')}</span></span>
          <div style="flex:1"><b>${U.bulan(b)}</b><div class="tiny ${l ? '' : tunggak ? '' : 'muted'}" style="${tunggak && !l ? 'color:var(--bad-700);font-weight:700' : ''}">${l ? 'Sudah lunas ' + esc(U.tgl(l.tglBayar)) : dd ? 'Sudah ada di draf, menunggu admin' : tunggak ? 'TUNGGAKAN' : b > now ? 'Bayar di muka' : b === now ? 'Bulan berjalan' : ''}</div></div><b class="num">${U.rp(R.tarif(b))}</b></label>`; }).join('')}</div>
        <div class="card soft card-pad mt-16 row-gap"><div style="flex:1"><div class="small muted">Total pembayaran</div><div class="tiny muted" id="by-n"></div></div><div style="font-family:var(--f-head);font-weight:900;font-size:26px;color:var(--p-700)" id="by-total" class="num"></div></div>
        <div class="grid-2 mt-16"><div class="field"><label>Metode</label><select class="input" id="by-metode">${['Tunai', 'Transfer Bank', 'QRIS / E-wallet'].map((x) => `<option ${df && df.metode === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="field"><label>Tanggal bayar</label><input class="input" type="date" id="by-tgl" value="${esc(df && df.tglBayar ? df.tglBayar : U.today())}" max="${U.today()}"></div></div>
        ${draf ? `<div class="field mt-16"><label for="by-cat">Catatan untuk admin (opsional)</label><input class="input" id="by-cat" maxlength="300" placeholder="Contoh: dibayar oleh ibunya, uang pas"></div>`
          : `<label class="check mt-16"><input type="checkbox" id="by-wa" ${s.wa && A.tplAktif('tpl_wa_kuitansi') ? 'checked' : 'disabled'}><span class="box">${icon('check')}</span><span class="small">Buat 1 kuitansi & kirim link via WhatsApp ke ${s.wa ? esc(U.tampilWa(s.wa)) : '(nomor WA belum ada)'}${A.tplAktif('tpl_wa_kuitansi') ? '' : ' <span class="muted">— pesan kuitansi dinonaktifkan di Pengaturan → WhatsApp</span>'}</span></label>`}`,
      foot: `<button class="btn btn-light" data-n>Batal</button><button class="btn btn-primary" data-ok>${icon(draf ? 'send' : 'receipt')} ${draf ? 'Kirim Draf ke Admin' : setujui ? 'Setujui & Terbitkan Kuitansi' : 'Simpan & Terbitkan Kuitansi'}</button>`
    });
    const hitung = () => {
      const p = m.$$('#by-list input:checked:not(:disabled)').map((i) => i.value);
      m.$('#by-total').textContent = U.rp(p.reduce((a, b) => a + R.tarif(b), 0));
      m.$('#by-n').textContent = p.length + ' bulan dipilih';
      m.$('[data-ok]').disabled = !p.length;
    };
    hitung(); m.$('#by-list').onchange = hitung;
    m.$('[data-n]').onclick = () => m.close();
    m.$('[data-ok]').onclick = () => {
      const p = m.$$('#by-list input:checked:not(:disabled)').map((i) => i.value);
      const metode = m.$('#by-metode').value, tglBayar = m.$('#by-tgl').value || U.today();
      if (draf) {
        const rec = { id: U.uid(), siswaId: s.id, bulan: p.join(','), total: String(p.reduce((a, b) => a + R.tarif(b), 0)), metode, tglBayar, catatan: m.$('#by-cat').value.trim(), status: 'menunggu', dibuatOleh: A.S.user.id, namaPembuat: A.S.user.nama, createdAt: U.nowIso(), diprosesAt: '', kuitansiId: '' };
        A.mut((d) => { d.drafSpp = (d.drafSpp || []).concat([rec]); });
        A.kirim({ op: 'drafBayar', draf: Object.assign({}, rec, { bulan: p }), _label: 'Draf pembayaran' });
        m.close(); U.toast('Draf pembayaran ' + s.nama + ' dikirim ke admin (' + p.length + ' bulan)');
        return;
      }
      const kw = catatBayar(s, p, { metode, tglBayar, kirimWA: m.$('#by-wa').checked });
      if (setujui && df) {
        A.kirim({ op: 'setujuiDraf', id: df.id, kuitansiId: kw ? kw.id : '', _label: 'Setujui draf' });
        A.mut((d) => { const x = (d.drafSpp || []).find((y) => y.id === df.id); if (x) { x.status = 'disetujui'; x.diprosesAt = U.nowIso(); x.kuitansiId = kw ? kw.id : ''; } });
      }
      m.close();
      if (kw) { U.toast('Pembayaran ' + s.nama + ' tercatat (' + p.length + ' bulan)'); A.lihatKuitansi(kw); }
    };
  };
  // ---------------- Draf pembayaran dari wakil admin ----------------
  function kartuDraf() {
    const list = (D().drafSpp || []).filter((x) => x.status === 'menunggu').sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    if (!list.length) return '';
    const idx = R.idx().siswa;
    return `<div class="card mb-16 draf-card"><div class="card-head"><h3>${icon('notebook-pen')} Draf pembayaran menunggu persetujuan</h3><span class="chip chip-warn">${list.length}</span></div>
      <div class="ll-list">${list.map((x) => { const s = idx[x.siswaId]; return `<div class="ll-item" style="padding:12px 18px">${U.avatar(s ? s.nama : '?', x.siswaId, 'av-sm')}<div class="t"><b>${esc(s ? s.nama : 'Siswa terhapus')}</b>
          <div class="tiny muted">${esc(U.daftarBulan(String(x.bulan).split(',')))} · <b class="num">${U.rp(+x.total)}</b> · ${esc(x.metode)} · dicatat ${esc(x.namaPembuat)} ${esc(U.tgl(String(x.createdAt).slice(0, 10)))}</div>${x.catatan ? `<div class="tiny">${icon('message-circle', 'ic-sm')} ${esc(x.catatan)}</div>` : ''}</div>
          <button class="btn btn-light btn-sm" data-draf-tolak="${esc(x.id)}">${icon('x', 'ic-sm')}<span class="d-only"> Tolak</span></button><button class="btn btn-primary btn-sm" data-draf-ok="${esc(x.id)}" ${s ? '' : 'disabled'}>${icon('check', 'ic-sm')} Setujui</button></div>`; }).join('')}</div></div>`;
  }
  function pasangDraf() {
    const cari = (id) => (D().drafSpp || []).find((x) => x.id === id);
    $$('[data-draf-ok]').forEach((b) => b.onclick = () => { const x = cari(b.dataset.drafOk); A.bayarSiswa(R.idx().siswa[x.siswaId], null, { mode: 'setujui', draf: x }); });
    $$('[data-draf-tolak]').forEach((b) => b.onclick = async () => {
      const x = cari(b.dataset.drafTolak); const s = R.idx().siswa[x.siswaId];
      const alasan = await U.prompt({ title: 'Tolak draf ' + (s ? s.nama : ''), icon: 'circle-x', label: 'Alasan (opsional, terlihat oleh wakil admin)', ok: 'Tolak draf' });
      if (alasan === null) return;
      A.mut((d) => { const y = (d.drafSpp || []).find((z) => z.id === x.id); if (y) { y.status = 'ditolak'; y.diprosesAt = U.nowIso(); if (alasan) y.catatan = alasan; } });
      A.kirim({ op: 'tolakDraf', id: x.id, catatan: alasan || x.catatan, _label: 'Tolak draf' });
      U.toast('Draf ditolak');
    });
  }
  // ---------------- Halaman SPP untuk wakil admin (hanya draf) ----------------
  function sppWakil(view) {
    const ui = A.ui.sppW = A.ui.sppW || { q: '', semua: false };
    const ym = U.ymNow();
    const milik = (D().drafSpp || []).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const tunggu = milik.filter((x) => x.status === 'menunggu');
    const q = ui.q.toLowerCase();
    const rows = R.siswaTerdaftar().filter((s) => R.ditagih(s, ym) || R.tunggakan(s).belum.length).map((s) => ({ s, l: R.lunas(s.id, ym), tg: R.tunggakan(s) }))
      .filter((x) => (ui.semua || q || !x.l || x.tg.belum.length) && (!q || [x.s.nama, x.s.panggilan, x.s.kode, x.s.ortu].join(' ').toLowerCase().includes(q)))
      .sort((a, b) => (a.l ? 1 : 0) - (b.l ? 1 : 0) || a.s.nama.localeCompare(b.s.nama));
    const idx = R.idx().siswa;
    const stCls = { menunggu: 'chip-warn', disetujui: 'chip-ok', ditolak: 'chip-bad' };
    view.innerHTML = `<div class="page-head"><div><h1>SPP — Catat Pembayaran</h1><p>Catat pembayaran yang Anda terima sebagai <b>draf</b>. Admin utama yang menandai lunas & menerbitkan kuitansi.</p></div></div>
      <div class="split"><div class="card"><div class="card-head" style="flex-wrap:wrap;gap:10px"><h3>${icon('users')} Siswa · ${esc(U.bulan(ym))}</h3><div class="seg"><button class="${ui.semua ? '' : 'on'}" data-sw="0">Belum bayar</button><button class="${ui.semua ? 'on' : ''}" data-sw="1">Semua</button></div><div class="input-icon" style="flex:1 1 180px;max-width:260px">${icon('search')}<input class="input" id="sw-q" placeholder="Cari siswa…" value="${esc(ui.q)}"></div></div>
        ${rows.length ? `<div class="ll-list">${rows.map((x) => { const adaDraf = tunggu.some((d) => d.siswaId === x.s.id); return `<div class="ll-item" style="padding:10px 18px">${U.avatar(x.s.nama, x.s.id, 'av-sm')}<div class="t"><b>${esc(x.s.nama)}</b>
            <div class="tiny muted">${x.l ? `<span style="color:var(--ok-700);font-weight:700">Lunas ${esc(U.bulan(ym))}</span>` : x.tg.belum.length ? `<span style="color:var(--bad-700);font-weight:700">Belum bayar: ${esc(U.daftarBulan(x.tg.belum))}</span>` : 'Belum bayar bulan ini'}${adaDraf ? ' · <span class="chip chip-sm chip-warn">ada draf</span>' : ''}</div></div>
            <button class="btn ${x.l && !x.tg.belum.length ? 'btn-light' : 'btn-primary'} btn-sm" data-catat="${esc(x.s.id)}">${icon('notebook-pen', 'ic-sm')} Catat</button></div>`; }).join('')}</div>` : A.kosong('users', 'Tidak ada siswa', '')}</div>
        <div class="card bk-utama" style="align-self:start"><div class="card-head"><h3>${icon('history')} Draf saya</h3><span class="chip">${tunggu.length} menunggu</span></div>
          ${milik.length ? `<div class="ll-list">${milik.map((x) => { const s = idx[x.siswaId]; return `<div class="ll-item" style="padding:10px 18px"><div class="t"><b>${esc(s ? s.nama : '-')}</b>
              <div class="tiny muted">${esc(U.daftarBulan(String(x.bulan).split(',')))} · <b class="num">${U.rp(+x.total)}</b> · ${esc(U.tgl(String(x.createdAt).slice(0, 10)))}</div>${x.status === 'ditolak' && x.catatan ? `<div class="tiny" style="color:var(--bad-700)">Alasan: ${esc(x.catatan)}</div>` : ''}</div>
              <span class="chip chip-sm ${stCls[x.status] || ''}">${esc({ menunggu: 'Menunggu', disetujui: 'Disetujui', ditolak: 'Ditolak' }[x.status] || x.status)}</span>
              ${x.status === 'menunggu' ? `<button class="btn btn-ghost btn-icon btn-sm" data-batal-draf="${esc(x.id)}" title="Batalkan draf" aria-label="Batalkan draf">${icon('trash-2', 'ic-sm')}</button>` : ''}</div>`; }).join('')}</div>`
            : A.kosong('notebook-pen', 'Belum ada draf', 'Tekan "Catat" pada siswa yang membayar.')}</div></div>`;
    $('#sw-q').oninput = U.debounce((e) => { ui.q = e.target.value; A.refresh(true); const i = $('#sw-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200);
    $$('[data-sw]').forEach((b) => b.onclick = () => { ui.semua = b.dataset.sw === '1'; A.render(); });
    $$('[data-catat]').forEach((b) => b.onclick = () => A.bayarSiswa(R.idx().siswa[b.dataset.catat], null, { mode: 'draf' }));
    $$('[data-batal-draf]').forEach((b) => b.onclick = async () => {
      if (!(await U.confirm({ title: 'Batalkan draf ini?', text: 'Draf dihapus dan tidak dikirim ke admin.', ok: 'Batalkan draf', batal: 'Tidak', danger: true }))) return;
      A.mut((d) => { d.drafSpp = (d.drafSpp || []).filter((x) => x.id !== b.dataset.batalDraf); });
      A.kirim({ op: 'hapusDraf', id: b.dataset.batalDraf, _label: 'Batalkan draf' });
    });
  }
  async function batalLunas(s, ym) {
    if (!(await U.confirm({ title: 'Batalkan pembayaran ' + U.bulan(ym) + '?', text: s.nama + ' akan kembali berstatus belum bayar. Kuitansi ikut dihapus bila tidak mencakup bulan lain.', ok: 'Batalkan lunas', danger: true }))) return;
    const l = R.lunas(s.id, ym);
    A.mut((d) => {
      d.spp = d.spp.filter((x) => !(x.siswaId === s.id && x.bulan === ym));
      if (l && l.kuitansiId && !d.spp.some((x) => x.kuitansiId === l.kuitansiId)) d.kuitansi = d.kuitansi.filter((k) => k.id !== l.kuitansiId);
      delete A.detailCache[s.id];
    });
    A.kirim({ op: 'batalSPP', siswaId: s.id, bulan: ym, _label: 'Batal SPP' });
    U.toast('Pembayaran dibatalkan');
  }
  function ingatkan(s) {
    const tg = R.tunggakan(s);
    const pesan = A.isiTpl('tpl_wa_tunggakan', A.varsSiswa(s, { bulan_tunggakan: U.daftarBulan(tg.belum), total: U.rp(tg.total) }));
    const m = U.modal({ title: 'Pengingat SPP — ' + s.nama, icon: 'message-circle', sub: esc(U.tampilWa(s.wa)), body: `<div class="wa-phone"><div class="wa-bubble" id="ig-msg" contenteditable="true">${esc(pesan)}</div></div><p class="help mt-8">Pesan bisa diubah sebelum dikirim.</p>`,
      foot: `<a class="btn btn-wa" target="_blank" rel="noopener" data-manual>${icon('external-link')} Buka WhatsApp</a><button class="btn btn-primary" data-kirim>${icon('send')} Kirim otomatis</button>` });
    const teks = () => m.$('#ig-msg').innerText;
    m.$('[data-manual]').onclick = (e) => { e.currentTarget.href = U.waLink(s.wa, teks()); m.close(); };
    m.$('[data-kirim]').onclick = async (e) => { const b = e.currentTarget; b.disabled = true; if (await A.kirimWA({ target: s.wa, pesan: teks(), jenis: 'tunggakan', siswaId: s.id, periode: R.m0() })) m.close(); else b.disabled = false; };
  }
  A.aturTarif = () => aturTarif();
  function aturTarif() {
    const tarif = (D().tarif || []).slice().sort((a, b) => b.berlakuMulai.localeCompare(a.berlakuMulai));
    const m = U.modal({
      title: 'Tarif SPP per bulan', icon: 'wallet',
      body: `<p class="small muted mb-12">Tarif berlaku mulai bulan tertentu. Mengubah tarif tidak mengubah tagihan bulan sebelumnya.</p>
        <div class="grid-2"><div class="field"><label>Berlaku mulai</label><input class="input" type="month" id="tf-b" value="${U.ymNow()}"></div><div class="field"><label>Nominal (Rp)</label><input class="input" id="tf-n" inputmode="numeric" placeholder="150000" value="${tarif[0] ? tarif[0].nominal : ''}"></div></div>
        <div class="divider"></div><h4 class="mb-12">Riwayat tarif</h4>${tarif.length ? `<div class="stack-sm">${tarif.map((t) => `<div class="row-gap card soft card-pad" style="padding:10px 14px"><b style="flex:1">${U.bulan(t.berlakuMulai)}</b><span class="num strong">${U.rp(t.nominal)}</span><button class="btn btn-danger-ghost btn-icon btn-xs" data-h="${t.berlakuMulai}" title="Hapus">${icon('trash-2')}</button></div>`).join('')}</div>` : '<p class="small muted">Belum ada tarif.</p>'}`,
      foot: `<button class="btn btn-light" data-n>Tutup</button><button class="btn btn-primary" data-ok>${icon('save')} Simpan tarif</button>`
    });
    m.$('[data-n]').onclick = () => m.close();
    m.$$('[data-h]').forEach((b) => b.onclick = () => { const bm = b.dataset.h; A.mut((d) => { d.tarif = d.tarif.filter((t) => t.berlakuMulai !== bm); }); A.kirim({ op: 'setTarif', berlakuMulai: bm, nominal: 0, hapus: true, _label: 'Hapus tarif' }); m.close(); aturTarif(); });
    m.$('[data-ok]').onclick = () => {
      const b = m.$('#tf-b').value, n = Math.round(+String(m.$('#tf-n').value).replace(/\D/g, ''));
      if (!/^\d{4}-\d{2}$/.test(b) || !n) return U.toast('Isi bulan dan nominal', 'warn');
      A.mut((d) => { d.tarif = d.tarif.filter((t) => t.berlakuMulai !== b).concat([{ berlakuMulai: b, nominal: String(n) }]); });
      A.kirim({ op: 'setTarif', berlakuMulai: b, nominal: n, _label: 'Tarif SPP' });
      U.toast('Tarif ' + U.rp(n) + ' berlaku mulai ' + U.bulan(b)); m.close();
    };
  }
  async function eksporSpp(ym, fmt) {
    const rows = R.siswaTerdaftar().filter((s) => R.lunas(s.id, ym) || R.ditagih(s, ym)).sort((a, b) => a.nama.localeCompare(b.nama));
    const rk = A.ringkasSpp(ym);
    const body = rows.map((s, i) => { const l = R.lunas(s.id, ym); const p = R.prog(s.id) || {}; const kw = l && R.idx().kw[l.kuitansiId]; return [i + 1, s.nama, s.kode, p.program === 'ala' ? 'Ala' : p.program === 'ahe' ? 'Ahe' : '-', p.level || '-', l ? 'Lunas' : 'Belum', l ? U.tgl(l.tglBayar) : '-', kw ? kw.nomor : '-', l ? +l.nominal : R.tarif(ym)]; });
    body.push(['', 'TOTAL LUNAS: ' + U.rp(rk.lunas) + ' · BELUM: ' + U.rp(rk.belum), '', '', '', rk.lunasN + '/' + rk.wajib, '', '', '']);
    const lembar = [{ nama: U.bulan(ym), judul: 'Rekap SPP — ' + U.bulan(ym), head: ['No', 'Nama Siswa', 'Kode', 'Program', 'Lv', 'Status', 'Tgl Bayar', 'No. Kuitansi', 'Nominal'], body }];
    try { if (fmt === 'xlsx') await A.unduhExcel(lembar, 'Rekap-SPP_' + ym); else await A.unduhPdf(lembar, 'Rekap-SPP_' + ym); } catch (e) { U.toast(e.message, 'bad'); }
  }

  // Data kuitansi untuk tampilan & PDF
  A.dataKuitansi = (k) => {
    const s = R.idx().siswa[k.siswaId] || {};
    const p = R.prog(k.siswaId);
    const set = D().settings;
    return { nomor: k.nomor, bulan: String(k.bulan).split(',').filter(Boolean), total: k.total, tglBayar: k.tglBayar, metode: k.metode, penerima: k.penerima || set.kuitansi_penerima,
      siswa: { nama: s.nama || '-', panggilan: s.panggilan, kode: s.kode, ortu: s.ortu }, program: p ? { program: p.program, level: p.level } : null,
      lembaga: { nama_aplikasi: set.nama_aplikasi, nama_lembaga: set.nama_lembaga, nama_unit: set.nama_unit, logo_data: set.logo_data, warna_utama: set.warna_utama, alamat: set.alamat, wa_admin: set.wa_admin, kecamatan: set.kecamatan, desa: set.desa, kepala_unit: set.kepala_unit, ttd_data: set.ttd_data } };
  };
  A.lihatKuitansi = (k) => {
    if (!k) return;
    const s = R.idx().siswa[k.siswaId] || {};
    const link = () => ((D().settings.url_frontend || U.urlBaseFrontend()).replace(/\/+$/, '') + '/#/kuitansi/' + k.token);
    const m = U.modal({
      title: 'Kuitansi SPP', icon: 'receipt', size: 'wide', sub: esc(s.nama || ''), body: `<div data-kw-modal="${k.id}" style="background:var(--bg-public);padding:12px;border-radius:16px" id="kw-isi"></div>`,
      foot: `<button class="btn btn-light" data-salin>${icon('link')} Salin link</button><button class="btn btn-light" data-cetak>${icon('printer')} Cetak</button><button class="btn btn-wa" data-wa>${icon('message-circle')} Kirim WA</button><button class="btn btn-primary" data-pdf>${icon('download')} Unduh PDF</button>`,
      onClose: () => { A._kwModal = null; }
    });
    const gambar = () => { const kk = R.idx().kw[k.id] || k; Object.assign(k, kk); m.$('#kw-isi').innerHTML = Kuitansi.html(A.dataKuitansi(k)); const siap = !!k.nomor; m.$$('[data-pdf],[data-cetak],[data-wa],[data-salin]').forEach((b) => { b.disabled = !siap; }); };
    A._kwModal = { refresh: gambar };
    gambar();
    m.$('[data-pdf]').onclick = async (e) => { const b = e.currentTarget; b.disabled = true; try { await Kuitansi.pdf(A.dataKuitansi(k)); } catch (er) { U.toast(er.message, 'bad'); } b.disabled = false; };
    m.$('[data-cetak]').onclick = () => window.print();
    m.$('[data-salin]').onclick = async () => { if (await U.salin(link())) U.toast('Link kuitansi disalin'); };
    m.$('[data-wa]').onclick = () => {
      if (!s.wa) return U.toast('Nomor WA siswa belum diisi', 'warn');
      const pesan = A.isiTpl('tpl_wa_kuitansi', A.varsSiswa(s, { bulan_tunggakan: U.daftarBulan(String(k.bulan).split(',')), total: U.rp(k.total), link_kuitansi: link() }));
      A.kirimWA({ target: s.wa, pesan, jenis: 'kuitansi', siswaId: s.id, periode: k.nomor });
    };
  };
})();
