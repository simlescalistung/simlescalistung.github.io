/* ==========================================================================
   ADMIN (1/3) — aksi program siswa, Dashboard, Pendaftar, Siswa, Detail, Impor
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, icon } = U;
  const A = App;
  const R = Rules;
  const D = () => A.S.data;

  // ======================================================================
  // AKSI PROGRAM SISWA (dipakai daftar, detail, pendaftar, impor)
  // ======================================================================
  const Aksi = A.aksi = {};
  const salin = (p) => Object.assign({}, p);
  const riw = (s, p, jenis, dari, ke, catatan) => ({ id: U.uid(), siswaId: s.id, programId: p.id, program: p.program, jenis, dari: String(dari), ke: String(ke), tanggal: U.today(), catatan: catatan || '' });
  Aksi.terapkan = (list, label, opsi) => {
    if (!list.length) return 0;
    const rows = list.map((x) => x.p);
    const rw = [].concat(...list.map((x) => x.riw || []));
    A.mut((d) => {
      rows.forEach((r) => {
        r.updatedAt = U.nowIso();
        if (typeof r.siapPiagam !== 'string') r.siapPiagam = JSON.stringify(r.siapPiagam || []);
        const i = d.program.findIndex((p) => p.id === r.id);
        if (i >= 0) d.program[i] = r; else d.program.push(r);
      });
      if (A.detailCache) rw.forEach((r) => { const c = A.detailCache[r.siswaId]; if (c) c.riwayat.push(r); });
    });
    A.kirim(Object.assign({ op: 'program', rows, riwayat: rw, _label: label || 'Perubahan program' }, opsi && opsi.waNaik ? { waNaik: true } : {}));
    return rows.length;
  };
  const tiapProgram = (ids, fn) => {
    const hasil = [], lewati = [];
    ids.forEach((id) => {
      const s = R.idx().siswa[id]; const p0 = R.prog(id);
      if (!s) return;
      const r = fn(s, p0 ? salin(p0) : null);
      if (r) hasil.push(r); else lewati.push(s.nama);
    });
    return { hasil, lewati };
  };
  const laporan = (n, lewati, kerja, alasan) => {
    if (n) U.toast(`${n} siswa ${kerja}`);
    if (lewati.length) U.toast(`${lewati.length} dilewati (${alasan}): ${lewati.slice(0, 3).join(', ')}${lewati.length > 3 ? '…' : ''}`, 'warn', 6000);
  };
  Aksi.setLevel = (ids, lv, program) => {
    const { hasil, lewati } = tiapProgram(ids, (s, p) => {
      if (!p && !program) return null;
      if (!p) { p = { id: s.id + 'p', siswaId: s.id, program, level: 1, status: 'aktif', buku: 'belum', tglMulai: U.today(), tglStatus: U.today(), siapPiagam: '[]' }; }
      if (program && p.program !== program) return null;
      if (lv < 1 || lv > R.MAKS[p.program]) return null;
      const dari = p.level; p.level = String(lv);
      if (String(dari) !== String(lv)) p.buku = 'belum';
      return { p, riw: [riw(s, p, 'set', dari, lv, 'Level ditetapkan')] };
    });
    laporan(Aksi.terapkan(hasil, 'Tetapkan level'), lewati, 'ditetapkan ke Level ' + lv, 'level di luar rentang program');
  };
  // Naik 1 level — selalu dengan jendela konfirmasi (Iya / Tidak)
  Aksi.naik = async (ids) => {
    const { hasil, lewati } = tiapProgram(ids, (s, p) => {
      if (!p || p.status !== 'aktif' || +p.level >= R.MAKS[p.program]) return null;
      const dari = +p.level; p.level = String(dari + 1); p.buku = 'belum';
      return { p, s, dari, riw: [riw(s, p, 'naik', dari, dari + 1)] };
    });
    if (!hasil.length) { laporan(0, lewati, 'naik 1 level', 'tidak aktif / sudah level akhir — gunakan Tuntaskan'); return 0; }
    const baris = (x) => `<b>${esc(x.s.nama)}</b> · ${esc(R.SINGKAT[x.p.program])} Level ${x.dari} → <b>Level ${x.dari + 1}</b>${x.p.program === 'ala' && x.dari === 6 ? ' <span class="chip chip-sm chip-ala">mulai Kali-Bagi</span>' : ''}`;
    const teks = hasil.length === 1
      ? `${esc(hasil[0].s.nama)} akan dinaikkan dari <b>${esc(R.LABEL[hasil[0].p.program])} Level ${hasil[0].dari}</b> ke <b>Level ${hasil[0].dari + 1}</b>.<br><span class="small muted">Status buku otomatis menjadi "belum punya buku" untuk level baru.</span>`
      : `<div class="stack-sm mt-8">${hasil.slice(0, 6).map((x) => `<div class="small">${baris(x)}</div>`).join('')}${hasil.length > 6 ? `<div class="small muted">+ ${hasil.length - 6} siswa lainnya</div>` : ''}</div>${lewati.length ? `<p class="small muted mt-8">${lewati.length} siswa dilewati (tidak aktif / sudah level akhir).</p>` : ''}`;
    const adaWa = hasil.filter((x) => x.s.wa).length, tplOn = A.tplAktif('tpl_wa_naik_level');
    const cek = { label: tplOn ? `Kirim WhatsApp ucapan naik level ke orang tua <span class="muted">(${adaWa} dari ${hasil.length} punya nomor WA)</span>` : 'Kirim WhatsApp ke orang tua <span class="muted">(template "Naik Level" sedang dinonaktifkan)</span>', checked: tplOn && adaWa > 0, disabled: !tplOn || !adaWa };
    const ok = await U.confirm({ title: hasil.length === 1 ? `Naikkan ke Level ${hasil[0].dari + 1}?` : `Naikkan ${hasil.length} siswa 1 level?`, text: teks, ok: 'Iya, naikkan', batal: 'Tidak', cek });
    if (!ok) return 0;
    const n = Aksi.terapkan(hasil, 'Naik level', { waNaik: cek.nilai });
    if (cek.nilai) U.toast('WhatsApp naik level dikirim ke ' + adaWa + ' orang tua', 'info');
    laporan(n, lewati, hasil.length === 1 ? 'naik ke Level ' + (hasil[0].dari + 1) : 'naik 1 level', 'tidak aktif / sudah level akhir — gunakan Tuntaskan');
    return n;
  };
  Aksi.buku = (ids, v) => {
    const { hasil, lewati } = tiapProgram(ids, (s, p) => { if (!p || p.buku === v) return null; p.buku = v; return { p }; });
    laporan(Aksi.terapkan(hasil, 'Status buku'), lewati, v === 'ya' ? 'ditandai sudah punya buku' : 'ditandai belum punya buku', 'tanpa program / sudah sama');
  };
  Aksi.status = (ids, st) => {
    const { hasil, lewati } = tiapProgram(ids, (s, p) => {
      if (!p || p.status === st || p.status === 'lulus') return null;
      const dari = p.status; p.status = st; p.tglStatus = U.today();
      return { p, riw: [riw(s, p, 'status', dari, st, st === 'rehat' ? 'Ditandai rehat' : 'Aktif kembali tanpa daftar ulang')] };
    });
    laporan(Aksi.terapkan(hasil, st === 'rehat' ? 'Rehat' : 'Aktifkan kembali'), lewati, st === 'rehat' ? 'ditandai rehat' : 'aktif kembali', 'status sudah sama / lulus');
  };
  Aksi.tuntas = (ids) => {
    const { hasil, lewati } = tiapProgram(ids, (s, p) => {
      if (!p || p.status !== 'aktif') return null;
      const siap = R.siap(p); const lv = +p.level;
      if (p.program === 'ahe' && lv === 7) {
        p.status = 'lulus'; p.tglStatus = U.today(); if (!siap.includes('ahe')) siap.push('ahe'); p.siapPiagam = siap;
        return { p, riw: [riw(s, p, 'tuntas', 7, 'lulus', 'Lulus Les Baca (Ahe) Level 7')] };
      }
      if (p.program === 'ala' && lv === 6) {
        if (!siap.includes('tambahKurang')) siap.push('tambahKurang'); p.siapPiagam = siap; p.level = '7'; p.buku = 'belum';
        return { p, riw: [riw(s, p, 'tuntas', 6, 7, 'Tuntas Pertambahan & Pengurangan, lanjut Perkalian & Pembagian')] };
      }
      if (p.program === 'ala' && lv === 16) {
        p.status = 'lulus'; p.tglStatus = U.today(); if (!siap.includes('kaliBagi')) siap.push('kaliBagi'); p.siapPiagam = siap;
        return { p, riw: [riw(s, p, 'tuntas', 16, 'lulus', 'Lulus Les Berhitung (Ala) Level 16')] };
      }
      return null;
    });
    laporan(Aksi.terapkan(hasil, 'Tuntaskan'), lewati, 'dituntaskan & masuk daftar Siap Piagam', 'bukan di level akhir: Baca 7, Berhitung 6 atau 16');
  };
  Aksi.lanjutAla = (ids, lv) => {
    const { hasil, lewati } = tiapProgram(ids, (s) => {
      const ps = R.programs(s.id);
      if (ps.some((p) => p.status === 'aktif' || p.status === 'rehat') || ps.some((p) => p.program === 'ala')) return null;
      const p = { id: s.id + 'a', siswaId: s.id, program: 'ala', level: String(lv || 1), status: 'aktif', buku: 'belum', tglMulai: U.today(), tglStatus: U.today(), siapPiagam: '[]' };
      return { p, riw: [riw(s, p, 'lanjut', 'ahe', 'ala', 'Lanjut ke Les Berhitung tanpa daftar ulang')] };
    });
    laporan(Aksi.terapkan(hasil, 'Lanjut Berhitung'), lewati, 'dilanjutkan ke Les Berhitung', 'masih aktif / sudah punya program Berhitung');
  };
  Aksi.pilihLevel = async (judul, program) => {
    const opsi = (pr) => Array.from({ length: R.MAKS[pr] }, (_, i) => `<option value="${pr}:${i + 1}">${R.SINGKAT[pr]} · Level ${i + 1}${pr === 'ala' ? ' · ' + (i < 6 ? 'Tambah-Kurang' : 'Kali-Bagi') : ''}</option>`).join('');
    const v = await U.prompt({ title: judul || 'Tetapkan level', icon: 'list', label: 'Pilih level', input: `<select class="input" data-v>${!program || program === 'ahe' ? opsi('ahe') : ''}${!program || program === 'ala' ? opsi('ala') : ''}</select>`, help: 'Siswa yang levelnya berubah otomatis ditandai <b>belum punya buku</b> untuk level baru.', ok: 'Tetapkan' });
    if (!v) return null;
    const [pr, lv] = v.split(':');
    return { program: pr, level: +lv };
  };

  // Pengiriman WA langsung (Fonnte) dengan cadangan wa.me
  A.tplAktif = (key) => !String((D().settings || {}).tpl_nonaktif || '').split(',').includes(key);
  A.isiTpl = (key, vars) => { let t = String((D().settings || {})[key] || ''); const o = String((vars || {}).ortu || '').trim(); if (vars && vars.ortu !== undefined && (!o || o === 'Bapak/Ibu' || /^(bapak|bpk|ibu|bu|pak|ayah|bunda|mama|papa|hj|h)\b\.?/i.test(o))) t = t.replace(/Bapak\/Ibu\s+\{ortu\}/gi, '{ortu}'); return t.replace(/\{([a-z_]+)\}/g, (m, k) => vars[k] !== undefined ? vars[k] : m); };
  A.varsSiswa = (s, extra) => {
    const set = D().settings || {}; const p = R.prog(s.id);
    return Object.assign({ lembaga: set.nama_lembaga || set.nama_aplikasi || '', nama: s.nama || '', panggilan: s.panggilan || s.nama || '', ortu: s.ortu || 'Bapak/Ibu', program: p ? R.LABEL[p.program] : 'Les', kode: s.kode || '', wa: s.wa || '', wa_admin: set.wa_admin ? '+' + set.wa_admin : '' }, extra || {});
  };
  A.kirimWA = async (o) => {
    try {
      await U.api('kirimWA', { token: A.S.token, target: o.target, pesan: o.pesan, jenis: o.jenis || 'manual', siswaId: o.siswaId || '', periode: o.periode || '' }, { timeout: 30000 });
      U.toast('Pesan WhatsApp terkirim');
      A.segarkanLog();
      return true;
    } catch (e) {
      const m = U.modal({
        title: 'WA otomatis gagal', icon: 'triangle-alert', iconCls: 'bad', body: `<p>${esc(e.message)}</p><p class="small muted mt-8">Anda tetap bisa mengirim manual: WhatsApp akan terbuka dengan pesan yang sudah terisi.</p>`,
        foot: `<button class="btn btn-light" data-n>Tutup</button><a class="btn btn-wa" target="_blank" rel="noopener" href="${U.waLink(o.target, o.pesan)}" data-o>${icon('message-circle')} Buka di WhatsApp</a>`
      });
      m.$('[data-n]').onclick = () => m.close(); m.$('[data-o]').onclick = () => m.close();
      return false;
    }
  };
  A.segarkanLog = U.debounce(() => A.segarkan(), 1500);

  // ======================================================================
  // DASHBOARD
  // ======================================================================
  let charts = [];
  A.page('dashboard', {
    title: 'Dashboard', crumb: 'Dashboard',
    render(view) {
      const d = D(), set = d.settings;
      const ui = A.ui.dash = A.ui.dash || { dari: U.ymNow(), sampai: U.ymNow() };
      if (!ui.dari) { ui.dari = ui.sampai = ui.ym || U.ymNow(); }
      const satu = ui.dari === ui.sampai;
      const siswa = R.siswaTerdaftar();
      const per = { aktif: [], rehat: [], lulus: [] };
      siswa.forEach((s) => { const st = R.status(s.id); if (per[st]) per[st].push(s); });
      const aktifAhe = per.aktif.filter((s) => R.prog(s.id).program === 'ahe').length;
      const guruAktif = (d.guru || []).filter((g) => !g.tglKeluar || g.tglKeluar > U.today());
      const menunggu = (d.siswa || []).filter((s) => s.statusDaftar === 'menunggu').length;
      const sppB = A.ringkasSppRentang(ui.dari, ui.sampai);
      const pr = R.peringatan();
      const persen = sppB.wajib ? Math.round(sppB.lunasN / sppB.wajib * 100) : 0;
      view.innerHTML = `<div class="page-head"><div><h1>Ringkasan Les</h1><p>${esc(set.nama_lembaga || '')} · ${esc(U.tglHari(U.today()))}</p></div>
        <div class="actions">${U.tombolPeriode('dash-per', ui.dari, ui.sampai)}
        <button class="btn btn-light btn-sm" id="dash-sync">${icon('refresh-cw')} Sinkronkan</button></div></div>
        <div class="stats six">
          <a class="card stat" href="#/siswa?st=aktif"><div class="top"><span class="lbl">Siswa aktif</span><span class="icon-dot sm">${icon('graduation-cap')}</span></div><div class="val num">${per.aktif.length}</div><div class="sub">Baca ${aktifAhe} · Berhitung ${per.aktif.length - aktifAhe}</div><div class="bar"><i style="width:${per.aktif.length ? aktifAhe / per.aktif.length * 100 : 0}%"></i></div></a>
          <a class="card stat" href="#/siswa?st=rehat"><div class="top"><span class="lbl">Rehat</span><span class="icon-dot sm neu">${icon('circle-pause')}</span></div><div class="val num">${per.rehat.length}</div><div class="sub">Bisa diaktifkan kapan saja</div></a>
          <a class="card stat" href="#/siswa?st=lulus"><div class="top"><span class="lbl">Lulus</span><span class="icon-dot sm sun">${icon('award')}</span></div><div class="val num">${per.lulus.length}</div><div class="sub">Total alumni berpiagam</div></a>
          <a class="card stat" href="#/guru"><div class="top"><span class="lbl">Guru aktif</span><span class="icon-dot sm ala">${icon('users')}</span></div><div class="val num">${guruAktif.length}</div><div class="sub">${(d.hadirGuru || []).filter((h) => h.tanggal === U.today()).length} hadir hari ini</div></a>
          <a class="card stat ${menunggu ? 'hl' : ''}" href="#/pendaftar"><div class="top"><span class="lbl">Pendaftar menunggu</span><span class="icon-dot sm acc">${icon('user-plus')}</span></div><div class="val num">${menunggu}</div><div class="sub">${menunggu ? 'Perlu ditinjau' : 'Semua sudah diproses'}</div></a>
          <a class="card stat" href="#/spp/${satu ? ui.dari : ui.dari + '_' + ui.sampai}"><div class="top"><span class="lbl">SPP ${esc(satu ? U.bln(ui.dari) : U.labelPeriode(ui.dari, ui.sampai))}</span><span class="icon-dot sm ok">${icon('banknote')}</span></div><div class="val sm num">${U.rp(sppB.lunas)}</div><div class="sub">${persen}% lunas · belum ${U.rp(sppB.belum)}</div><div class="bar ok"><i style="width:${persen}%"></i></div></a>
        </div>
        <div class="card mt-16"><div class="card-head"><h3><span class="dot" style="color:var(--bad)"></span> Peringatan Otomatis</h3><span class="small muted">${icon('clock', 'ic-sm')} Dicek setiap hari pukul 07.00 WITA · tampilan diperbarui seketika</span></div>
          <div class="card-body"><div class="alerts">
            ${kartuPeringatan('bad', 'wallet', 'Tunggakan SPP 2 Bulan', pr.tunggakan.length, pr.tunggakan.slice(0, 3).map((x) => x.s.nama).join(', ') || 'Tidak ada tunggakan', '#/spp?f=tunggak', 'Lihat & ingatkan')}
            ${kartuPeringatan('', 'clock', 'Tidak Masuk > 2 Minggu', pr.absen.length, pr.absen.slice(0, 3).map((x) => x.s.nama + ' (' + x.a.hari + ' hr)').join(', ') || 'Semua siswa rutin hadir', '#/siswa?f=absen', 'Tandai rehat')}
            ${kartuPeringatan('', 'book-open', 'Belum Punya Buku', pr.buku.length, pr.buku.length ? 'Siswa aktif yang belum memiliki buku level saat ini' : 'Semua siswa sudah punya buku', '#/siswa?f=buku', 'Perbarui buku')}
            ${kartuPeringatan('lulus', 'award', 'Siap Dibuatkan Piagam', pr.piagam.length, pr.piagam.slice(0, 3).map((x) => x.s.nama).join(', ') || 'Belum ada yang tuntas', '#/piagam', 'Buat piagam')}
            ${kartuPeringatan('bad', 'message-circle', 'WA Gagal Terkirim', pr.waGagal.length, pr.waGagal.length ? 'Periksa koneksi Fonnte lalu kirim ulang' : 'Semua pesan terkirim', '#/pengaturan/wa', 'Lihat riwayat')}
          </div></div></div>
        <div class="charts mt-16">
          <div class="card"><div class="card-head"><h3>${icon('chart-column')} Siswa Aktif per Level</h3><div class="legend"><span><i style="background:var(--p)"></i>Baca (Ahe)</span><span><i style="background:var(--ala)"></i>Berhitung (Ala)</span></div></div><div class="card-body"><div class="chart-box"><canvas id="ch-level"></canvas></div></div></div>
          <div class="card"><div class="card-head"><h3>${icon('trending-up')} Pendaftar Baru per Bulan</h3><span class="small muted">12 bulan terakhir</span></div><div class="card-body"><div class="chart-box"><canvas id="ch-daftar"></canvas></div></div></div>
          <div class="card"><div class="card-head"><h3>${icon('banknote')} Pendapatan SPP per Bulan</h3><div class="legend"><span><i style="background:#16A34A"></i>Lunas</span><span><i style="background:#FCA5A5"></i>Belum</span></div></div><div class="card-body"><div class="chart-box"><canvas id="ch-spp"></canvas></div></div></div>
          <div class="card"><div class="card-head"><h3>${icon('calendar-check')} Hari Mengajar per Guru</h3><div class="legend"><span><i style="background:var(--p)"></i>Reguler</span><span><i style="background:var(--sun)"></i>&gt; ${+set.ambang_siswa_banyak || 10} siswa</span></div></div><div class="card-body" id="hb-guru">${A.kosong('loader-circle', 'Memuat…')}</div></div>
        </div>`;
      $('#dash-per').onclick = async () => {
        const r = await U.pilihPeriode({ dari: ui.dari, sampai: ui.sampai, max: U.ymNow().slice(0, 4) + '-12', min: '2020-01' }); if (!r) return;
        ui.dari = r.dari; ui.sampai = r.sampai;
        try { if (await A.pastikanSpp(ui.dari)) U.toast('Data SPP lama dimuat', 'info'); } catch (e) { U.toast(e.message, 'bad'); }
        A.render();
      };
      $('#dash-sync').onclick = () => { U.toast('Menyinkronkan data…', 'info'); A.segarkan(); };
      hariMengajar(ui.dari, ui.sampai);
      grafik();
    }
  });
  function kartuPeringatan(cls, ic, judul, n, teks, href, aksi) {
    return `<a class="alert-card ${cls} ${n ? '' : 'zero'}" href="${href}"><div class="t"><span class="icon-dot sm ${cls === 'bad' ? 'bad' : cls === 'lulus' ? '' : 'acc'}">${icon(ic)}</span><span class="chip ${n ? (cls === 'bad' ? 'chip-bad' : cls === 'lulus' ? 'chip-ahe' : 'chip-warn') : 'chip-ok'}">${n} ${ic === 'message-circle' ? 'pesan' : 'siswa'}</span></div>
      <h4>${judul}</h4><p>${esc(teks)}</p><span class="go">${aksi} ${icon('arrow-right', 'ic-sm')}</span></a>`;
  }
  function ringkasSpp(ym) {
    let lunas = 0, lunasN = 0, belum = 0, wajib = 0;
    const tar = R.tarif(ym);
    R.siswaTerdaftar().forEach((s) => {
      const l = R.lunas(s.id, ym);
      if (l) { lunas += +l.nominal || 0; lunasN++; wajib++; }
      else if (R.ditagih(s, ym)) { belum += tar; wajib++; }
    });
    return { lunas, lunasN, belum, wajib };
  }
  A.ringkasSpp = ringkasSpp;
  A.ringkasSppRentang = (dari, sampai) => {
    const t = { lunas: 0, lunasN: 0, belum: 0, wajib: 0 };
    for (let b = dari; b <= sampai; b = U.addMonths(b, 1)) { const r = ringkasSpp(b); t.lunas += r.lunas; t.lunasN += r.lunasN; t.belum += r.belum; t.wajib += r.wajib; }
    return t;
  };
  // Data SPP lokal hanya ±13 bulan terakhir; bulan lebih lama diambil dari server bila diperlukan
  A.pastikanSpp = async (dari) => {
    const lokalMin = U.addMonths(U.ymNow(), -13);
    if (dari >= lokalMin || (A._sppDari && A._sppDari <= dari)) return false;
    const sampai = U.addMonths(lokalMin, -1);
    const r = await U.api('getRekap', { token: A.S.token, dari, sampai: sampai < dari ? dari : sampai, hanya: 'spp' });
    A.mut((dd) => {
      const ada = new Set(dd.spp.map((x) => x.id)); (r.spp || []).forEach((x) => { if (!ada.has(x.id)) dd.spp.push(x); });
      const adaK = new Set(dd.kuitansi.map((x) => x.id)); (r.kuitansi || []).forEach((x) => { if (!adaK.has(x.id)) dd.kuitansi.push(x); });
    }, { render: false });
    A._sppDari = dari;
    return true;
  };
  async function hariMengajar(dari, sampai) {
    const el = $('#hb-guru');
    sampai = sampai || dari;
    const ym = dari;
    let rows;
    if (dari === sampai && dari === D().hadirBulan) rows = D().hadirGuru || [];
    else { try { rows = (await A.ambilRekap(dari, sampai > U.ymNow() ? U.ymNow() : sampai)).hadirGuru; } catch (e) { el.innerHTML = A.kosong('cloud-off', 'Tidak dapat memuat', esc(e.message)); return; } }
    if (!$('#hb-guru')) return;
    const ambang = +D().settings.ambang_siswa_banyak || 10;
    let hl = 0; for (let b = dari; b <= sampai; b = U.addMonths(b, 1)) hl += R.hariLesBulan(b).length; hl = hl || 20;
    const per = {};
    rows.forEach((r) => { const x = per[r.guruId] = per[r.guruId] || { nama: r.namaGuru, n: 0, banyak: 0 }; x.n++; if (+r.jumlahSiswa > ambang) x.banyak++; });
    (D().guru || []).forEach((g) => { if (!per[g.id] && (!g.tglKeluar || g.tglKeluar > ym + '-01')) per[g.id] = { nama: g.panggilan || g.nama, n: 0, banyak: 0 }; if (per[g.id]) per[g.id].nama = g.panggilan || g.nama; });
    const list = Object.values(per).sort((a, b) => b.n - a.n);
    el.innerHTML = list.length ? `<div class="hbar">${list.map((x, i) => `<div class="row"><div class="lab"><b>${i + 1}. ${esc(x.nama)}</b><span class="muted">${x.n} hari${x.banyak ? ` · <b style="color:var(--accent-700)">${x.banyak} hari &gt;${ambang} siswa</b>` : ''}</span></div>
      <div class="track"><i style="width:${(x.n - x.banyak) / hl * 100}%;background:var(--p)"></i><i style="width:${x.banyak / hl * 100}%;background:var(--sun)"></i></div></div>`).join('')}
      <p class="tiny muted">Dari ${hl} hari les · ${esc(U.labelPeriode(dari, sampai))} · <a href="#/kehadiran/hari">Lihat jumlah siswa per guru per hari ${icon('arrow-right', 'ic-sm')}</a></p></div>` : A.kosong('users', 'Belum ada data guru', '', '<a class="btn btn-soft btn-sm" href="#/guru">Tambah guru</a>');
  }
  let genGrafik = 0;
  async function grafik() {
    const gen = ++genGrafik;
    charts.forEach((c) => c.destroy()); charts = [];
    let Chart;
    try { Chart = await U.lib.chart(); } catch (e) { $$('.chart-box').forEach((b) => { b.innerHTML = A.kosong('cloud-off', 'Grafik tidak dapat dimuat', 'Periksa koneksi internet.'); }); return; }
    if (gen !== genGrafik || !$('#ch-level')) return;
    ['#ch-level', '#ch-daftar', '#ch-spp'].forEach((s) => { const c = Chart.getChart($(s)); if (c) c.destroy(); });
    const css = getComputedStyle(document.documentElement);
    const P = css.getPropertyValue('--p').trim(), ALA = '#0F8B8D';
    Chart.defaults.font.family = 'Inter, system-ui, sans-serif'; Chart.defaults.color = '#6B5F78';
    const opsi = (extra) => Object.assign({ responsive: true, maintainAspectRatio: false, animation: { duration: 350 }, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#2B1B3D', padding: 10, cornerRadius: 10 } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#F1EADB' }, ticks: { precision: 0 } } } }, extra || {});
    const aktif = R.siswaTerdaftar().map((s) => R.prog(s.id)).filter((p) => p && p.status === 'aktif');
    const lv = Array.from({ length: 16 }, (_, i) => i + 1);
    charts.push(new Chart($('#ch-level'), { type: 'bar', data: { labels: lv.map((x) => 'L' + x), datasets: [
      { label: 'Baca', data: lv.map((x) => x <= 7 ? aktif.filter((p) => p.program === 'ahe' && +p.level === x).length : null), backgroundColor: P, borderRadius: 6 },
      { label: 'Berhitung', data: lv.map((x) => aktif.filter((p) => p.program === 'ala' && +p.level === x).length), backgroundColor: ALA, borderRadius: 6 }] }, options: opsi() }));
    const bln = []; for (let i = 11; i >= 0; i--) bln.push(U.addMonths(U.ymNow(), -i));
    const daftar = bln.map((b) => (D().siswa || []).filter((s) => s.sumber !== 'impor' && String(s.createdAt).slice(0, 7) === b).length);
    charts.push(new Chart($('#ch-daftar'), { type: 'line', data: { labels: bln.map(U.bln), datasets: [{ data: daftar, borderColor: P, backgroundColor: P + '22', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#fff', pointBorderWidth: 2 }] }, options: opsi() }));
    const sp = bln.map(ringkasSpp);
    charts.push(new Chart($('#ch-spp'), { type: 'bar', data: { labels: bln.map(U.bln), datasets: [
      { label: 'Lunas', data: sp.map((x) => x.lunas), backgroundColor: '#16A34A', borderRadius: 4, stack: 's' },
      { label: 'Belum', data: sp.map((x) => x.belum), backgroundColor: '#FCA5A5', borderRadius: 4, stack: 's' }] },
      options: opsi({ scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, grid: { color: '#F1EADB' }, ticks: { callback: (v) => v >= 1e6 ? (v / 1e6) + 'jt' : v >= 1e3 ? (v / 1e3) + 'rb' : v } } },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.dataset.label + ': ' + U.rp(c.raw) } } } }) }));
  }

  // Data rekap bulan lalu (dimuat dari server sekali, disimpan di memori)
  A.rekapCache = {};
  A.ambilRekap = async (dari, sampai) => {
    const butuh = [];
    for (let b = dari; b <= sampai; b = U.addMonths(b, 1)) if (b !== D().hadirBulan && !A.rekapCache[b]) butuh.push(b);
    if (butuh.length) {
      const r = await U.api('getRekap', { token: A.S.token, dari: butuh[0], sampai: butuh[butuh.length - 1] });
      r.bulan.forEach((b) => { if (b !== D().hadirBulan) A.rekapCache[b] = { hadirGuru: r.hadirGuru.filter((x) => x.tanggal.slice(0, 7) === b), hadirSiswa: r.hadirSiswa.filter((x) => x[0].slice(0, 7) === b), spp: r.spp.filter((x) => x.bulan === b) }; });
    }
    const out = { hadirGuru: [], hadirSiswa: [] };
    for (let b = dari; b <= sampai; b = U.addMonths(b, 1)) {
      const src = b === D().hadirBulan ? { hadirGuru: D().hadirGuru || [], hadirSiswa: D().hadirSiswa || [] } : A.rekapCache[b] || { hadirGuru: [], hadirSiswa: [] };
      out.hadirGuru = out.hadirGuru.concat(src.hadirGuru); out.hadirSiswa = out.hadirSiswa.concat(src.hadirSiswa);
    }
    return out;
  };

  // ======================================================================
  // PENDAFTAR BARU
  // ======================================================================
  A.page('pendaftar', {
    title: 'Pendaftar Baru', crumb: 'Pendaftar Baru',
    render(view) {
      const d = D(), set = d.settings;
      const ui = A.ui.pend = A.ui.pend || { tab: 'menunggu', q: '', sel: new Set() };
      const semua = (d.siswa || []).filter((s) => s.sumber === 'formulir');
      const jml = { menunggu: 0, diterima: 0, ditolak: 0 };
      semua.forEach((s) => { jml[s.statusDaftar] = (jml[s.statusDaftar] || 0) + 1; });
      const q = ui.q.toLowerCase();
      const rows = semua.filter((s) => s.statusDaftar === ui.tab && (!q || [s.nama, s.kode, s.ortu, s.wa].join(' ').toLowerCase().includes(q)))
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      ui.sel = new Set(Array.from(ui.sel).filter((id) => rows.some((r) => r.id === id)));
      const buka = set.pendaftaran_buka === 'ya';
      const link = U.urlBaseFrontend() + '#/daftar';
      view.innerHTML = `<div class="page-head"><div><h1>Pendaftar Baru</h1><p>Tinjau pendaftar dari formulir online, tetapkan level awal, lalu aktifkan.</p></div>
        <div class="actions"><span class="chip ${buka ? 'chip-ok' : 'chip-bad'}" style="height:40px;padding:0 14px"><span class="dot"></span>Pendaftaran: ${buka ? 'Dibuka' : 'Ditutup'}</span>
          <button class="btn btn-light btn-sm" id="p-toggle">${icon(buka ? 'circle-pause' : 'play')} ${buka ? 'Tutup' : 'Buka'} Pendaftaran</button>
          <button class="btn btn-light btn-sm" id="p-link">${icon('link')} Salin Link</button><button class="btn btn-light btn-sm" id="p-qr">${icon('qr-code')} Kode QR</button></div></div>
        <div class="row-gap mb-12"><div class="tabs">${[['menunggu', 'Menunggu'], ['diterima', 'Diterima'], ['ditolak', 'Ditolak']].map(([k, l]) => `<button class="tab ${ui.tab === k ? 'on' : ''}" data-tab="${k}">${l} <span class="n">${jml[k] || 0}</span></button>`).join('')}</div>
          <div class="input-icon spacer" style="min-width:220px">${icon('search')}<input class="input" id="p-q" placeholder="Cari nama, kode, orang tua, WA…" value="${esc(ui.q)}" style="min-height:42px"></div></div>
        <div class="card">${rows.length ? `<div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr>${ui.tab === 'menunggu' ? `<th class="w-check">${A.cek('data-all', ui.sel.size && ui.sel.size === rows.length)}</th>` : ''}<th>Kode</th><th>Calon siswa</th><th>Program</th><th>Orang tua / WA</th><th>Tgl daftar</th><th class="t-right">Aksi</th></tr></thead><tbody>
          ${rows.map((s) => { const pm = (R.idx().progSiswa[s.id] || [])[0]; return `<tr class="${ui.sel.has(s.id) ? 'sel' : ''}">
            ${ui.tab === 'menunggu' ? `<td class="w-check">${A.cek(`data-sel="${s.id}"`, ui.sel.has(s.id))}</td>` : ''}
            <td class="hide-m"><b class="num">${esc(s.kode)}</b>${ui.tab === 'menunggu' ? ' <span class="chip chip-info chip-sm">Baru</span>' : ''}</td>
            <td class="t-main"><div class="person">${U.avatar(s.nama, s.id)}<div><div class="t-name">${esc(s.nama)} ${s.panggilan ? `<span class="muted small">(${esc(s.panggilan)})</span>` : ''}</div><div class="t-sub">${esc([s.kelas, s.sekolah].filter(Boolean).join(' · '))} · <span class="m-only num">${esc(s.kode)}</span></div></div></div></td>
            <td data-l="Program">${A.chipProg(pm ? { program: pm.program } : null)}</td>
            <td data-l="Orang tua">${esc(s.ortu)}<div class="t-sub num">${esc(U.tampilWa(s.wa))}</div></td>
            <td data-l="Daftar" class="nowrap">${esc(U.tgl(String(s.createdAt).slice(0, 10)))}<div class="t-sub">${esc(String(s.createdAt).slice(11, 16))} WITA</div></td>
            <td class="t-actions t-right"><div class="row-gap" style="justify-content:flex-end">
              ${ui.tab === 'menunggu' ? `<button class="btn btn-primary btn-sm" data-terima="${s.id}">Terima</button><button class="btn btn-light btn-sm" data-tolak="${s.id}">Tolak</button>` : `<button class="btn btn-light btn-sm" data-lihat="${s.id}">${icon('eye')} Lihat</button>`}
              <a class="btn btn-wa btn-icon btn-sm" target="_blank" rel="noopener" href="${U.waLink(s.wa)}" title="Hubungi via WA">${icon('message-circle')}</a></div></td></tr>`; }).join('')}
          </tbody></table></div>` : A.kosong('user-plus', ui.tab === 'menunggu' ? 'Tidak ada pendaftar menunggu' : 'Belum ada data', ui.tab === 'menunggu' ? 'Bagikan link formulir agar orang tua bisa mendaftar lewat HP.' : '', ui.tab === 'menunggu' ? `<button class="btn btn-soft" data-link2>${icon('link')} Salin link formulir</button>` : '')}</div>
        ${ui.sel.size ? `<div class="bulk"><span class="n">${icon('circle-check')} ${ui.sel.size} dipilih</span><div class="acts">
          <button class="btn hl" data-bulk-terima>${icon('check')} Terima massal (level sama)</button><button class="btn" data-bulk-tolak>${icon('x')} Tolak terpilih</button></div>
          <button class="btn x btn-icon" data-clear aria-label="Batalkan pilihan">${icon('x')}</button></div>` : ''}`;
      const salinLink = async () => { if (await U.salin(link)) U.toast('Link formulir disalin: ' + link); };
      $('#p-link').onclick = salinLink; const l2 = $('[data-link2]'); if (l2) l2.onclick = salinLink;
      $('#p-qr').onclick = () => {
        const src = 'https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=10&data=' + encodeURIComponent(link);
        const m = U.modal({ title: 'Kode QR Formulir Pendaftaran', icon: 'qr-code', body: `<div style="text-align:center"><img src="${src}" alt="Kode QR" style="width:260px;margin:0 auto;border-radius:12px;border:1px solid var(--line)"><p class="small muted mt-12" style="word-break:break-all">${esc(link)}</p></div>`, foot: `<button class="btn btn-light" data-n>Tutup</button><a class="btn btn-primary" href="${src}" target="_blank" rel="noopener" download="QR-Pendaftaran.png">${icon('download')} Unduh QR</a>` });
        m.$('[data-n]').onclick = () => m.close();
      };
      $('#p-toggle').onclick = async () => {
        if (buka && !(await U.confirm({ title: 'Tutup pendaftaran?', text: 'Link formulir akan menampilkan pesan bahwa pendaftaran ditutup, dan tombol Daftar di landing page disembunyikan.', ok: 'Tutup pendaftaran' }))) return;
        A.mut((dd) => { dd.settings.pendaftaran_buka = buka ? 'tidak' : 'ya'; });
        A.kirim({ op: 'saveSetting', key: 'pendaftaran_buka', value: buka ? 'tidak' : 'ya', _label: 'Status pendaftaran' });
        U.toast(buka ? 'Pendaftaran ditutup' : 'Pendaftaran dibuka');
      };
      $$('[data-tab]').forEach((b) => b.onclick = () => { ui.tab = b.dataset.tab; ui.sel.clear(); A.render(); });
      $('#p-q').oninput = U.debounce((e) => { ui.q = e.target.value; A.refresh(true); setTimeout(() => { const i = $('#p-q'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }); }, 250);
      $$('[data-sel]').forEach((c) => c.onchange = () => { c.checked ? ui.sel.add(c.dataset.sel) : ui.sel.delete(c.dataset.sel); A.render(); });
      const all = $('[data-all]'); if (all) all.onchange = () => { ui.sel = all.checked ? new Set(rows.map((r) => r.id)) : new Set(); A.render(); };
      $$('[data-terima]').forEach((b) => b.onclick = () => drawerTerima(R.idx().siswa[b.dataset.terima]));
      $$('[data-tolak]').forEach((b) => b.onclick = () => tolak([b.dataset.tolak]));
      $$('[data-lihat]').forEach((b) => b.onclick = () => drawerTerima(R.idx().siswa[b.dataset.lihat], true));
      const bt = $('[data-bulk-terima]'); if (bt) bt.onclick = async () => {
        const lv = await Aksi.pilihLevel('Terima ' + ui.sel.size + ' pendaftar');
        if (!lv) return;
        Array.from(ui.sel).forEach((id) => terima(R.idx().siswa[id], lv.program, lv.level, 'belum', true));
        U.toast(ui.sel.size + ' pendaftar diterima & diaktifkan'); ui.sel.clear(); A.render();
      };
      const btl = $('[data-bulk-tolak]'); if (btl) btl.onclick = () => tolak(Array.from(ui.sel));
      const cl = $('[data-clear]'); if (cl) cl.onclick = () => { ui.sel.clear(); A.render(); };
    }
  });
  function terima(s, program, level, buku, kirimWA) {
    const pm = (R.idx().progSiswa[s.id] || [])[0];
    const p = { id: pm ? pm.id : s.id + 'p', siswaId: s.id, program, level: String(level), status: 'aktif', buku: buku || 'belum', tglMulai: U.today(), tglStatus: U.today(), siapPiagam: '[]', updatedAt: U.nowIso() };
    const rw = { id: U.uid(), siswaId: s.id, programId: p.id, program, jenis: 'mulai', dari: '', ke: String(level), tanggal: U.today(), catatan: 'Diterima dari formulir pendaftaran' };
    A.mut((d) => {
      const x = d.siswa.find((y) => y.id === s.id); if (x) x.statusDaftar = 'diterima';
      const i = d.program.findIndex((y) => y.id === p.id); if (i >= 0) d.program[i] = p; else d.program.push(p);
    });
    A.kirim({ op: 'terimaPendaftar', siswaId: s.id, program: p, riwayat: [rw], kirimWA: !!kirimWA, _label: 'Terima ' + s.nama });
  }
  async function tolak(ids) {
    const alasan = await U.prompt({ title: 'Tolak ' + ids.length + ' pendaftar', icon: 'circle-x', label: 'Catatan / alasan (opsional)', input: '<textarea class="input" data-v placeholder="Contoh: kuota penuh, akan dihubungi periode berikutnya"></textarea>', ok: 'Tolak pendaftar' });
    if (alasan === null) return;
    ids.forEach((id) => {
      A.mut((d) => { const x = d.siswa.find((y) => y.id === id); if (x) { x.statusDaftar = 'ditolak'; if (alasan) x.catatan = alasan; } }, { render: false });
      A.kirim({ op: 'tolakPendaftar', siswaId: id, catatan: alasan, _label: 'Tolak pendaftar' });
    });
    if (A.ui.pend) A.ui.pend.sel.clear();
    U.toast(ids.length + ' pendaftar ditolak (data tetap disimpan)');
    A.refresh();
  }
  function drawerTerima(s, lihat) {
    if (!s) return;
    const pm = (R.idx().progSiswa[s.id] || [])[0] || { program: 'ahe' };
    const kv = [['Nama lengkap', s.nama], ['Panggilan', s.panggilan], ['Tempat, tgl lahir', [s.tempatLahir, U.tglPanjang(s.tglLahir)].filter((x) => x && x !== '-').join(', ') + (s.tglLahir ? ' (' + U.umur(s.tglLahir) + ')' : '')],
      ['Sekolah & kelas', [s.sekolah, s.kelas].filter(Boolean).join(' · ')], ['Orang tua / wali', s.ortu], ['WhatsApp', U.tampilWa(s.wa)], ['Alamat', [s.jalan, s.rt ? 'RT ' + s.rt : '', s.desa, s.kecamatan].filter(Boolean).join(', ')],
      ['Facebook', s.facebook], ['Info dari', s.infoDari], ['Catatan', s.catatan]];
    const m = U.modal({
      drawer: true, title: lihat ? 'Data Pendaftar' : 'Terima Pendaftar', icon: 'user-check', sub: `<span class="chip chip-ahe">${esc(s.kode)}</span> ${s.lengkap === 'ya' ? '<span class="chip chip-ok">Lengkap</span>' : ''}`,
      body: `<div class="card soft card-pad"><div class="tiny strong muted mb-12" style="letter-spacing:.06em">BIODATA TERDAFTAR</div><dl class="kv">${kv.filter((x) => x[1]).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>
        ${lihat ? '' : `<div class="form-stack mt-16"><h4>${icon('settings')} Pengaturan siswa baru</h4>
          <div class="field"><label>Program</label><select class="input" id="t-prog"><option value="ahe" ${pm.program === 'ahe' ? 'selected' : ''}>Les Baca (Ahe)</option><option value="ala" ${pm.program === 'ala' ? 'selected' : ''}>Les Berhitung (Ala)</option></select></div>
          <div class="field"><label>Level awal <span class="req">*</span></label><select class="input" id="t-lv"></select></div>
          <div class="field"><label>Buku level awal</label><select class="input" id="t-buku"><option value="belum">Belum punya buku</option><option value="ya">Sudah punya buku</option></select></div>
          <label class="check">${''}<input type="checkbox" id="t-wa" ${s.wa && A.tplAktif('tpl_wa_terima') ? 'checked' : ''} ${A.tplAktif('tpl_wa_terima') ? '' : 'disabled'}><span class="box">${icon('check')}</span><span>Kirim WhatsApp konfirmasi ke orang tua</span></label></div>`}`,
      foot: lihat ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${U.waLink(s.wa)}">${icon('message-circle')} Hubungi</a><a class="btn btn-primary" href="#/siswa/${s.id}" data-n>Buka detail siswa</a>`
        : `<button class="btn btn-danger-ghost" data-tl>${icon('circle-x')} Tolak</button><span class="spacer"></span><button class="btn btn-primary" data-ok>${icon('circle-check')} Terima & Aktifkan</button>`
    });
    if (lihat) { const n = m.$('[data-n]'); if (n) n.onclick = () => m.close(); return; }
    const isiLv = () => { const pr = m.$('#t-prog').value; m.$('#t-lv').innerHTML = Array.from({ length: R.MAKS[pr] }, (_, i) => `<option value="${i + 1}">Level ${i + 1}${pr === 'ala' ? ' · ' + (i < 6 ? 'Pertambahan & Pengurangan' : 'Perkalian & Pembagian') : ''}</option>`).join(''); };
    isiLv(); m.$('#t-prog').onchange = isiLv;
    m.$('[data-tl]').onclick = () => { m.close(); tolak([s.id]); };
    m.$('[data-ok]').onclick = () => {
      terima(s, m.$('#t-prog').value, +m.$('#t-lv').value, m.$('#t-buku').value, m.$('#t-wa').checked);
      U.toast(s.nama + ' diterima di ' + R.LABEL[m.$('#t-prog').value] + ' Level ' + m.$('#t-lv').value);
      m.close();
    };
  }

  // ======================================================================
  // DAFTAR SISWA
  // ======================================================================
  const PER = 25;
  A.page('siswa', {
    title: 'Siswa', crumb: 'Data Siswa',
    render(view, params, qs) {
      const ui = A.ui.siswa = A.ui.siswa || { st: 'belajar', q: '', prog: '', lv: '', kel: '', buku: '', f: '', hal: 1, sel: new Set(), qsKey: '', tetap: new Set() };
      if (!ui.tetap) ui.tetap = new Set();
      const key = qs.toString();
      if (key && key !== ui.qsKey) { ui.qsKey = key; ui.tetap.clear(); ui.st = qs.get('st') || 'belajar'; ui.f = qs.get('f') || ''; ui.buku = ''; ui.hal = 1; ui.sel.clear(); if (ui.f === 'buku') { ui.buku = 'belum'; ui.f = ''; ui.st = 'aktif'; } }
      const pr = R.peringatan();
      const setF = { absen: new Set(pr.absen.map((x) => x.s.id)), tunggak: new Set(pr.tunggakan.map((x) => x.s.id)), piagam: new Set(pr.piagam.map((x) => x.s.id)) };
      const absenInfo = {}; pr.absen.forEach((x) => { absenInfo[x.s.id] = x.a; });
      const semua = R.siswaTerdaftar();
      const jml = { semua: semua.length, belajar: 0, aktif: 0, rehat: 0, lulus: 0, kurang: 0 };
      semua.forEach((s) => { const st = R.status(s.id); if (jml[st] !== undefined) jml[st]++; if (st === 'aktif' || st === 'rehat') jml.belajar++; if (s.lengkap !== 'ya') jml.kurang++; });
      const q = ui.q.trim().toLowerCase();
      let rows = semua.filter((s) => {
        const p = R.prog(s.id), st = p ? p.status : 'belum';
        // Siswa yang baru diubah tetap terlihat walau tidak lagi cocok dengan filter (mis. filter Level)
        if (ui.tetap.has(s.id)) return true;
        if (ui.st === 'kurang' ? s.lengkap === 'ya' : ui.st === 'belajar' ? (st !== 'aktif' && st !== 'rehat') : ui.st !== 'semua' && st !== ui.st) return false;
        if (ui.prog && (!p || p.program !== ui.prog)) return false;
        if (ui.lv && (!p || String(p.level) !== ui.lv)) return false;
        if (ui.kel && (!p || p.program !== 'ala' || R.kelompok(p) !== ui.kel)) return false;
        if (ui.buku && (!p || (ui.buku === 'ya' ? p.buku !== 'ya' : p.buku === 'ya'))) return false;
        if (ui.f && !(setF[ui.f] || new Set()).has(s.id)) return false;
        if (q && ![s.nama, s.panggilan, s.kode, s.ortu, s.wa, U.tampilWa(s.wa)].join(' ').toLowerCase().includes(q)) return false;
        return true;
      }).sort((a, b) => a.nama.localeCompare(b.nama));
      const total = rows.length;
      const nHal = Math.max(1, Math.ceil(total / PER)); if (ui.hal > nHal) ui.hal = nHal;
      const halRows = rows.slice((ui.hal - 1) * PER, ui.hal * PER);
      const fLabel = { absen: 'Tidak masuk > 2 minggu', tunggak: 'Tunggakan SPP 2 bulan', piagam: 'Siap piagam' }[ui.f];
      view.innerHTML = `<div class="page-head"><div><h1>Data Siswa</h1><p>Kelola data siswa, level program, buku, dan riwayat belajar seumur les.</p></div>
        <div class="actions"><a class="btn btn-light" href="#/siswa/impor">${icon('file-spreadsheet')} Impor Excel</a><button class="btn btn-primary" id="s-tambah">${icon('user-plus')} Tambah Siswa</button></div></div>
        <div class="tabs mb-12">${[['belajar', 'Siswa Les'], ['aktif', 'Aktif'], ['rehat', 'Rehat'], ['lulus', 'Lulus / Alumni'], ['semua', 'Semua']].map(([k, l]) => `<button class="tab ${ui.st === k ? 'on' : ''}" data-st="${k}">${k === 'lulus' ? icon('award', 'ic-sm') + ' ' : ''}${l} <span class="n">${jml[k]}</span></button>`).join('')}
          <button class="tab warn ${ui.st === 'kurang' ? 'on' : ''}" data-st="kurang">${icon('triangle-alert', 'ic-sm')} Data belum lengkap <span class="n">${jml.kurang}</span></button></div>
        <div class="card mb-12"><div class="filters">
          <div class="input-icon search">${icon('search')}<input class="input" id="s-q" placeholder="Cari nama, kode REG, orang tua, nomor WA…" value="${esc(ui.q)}"></div>
          <select class="input" data-fl="prog"><option value="">Semua program</option><option value="ahe" ${ui.prog === 'ahe' ? 'selected' : ''}>Les Baca (Ahe)</option><option value="ala" ${ui.prog === 'ala' ? 'selected' : ''}>Les Berhitung (Ala)</option></select>
          <select class="input" data-fl="lv"><option value="">Semua level</option>${Array.from({ length: 16 }, (_, i) => `<option ${ui.lv === String(i + 1) ? 'selected' : ''} value="${i + 1}">Level ${i + 1}</option>`).join('')}</select>
          <select class="input" data-fl="kel"><option value="">Semua kelompok</option>${Object.values(R.KELOMPOK).map((k) => `<option ${ui.kel === k ? 'selected' : ''}>${k}</option>`).join('')}</select>
          <select class="input" data-fl="buku"><option value="">Status buku</option><option value="ya" ${ui.buku === 'ya' ? 'selected' : ''}>Sudah punya buku</option><option value="belum" ${ui.buku === 'belum' ? 'selected' : ''}>Belum punya buku</option></select>
          <select class="input" data-fl="f"><option value="">Semua peringatan</option><option value="absen" ${ui.f === 'absen' ? 'selected' : ''}>Tidak masuk &gt; 2 minggu</option><option value="tunggak" ${ui.f === 'tunggak' ? 'selected' : ''}>Tunggakan SPP</option><option value="piagam" ${ui.f === 'piagam' ? 'selected' : ''}>Siap piagam</option></select>
          <button class="btn btn-ghost btn-sm" id="s-reset">${icon('rotate-ccw')} Reset</button></div>
          ${ui.st === 'lulus' ? `<div class="note-box" style="margin:0 12px 12px">${icon('award')}<span>Siswa yang sudah <b>tuntas/lulus</b>. Lulusan Les Baca yang dilanjutkan ke Les Berhitung (pilih siswa → <b>Lanjut Berhitung</b>) otomatis kembali ke daftar <b>Siswa Les</b>.</span></div>` : ''}
          ${ui.tetap.size ? `<div class="note-box ok" style="margin:0 12px 12px">${icon('info')}<span>${ui.tetap.size} siswa yang baru diubah tetap ditampilkan (ditandai). Mereka mengikuti filter lagi setelah Anda mengganti filter atau tab.</span></div>` : ''}
          ${fLabel ? `<div class="note-box warn" style="margin:0 12px 12px">${icon('filter')}<span>Menampilkan: <b>${fLabel}</b> (${total} siswa). ${ui.f === 'absen' ? 'Pilih siswa lalu tekan <b>Rehat</b> bila memang sedang berhenti sementara.' : ''}</span></div>` : ''}</div>
        <div class="card">${halRows.length ? `<div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr><th class="w-check">${A.cek('data-all', halRows.length && halRows.every((r) => ui.sel.has(r.id)))}</th><th>Siswa</th><th>Program</th><th>Level</th><th>Kelompok</th><th>Buku</th><th>Status</th><th></th></tr></thead><tbody>
          ${halRows.map((s) => { const p = R.prog(s.id); const ab = absenInfo[s.id]; return `<tr class="clickable ${ui.sel.has(s.id) ? 'sel' : ''} ${ui.tetap.has(s.id) ? 'baru-ubah' : ''}" data-row="${s.id}">
            <td class="w-check">${A.cek(`data-sel="${s.id}"`, ui.sel.has(s.id))}</td>
            <td class="t-main"><div class="person">${U.avatar(s.nama, s.id)}<div><div class="t-name">${esc(s.nama)} ${s.panggilan ? `<span class="muted small">(${esc(s.panggilan)})</span>` : ''}</div>
              <div class="t-sub"><span class="num">${esc(s.kode || '…')}</span>${s.ortu ? ' · Ortu: ' + esc(s.ortu) : ''}</div>
              ${s.lengkap !== 'ya' ? `<span class="chip chip-warn chip-sm mt-8">${icon('triangle-alert')} Data belum lengkap</span>` : ''}
              ${ab ? `<span class="chip chip-bad chip-sm mt-8">${icon('clock')} Absen ${ab.hari} hari les</span>` : ''}${setF.tunggak.has(s.id) ? ` <span class="chip chip-bad chip-sm mt-8">${icon('wallet')} Tunggakan SPP</span>` : ''}</div></div></td>
            <td data-l="Program">${A.chipProg(p)}</td>
            <td data-l="Level"><b style="font-family:var(--f-head);font-size:16px;color:var(--p-700)">${p ? 'Level ' + esc(p.level) : '-'}</b></td>
            <td data-l="Kelompok" class="small">${p && p.program === 'ala' ? esc(R.kelompok(p)) : '<span class="muted">—</span>'}</td>
            <td data-l="Buku">${A.chipBuku(p) || '-'}</td><td data-l="Status">${A.chipStatus(p ? p.status : 'belum')}</td>
            <td class="hide-m t-right">${icon('chevron-right')}</td></tr>`; }).join('')}
          </tbody></table></div>${A.pager(total, ui.hal, PER)}` : A.kosong('graduation-cap', semua.length ? 'Tidak ada siswa yang cocok' : 'Belum ada data siswa', semua.length ? 'Ubah kata kunci atau filter.' : 'Tambahkan siswa satu per satu atau impor data lama dari Excel.', semua.length ? '' : '<a class="btn btn-primary" href="#/siswa/impor">' + icon('file-spreadsheet') + ' Impor dari Excel</a>')}</div>
        ${ui.sel.size ? `<div class="bulk"><span class="n">${icon('circle-check')} ${ui.sel.size} siswa dipilih</span><div class="acts">
          <button class="btn" data-b="level">${icon('list')} Tetapkan Level</button><button class="btn" data-b="naik">${icon('arrow-up')} Naik 1 Level</button>
          <button class="btn" data-b="bukuYa">${icon('book-open')} Tandai Punya Buku</button><button class="btn" data-b="bukuBelum">Tandai Belum Buku</button>
          <button class="btn" data-b="rehat">${icon('circle-pause')} Rehat</button><button class="btn" data-b="aktif">${icon('play')} Aktifkan Kembali</button>
          <button class="btn lt" data-b="tuntas">${icon('star')} Tuntaskan</button><button class="btn hl" data-b="lanjut">Lanjut Berhitung ${icon('arrow-right')}</button>
          <button class="btn" data-b="semuaFilter">Pilih semua hasil (${total})</button></div><button class="btn x btn-icon" data-clear aria-label="Batalkan pilihan">${icon('x')}</button></div>` : ''}`;
      // Peristiwa
      $$('[data-st]').forEach((b) => b.onclick = () => { ui.st = b.dataset.st; ui.hal = 1; ui.tetap.clear(); A.render(); });
      $$('[data-fl]').forEach((sl) => sl.onchange = () => { ui[sl.dataset.fl] = sl.value; ui.hal = 1; ui.tetap.clear(); A.render(); });
      $('#s-reset').onclick = () => { Object.assign(ui, { st: 'belajar', q: '', prog: '', lv: '', kel: '', buku: '', f: '', hal: 1 }); ui.sel.clear(); ui.tetap.clear(); A.go('/siswa'); A.render(); };
      $('#s-q').oninput = U.debounce((e) => { ui.q = e.target.value; ui.hal = 1; ui.tetap.clear(); A.refresh(true); const i = $('#s-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200);
      $$('[data-pg]').forEach((b) => b.onclick = () => { ui.hal = +b.dataset.pg; A.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      $$('[data-sel]').forEach((c) => c.onchange = () => { c.checked ? ui.sel.add(c.dataset.sel) : ui.sel.delete(c.dataset.sel); A.refresh(true); });
      const all = $('[data-all]'); if (all) all.onchange = () => { halRows.forEach((r) => all.checked ? ui.sel.add(r.id) : ui.sel.delete(r.id)); A.refresh(true); };
      $$('[data-row]').forEach((tr) => tr.onclick = () => A.go('/siswa/' + tr.dataset.row));
      $('#s-tambah').onclick = () => A.formSiswa(null);
      const cl = $('[data-clear]'); if (cl) cl.onclick = () => { ui.sel.clear(); A.render(); };
      $$('[data-b]').forEach((b) => b.onclick = async () => {
        const ids = Array.from(ui.sel);
        const k = b.dataset.b;
        if (k === 'semuaFilter') { rows.forEach((r) => ui.sel.add(r.id)); return A.render(); }
        if (k === 'level') { const lv = await Aksi.pilihLevel('Tetapkan level ' + ids.length + ' siswa'); if (!lv) return; Aksi.setLevel(ids, lv.level, lv.program); }
        if (k === 'naik' && !(await Aksi.naik(ids))) return;
        if (['level', 'naik', 'bukuYa', 'bukuBelum', 'rehat', 'aktif', 'tuntas', 'lanjut'].includes(k)) ids.forEach((id) => ui.tetap.add(id));
        if (k === 'bukuYa') Aksi.buku(ids, 'ya');
        if (k === 'bukuBelum') Aksi.buku(ids, 'belum');
        if (k === 'rehat') { if (!(await U.confirm({ title: 'Tandai ' + ids.length + ' siswa rehat?', text: 'Siswa rehat tidak muncul di daftar absen guru, tidak ditagih SPP, dan tidak dicek absen. Bisa diaktifkan kembali kapan saja tanpa daftar ulang.', ok: 'Tandai rehat' }))) return; Aksi.status(ids, 'rehat'); }
        if (k === 'aktif') Aksi.status(ids, 'aktif');
        if (k === 'tuntas') { if (!(await U.confirm({ title: 'Tuntaskan level akhir?', text: 'Berlaku untuk siswa di <b>Baca Level 7</b> (lulus), <b>Berhitung Level 6</b> (lanjut ke Level 7) atau <b>Berhitung Level 16</b> (lulus). Siswa masuk daftar <b>Siap Dibuatkan Piagam</b>.', ok: 'Tuntaskan' }))) return; Aksi.tuntas(ids); }
        if (k === 'lanjut') { if (!(await U.confirm({ title: 'Lanjutkan ke Les Berhitung?', text: 'Siswa yang sudah lulus Les Baca dibuatkan program Berhitung Level 1 tanpa daftar ulang. Kode registrasi tetap sama.', ok: 'Lanjutkan' }))) return; Aksi.lanjutAla(ids, 1); }
        ui.sel.clear(); A.render();
      });
    }
  });

  // Formulir tambah / edit siswa
  A.formSiswa = (s) => {
    const baru = !s;
    s = s || {};
    const p = baru ? null : R.prog(s.id);
    const f = (k, l, req, attr) => `<div class="field"><label>${l}${req ? '<span class="req">*</span>' : ''}</label><input class="input" name="${k}" value="${esc(s[k] || '')}" ${attr || ''}></div>`;
    const m = U.modal({
      drawer: true, title: baru ? 'Tambah Siswa' : 'Edit Data Siswa', icon: baru ? 'user-plus' : 'square-pen', sub: baru ? 'Data boleh belum lengkap, bisa dilengkapi kapan saja.' : esc(s.kode || ''),
      body: `<form class="form-stack" id="fsiswa" autocomplete="off">
        ${f('nama', 'Nama Lengkap', 1, 'maxlength="150" required')}<div class="grid-2">${f('panggilan', 'Panggilan', 0, 'maxlength="50"')}${f('kelas', 'Kelas', 0, 'list="dl-kls"')}</div>
        <datalist id="dl-kls">${['PAUD', 'TK A', 'TK B', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map((x) => `<option value="${x}">`).join('')}</datalist>
        <div class="grid-2">${f('tempatLahir', 'Tempat Lahir')}<div class="field"><label>Tanggal Lahir</label><input class="input" type="date" name="tglLahir" value="${esc(s.tglLahir || '')}"></div></div>
        ${f('sekolah', 'Nama Sekolah')}${f('ortu', 'Nama Orang Tua')}
        <div class="field"><label>Nomor WhatsApp</label><div class="input-group"><span class="prefix">+62</span><input class="input" name="wa" inputmode="tel" value="${esc(s.wa ? '0' + U.normWa(s.wa).slice(2) : '')}"></div></div>
        <div class="grid-2">${f('kecamatan', 'Kecamatan')}${f('desa', 'Desa / Kelurahan')}</div><div class="grid-2" style="grid-template-columns:100px 1fr">${f('rt', 'RT')}${f('jalan', 'Jalan')}</div>
        ${f('facebook', 'Nama Facebook')}
        ${baru ? `<div class="divider"></div><h4>${icon('book-open')} Program awal</h4><div class="grid-2"><div class="field"><label>Program</label><select class="input" name="program"><option value="">Tentukan nanti</option><option value="ahe">Les Baca (Ahe)</option><option value="ala">Les Berhitung (Ala)</option></select></div><div class="field"><label>Level</label><select class="input" name="level"></select></div></div>
          <div class="field"><label>Tanggal mulai</label><input class="input" type="date" name="tglMulai" value="${U.today()}"></div>` : ''}
        <div class="field"><label>Foto (opsional)</label><div class="row-gap"><span id="f-foto">${U.avatar(s.nama || '?', s.id || 'x', 'av-lg', A.foto['s_' + s.id])}</span><button type="button" class="btn btn-light btn-sm" data-foto>${icon('image-plus')} Pilih foto</button><button type="button" class="btn btn-ghost btn-sm" data-foto-hapus>Hapus</button></div></div>
      </form>`,
      foot: `<button class="btn btn-light" data-n>Batal</button><button class="btn btn-primary" data-ok>${icon('save')} ${baru ? 'Simpan Siswa' : 'Simpan Perubahan'}</button>`
    });
    let foto;
    const fm = m.$('#fsiswa');
    if (baru) { const isi = () => { const pr = fm.program.value; fm.level.innerHTML = pr ? Array.from({ length: R.MAKS[pr] }, (_, i) => `<option value="${i + 1}">Level ${i + 1}</option>`).join('') : '<option value="">—</option>'; }; isi(); fm.program.onchange = isi; }
    fm.tempatLahir.onblur = () => { fm.tempatLahir.value = U.hurufKata(fm.tempatLahir.value); };
    m.$('[data-foto]').onclick = async () => { const fl = await U.pilihFile('image/*'); if (!fl) return; try { const k = await U.kompres(fl, 160, 0.8); foto = k.dataUrl; m.$('#f-foto').innerHTML = U.avatar('', '', 'av-lg', foto); } catch (e) { U.toast(e.message, 'bad'); } };
    m.$('[data-foto-hapus]').onclick = () => { foto = ''; m.$('#f-foto').innerHTML = U.avatar(fm.nama.value || '?', s.id || 'x', 'av-lg'); };
    m.$('[data-n]').onclick = () => m.close();
    m.$('[data-ok]').onclick = () => {
      const x = {};
      ['nama', 'panggilan', 'kelas', 'tempatLahir', 'tglLahir', 'sekolah', 'ortu', 'kecamatan', 'desa', 'rt', 'jalan', 'facebook'].forEach((k) => { x[k] = fm[k].value.trim(); });
      x.wa = U.normWa(fm.wa.value);
      if (!x.nama) { U.toast('Nama Lengkap wajib diisi', 'warn'); fm.nama.focus(); return; }
      x.id = s.id || U.uid();
      x.lengkap = R.lengkap(x) ? 'ya' : 'tidak';
      A.mut((d) => {
        const ada = d.siswa.find((y) => y.id === x.id);
        if (ada) Object.assign(ada, x, { updatedAt: U.nowIso() });
        else d.siswa.push(Object.assign({ kode: '', sumber: 'manual', statusDaftar: 'diterima', createdAt: U.nowIso(), updatedAt: U.nowIso() }, x));
      });
      A.kirim(Object.assign({ op: 'upsertSiswa', siswa: baru ? Object.assign({ sumber: 'manual', statusDaftar: 'diterima' }, x) : x, _label: 'Data siswa' }));
      if (baru && fm.program.value) {
        const pr = fm.program.value;
        Aksi.terapkan([{ p: { id: x.id + 'p', siswaId: x.id, program: pr, level: fm.level.value, status: 'aktif', buku: 'belum', tglMulai: fm.tglMulai.value || U.today(), tglStatus: U.today(), siapPiagam: '[]' },
          riw: [{ id: U.uid(), siswaId: x.id, programId: x.id + 'p', program: pr, jenis: 'mulai', dari: '', ke: fm.level.value, tanggal: U.today(), catatan: 'Mulai les' }] }], 'Program siswa');
      }
      if (foto !== undefined) { A.foto['s_' + x.id] = foto; A.kirim({ op: 'foto', id: 's_' + x.id, data: foto, _label: 'Foto siswa' }); }
      U.toast(baru ? x.nama + ' ditambahkan' : 'Data ' + x.nama + ' diperbarui');
      m.close();
    };
  };
  A.hasil.upsertSiswa = (op, data) => {
    if (!data) return;
    A.mut((d) => { const s = d.siswa.find((y) => y.id === op.siswa.id); if (s) { s.kode = data.kode; s.lengkap = data.lengkap; } });
  };

  // ======================================================================
  // DETAIL SISWA
  // ======================================================================
  A.detailCache = {};
  A.page('detail', {
    title: 'Siswa', nav: 'siswa',
    crumb: (p) => { const s = R.idx().siswa[p[0]]; return s ? s.nama : 'Detail Siswa'; },
    render(view, params) {
      const s = R.idx().siswa[params[0]];
      if (!s) { view.innerHTML = `<div class="card">${A.kosong('search', 'Siswa tidak ditemukan', 'Mungkin sudah dihapus.', '<a class="btn btn-primary" href="#/siswa">Kembali ke daftar</a>')}</div>`; return; }
      const ui = A.ui.detail = A.ui.detail && A.ui.detail.id === s.id ? A.ui.detail : { id: s.id, tab: 'program' };
      const det = A.detailCache[s.id];
      if (!det && !ui.memuat) {
        ui.memuat = true;
        U.api('getSiswaDetail', { token: A.S.token, id: s.id }).then((r) => { A.detailCache[s.id] = r; if (r.foto) A.foto['s_' + s.id] = r.foto; ui.memuat = false; A.refresh(); }).catch((e) => { ui.memuat = false; U.toast(e.message, 'bad'); });
      }
      const p = R.prog(s.id), ps = R.programs(s.id);
      const tg = R.tunggakan(s), ab = R.absen(s);
      const ym = U.ymNow();
      const hadirBulan = (D().hadirSiswa || []).filter((h) => h[1] === s.id);
      const hl = R.hariLesBulan(ym).filter((t) => t < U.today() || (t === U.today() && hadirBulan.some((h) => h[0] === t)));
      const piagam = R.idx().piagamSiswa[s.id] || [];
      const sppBulan = R.lunas(s.id, ym);
      view.innerHTML = `<a class="btn btn-ghost btn-sm mb-12" href="#/siswa">${icon('arrow-left')} Kembali ke Data Siswa</a>
        <div class="card" style="overflow:hidden"><div style="height:74px;background:linear-gradient(120deg,var(--p),var(--p-800))"></div>
          <div class="card-body" style="margin-top:-56px"><div class="row-gap" style="align-items:flex-end">${U.avatar(s.nama, s.id, 'av-xl', A.foto['s_' + s.id])}
            <div style="flex:1;min-width:200px;padding-top:58px"><h2>${esc(s.nama)} ${s.panggilan ? `<span class="muted" style="font-weight:600;font-size:16px">(${esc(s.panggilan)})</span>` : ''}</h2>
              <div class="small muted mt-8">${[s.tglLahir ? U.umur(s.tglLahir) : '', s.sekolah, s.ortu ? 'Ortu: ' + s.ortu : '', s.wa ? U.tampilWa(s.wa) : ''].filter(Boolean).map(esc).join(' · ')}</div></div>
            <div class="row-gap" style="padding-top:58px"><button class="btn btn-light btn-sm" data-edit>${icon('pencil')} Edit Data</button>${s.wa ? `<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${U.waLink(s.wa)}">${icon('message-circle')} Hubungi Ortu</a>` : ''}<button class="btn btn-light btn-icon btn-sm" data-more aria-label="Aksi lainnya">${icon('ellipsis')}</button></div></div>
          <div class="row-gap mt-16"><span class="chip chip-ahe num">${esc(s.kode || '…')}</span>${A.chipProg(p)}${p ? `<span class="chip">${'Level ' + esc(p.level)}${p.program === 'ala' ? ' · ' + esc(R.kelompok(p)) : ''}</span>` + A.chipStatus(p.status) + (p.buku !== 'ya' ? `<span class="chip chip-warn">${icon('book-open')} Belum punya buku Lv ${esc(p.level)}</span>` : `<span class="chip chip-ok">${icon('book-open')} Sudah punya buku</span>`) : ''}
            ${s.lengkap !== 'ya' ? `<span class="chip chip-warn">${icon('triangle-alert')} Data belum lengkap</span>` : ''}${tg.dua ? `<span class="chip chip-bad">${icon('wallet')} Tunggakan ${tg.belum.length} bulan</span>` : ''}${ab && ab.hari >= (+D().settings.ambang_absen_hari || 10) ? `<span class="chip chip-bad">${icon('clock')} Absen ${ab.hari} hari les</span>` : ''}</div></div></div>
        <div class="utabs mt-16">${[['program', 'Program & Level', 'book-open'], ['data', 'Data Diri', 'user'], ['hadir', 'Kehadiran', 'calendar'], ['spp', 'SPP & Kuitansi', 'receipt'], ['piagam', 'Piagam', 'award']].map(([k, l, ic]) => `<button class="utab ${ui.tab === k ? 'on' : ''}" data-tab="${k}">${icon(ic)} ${l}${k === 'piagam' && piagam.length ? ` <span class="n">${piagam.length}</span>` : ''}</button>`).join('')}</div>
        <div class="split mt-16"><div class="stack" id="d-main"></div>
          <div class="stack">
            <div class="card card-pad"><div class="row-gap mb-12"><h4 style="flex:1">${icon('calendar-check')} Kehadiran ${U.bln(ym)}</h4></div>
              <div class="row-gap"><div class="card soft card-pad" style="flex:1;text-align:center;padding:12px"><div class="tiny muted strong">HADIR</div><div style="font-family:var(--f-head);font-weight:900;font-size:26px;line-height:1.2">${hadirBulan.length}<span class="small muted">/${hl.length}</span></div></div>
                <div class="card soft card-pad" style="flex:1;text-align:center;padding:12px"><div class="tiny muted strong">PERSEN</div><div style="font-family:var(--f-head);font-weight:900;font-size:26px;line-height:1.2;color:var(--ala)">${hl.length ? Math.round(hadirBulan.length / hl.length * 100) : 0}%</div></div></div>
              <dl class="kv mt-12"><dt>Terakhir hadir</dt><dd>${esc(U.tgl((D().lastHadir || {})[s.id]))}</dd></dl></div>
            <div class="card card-pad"><h4 class="mb-12">${icon('receipt')} SPP ${U.bln(ym)}</h4>
              ${sppBulan ? `<div class="note-box ok">${icon('circle-check')}<span>Lunas ${esc(U.tgl(sppBulan.tglBayar))} · ${U.rp(sppBulan.nominal)}</span></div>`
                : R.ditagih(s, ym) ? `<div class="note-box bad">${icon('circle-alert')}<span><b>Belum bayar</b> · ${U.rp(R.tarif(ym))}${tg.belum.length > 1 ? '<br>Tunggakan: ' + esc(U.daftarBulan(tg.belum)) : ''}</span></div>` : '<p class="small muted">Tidak ada tagihan bulan ini.</p>'}
              <button class="btn btn-accent btn-block mt-12" data-bayar>${icon('wallet')} Tandai Lunas & Buat Kuitansi</button></div>
            <div class="card card-pad"><h4 class="mb-12">${icon('award')} Piagam</h4>${piagam.length ? piagam.map((x) => `<div class="row-gap mb-12"><span class="icon-dot sm ok">${icon('circle-check')}</span><div style="flex:1"><b class="small">${x.jenis === 'ahe' ? 'Piagam Baca (Ahe)' : 'Piagam Ala · ' + esc(x.kelompok)}</b><div class="tiny muted">${esc(x.nomor)} · ${esc(U.tgl(x.tglLulus))}</div></div><a class="btn btn-ghost btn-icon btn-sm" href="#/piagam/hasil/${x.jenis}/${x.id}" title="Lihat & unduh">${icon('download')}</a></div>`).join('') : '<p class="small muted">Belum ada piagam.</p>'}
              ${ps.some((x) => R.siap(x).length) ? `<a class="btn btn-soft btn-block" href="#/piagam">${icon('award')} Buat piagam</a>` : ''}</div>
          </div></div>`;
      const main = $('#d-main');
      const T = {
        program() {
          const aksiBtn = p && p.status !== 'lulus' ? `<div class="card card-pad"><div class="tiny strong muted mb-12" style="letter-spacing:.06em">AKSI CEPAT (ADMIN)</div><div class="row-gap">
            ${p.status === 'aktif' && +p.level < R.MAKS[p.program] ? `<button class="btn btn-primary btn-sm" data-a="naik">${icon('arrow-up')} Naik 1 Level (ke Level ${+p.level + 1})</button>` : ''}
            <button class="btn btn-light btn-sm" data-a="level">${icon('list')} Tetapkan Level</button>
            <button class="btn btn-light btn-sm" data-a="buku">${icon('book-open')} ${p.buku === 'ya' ? 'Tandai Belum Punya Buku' : 'Tandai Sudah Punya Buku Lv ' + esc(p.level)}</button>
            ${(p.program === 'ahe' && +p.level === 7) || (p.program === 'ala' && (+p.level === 6 || +p.level === 16)) ? `<button class="btn btn-soft btn-sm" data-a="tuntas" style="background:var(--sun-50);color:#7A5600">${icon('star')} Tuntaskan Kelompok</button>` : ''}
            <button class="btn btn-light btn-sm" data-a="${p.status === 'rehat' ? 'aktif' : 'rehat'}">${icon(p.status === 'rehat' ? 'play' : 'circle-pause')} ${p.status === 'rehat' ? 'Aktifkan Kembali' : 'Tandai Rehat'}</button></div>
            <p class="tiny muted mt-12">${icon('info', 'ic-sm')} Setiap naik level, status buku otomatis kembali "belum" dan tercatat di riwayat.</p></div>`
            : !p ? `<div class="card card-pad">${A.kosong('book-open', 'Belum ada program', 'Tetapkan program dan level awal siswa ini.', '<button class="btn btn-primary" data-a="level">' + icon('plus') + ' Tetapkan program & level</button>')}</div>`
              : `<div class="card card-pad"><div class="note-box ok">${icon('award')}<span><b>${esc(R.LABEL[p.program])} selesai.</b> ${p.program === 'ahe' && !ps.some((x) => x.program === 'ala') ? 'Siswa bisa langsung dilanjutkan ke Les Berhitung tanpa daftar ulang.' : ''}</span></div>
                ${p.program === 'ahe' && !ps.some((x) => x.program === 'ala') ? `<button class="btn btn-accent mt-12" data-a="lanjut">Lanjutkan ke Les Berhitung ${icon('arrow-right')}</button>` : ''}</div>`;
          const kartu = ps.slice().sort((a, b) => (a.program === 'ahe' ? -1 : 1)).map((x) => `<div class="card card-pad" style="${x === p ? 'border:2px solid var(--p-200)' : ''}"><div class="row-gap"><span class="icon-dot ${x.program === 'ala' ? 'ala' : ''}">${icon(x.program === 'ala' ? 'calculator' : 'book-open')}</span>
            <div style="flex:1"><h4>${esc(R.LABEL[x.program])} ${A.chipStatus(x.status)}</h4><div class="small muted">Mulai ${esc(U.tgl(x.tglMulai))}${x.status !== 'aktif' ? ' · ' + esc(x.status) + ' sejak ' + esc(U.tgl(x.tglStatus)) : ''}</div></div></div>
            <div class="grid-3 mt-12"><div class="card soft card-pad" style="padding:12px"><div class="tiny muted strong">LEVEL</div><div style="font-family:var(--f-head);font-weight:900;font-size:24px;color:var(--p-700)">Level ${esc(x.level)}</div><div class="tiny muted">${x.program === 'ala' ? esc(R.kelompok(x)) : 'Membaca'}</div></div>
              <div class="card soft card-pad" style="padding:12px"><div class="tiny muted strong">BUKU</div><div class="mt-8">${A.chipBuku(x)}</div></div>
              <div class="card soft card-pad" style="padding:12px"><div class="tiny muted strong">TARGET</div><div class="small strong mt-8">Level ${R.MAKS[x.program]}</div><div class="bar mt-8 ${x.program === 'ala' ? 'ala' : ''}"><i style="width:${x.level / R.MAKS[x.program] * 100}%"></i></div></div></div>
            ${R.siap(x).length ? `<div class="note-box mt-12" style="background:var(--sun-50);color:#7A5600">${icon('star')}<span>Siap dibuatkan: ${R.siap(x).map((k) => R.SIAP_LABEL[k]).join(', ')}</span></div>` : ''}</div>`).join('');
          const rw = det ? det.riwayat.slice().sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id)) : null;
          main.innerHTML = kartu + aksiBtn + `<div class="card"><div class="card-head"><h3>${icon('history')} Riwayat Level & Perkembangan</h3></div><div class="card-body">
            ${!rw ? '<div class="stack-sm"><div class="sk" style="height:56px"></div><div class="sk" style="height:56px"></div></div>' : rw.length ? `<div class="tl">${rw.map((r) => `<div class="it ${r.jenis === 'tuntas' ? 'ms' : ''}"><div class="h"><span>${esc(judulRiwayat(r))}</span><small>${esc(U.tgl(r.tanggal))}</small></div>${r.catatan ? `<div class="small muted">${esc(r.catatan)}</div>` : ''}</div>`).join('')}</div>` : '<p class="small muted">Belum ada riwayat.</p>'}</div></div>`;
        },
        data() {
          const kv = [['Kode registrasi', s.kode], ['Nama lengkap', s.nama], ['Panggilan', s.panggilan], ['Tempat lahir', s.tempatLahir], ['Tanggal lahir', s.tglLahir ? U.tglPanjang(s.tglLahir) + ' (' + U.umur(s.tglLahir) + ')' : ''], ['Kelas', s.kelas], ['Sekolah', s.sekolah], ['Orang tua', s.ortu], ['WhatsApp', U.tampilWa(s.wa)],
            ['Alamat', [s.jalan, s.rt ? 'RT ' + s.rt : '', s.desa, s.kecamatan].filter(Boolean).join(', ')], ['Facebook', s.facebook], ['Info dari', s.infoDari], ['Sumber data', { formulir: 'Formulir online', impor: 'Impor Excel', manual: 'Input admin' }[s.sumber] || s.sumber], ['Terdaftar', U.tgl(String(s.createdAt).slice(0, 10))]];
          main.innerHTML = `<div class="card"><div class="card-head"><h3>${icon('user')} Data Diri</h3><button class="btn btn-soft btn-sm" data-edit>${icon('pencil')} Edit</button></div><div class="card-body"><dl class="kv">${kv.map(([k, v]) => `<dt>${k}</dt><dd>${v ? esc(v) : '<span class="chip chip-warn chip-sm">Belum diisi</span>'}</dd>`).join('')}</dl></div></div>`;
        },
        hadir() {
          const list = det ? det.hadir.slice().sort((a, b) => b[0].localeCompare(a[0])) : null;
          const g = R.idx().guru;
          main.innerHTML = `<div class="card"><div class="card-head"><h3>${icon('calendar')} Kehadiran 6 Bulan Terakhir</h3>${list ? `<span class="chip chip-ahe">${list.length} kali hadir</span>` : ''}</div><div class="card-body">
            ${!list ? '<div class="sk" style="height:120px"></div>' : list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tanggal</th><th>Guru</th></tr></thead><tbody>${list.slice(0, 120).map(([t, gid]) => `<tr><td>${esc(U.tglHari(t))}</td><td>${esc((g[gid] || {}).panggilan || (g[gid] || {}).nama || '-')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small muted">Belum ada catatan kehadiran.</p>'}</div></div>`;
        },
        spp() {
          const rows = det ? det.spp.slice().sort((a, b) => b.bulan.localeCompare(a.bulan)) : null;
          const kw = det ? det.kuitansi : [];
          main.innerHTML = `<div class="card"><div class="card-head"><h3>${icon('receipt')} Riwayat SPP</h3><button class="btn btn-accent btn-sm" data-bayar>${icon('wallet')} Bayar SPP</button></div>
            ${tg.belum.length ? `<div class="note-box bad" style="margin:12px 18px 0">${icon('circle-alert')}<span>Belum lunas: <b>${esc(U.daftarBulan(tg.belum))}</b> · total ${U.rp(tg.total)}</span></div>` : ''}
            <div class="card-body">${!rows ? '<div class="sk" style="height:120px"></div>' : rows.length ? `<div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr><th>Bulan</th><th>Nominal</th><th>Tgl bayar</th><th>Kuitansi</th></tr></thead><tbody>
              ${rows.map((r) => { const k = kw.find((x) => x.id === r.kuitansiId) || R.idx().kw[r.kuitansiId]; return `<tr><td class="t-main"><b>${U.bulan(r.bulan)}</b></td><td data-l="Nominal">${U.rp(r.nominal)}</td><td data-l="Dibayar">${esc(U.tgl(r.tglBayar))}</td><td data-l="Kuitansi">${k ? `<button class="btn btn-ghost btn-sm" data-kw="${k.id}">${icon('receipt')} ${esc(k.nomor || 'menunggu nomor')}</button>` : '-'}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="small muted">Belum ada pembayaran tercatat.</p>'}</div></div>`;
          $$('[data-kw]', main).forEach((b) => b.onclick = () => A.lihatKuitansi(kw.find((x) => x.id === b.dataset.kw) || R.idx().kw[b.dataset.kw]));
        },
        piagam() {
          main.innerHTML = `<div class="card"><div class="card-head"><h3>${icon('award')} Piagam & Sertifikat</h3>${ps.some((x) => R.siap(x).length) ? `<a class="btn btn-primary btn-sm" href="#/piagam">${icon('plus')} Buat Piagam</a>` : ''}</div><div class="card-body">
            ${piagam.length ? piagam.map((x) => `<div class="row-gap mb-12 card soft card-pad"><span class="icon-dot ok">${icon('award')}</span><div style="flex:1"><b>${x.jenis === 'ahe' ? 'Piagam Baca (Ahe)' : 'Piagam Ala · ' + esc(x.kelompok)}</b><div class="small muted">${esc(x.nomor)} · Lulus ${esc(U.tglPanjang(x.tglLulus))}</div></div><a class="btn btn-light btn-sm" href="#/piagam/hasil/${x.jenis}/${x.id}">${icon('download')} Lihat & unduh</a></div>`).join('') : A.kosong('award', 'Belum ada piagam', 'Piagam dibuat setelah siswa menuntaskan level akhir.')}</div></div>`;
        }
      };
      (T[ui.tab] || T.program)();
      $$('[data-tab]').forEach((b) => b.onclick = () => { ui.tab = b.dataset.tab; A.render(); });
      $$('[data-edit]').forEach((b) => b.onclick = () => A.formSiswa(s));
      $$('[data-bayar]').forEach((b) => b.onclick = () => A.bayarSiswa(s));
      $$('[data-a]').forEach((b) => b.onclick = async () => {
        const k = b.dataset.a;
        if (k === 'naik') Aksi.naik([s.id]);
        if (k === 'level') { const lv = await Aksi.pilihLevel('Tetapkan level ' + s.nama, p ? p.program : null); if (lv) Aksi.setLevel([s.id], lv.level, lv.program); }
        if (k === 'buku') Aksi.buku([s.id], p.buku === 'ya' ? 'belum' : 'ya');
        if (k === 'tuntas') Aksi.tuntas([s.id]);
        if (k === 'rehat') { if (await U.confirm({ title: 'Tandai ' + s.nama + ' rehat?', text: 'Tidak muncul di absen guru, tidak ditagih SPP, bisa diaktifkan kembali kapan saja.', ok: 'Tandai rehat' })) Aksi.status([s.id], 'rehat'); }
        if (k === 'aktif') Aksi.status([s.id], 'aktif');
        if (k === 'lanjut') Aksi.lanjutAla([s.id], 1);
      });
      const more = $('[data-more]');
      if (more) more.onclick = () => {
        const m = U.modal({
          title: 'Aksi lainnya', icon: 'ellipsis', foot: false, body: `<div class="stack-sm">
          <button class="btn btn-light btn-block" data-x1>${icon('message-circle')} Kirim pesan WA (Fonnte)</button>
          <button class="btn btn-danger-ghost btn-block" data-x2>${icon('trash-2')} Hapus siswa permanen</button></div>`
        });
        m.$('[data-x1]').onclick = () => { m.close(); A.tulisWA(s); };
        m.$('[data-x2]').onclick = async () => {
          m.close();
          if (!(await U.confirm({ danger: true, title: 'Hapus ' + s.nama + '?', text: 'Data siswa, riwayat level, kehadiran, SPP, dan kuitansinya akan dihapus permanen. Piagam yang sudah dibuat tetap disimpan.', ketik: s.nama, ok: 'Hapus permanen' }))) return;
          A.mut((d) => { d.siswa = d.siswa.filter((x) => x.id !== s.id); d.program = d.program.filter((x) => x.siswaId !== s.id); d.spp = d.spp.filter((x) => x.siswaId !== s.id); d.kuitansi = d.kuitansi.filter((x) => x.siswaId !== s.id); d.hadirSiswa = (d.hadirSiswa || []).filter((h) => h[1] !== s.id); }, { render: false });
          A.kirim({ op: 'deleteSiswa', id: s.id, _label: 'Hapus siswa' });
          U.toast(s.nama + ' dihapus');
          A.go('/siswa');
        };
      };
    }
  });
  function judulRiwayat(r) {
    const pr = R.SINGKAT[r.program] || '';
    return ({ naik: `Naik ke Level ${r.ke} (${pr})`, set: `Level ditetapkan: ${r.dari ? r.dari + ' → ' : ''}${r.ke} (${pr})`, mulai: `Mulai ${R.LABEL[r.program] || ''} Level ${r.ke}`,
      tuntas: r.ke === 'lulus' ? `🎓 Lulus ${R.LABEL[r.program]} Level ${r.dari}` : `★ Tuntas Level ${r.dari} (${pr})`, lanjut: 'Lanjut ke Les Berhitung (Ala)',
      status: r.ke === 'rehat' ? 'Rehat sementara' : 'Aktif kembali' })[r.jenis] || r.jenis;
  }
  A.tulisWA = (s) => {
    const m = U.modal({
      title: 'Kirim WhatsApp ke ' + (s.ortu ? 'Bapak/Ibu ' + s.ortu : s.nama), icon: 'message-circle', sub: esc(U.tampilWa(s.wa)),
      body: `<div class="field"><label>Pesan</label><textarea class="input" id="wa-msg" rows="6">Assalamu'alaikum Bapak/Ibu ${esc(s.ortu || '')}, </textarea></div>`,
      foot: `<a class="btn btn-wa" target="_blank" rel="noopener" data-manual>${icon('external-link')} Buka WhatsApp</a><button class="btn btn-primary" data-kirim>${icon('send')} Kirim otomatis</button>`
    });
    m.$('[data-manual]').onclick = (e) => { e.currentTarget.href = U.waLink(s.wa, m.$('#wa-msg').value); m.close(); };
    m.$('[data-kirim]').onclick = async (e) => { const b = e.currentTarget; b.disabled = true; if (await A.kirimWA({ target: s.wa, pesan: m.$('#wa-msg').value, siswaId: s.id })) m.close(); else b.disabled = false; };
  };

  // ======================================================================
  // IMPOR SISWA DARI EXCEL
  // ======================================================================
  const KOL_IMPOR = [
    ['nama', 'Nama Lengkap*', ['nama lengkap', 'nama siswa', 'nama']], ['panggilan', 'Nama Panggilan', ['panggilan']], ['tempatLahir', 'Tempat Lahir', ['tempat lahir', 'tempat']],
    ['tglLahir', 'Tanggal Lahir', ['tanggal lahir', 'tgl lahir', 'lahir']], ['kelas', 'Kelas', ['kelas']], ['sekolah', 'Nama Sekolah', ['sekolah']], ['ortu', 'Nama Orang Tua', ['orang tua', 'ortu', 'wali']],
    ['kecamatan', 'Kecamatan', ['kecamatan']], ['desa', 'Desa/Kelurahan', ['desa', 'kelurahan']], ['rt', 'RT', ['rt']], ['jalan', 'Jalan', ['jalan', 'alamat']], ['wa', 'Nomor WhatsApp', ['whatsapp', 'wa', 'hp', 'telepon']],
    ['facebook', 'Nama Facebook', ['facebook']], ['infoDari', 'Info Dari', ['info']], ['program', 'Program (Ahe/Ala)', ['program']], ['level', 'Level', ['level']],
    ['status', 'Status (Aktif/Rehat/Lulus)', ['status']], ['buku', 'Punya Buku (Ya/Belum)', ['buku']], ['tglMulai', 'Tanggal Mulai', ['tanggal mulai', 'mulai']]
  ];
  A.page('impor', {
    title: 'Impor Excel', nav: 'siswa', crumb: 'Impor Siswa dari Excel',
    render(view) {
      const ui = A.ui.impor = A.ui.impor || { rows: null, file: '', tab: 'semua', sel: new Set() };
      const r = ui.rows || [];
      const jml = { semua: r.length, siap: r.filter((x) => x.st === 'siap').length, kurang: r.filter((x) => x.st === 'kurang').length, ganda: r.filter((x) => x.st === 'ganda').length };
      const tampil = r.filter((x) => ui.tab === 'semua' || x.st === ui.tab);
      view.innerHTML = `<a class="btn btn-ghost btn-sm mb-12" href="#/siswa">${icon('arrow-left')} Kembali ke Data Siswa</a>
        <div class="page-head"><div><h1>Impor Siswa dari Excel</h1><p>Masukkan data siswa lama sekaligus. Data boleh belum lengkap — hanya <b>Nama Lengkap</b> yang wajib.</p></div></div>
        <div class="stepper mb-16"><div class="step done"><span class="n">${icon('check')}</span><div><b>1. Unduh template</b><div class="tiny muted">Format kolom standar</div></div></div>
          <div class="step ${ui.rows ? 'done' : 'on'}"><span class="n">${ui.rows ? icon('check') : '2'}</span><div><b>2. Unggah berkas</b><div class="tiny muted">${esc(ui.file || '.xlsx / .csv')}</div></div></div>
          <div class="step ${ui.rows ? 'on' : ''}"><span class="n">3</span><div><b>3. Periksa & impor</b><div class="tiny muted">Validasi & konfirmasi</div></div></div></div>
        <div class="split half mb-16"><div class="card card-pad row-gap"><span class="icon-dot ala lg">${icon('file-spreadsheet', 'ic-lg')}</span><div style="flex:1"><b>Template_Impor_Siswa.xlsx</b><div class="small muted">Kolom sesuai formulir + Program, Level, Status, Buku. Sheet kedua berisi petunjuk.</div></div><button class="btn btn-soft" id="i-tpl">${icon('download')} Unduh template</button></div>
          <label class="dropzone" id="i-drop">${icon('upload', 'ic-xl')}<b>${ui.rows ? 'Ganti berkas' : 'Pilih atau seret berkas Excel ke sini'}</b><span class="small muted">.xlsx, .xls, atau .csv</span><input type="file" accept=".xlsx,.xls,.csv" hidden id="i-file"></label></div>
        ${ui.rows ? `<div class="card"><div class="card-head"><h3>${icon('list')} Pratinjau & validasi</h3><div class="row-gap"><span class="chip">Total ${jml.semua}</span><span class="chip chip-ok">Siap ${jml.siap}</span><span class="chip chip-warn">Kurang data ${jml.kurang}</span><span class="chip chip-bad">Dugaan ganda ${jml.ganda}</span></div></div>
          <div class="filters"><div class="tabs">${[['semua', 'Semua'], ['siap', 'Siap'], ['kurang', 'Kurang data'], ['ganda', 'Dugaan ganda']].map(([k, l]) => `<button class="tab ${ui.tab === k ? 'on' : ''}" data-tab="${k}">${l} <span class="n">${jml[k]}</span></button>`).join('')}</div></div>
          <div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr><th class="w-check">${A.cek('data-all', tampil.length && tampil.every((x) => ui.sel.has(x.no)))}</th><th>Baris</th><th>Nama & wali</th><th>Program</th><th>Level</th><th>Tgl lahir</th><th>WhatsApp</th><th>Status validasi</th></tr></thead><tbody>
          ${tampil.slice(0, 300).map((x) => `<tr class="${ui.sel.has(x.no) ? 'sel' : ''}"><td class="w-check">${A.cek(`data-sel="${x.no}"`, ui.sel.has(x.no))}</td><td class="hide-m muted">#${x.no}</td>
            <td class="t-main"><div class="t-name">${esc(x.s.nama || '(tanpa nama)')}</div><div class="t-sub">${x.s.ortu ? 'Ortu: ' + esc(x.s.ortu) : ''}</div></td>
            <td data-l="Program">${x.p ? A.chipProg(x.p) : '<span class="chip chip-outline">Belum ditentukan</span>'}</td><td data-l="Level">${x.p ? 'Level ' + x.p.level : '—'}</td>
            <td data-l="Lahir">${x.s.tglLahir ? esc(U.tgl(x.s.tglLahir)) : '<span class="chip chip-warn chip-sm">Kosong</span>'}</td><td data-l="WA" class="num">${x.s.wa ? esc(U.tampilWa(x.s.wa)) : '<span class="chip chip-warn chip-sm">Kosong</span>'}</td>
            <td data-l="Status">${x.st === 'siap' ? `<span class="chip chip-ok">${icon('check')} Siap</span>` : x.st === 'ganda' ? `<span class="chip chip-bad">${icon('x')} ${esc(x.ket)}</span>` : `<span class="chip chip-warn">${icon('circle-alert')} ${esc(x.ket)}</span>`}</td></tr>`).join('')}
          </tbody></table></div>${tampil.length > 300 ? `<p class="small muted" style="padding:12px 18px">Menampilkan 300 baris pertama dari ${tampil.length}.</p>` : ''}</div>
          <div class="note-box mt-16">${icon('info')}<span><b>Aturan:</b> hanya Nama Lengkap yang wajib. Baris <b>dugaan ganda</b> (nama + tanggal lahir atau nama + WA sama dengan siswa yang sudah ada) tidak dicentang otomatis. Program/level kosong bisa ditetapkan nanti lewat aksi massal.</span></div>
          <div class="bulk inline" style="bottom:84px"><span class="n">${icon('circle-check')} ${ui.sel.size} baris dipilih untuk diimpor</span><div class="acts"></div>
            <button class="btn" id="i-batal">Batal</button><button class="btn hl" id="i-go" ${ui.sel.size ? '' : 'disabled'}>${icon('upload')} Impor ${ui.sel.size} Siswa</button></div>` : ''}`;
      $('#i-tpl').onclick = unduhTemplate;
      const inp = $('#i-file');
      inp.onchange = () => inp.files[0] && baca(inp.files[0]);
      const dz = $('#i-drop');
      dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('over'); };
      dz.ondragleave = () => dz.classList.remove('over');
      dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove('over'); if (e.dataTransfer.files[0]) baca(e.dataTransfer.files[0]); };
      $$('[data-tab]').forEach((b) => b.onclick = () => { ui.tab = b.dataset.tab; A.render(); });
      $$('[data-sel]').forEach((c) => c.onchange = () => { c.checked ? ui.sel.add(+c.dataset.sel) : ui.sel.delete(+c.dataset.sel); A.refresh(true); });
      const all = $('[data-all]'); if (all) all.onchange = () => { tampil.forEach((x) => all.checked ? ui.sel.add(x.no) : ui.sel.delete(x.no)); A.refresh(true); };
      const bt = $('#i-batal'); if (bt) bt.onclick = () => { A.ui.impor = null; A.render(); };
      const go = $('#i-go'); if (go) go.onclick = impor;
    }
  });
  async function unduhTemplate() {
    try {
      const X = await U.lib.xlsx();
      const ws = X.utils.aoa_to_sheet([KOL_IMPOR.map((k) => k[1]), ['Aisyah Putri', 'Ica', 'Sangatta', '2019-03-05', 'TK B', 'TK Pembina', 'Hendra', 'Sangatta Utara', 'Teluk Lingga', '08', 'Jl. Pendidikan No. 4', '081234567890', '', 'Teman', 'Ahe', 3, 'Aktif', 'Ya', '2026-07-01'],
        ['Bima Saputra', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Ala', 7, 'Aktif', 'Belum', '']]);
      ws['!cols'] = KOL_IMPOR.map((k) => ({ wch: Math.max(12, k[1].length + 2) }));
      const pet = X.utils.aoa_to_sheet([['PETUNJUK PENGISIAN'], [''], ['1. Satu baris = satu siswa. Hapus 2 baris contoh sebelum mengimpor.'], ['2. Hanya kolom "Nama Lengkap" yang wajib. Kolom lain boleh dikosongkan.'],
        ['3. Tanggal ditulis YYYY-MM-DD (2019-03-05) atau DD/MM/YYYY (05/03/2019).'], ['4. Program: Ahe (Les Baca, level 1–7) atau Ala (Les Berhitung, level 1–16).'], ['5. Status: Aktif, Rehat, atau Lulus. Kosong = Aktif.'],
        ['6. Punya Buku: Ya atau Belum (untuk buku level saat ini).'], ['7. Nomor WhatsApp boleh 08…, 62…, atau +62….'], ['8. Kode registrasi dibuat otomatis oleh aplikasi.']]);
      pet['!cols'] = [{ wch: 90 }];
      const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Data Siswa'); X.utils.book_append_sheet(wb, pet, 'Petunjuk');
      X.writeFile(wb, 'Template_Impor_Siswa.xlsx');
    } catch (e) { U.toast(e.message, 'bad'); }
  }
  const keTgl = (v) => {
    if (v === null || v === undefined || v === '') return '';
    if (v instanceof Date && !isNaN(v)) { const d = new Date(v.getTime() - v.getTimezoneOffset() * 60000); return d.toISOString().slice(0, 10); }
    if (typeof v === 'number' && v > 1000 && v < 80000) return U.fromUtc(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
    const s = String(v).trim();
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/); if (m) return m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/); if (m) { const y = m[3].length === 2 ? (+m[3] > 50 ? '19' : '20') + m[3] : m[3]; return y + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'); }
    const bl = U.BULAN.findIndex((b) => s.toLowerCase().includes(b.toLowerCase()));
    m = s.match(/(\d{1,2})\s+\D+\s+(\d{4})/); if (m && bl >= 0) return m[2] + '-' + String(bl + 1).padStart(2, '0') + '-' + m[1].padStart(2, '0');
    return '';
  };
  async function baca(file) {
    const ui = A.ui.impor;
    try {
      const X = await U.lib.xlsx();
      const buf = await file.arrayBuffer();
      const wb = X.read(buf, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const aoa = X.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
      const hIdx = aoa.findIndex((r) => r.some((c) => /nama/i.test(String(c))));
      if (hIdx < 0) throw new Error('Kolom "Nama Lengkap" tidak ditemukan di baris judul');
      const head = aoa[hIdx].map((c) => String(c).toLowerCase().replace(/\*/g, '').trim());
      const kol = {};
      KOL_IMPOR.forEach(([k, , alias]) => { const i = head.findIndex((h, j) => !Object.values(kol).includes(j) && alias.some((a) => h === a || h.startsWith(a) || h.includes(a))); if (i >= 0) kol[k] = i; });
      const ada = R.siswaTerdaftar().concat((D().siswa || []).filter((s) => s.statusDaftar === 'menunggu'));
      const kunci = (n) => String(n || '').toLowerCase().replace(/[^a-z]/g, '');
      const lihat = {};
      ui.rows = aoa.slice(hIdx + 1).map((r, i) => {
        const g = (k) => kol[k] === undefined ? '' : r[kol[k]];
        const s = { id: U.uid() };
        ['nama', 'panggilan', 'kelas', 'sekolah', 'ortu', 'kecamatan', 'desa', 'rt', 'jalan', 'facebook', 'infoDari'].forEach((k) => { s[k] = String(g(k) || '').trim(); });
        s.tempatLahir = U.hurufKata(String(g('tempatLahir') || '')); s.tglLahir = keTgl(g('tglLahir')); s.wa = U.normWa(g('wa'));
        if (!s.nama) return null;
        const prRaw = String(g('program') || '').toLowerCase();
        const pr = /ala|hitung/.test(prRaw) ? 'ala' : /ahe|baca/.test(prRaw) ? 'ahe' : '';
        let p = null;
        if (pr) {
          const lv = Math.min(R.MAKS[pr], Math.max(1, parseInt(g('level'), 10) || 1));
          const stRaw = String(g('status') || '').toLowerCase();
          const st = /rehat|cuti|berhenti/.test(stRaw) ? 'rehat' : /lulus/.test(stRaw) ? 'lulus' : 'aktif';
          p = { id: s.id + 'p', siswaId: s.id, program: pr, level: String(lv), status: st, buku: /^(ya|y|sudah|punya)/i.test(String(g('buku'))) ? 'ya' : 'belum', tglMulai: keTgl(g('tglMulai')) || U.today(), tglStatus: U.today(), siapPiagam: '[]' };
        }
        const k1 = kunci(s.nama) + '|' + s.tglLahir, k2 = kunci(s.nama) + '|' + s.wa;
        const dup = ada.find((x) => kunci(x.nama) === kunci(s.nama) && ((s.tglLahir && x.tglLahir === s.tglLahir) || (s.wa && x.wa === s.wa)));
        const dupFile = (s.tglLahir && lihat[k1]) || (s.wa && lihat[k2]);
        lihat[k1] = lihat[k2] = true;
        const kurang = R.WAJIB.filter((k) => !s[k]).length;
        const st = dup || dupFile ? 'ganda' : (kurang || !p) ? 'kurang' : 'siap';
        const ket = dup ? 'Mirip ' + (dup.kode || dup.nama) : dupFile ? 'Ganda dalam berkas' : !p ? 'Program belum ditentukan' : kurang + ' kolom kosong (tetap diimpor)';
        return { no: hIdx + 2 + i, s, p, st, ket };
      }).filter(Boolean);
      ui.file = file.name; ui.tab = 'semua';
      ui.sel = new Set(ui.rows.filter((x) => x.st !== 'ganda').map((x) => x.no));
      if (!ui.rows.length) U.toast('Tidak ada baris data dengan Nama Lengkap', 'warn');
      A.render();
    } catch (e) { U.toast('Berkas tidak dapat dibaca: ' + e.message, 'bad', 6000); }
  }
  function impor() {
    const ui = A.ui.impor;
    const pilih = ui.rows.filter((x) => ui.sel.has(x.no));
    if (!pilih.length) return;
    const now = U.nowIso();
    const siswa = pilih.map((x) => Object.assign({ kode: '', sumber: 'impor', statusDaftar: 'diterima', createdAt: now, updatedAt: now, lengkap: R.lengkap(x.s) ? 'ya' : 'tidak' }, x.s));
    const program = pilih.filter((x) => x.p).map((x) => Object.assign({ updatedAt: now }, x.p));
    const riwayat = program.map((p) => ({ id: U.uid(), siswaId: p.siswaId, programId: p.id, program: p.program, jenis: 'mulai', dari: '', ke: p.level, tanggal: U.today(), catatan: 'Data impor Excel' }));
    A.mut((d) => { d.siswa = d.siswa.concat(siswa); d.program = d.program.concat(program); }, { render: false });
    for (let i = 0; i < siswa.length; i += 150) {
      const part = siswa.slice(i, i + 150); const ids = new Set(part.map((s) => s.id));
      A.kirim({ op: 'imporSiswa', siswa: part.map((s) => x(s)), program: program.filter((p) => ids.has(p.siswaId)), riwayat: riwayat.filter((r) => ids.has(r.siswaId)), _label: 'Impor siswa' });
    }
    function x(s) { const o = Object.assign({}, s); delete o.lengkap; return o; }
    U.toast(`${siswa.length} siswa diimpor · ${program.length} dengan program · ${pilih.filter((y) => y.st === 'kurang').length} perlu dilengkapi`, 'ok', 6000);
    A.ui.impor = null;
    A.go('/siswa');
  }
  A.hasil.imporSiswa = (op, data) => {
    if (!data || !data.kodes) return;
    A.mut((d) => { d.siswa.forEach((s) => { if (data.kodes[s.id]) s.kode = data.kodes[s.id]; }); });
  };
})();
