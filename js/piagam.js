/* ==========================================================================
   MODUL PIAGAM AHE v2.0 (mode tertanam) — Piagam Ahe & Piagam Ala
   Render di <canvas> memakai gambar template + tata letak hasil kalibrasi.
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, icon } = U;
  const A = App;
  const R = Rules;
  const D = () => A.S.data;
  const P = window.Piagam = {};

  // ---------------- Tata letak bawaan (ukuran rujukan) ----------------
  const REF = { ahe: { w: 1491, h: 1054 }, ala: { w: 1486, h: 1059 } };
  const FONT = { nama: ['Nunito Sans', 900], kelompok: ['Nunito Sans', 800], kepala: ['Inter', 700] };
  const fontField = (k) => FONT[k] || ['Inter', 600];
  const BAWAAN = {
    ahe: { nomor: [815, 172, 26, 420, 'center', '#2B1B3D'], nama: [930, 378, 58, 860, 'center', '#C2185B'], ttl: [918, 475, 30, 470, 'left', '#2B1B3D'], unit: [500, 585, 30, 400, 'left', '#2B1B3D'], tglLulus: [1157, 585, 30, 290, 'left', '#2B1B3D'], kepala: [1003, 815, 30, 440, 'center', '#2B1B3D'] },
    ala: { nomor: [715, 465, 26, 420, 'center', '#2B1B3D'], nama: [732, 618, 56, 860, 'center', '#C2185B'], kelompok: [740, 706, 32, 560, 'center', '#2B1B3D'], desa: [645, 747, 24, 230, 'center', '#2B1B3D'], tglLulus: [912, 742, 24, 230, 'center', '#2B1B3D'], kepala: [1190, 945, 30, 380, 'center', '#2B1B3D'] }
  };
  const LABEL = { nomor: 'Nomor', nama: 'Nama Lengkap', ttl: 'Tempat Tgl Lahir', unit: 'Nama Unit', tglLulus: 'Tanggal Lulus', kepala: 'Kepala Unit', kelompok: 'Kelompok', desa: 'Desa / Kelurahan' };
  const WARNA = ['#2B1B3D', '#C2185B', '#6B2F8F', '#0F8B8D', '#B45309', '#1E3A8A', '#000000', '#FFFFFF'];
  const KEL = [R.KELOMPOK.tambahKurang, R.KELOMPOK.kaliBagi];
  const kelompokDariKey = (k) => k === 'kaliBagi' ? R.KELOMPOK.kaliBagi : R.KELOMPOK.tambahKurang;
  const keyDariKelompok = (n) => n === R.KELOMPOK.kaliBagi ? 'kaliBagi' : 'tambahKurang';

  P.layout = (jenis) => {
    const out = {};
    Object.keys(BAWAAN[jenis]).forEach((k) => { const b = BAWAAN[jenis][k]; out[k] = { x: b[0], y: b[1], size: b[2], maxW: b[3], align: b[4], color: b[5], kapital: 'asli' }; });
    try { const s = JSON.parse(D().settings['layout_' + jenis] || 'null'); if (s && s.fields) Object.keys(s.fields).forEach((k) => { if (out[k]) Object.assign(out[k], s.fields[k]); }); } catch (e) { /* bawaan */ }
    return out;
  };
  const kapital = (t, m) => m === 'besar' ? String(t).toUpperCase() : m === 'kata' ? U.hurufKata(t) : String(t);

  // ---------------- Template gambar (IndexedDB berversi) ----------------
  const memTpl = {};
  P.template = async (jenis) => {
    const meta = (D().templateFiles || {})[jenis];
    if (!meta || !meta.id) return null;
    const ver = meta.id + '_' + meta.updated;
    if (memTpl[jenis] && memTpl[jenis].ver === ver) return memTpl[jenis].img;
    let simpan = await U.idb.get('tpl_' + jenis);
    if (!simpan || simpan.ver !== ver) {
      const r = await U.api('getTemplate', { token: A.S.token, jenis }, { timeout: 90000 });
      if (!r) return null;
      simpan = { ver, src: 'data:' + r.mime + ';base64,' + r.base64 };
      U.idb.set('tpl_' + jenis, simpan);
    }
    const img = await U.muatGambar(simpan.src);
    memTpl[jenis] = { ver, img };
    return img;
  };
  // Template sementara bila belum ada gambar resmi (agar alur tetap bisa diuji)
  function templateSementara(jenis) {
    const { w, h } = REF[jenis];
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    const pc = getComputedStyle(document.documentElement).getPropertyValue('--p').trim() || '#6B2F8F';
    x.fillStyle = '#FFFBF0'; x.fillRect(0, 0, w, h);
    x.strokeStyle = pc; x.lineWidth = 26; x.strokeRect(28, 28, w - 56, h - 56);
    x.strokeStyle = '#E8B930'; x.lineWidth = 6; x.strokeRect(58, 58, w - 116, h - 116);
    x.fillStyle = '#FFC93C'; [[90, 90], [w - 90, 90], [90, h - 90], [w - 90, h - 90]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 16, 0, 7); x.fill(); });
    x.textAlign = 'center'; x.fillStyle = pc;
    const t = (s, px, py, sz, wt, col) => { x.font = `${wt || 700} ${sz}px "Nunito Sans", Arial`; x.fillStyle = col || '#2B1B3D'; x.fillText(s, px, py); };
    const garis = (x1, x2, y) => { x.strokeStyle = '#CDB98A'; x.lineWidth = 2; x.setLineDash([6, 6]); x.beginPath(); x.moveTo(x1, y); x.lineTo(x2, y); x.stroke(); x.setLineDash([]); };
    if (jenis === 'ahe') {
      t('PIAGAM KELULUSAN', w / 2 + 70, 118, 62, 900, pc); t('Nomor:', 600, 172, 24, 600, '#6B5F78');
      t('Diberikan kepada', 930, 300, 30, 600, '#6B5F78'); garis(500, 1360, 395);
      x.textAlign = 'right'; t('Tempat, Tanggal Lahir :', 900, 475, 28, 600, '#6B5F78'); garis(918, 1390, 485);
      x.textAlign = 'center'; t('telah lulus Program Membaca Ahe', w / 2, 535, 26, 600, '#6B5F78'); x.textAlign = 'right'; t('Unit :', 490, 585, 26, 600, '#6B5F78'); garis(500, 900, 595);
      t('Tanggal :', 1147, 585, 26, 600, '#6B5F78'); garis(1157, 1447, 595); x.textAlign = 'center';
      t('Kepala Unit,', 1003, 700, 28, 700); garis(783, 1223, 825);
      x.fillStyle = '#FFC93C'; x.beginPath(); x.arc(250, 820, 90, 0, 7); x.fill(); t('AHE', 250, 835, 46, 900, pc);
    } else {
      t('PIAGAM KELULUSAN', w / 2, 300, 62, 900, pc); t('Program Berhitung Ala', w / 2, 360, 32, 700, '#0F8B8D');
      t('Nomor', 715, 430, 22, 600, '#6B5F78'); t('Diberikan kepada', 732, 560, 28, 600, '#6B5F78'); garis(302, 1162, 632);
      t('Desa/Kelurahan', 645, 790, 20, 600, '#6B5F78'); t('Tanggal Lulus', 912, 790, 20, 600, '#6B5F78');
      t('Kepala Unit,', 1190, 850, 26, 700); garis(1000, 1380, 955);
      x.fillStyle = '#FFC93C'; x.beginPath(); x.arc(250, 220, 90, 0, 7); x.fill(); t('ALA', 250, 235, 46, 900, '#0F8B8D');
    }
    x.font = '600 20px Inter, Arial'; x.fillStyle = '#B45309'; x.textAlign = 'center';
    x.fillText('TEMPLATE SEMENTARA — unggah gambar template resmi di Pengaturan → Piagam', w / 2, h - 80);
    return c;
  }
  let fontSiap = null;
  const tungguFont = () => fontSiap || (fontSiap = Promise.race([
    Promise.all(['900 58px "Nunito Sans"', '800 32px "Nunito Sans"', '600 30px Inter', '700 30px Inter'].map((f) => document.fonts.load(f))),
    new Promise((r) => setTimeout(r, 3500))
  ]).catch(() => { }));

  // ---------------- Render ----------------
  P.nilai = (jenis, rec) => ({
    nomor: rec.nomor || '', nama: rec.nama || '', ttl: rec.ttl || '', unit: rec.unit || '', kelompok: rec.kelompok || '', desa: rec.desa || '',
    tglLulus: rec.tglLulus ? U.tglPanjang(rec.tglLulus) : '', kepala: rec.kepala || ''
  });
  P.render = async (canvas, jenis, rec, opt) => {
    opt = opt || {};
    await tungguFont();
    let img = null;
    try { img = await P.template(jenis); } catch (e) { img = null; if (!opt.diam) U.toast('Template tidak dapat dimuat: ' + e.message, 'warn'); }
    const src = img || templateSementara(jenis);
    const W = src.naturalWidth || src.width, H = src.naturalHeight || src.height;
    canvas.width = W; canvas.height = H;
    const x = canvas.getContext('2d');
    x.clearRect(0, 0, W, H);
    x.drawImage(src, 0, 0, W, H);
    const sx = W / REF[jenis].w, sy = H / REF[jenis].h;
    const lay = opt.layout || P.layout(jenis);
    const v = P.nilai(jenis, rec);
    const kotak = {};
    Object.keys(lay).forEach((k) => {
      const f = lay[k];
      const teks = kapital(v[k], f.kapital);
      const [fam, wt] = fontField(k);
      const px = f.x * sx, py = f.y * sy, maxW = f.maxW * sx;
      let size = f.size * sx;
      x.textAlign = f.align; x.textBaseline = 'alphabetic'; x.fillStyle = f.color;
      x.font = `${wt} ${size}px "${fam}", Arial`;
      let lebar = teks ? x.measureText(teks).width : 0;
      if (lebar > maxW) { size = Math.max(f.size * sx * 0.7, size * maxW / lebar); x.font = `${wt} ${size}px "${fam}", Arial`; lebar = x.measureText(teks).width; }
      if (teks) {
        if (lebar > maxW) { const k2 = maxW / lebar; x.save(); x.translate(px, py); x.scale(k2, 1); x.fillText(teks, 0, 0); x.restore(); lebar = maxW; }
        else x.fillText(teks, px, py);
      }
      const kiri = f.align === 'center' ? px - maxW / 2 : f.align === 'right' ? px - maxW : px;
      kotak[k] = { x: kiri, y: py - size, w: maxW, h: size * 1.25 };
      if (opt.bantu) {
        x.save(); x.strokeStyle = k === opt.pilih ? '#F58220' : 'rgba(107,47,143,.55)'; x.lineWidth = k === opt.pilih ? 4 : 2; x.setLineDash(k === opt.pilih ? [] : [8, 6]);
        x.strokeRect(kiri, py - size, maxW, size * 1.25);
        x.fillStyle = k === opt.pilih ? '#F58220' : 'rgba(107,47,143,.8)'; x.beginPath(); x.arc(px, py, 7, 0, 7); x.fill();
        x.font = '700 18px Inter, Arial'; x.textAlign = 'left'; x.fillText(LABEL[k], kiri, py - size - 8);
        x.restore();
      }
    });
    return { kotak, sx, sy, W, H, sementara: !img };
  };

  // ---------------- Unduh ----------------
  const namaBerkas = (jenis, rec, ext) => 'Piagam-' + (jenis === 'ahe' ? 'Ahe' : 'Ala') + '_' + U.namaFile(rec.nama || 'Siswa') + '.' + ext;
  const iOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  P.unduhJpg = (canvas, jenis, rec) => new Promise((res) => canvas.toBlob((b) => { U.unduhBlob(b, namaBerkas(jenis, rec, 'jpg')); if (iOS()) U.toast('Di iPhone: ketuk Bagikan → Simpan ke Berkas', 'info', 6000); res(); }, 'image/jpeg', 0.95));
  P.unduhPdf = async (canvas, jenis, rec) => {
    const JsPDF = await U.lib.pdf();
    const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297, H = 210, r = canvas.width / canvas.height;
    let w = W, h = W / r; if (h > H) { h = H; w = H * r; }
    doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', (W - w) / 2, (H - h) / 2, w, h);
    doc.save(namaBerkas(jenis, rec, 'pdf'));
    if (iOS()) U.toast('Di iPhone: ketuk Bagikan → Simpan ke Berkas', 'info', 6000);
  };

  // ---------------- Nomor berikutnya ----------------
  // Nomor piagam = No. Unit (4 digit, Pengaturan → Identitas), sama untuk semua piagam. Contoh: 3924
  P.formatNomor = (n, jenis, tgl, noUnit) => String(noUnit || '').trim();
  P.nomorOtomatis = () => P.formatNomor(0, '', '', (D().settings || {}).no_unit);
  P.nomorBerikut = (nomor) => String(nomor || '').replace(/\d+/, (m) => String(+m + 1).padStart(m.length, '0'));

  // ======================================================================
  // HALAMAN PIAGAM
  // ======================================================================
  A.page('piagam', {
    title: 'Piagam', crumb: 'Piagam Kelulusan', wakil: true,
    render(view, params) {
      const sub = params[0] || 'siap';
      const pr = R.peringatan();
      const jml = (D().piagam.ahe || []).length + (D().piagam.ala || []).length;
      const atas = `<div class="page-head"><div><h1>Piagam Kelulusan</h1><p>Buat piagam dari siswa yang sudah tuntas tanpa mengetik ulang datanya. Unduh dalam PDF (A4 landscape) atau JPG.</p></div>
        <div class="actions">${A.S.role === 'admin' ? `<a class="btn btn-light" href="#/pengaturan/piagam">${icon('settings')} Pengaturan Piagam</a>` : `<span class="chip">${icon('lock', 'ic-sm')} Template & posisi teks diatur admin utama</span>`}</div></div>
        <div class="tabs mb-16"><a class="tab ${sub === 'siap' ? 'on' : ''}" href="#/piagam/siap">${icon('sparkles', 'ic-sm')} Siap Dibuat <span class="n">${pr.piagam.length}</span></a>
          <a class="tab ${sub === 'buat' || sub === 'edit' ? 'on' : ''}" href="#/piagam/buat/ahe">${icon('square-pen', 'ic-sm')} Buat Piagam</a>
          <a class="tab ${sub === 'daftar' ? 'on' : ''}" href="#/piagam/daftar">${icon('list', 'ic-sm')} Daftar Piagam <span class="n">${jml}</span></a></div>`;
      if (sub === 'buat' || sub === 'edit') return formulir(view, atas, params);
      if (sub === 'hasil') return hasil(view, params[1], params[2]);
      if (sub === 'daftar') return daftar(view, atas);
      return siap(view, atas, pr.piagam);
    }
  });

  function siap(view, atas, list) {
    view.innerHTML = atas + `<div class="note-box mb-16">${icon('info')}<span>Siswa yang dituntaskan di <b>Baca Level 7</b>, <b>Berhitung Level 6</b>, atau <b>Berhitung Level 16</b> otomatis masuk daftar ini. Setelah piagam disimpan, siswa hilang dari daftar.</span></div>
      ${list.length ? `<div class="cards-3" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px">${list.map((x) => {
        const jenis = x.k === 'ahe' ? 'ahe' : 'ala';
        return `<div class="card card-pad" style="position:relative"><span style="position:absolute;top:-10px;right:14px" class="icon-dot sm sun">${icon('star')}</span>
          <div class="person">${U.avatar(x.s.nama, x.s.id, 'av-lg')}<div><h4>${esc(x.s.nama)}${x.s.panggilan ? ` <span class="muted small">(${esc(x.s.panggilan)})</span>` : ''}</h4><div class="small muted">${esc(x.s.kode)}</div></div></div>
          <span class="chip ${jenis === 'ala' ? 'chip-ala' : 'chip-ahe'} mt-12">${icon(jenis === 'ala' ? 'calculator' : 'book-open')} ${esc(R.SIAP_LABEL[x.k])}</span>
          <div class="card soft card-pad mt-12 small" style="padding:10px 12px">${icon('award', 'ic-sm')} Tuntas Level ${x.k === 'ahe' ? 7 : x.k === 'tambahKurang' ? 6 : 16}${x.p.tglStatus ? ' · ' + esc(U.tglPanjang(x.p.tglStatus)) : ''}</div>
          <a class="btn btn-accent btn-block mt-12" href="#/piagam/buat/${jenis}/${x.s.id}/${x.k}">Buat Piagam Sekarang ${icon('arrow-right')}</a></div>`;
      }).join('')}</div>` : `<div class="card">${A.kosong('award', 'Belum ada siswa yang siap dibuatkan piagam', 'Tuntaskan siswa di level akhir dari menu Siswa (aksi massal → Tuntaskan).', '<a class="btn btn-soft" href="#/piagam/buat/ahe">' + icon('square-pen') + ' Buat piagam manual</a>')}</div>`}`;
  }

  // ---------------- Formulir buat / edit ----------------
  const DRAFT = (j) => 'ahe_piagam_draft_' + j;
  function formulir(view, atas, params) {
    const edit = params[0] === 'edit';
    const jenis = params[1] === 'ala' ? 'ala' : 'ahe';
    const set = D().settings;
    let rec, siswaId = '', kKey = '';
    if (edit) {
      rec = Object.assign({}, (D().piagam[jenis] || []).find((r) => r.id === params[2]) || null);
      if (!rec.id) { view.innerHTML = atas + `<div class="card">${A.kosong('search', 'Piagam tidak ditemukan')}</div>`; return; }
      siswaId = rec.siswaId;
    } else {
      siswaId = params[2] || ''; kKey = params[3] || '';
      const s = siswaId && R.idx().siswa[siswaId];
      // Draf tersimpan dipakai bila milik siswa yang sama (mis. kembali dari "Atur Posisi Teks")
      const dr = U.ls.get(DRAFT(jenis), null);
      const pakaiDraf = dr && (s ? dr.siswaId === s.id : !dr.siswaId);
      const tgl = U.today();
      rec = pakaiDraf ? Object.assign({}, dr, dr._nomorAuto ? { nomor: P.nomorOtomatis(jenis, tgl) } : {}) : { nomor: P.nomorOtomatis(jenis, tgl), kepala: set.kepala_unit || '', tglLulus: tgl, _nomorAuto: true };
      if (!pakaiDraf) {
        if (jenis === 'ahe') rec.unit = set.nama_unit || ''; else rec.desa = set.desa || '';
        if (s) {
          rec.nama = s.nama;
          rec.ttl = [U.hurufKata(s.tempatLahir || ''), s.tglLahir ? U.tglPanjang(s.tglLahir) : ''].filter(Boolean).join(', ');
          if (jenis === 'ala') rec.kelompok = kelompokDariKey(kKey || ((R.siap(R.prog(s.id) || {})[0]) || 'tambahKurang'));
          rec.siswaId = s.id;
        }
      }
      if (jenis === 'ala' && !rec.kelompok) rec.kelompok = KEL[0];
    }
    const s = siswaId && R.idx().siswa[siswaId];
    const fieldsAhe = [['nomor', 'Nomor'], ['nama', 'Nama Lengkap', 1], ['ttl', 'Tempat Tgl Lahir', 1], ['unit', 'Nama Unit Pembelajaran'], ['tglLulus', 'Tanggal Kelulusan'], ['kepala', 'Nama Kepala Unit']];
    const fieldsAla = [['nomor', 'Nomor'], ['nama', 'Nama Lengkap', 1], ['kelompok', 'Kelompok', 1], ['desa', 'Desa / Kelurahan'], ['tglLulus', 'Tanggal Kelulusan'], ['kepala', 'Nama Kepala Unit']];
    const fields = jenis === 'ahe' ? fieldsAhe : fieldsAla;
    view.innerHTML = atas + `<div class="split"><div class="card card-pad"><div class="row-gap mb-16"><h3 style="flex:1">${edit ? 'Edit' : 'Buat'} Piagam ${jenis === 'ahe' ? 'Ahe (Membaca)' : 'Ala (Berhitung)'}</h3>
        ${edit ? '' : `<div class="seg"><a href="#/piagam/buat/ahe${s ? '/' + s.id : ''}" class="${jenis === 'ahe' ? 'on' : ''}" style="padding:8px 14px;border-radius:10px;font-weight:700">Ahe</a><a href="#/piagam/buat/ala${s ? '/' + s.id : ''}" class="${jenis === 'ala' ? 'on' : ''}" style="padding:8px 14px;border-radius:10px;font-weight:700">Ala</a></div>`}</div>
      <div class="note-box mb-16">${icon('wand-sparkles')}<span>${s ? `Data siswa: <b>${esc(s.nama)}</b> (${esc(s.kode)}) — terisi otomatis.` : 'Belum ada siswa terpilih. Pilih siswa agar data terisi otomatis, atau ketik manual.'} <a href="#" id="pg-pilih" style="font-weight:700">${s ? 'Ganti siswa' : 'Pilih siswa'}</a></span></div>
      <form class="form-stack" id="fpg" autocomplete="off">${fields.map(([k, l, req]) => `<div class="field"><label>${l}${req ? '<span class="req">*</span>' : ''}</label>${
        k === 'kelompok' ? `<select class="input" name="kelompok">${KEL.map((x) => `<option ${rec.kelompok === x ? 'selected' : ''}>${x}</option>`).join('')}</select>`
        : k === 'tglLulus' ? `<input class="input" type="date" name="tglLulus" value="${esc(rec.tglLulus || U.today())}">`
        : `<input class="input" name="${k}" value="${esc(rec[k] || '')}" maxlength="150">`}${k === 'nomor' ? `<span class="help">${icon('info', 'ic-sm')} ${set.no_unit ? 'Otomatis dari No. Unit (' + esc(set.no_unit) + ')' : 'Isi <a href="#/pengaturan/identitas">No. Unit</a> agar nomor terisi otomatis'}</span>` : ''}</div>`).join('')}
        <div class="row-gap">${A.S.role === 'admin' ? `<a class="btn btn-light btn-sm" href="#/pengaturan/piagam?kal=${jenis}&dari=buat&kembali=${encodeURIComponent(location.hash)}" id="pg-atur">${icon('move')} Atur Posisi Teks</a>` : ''}<span class="spacer"></span>${edit ? `<a class="btn btn-light" href="#/piagam/hasil/${jenis}/${rec.id}">Batal</a>` : ''}<button class="btn btn-primary btn-lg" type="submit" id="pg-simpan">${icon('save')} Simpan & Lihat Hasil</button></div></form></div>
      <div class="card card-pad" style="align-self:start;position:sticky;top:80px"><div class="row-gap mb-12"><h4 style="flex:1">${icon('eye')} Pratinjau langsung</h4><span class="chip" id="pg-tpl">A4 landscape</span></div><div class="canvas-wrap"><canvas id="pg-cv"></canvas></div></div></div>`;
    const f = $('#fpg'), cv = $('#pg-cv');
    if (window.innerWidth >= 1100) $('.split', view).style.gridTemplateColumns = 'minmax(0,0.9fr) minmax(0,1.1fr)';
    const baca = () => { const o = Object.assign({}, rec); fields.forEach(([k]) => { o[k] = f[k].value.trim(); }); o.siswaId = siswaId; return o; };
    const gambar = U.debounce(async () => { const r = await P.render(cv, jenis, baca(), { diam: true }); const t = $('#pg-tpl'); if (t) t.textContent = r.sementara ? 'Template sementara' : 'Template resmi'; }, 120);
    gambar();
    const simpanDraf = () => { if (!edit) U.ls.set(DRAFT(jenis), Object.assign(baca(), { _nomorAuto: rec._nomorAuto })); };
    simpanDraf(); // isian langsung tersimpan, agar tetap utuh setelah "Atur Posisi Teks"
    f.addEventListener('input', (e) => {
      if (e.target.name === 'nomor') rec._nomorAuto = false;
      if (e.target.name === 'tglLulus' && rec._nomorAuto && !edit && f.tglLulus.value) f.nomor.value = P.nomorOtomatis(jenis, f.tglLulus.value);
      gambar(); simpanDraf();
    });
    f.addEventListener('change', (e) => { if (e.target.name === 'tglLulus' && rec._nomorAuto && !edit && f.tglLulus.value) { f.nomor.value = P.nomorOtomatis(jenis, f.tglLulus.value); simpanDraf(); } gambar(); });
    if (f.ttl) f.ttl.onblur = () => { const v = f.ttl.value; const i = v.indexOf(','); f.ttl.value = i > 0 ? U.hurufKata(v.slice(0, i)) + v.slice(i) : U.hurufKata(v); gambar(); };
    $('#pg-pilih').onclick = (e) => { e.preventDefault(); pilihSiswa(jenis); };
    let terkunci = false;
    f.onsubmit = (e) => {
      e.preventDefault();
      if (terkunci) return; // klik berulang tetap satu piagam
      const o = baca();
      if (!o.nama) return U.toast('Nama Lengkap wajib diisi', 'warn');
      if (jenis === 'ahe' && !o.ttl) return U.toast('Tempat Tgl Lahir wajib diisi', 'warn');
      terkunci = true; $('#pg-simpan').disabled = true;
      const baru = !edit;
      const r = Object.assign({}, o, { id: o.id || U.uid(), updatedAt: U.nowIso(), createdAt: o.createdAt || U.nowIso() });
      delete r.jenis; delete r._nomorAuto;
      A.mut((d) => {
        const list = d.piagam[jenis] = d.piagam[jenis] || [];
        const i = list.findIndex((x) => x.id === r.id); if (i >= 0) list[i] = r; else list.push(r);
      }, { render: false });
      A.kirim({ op: 'upsert', jenis, record: r, _label: 'Piagam ' + r.nama });
      // Hapus tanda "siap piagam" pada program siswa
      if (siswaId) {
        const key = jenis === 'ahe' ? 'ahe' : keyDariKelompok(r.kelompok);
        const p = R.programs(siswaId).find((x) => R.siap(x).includes(key));
        if (p) { const q = Object.assign({}, p); q.siapPiagam = R.siap(p).filter((k) => k !== key); A.aksi.terapkan([{ p: q }], 'Status siap piagam'); }
      }
      if (baru) U.ls.del(DRAFT(jenis));
      U.toast('Piagam ' + r.nama + ' disimpan');
      A.go('/piagam/hasil/' + jenis + '/' + r.id);
    };
  }
  function pilihSiswa(jenis) {
    const list = R.siswaTerdaftar().slice().sort((a, b) => a.nama.localeCompare(b.nama));
    const m = U.modal({ title: 'Pilih siswa', icon: 'users', body: `<div class="input-icon mb-12">${icon('search')}<input class="input" id="ps-q" placeholder="Cari nama atau kode…" autofocus></div><div class="slist" id="ps-l" style="max-height:52dvh;overflow:auto"></div>`, foot: false });
    const g = (q) => { q = (q || '').toLowerCase(); m.$('#ps-l').innerHTML = list.filter((s) => !q || (s.nama + s.kode + s.panggilan).toLowerCase().includes(q)).slice(0, 60).map((s) => { const p = R.prog(s.id); return `<div class="sitem" data-id="${s.id}">${U.avatar(s.nama, s.id)}<div class="meta"><div class="nm">${esc(s.nama)}</div><div class="tiny muted">${esc(s.kode)}</div></div>${p ? A.chipProg(p, true) : ''}</div>`; }).join('') || '<p class="small muted">Tidak ditemukan.</p>'; m.$$('[data-id]').forEach((el) => el.onclick = () => { m.close(); U.ls.del(DRAFT(jenis)); A.go('/piagam/buat/' + jenis + '/' + el.dataset.id); }); };
    g(''); m.$('#ps-q').oninput = (e) => g(e.target.value);
  }

  // ---------------- Hasil ----------------
  function hasil(view, jenisP, id) {
    const jenis = jenisP === 'ala' ? 'ala' : 'ahe';
    const rec = (D().piagam[jenis] || []).find((r) => r.id === id);
    if (!rec) { view.innerHTML = `<div class="card">${A.kosong('award', 'Piagam tidak ditemukan', '', '<a class="btn btn-primary" href="#/piagam/daftar">Daftar piagam</a>')}</div>`; return; }
    view.innerHTML = `<a class="btn btn-ghost btn-sm mb-12" href="#/piagam/daftar">${icon('arrow-left')} Daftar Piagam</a>
      <div class="page-head"><div><h1>${esc(rec.nama)}</h1><p>${jenis === 'ahe' ? 'Piagam Ahe — Lulus Membaca' : 'Piagam Ala — ' + esc(rec.kelompok)} · ${esc(rec.nomor || '')} · ${esc(U.tglPanjang(rec.tglLulus))}</p></div>
        <div class="actions"><button class="btn btn-primary" data-pdf>${icon('download')} Unduh PDF</button><button class="btn btn-light" data-jpg>${icon('image')} Unduh JPG</button>
          <a class="btn btn-light" href="#/piagam/edit/${jenis}/${rec.id}">${icon('pencil')} Edit</a><a class="btn btn-soft" href="#/piagam/buat/${jenis}">${icon('plus')} Buat Baru</a></div></div>
      <div class="canvas-wrap" style="cursor:zoom-in" id="hs-wrap"><canvas id="hs-cv"></canvas></div><p class="tiny muted mt-8" style="text-align:center">Ketuk gambar untuk tampilan layar penuh</p>`;
    const cv = $('#hs-cv');
    const siap = P.render(cv, jenis, rec);
    const kunci = (b, fn) => async () => { b.disabled = true; try { await siap; await fn(); } catch (e) { U.toast(e.message, 'bad'); } b.disabled = false; };
    const bp = $('[data-pdf]'); bp.onclick = kunci(bp, () => P.unduhPdf(cv, jenis, rec));
    const bj = $('[data-jpg]'); bj.onclick = kunci(bj, () => P.unduhJpg(cv, jenis, rec));
    $('#hs-wrap').onclick = async () => {
      await siap;
      const lb = document.createElement('div'); lb.className = 'lightbox'; lb.style.overflow = 'auto'; lb.style.display = 'block'; lb.style.cursor = 'auto';
      lb.innerHTML = `<button class="btn btn-light btn-icon" style="position:fixed;top:12px;right:12px;z-index:2" aria-label="Tutup">${icon('x')}</button><img src="${cv.toDataURL('image/jpeg', 0.9)}" alt="Piagam" style="max-height:none;max-width:none;width:max(100%,1200px);border-radius:0;touch-action:pinch-zoom">`;
      lb.querySelector('button').onclick = () => lb.remove();
      document.body.appendChild(lb);
    };
  }

  // ---------------- Daftar ----------------
  function daftar(view, atas) {
    const ui = A.ui.pgDaftar = A.ui.pgDaftar || { q: '', jenis: '', bulan: '' };
    const semua = [].concat((D().piagam.ahe || []).map((r) => Object.assign({ jenis: 'ahe' }, r)), (D().piagam.ala || []).map((r) => Object.assign({ jenis: 'ala' }, r)))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    const bulan = Array.from(new Set(semua.map((r) => String(r.tglLulus).slice(0, 7)))).sort().reverse();
    const q = ui.q.toLowerCase();
    const rows = semua.filter((r) => (!ui.jenis || (ui.jenis === 'ahe' ? r.jenis === 'ahe' : r.jenis === 'ala' && keyDariKelompok(r.kelompok) === ui.jenis.split(':')[1])) && (!ui.bulan || String(r.tglLulus).slice(0, 7) === ui.bulan) && (!q || (r.nama + ' ' + r.nomor).toLowerCase().includes(q)));
    view.innerHTML = atas + `<div class="card mb-12"><div class="filters"><div class="input-icon search">${icon('search')}<input class="input" id="pd-q" placeholder="Cari nama atau nomor piagam…" value="${esc(ui.q)}"></div>
        <select class="input" id="pd-j"><option value="">Semua jenis</option><option value="ahe" ${ui.jenis === 'ahe' ? 'selected' : ''}>Piagam Ahe</option><option value="ala:tambahKurang" ${ui.jenis === 'ala:tambahKurang' ? 'selected' : ''}>Ala · Tambah & Kurang</option><option value="ala:kaliBagi" ${ui.jenis === 'ala:kaliBagi' ? 'selected' : ''}>Ala · Kali & Bagi</option></select>
        <select class="input" id="pd-b"><option value="">Semua bulan lulus</option>${bulan.map((b) => `<option value="${b}" ${ui.bulan === b ? 'selected' : ''}>${U.bulan(b)}</option>`).join('')}</select></div></div>
      <div class="card">${rows.length ? `<div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr><th>Nama</th><th>Jenis</th><th>Nomor</th><th>Tgl lulus</th><th class="t-right">Aksi</th></tr></thead><tbody>${rows.map((r) => `<tr>
        <td class="t-main"><div class="person">${U.avatar(r.nama, r.siswaId || r.id, 'av-sm')}<div><div class="t-name">${esc(r.nama)}</div>${r.siswaId && R.idx().siswa[r.siswaId] ? `<div class="t-sub">${esc(R.idx().siswa[r.siswaId].kode)}</div>` : ''}</div></div></td>
        <td data-l="Jenis">${r.jenis === 'ahe' ? `<span class="chip chip-ahe">${icon('book-open')} Ahe</span>` : `<span class="chip chip-ala">${icon('calculator')} Ala · ${keyDariKelompok(r.kelompok) === 'kaliBagi' ? 'Kali & Bagi' : 'Tambah & Kurang'}</span>`}</td>
        <td data-l="Nomor" class="num small">${esc(r.nomor || '-')}</td><td data-l="Lulus">${esc(U.tgl(r.tglLulus))}</td>
        <td class="t-actions t-right"><div class="row-gap" style="justify-content:flex-end"><a class="btn btn-light btn-sm" href="#/piagam/hasil/${r.jenis}/${r.id}">${icon('download')} Unduh</a><a class="btn btn-ghost btn-icon btn-sm" href="#/piagam/edit/${r.jenis}/${r.id}" title="Edit">${icon('pencil')}</a>${A.S.role === 'admin' ? `<button class="btn btn-danger-ghost btn-icon btn-sm" data-del="${r.jenis}|${r.id}" title="Hapus">${icon('trash-2')}</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>`
        : A.kosong('award', semua.length ? 'Tidak ada yang cocok' : 'Belum ada piagam', '')}</div>`;
    $('#pd-q').oninput = U.debounce((e) => { ui.q = e.target.value; A.refresh(true); const i = $('#pd-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200);
    $('#pd-j').onchange = (e) => { ui.jenis = e.target.value; A.render(); };
    $('#pd-b').onchange = (e) => { ui.bulan = e.target.value; A.render(); };
    $$('[data-del]').forEach((b) => b.onclick = async () => {
      const [j, id] = b.dataset.del.split('|'); const r = semua.find((x) => x.id === id);
      if (!(await U.confirm({ danger: true, title: 'Hapus piagam ' + r.nama + '?', text: 'Piagam dihapus permanen. Siswa tidak otomatis kembali ke daftar Siap Dibuat.', ok: 'Hapus' }))) return;
      A.mut((d) => { d.piagam[j] = d.piagam[j].filter((x) => x.id !== id); });
      A.kirim({ op: 'delete', jenis: j, id, _label: 'Hapus piagam' });
    });
  }

  // ======================================================================
  // PENGATURAN PIAGAM (tab di Pengaturan): Template Isian, File Template, Kalibrasi
  // ======================================================================
  P.pengaturan = (el) => {
    const qs = A.rute().qs || new URLSearchParams();
    const ui = A.ui.pgSet = A.ui.pgSet || { sub: 'file', kal: 'ahe', pilih: 'nama', bantu: true, langkah: 5, data: 'form', undo: [] };
    if (ui.sub === 'isian') ui.sub = 'file';
    if (qs.get('kal') && ui._qs !== qs.toString()) { ui._qs = qs.toString(); ui.sub = 'kal'; ui.kal = qs.get('kal') === 'ala' ? 'ala' : 'ahe'; ui.dari = qs.get('dari'); ui.kembali = qs.get('kembali') || ''; }
    el.innerHTML = `<div class="note-box mb-16">${icon('info')}<span>Nomor piagam, Nama Kepala Unit, Unit Pembelajaran (Ahe), dan Desa/Kelurahan (Ala) terisi otomatis dari <a href="#/pengaturan/identitas" style="font-weight:700">Pengaturan → Identitas</a>.</span></div>
      <div class="utabs mb-16">${[['file', 'File Template', 'image'], ['kal', 'Kalibrasi Posisi Teks', 'move']].map(([k, l, ic]) => `<button class="utab ${ui.sub === k ? 'on' : ''}" data-sub="${k}">${icon(ic)} ${l}</button>`).join('')}</div><div id="pg-set"></div>`;
    $$('[data-sub]', el).forEach((b) => b.onclick = () => { ui.sub = b.dataset.sub; P.pengaturan(el); });
    const box = $('#pg-set', el);
    if (ui.sub === 'file') return fileTemplate(box);
    return kalibrasi(box, ui);
  };
  function fileTemplate(box) {
    const meta = D().templateFiles || {};
    box.innerHTML = `<div class="split half">${['ahe', 'ala'].map((j) => { const m = meta[j]; return `<div class="card card-pad" data-tj="${j}"><div class="row-gap mb-12"><h3 style="flex:1">Template Piagam ${j === 'ahe' ? 'Ahe' : 'Ala'}</h3>${m ? '<span class="chip chip-ok">Aktif</span>' : '<span class="chip chip-warn">Belum ada</span>'}</div>
        <div class="canvas-wrap dropzone" style="padding:0;min-height:160px;display:grid;place-items:center" data-drop="${j}"><canvas data-cv="${j}"></canvas></div>
        <div class="small muted mt-12">${m ? `${esc(m.name)} · ${(m.size / 1024).toFixed(0)} KB · ${esc(String(m.updated).slice(0, 10))}` : 'Seret gambar ke kotak di atas atau tekan Unggah.'}</div>
        <button class="btn btn-primary btn-block mt-12" data-up="${j}">${icon('upload')} ${m ? 'Ganti' : 'Unggah'} template</button></div>`; }).join('')}</div>
      <div class="card card-pad mt-16 row-gap"><div style="flex:1"><b>Muat ulang dari Google Drive</b><div class="small muted">Untuk gambar yang ditaruh langsung di folder Piagam AHE/Template/Ahe atau /Ala. Template lama dipindah ke folder Arsip, tidak dihapus.</div></div><button class="btn btn-light" id="pg-refresh">${icon('folder-sync')} Muat ulang</button></div>
      <p class="help mt-12">${icon('info', 'ic-sm')} Format JPG/PNG, maks 8 MB. Gambar dikompres otomatis (sisi terpanjang 2000 px).</p>`;
    ['ahe', 'ala'].forEach((j) => { P.render($(`[data-cv="${j}"]`, box), j, contohData(j), { diam: true }); });
    const unggah = async (j, file) => {
      if (!file || !/image\/(jpeg|png)/.test(file.type)) return U.toast('Pilih gambar JPG atau PNG', 'warn');
      if (file.size > 8 * 1024 * 1024) return U.toast('Maksimal 8 MB', 'warn');
      const btn = $(`[data-up="${j}"]`, box); btn.disabled = true; btn.innerHTML = `${icon('loader-circle', 'spin')} Mengunggah…`;
      try {
        const img = await U.muatGambar(await U.bacaFile(file));
        const lewati = file.type === 'image/jpeg' && file.size <= 900 * 1024 && Math.max(img.naturalWidth, img.naturalHeight) <= 2400;
        const k = lewati ? { base64: (await U.bacaFile(file)).split(',')[1], mime: 'image/jpeg' } : await U.kompres(file, 2000, 0.9);
        const sebelum = (D().templateFiles || {})[j];
        let meta;
        try { meta = await U.api('uploadTemplate', { token: A.S.token, jenis: j, mime: k.mime, base64: k.base64, name: file.name }, { timeout: 150000 }); }
        catch (e) {
          if (e.kode !== 'NET') throw e;
          const t = await U.api('refreshTemplates', { token: A.S.token }); // cek apakah sebenarnya berhasil
          if (!t[j] || (sebelum && t[j].id === sebelum.id)) throw e;
          meta = t[j];
        }
        A.mut((d) => { d.templateFiles = d.templateFiles || {}; d.templateFiles[j] = meta; });
        U.toast('Template Piagam ' + (j === 'ahe' ? 'Ahe' : 'Ala') + ' diperbarui');
      } catch (e) { U.toast('Gagal unggah: ' + e.message, 'bad', 6000); btn.disabled = false; btn.innerHTML = `${icon('upload')} Unggah template`; }
    };
    $$('[data-up]', box).forEach((b) => b.onclick = async () => unggah(b.dataset.up, await U.pilihFile('image/jpeg,image/png')));
    $$('[data-drop]', box).forEach((z) => { z.ondragover = (e) => { e.preventDefault(); z.classList.add('over'); }; z.ondragleave = () => z.classList.remove('over'); z.ondrop = (e) => { e.preventDefault(); z.classList.remove('over'); unggah(z.dataset.drop, e.dataTransfer.files[0]); }; });
    $('#pg-refresh', box).onclick = async (e) => { e.currentTarget.disabled = true; try { const t = await U.api('refreshTemplates', { token: A.S.token }); A.mut((d) => { d.templateFiles = t; }); U.toast('Template dimuat ulang dari Drive'); } catch (er) { U.toast(er.message, 'bad'); } };
  }
  function contohData(j, mode) {
    const s = D().settings;
    if (mode === 'panjang') return { nomor: '3924', nama: 'Muhammad Abdurrahman Al-Fatih Wicaksono Saputra', ttl: 'Sangatta Selatan Kutai Timur, 28 September 2019', unit: 'Unit Pembelajaran Teluk Lingga Sangatta Utara', kelompok: R.KELOMPOK.kaliBagi, desa: 'Swarga Bara Sangatta Utara', tglLulus: '2026-09-28', kepala: 'Hj. Siti Rahmawati Nurhaliza, S.Pd., M.Pd.' };
    if (mode === 'terakhir') { const l = (D().piagam[j] || []).slice(-1)[0]; if (l) return l; }
    if (mode === 'form') { const dr = U.ls.get(DRAFT(j), null); if (dr) return dr; }
    return { nomor: P.nomorOtomatis(j, U.today()), nama: 'Aisyah Putri Ramadhani', ttl: 'Sangatta, 5 Maret 2019', unit: s.nama_unit || 'Unit Sangatta', kelompok: R.KELOMPOK.tambahKurang, desa: s.desa || 'Teluk Lingga', tglLulus: U.today(), kepala: s.kepala_unit || 'Nama Kepala Unit' };
  }
  function kalibrasi(box, ui) {
    const j = ui.kal;
    let lay = P.layout(j);
    if (!lay[ui.pilih]) ui.pilih = 'nama';
    box.innerHTML = `${ui.dari === 'buat' ? `<div class="note-box mb-16" style="background:var(--sun-50);color:#7A5600">${icon('info')}<span style="flex:1">Atur posisi teks, lalu kembali ke formulir. Isian formulir tetap utuh.</span><a class="btn btn-accent btn-sm" href="${ui.kembali && /^#\/piagam\/(buat|edit)\//.test(ui.kembali) ? esc(ui.kembali) : '#/piagam/buat/' + j}">${icon('arrow-left')} Kembali ke Formulir</a></div>` : ''}
      <div class="kal-grid"><div class="card card-pad"><div class="row-gap mb-12"><div class="seg"><button class="${j === 'ahe' ? 'on' : ''}" data-j="ahe">Piagam Ahe</button><button class="${j === 'ala' ? 'on' : ''}" data-j="ala">Piagam Ala</button></div><span class="spacer"></span>
        <label class="check"><input type="checkbox" id="k-bantu" ${ui.bantu ? 'checked' : ''}><span class="box">${icon('check')}</span><span class="small strong">Kotak bantu</span></label>
        <select class="input" id="k-data" style="width:auto;min-height:38px"><option value="form" ${ui.data === 'form' ? 'selected' : ''}>Data: isian formulir</option><option value="terakhir" ${ui.data === 'terakhir' ? 'selected' : ''}>Piagam terakhir</option><option value="isian" ${ui.data === 'isian' ? 'selected' : ''}>Contoh data identitas</option><option value="panjang" ${ui.data === 'panjang' ? 'selected' : ''}>Uji teks panjang</option></select></div>
        <div class="canvas-wrap"><canvas id="k-cv" style="cursor:crosshair"></canvas></div><p class="tiny muted mt-8">${icon('mouse-pointer-click', 'ic-sm')} Seret tulisan untuk memindah, atau ketuk posisi baru untuk kolom terpilih.</p></div>
      <div class="card card-pad stack" style="align-self:start"><div class="field"><label>Kolom</label><select class="input" id="k-f">${Object.keys(lay).map((k) => `<option value="${k}" ${ui.pilih === k ? 'selected' : ''}>${LABEL[k]}</option>`).join('')}</select></div>
        <div><div class="label mb-12">Posisi <span class="muted small" id="k-pos"></span></div><div class="row-gap"><div class="pad">
          <span></span><button class="btn btn-light" data-arah="0,-1" aria-label="Atas">${icon('arrow-up')}</button><span></span>
          <button class="btn btn-light" data-arah="-1,0" aria-label="Kiri">${icon('arrow-left')}</button><span class="btn btn-soft" style="pointer-events:none;width:48px;padding:0">${icon('move')}</span><button class="btn btn-light" data-arah="1,0" aria-label="Kanan">${icon('arrow-right')}</button>
          <span></span><button class="btn btn-light" data-arah="0,1" aria-label="Bawah">${icon('arrow-down')}</button><span></span></div>
          <div class="stack-sm"><span class="tiny muted strong">Langkah</span>${[1, 5, 20].map((n) => `<button class="btn btn-xs ${ui.langkah === n ? 'btn-primary' : 'btn-light'}" data-step="${n}">${n} px</button>`).join('')}</div></div></div>
        <div class="grid-2"><div class="field"><label>Ukuran huruf</label><div class="row-gap"><button class="btn btn-light btn-icon btn-sm" data-ub="size,-2">${icon('minus')}</button><b id="k-size" style="min-width:36px;text-align:center"></b><button class="btn btn-light btn-icon btn-sm" data-ub="size,2">${icon('plus')}</button></div></div>
          <div class="field"><label>Lebar maksimum</label><div class="row-gap"><button class="btn btn-light btn-icon btn-sm" data-ub="maxW,-20">${icon('minus')}</button><b id="k-maxw" style="min-width:36px;text-align:center"></b><button class="btn btn-light btn-icon btn-sm" data-ub="maxW,20">${icon('plus')}</button></div></div></div>
        <div class="field"><label>Perataan</label><div class="seg full">${[['left', 'align-left'], ['center', 'align-center'], ['right', 'align-right']].map(([a, ic]) => `<button data-al="${a}" aria-label="${a}">${icon(ic)}</button>`).join('')}</div></div>
        <div class="field"><label>Warna</label><div class="swatches">${WARNA.map((w) => `<button class="swatch" data-c="${w}" style="background:${w};${w === '#FFFFFF' ? 'box-shadow:0 0 0 1px #ccc' : ''}" aria-label="${w}"></button>`).join('')}</div></div>
        <div class="field"><label>Format huruf <span class="tiny muted">(berlaku untuk Ahe & Ala)</span></label><select class="input" id="k-kap"><option value="asli">Asli (seperti diketik)</option><option value="besar">HURUF BESAR</option><option value="kata">Huruf Besar Tiap Kata</option></select></div>
        <div class="row-gap"><button class="btn btn-light btn-sm" id="k-undo">${icon('undo-2')} Urungkan</button><button class="btn btn-danger-ghost btn-sm" id="k-reset">${icon('rotate-ccw')} Kembali ke bawaan</button><span class="spacer"></span><span class="tiny muted" id="k-st">${icon('cloud', 'ic-sm')} Tersimpan otomatis</span></div></div></div>`;
    const cv = $('#k-cv', box);
    let info = null;
    const data = () => ui.data === 'isian' ? contohData(j) : contohData(j, ui.data);
    const gambar = async () => { info = await P.render(cv, j, data(), { layout: lay, bantu: ui.bantu, pilih: ui.pilih, diam: true }); kontrol(); };
    const kontrol = () => {
      const f = lay[ui.pilih];
      $('#k-pos', box).textContent = `x ${Math.round(f.x)} · y ${Math.round(f.y)}`;
      $('#k-size', box).textContent = Math.round(f.size); $('#k-maxw', box).textContent = Math.round(f.maxW);
      $$('[data-al]', box).forEach((b) => b.classList.toggle('on', b.dataset.al === f.align));
      $$('[data-c]', box).forEach((b) => b.classList.toggle('on', b.dataset.c.toLowerCase() === String(f.color).toLowerCase()));
      $('#k-kap', box).value = f.kapital || 'asli';
    };
    const simpan = U.debounce(() => {
      const fields = {}; Object.keys(lay).forEach((k) => { fields[k] = lay[k]; });
      D().settings['layout_' + j] = JSON.stringify({ fields });
      A.kirim({ op: 'saveLayout', jenis: j, layout: { fields }, _label: 'Kalibrasi' });
      Rules.invalidate();
      const st = $('#k-st', box); if (st) st.innerHTML = `${icon('circle-check', 'ic-sm')} Tersimpan ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }, 600);
    const ubah = (fn, catat) => { if (catat !== false) { ui.undo.push(JSON.stringify(lay)); if (ui.undo.length > 50) ui.undo.shift(); } fn(lay[ui.pilih]); gambar(); simpan(); };
    gambar();
    $$('[data-j]', box).forEach((b) => b.onclick = () => { ui.kal = b.dataset.j; ui.undo = []; kalibrasi(box, ui); });
    $('#k-bantu', box).onchange = (e) => { ui.bantu = e.target.checked; gambar(); };
    $('#k-data', box).onchange = (e) => { ui.data = e.target.value; gambar(); };
    $('#k-f', box).onchange = (e) => { ui.pilih = e.target.value; gambar(); };
    $$('[data-step]', box).forEach((b) => b.onclick = () => { ui.langkah = +b.dataset.step; $$('[data-step]', box).forEach((x) => { x.className = 'btn btn-xs ' + (x === b ? 'btn-primary' : 'btn-light'); }); });
    // Tombol panah: tahan = geser terus
    $$('[data-arah]', box).forEach((b) => {
      let t1, t2;
      const geser = () => { const [dx, dy] = b.dataset.arah.split(',').map(Number); ubah((f) => { f.x += dx * ui.langkah; f.y += dy * ui.langkah; }, false); };
      const mulai = (e) => { e.preventDefault(); ui.undo.push(JSON.stringify(lay)); geser(); t1 = setTimeout(() => { t2 = setInterval(geser, 70); }, 380); };
      const stop = () => { clearTimeout(t1); clearInterval(t2); };
      b.addEventListener('pointerdown', mulai); ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, stop));
    });
    $$('[data-ub]', box).forEach((b) => b.onclick = () => { const [k, d] = b.dataset.ub.split(','); ubah((f) => { f[k] = Math.max(k === 'size' ? 8 : 40, f[k] + +d); }); });
    $$('[data-al]', box).forEach((b) => b.onclick = () => ubah((f) => { f.align = b.dataset.al; }));
    $$('[data-c]', box).forEach((b) => b.onclick = () => ubah((f) => { f.color = b.dataset.c; }));
    $('#k-kap', box).onchange = (e) => {
      const v = e.target.value; const k = ui.pilih;
      ubah((f) => { f.kapital = v; });
      // format huruf kolom yang sama berlaku untuk jenis lain juga
      const lain = j === 'ahe' ? 'ala' : 'ahe';
      const l2 = P.layout(lain);
      if (l2[k]) { l2[k].kapital = v; D().settings['layout_' + lain] = JSON.stringify({ fields: l2 }); A.kirim({ op: 'saveLayout', jenis: lain, layout: { fields: l2 } }); }
    };
    $('#k-undo', box).onclick = () => { const s = ui.undo.pop(); if (!s) return U.toast('Tidak ada yang bisa diurungkan', 'info'); lay = JSON.parse(s); gambar(); simpan(); };
    $('#k-reset', box).onclick = async () => {
      if (!(await U.confirm({ title: 'Kembali ke tata letak bawaan?', text: 'Semua posisi Piagam ' + (j === 'ahe' ? 'Ahe' : 'Ala') + ' dikembalikan ke bawaan.', ok: 'Kembalikan' }))) return;
      ui.undo.push(JSON.stringify(lay));
      D().settings['layout_' + j] = ''; lay = P.layout(j);
      A.kirim({ op: 'saveLayout', jenis: j, layout: null, _label: 'Kalibrasi' }); gambar();
    };
    // Seret di kanvas
    const titik = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
    let seret = null;
    cv.addEventListener('pointerdown', (e) => {
      if (!info) return;
      const p = titik(e);
      const kena = Object.keys(info.kotak).find((k) => { const b = info.kotak[k]; return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; });
      if (kena) { ui.pilih = kena; $('#k-f', box).value = kena; }
      ui.undo.push(JSON.stringify(lay));
      const f = lay[ui.pilih];
      if (!kena) { f.x = p.x / info.sx; f.y = p.y / info.sy; gambar(); simpan(); return; }
      seret = { p0: p, x0: f.x, y0: f.y };
      cv.setPointerCapture(e.pointerId);
      gambar();
    });
    cv.addEventListener('pointermove', (e) => {
      if (!seret) return;
      const p = titik(e); const f = lay[ui.pilih];
      f.x = seret.x0 + (p.x - seret.p0.x) / info.sx; f.y = seret.y0 + (p.y - seret.p0.y) / info.sy;
      if (!seret.raf) seret.raf = requestAnimationFrame(() => { seret && (seret.raf = 0); gambar(); });
    });
    const lepas = () => { if (seret) { seret = null; simpan(); } };
    cv.addEventListener('pointerup', lepas); cv.addEventListener('pointercancel', lepas);
  }
})();
