/* ==========================================================================
   ATURAN BISNIS (cermin dari Kode.gs) — dihitung lokal agar tampilan instan
   ========================================================================== */
(function () {
  'use strict';
  const R = {};
  window.Rules = R;
  R.MAKS = { ahe: 7, ala: 16 };
  R.LABEL = { ahe: 'Les Baca (Ahe)', ala: 'Les Berhitung (Ala)' };
  R.SINGKAT = { ahe: 'Baca', ala: 'Berhitung' };
  R.KELOMPOK = { tambahKurang: 'Pertambahan & Pengurangan', kaliBagi: 'Perkalian & Pembagian' };
  R.SIAP_LABEL = { ahe: 'Piagam Ahe – Lulus Membaca', tambahKurang: 'Piagam Ala – Tambah & Kurang', kaliBagi: 'Piagam Ala – Kali & Bagi' };

  let D = null, ver = -1, idx = null;
  R.bind = (data) => { D = data; R.invalidate(); };
  R.invalidate = () => { ver++; idx = null; };
  R.idx = () => {
    if (idx) return idx;
    const i = { siswa: {}, prog: {}, progSiswa: {}, guru: {}, spp: {}, kw: {}, libur: D.libur || [], piagamSiswa: {} };
    (D.siswa || []).forEach((s) => { i.siswa[s.id] = s; });
    (D.program || []).forEach((p) => { i.prog[p.id] = p; (i.progSiswa[p.siswaId] = i.progSiswa[p.siswaId] || []).push(p); });
    (D.guru || []).forEach((g) => { i.guru[g.id] = g; });
    (D.spp || []).forEach((x) => { i.spp[x.siswaId + '_' + x.bulan] = x; });
    (D.kuitansi || []).forEach((k) => { i.kw[k.id] = k; });
    const pg = D.piagam || { ahe: [], ala: [] };
    (pg.ahe || []).forEach((r) => { if (r.siswaId) (i.piagamSiswa[r.siswaId] = i.piagamSiswa[r.siswaId] || []).push(Object.assign({ jenis: 'ahe' }, r)); });
    (pg.ala || []).forEach((r) => { if (r.siswaId) (i.piagamSiswa[r.siswaId] = i.piagamSiswa[r.siswaId] || []).push(Object.assign({ jenis: 'ala' }, r)); });
    idx = i;
    return i;
  };
  R.set = () => (D && D.settings) || {};

  // ---------------- Hari les ----------------
  R.libur = (tgl, list) => (list || (D && D.libur) || []).find((l) => l.tglMulai && tgl >= l.tglMulai && tgl <= (l.tglSelesai || l.tglMulai)) || null;
  R.hariLes = (tgl, list) => { const h = U.dow(tgl); return h !== 0 && h !== 6 && !R.libur(tgl, list); };
  R.hariLesBulan = (ym, list) => { const out = []; const n = U.daysInMonth(ym); for (let d = 1; d <= n; d++) { const t = ym + '-' + String(d).padStart(2, '0'); if (R.hariLes(t, list)) out.push(t); } return out; };

  // ---------------- Program ----------------
  R.kelompok = (p) => p && p.program === 'ala' ? (+p.level <= 6 ? R.KELOMPOK.tambahKurang : R.KELOMPOK.kaliBagi) : '';
  R.siap = (p) => { try { const v = typeof p.siapPiagam === 'string' ? JSON.parse(p.siapPiagam || '[]') : (p.siapPiagam || []); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  R.programs = (sid) => (R.idx().progSiswa[sid] || []).filter((p) => p.status !== 'menunggu');
  // Program yang sedang berjalan: aktif → rehat → yang terakhir diubah
  R.prog = (sid) => {
    const ps = R.programs(sid);
    return ps.find((p) => p.status === 'aktif') || ps.find((p) => p.status === 'rehat') ||
      ps.slice().sort((a, b) => String(b.updatedAt || b.tglStatus).localeCompare(String(a.updatedAt || a.tglStatus)))[0] || null;
  };
  R.status = (sid) => { const p = R.prog(sid); return p ? p.status : 'belum'; };
  R.siswaTerdaftar = () => (D.siswa || []).filter((s) => s.statusDaftar === 'diterima');

  // ---------------- SPP ----------------
  R.tarif = (ym) => { let p = null; (D.tarif || []).forEach((t) => { if (t.berlakuMulai <= ym && (!p || t.berlakuMulai > p.berlakuMulai)) p = t; }); return p ? (+p.nominal || 0) : 0; };
  R.ditagih = (s, ym) => {
    if (!s || s.statusDaftar !== 'diterima') return false;
    const set = R.set();
    if (set.spp_mulai_bulan && ym < set.spp_mulai_bulan) return false;
    if (R.tarif(ym) <= 0) return false;
    return R.programs(s.id).some((p) => {
      const mulai = (p.tglMulai || String(s.createdAt || '').slice(0, 10)).slice(0, 7);
      if (mulai && mulai > ym) return false;
      if (p.status === 'aktif') return true;
      return !!(p.tglStatus && p.tglStatus.slice(0, 7) >= ym);
    });
  };
  R.lunas = (sid, ym) => R.idx().spp[sid + '_' + ym] || null;
  R.m0 = (tgl) => { tgl = tgl || U.today(); const j = +R.set().spp_jatuh_tempo || 10; return +tgl.slice(8, 10) > j ? tgl.slice(0, 7) : U.addMonths(tgl.slice(0, 7), -1); };
  R.tunggakan = (s, tgl) => {
    const m0 = R.m0(tgl);
    const belum = [];
    for (let i = 0; i < 12; i++) { const ym = U.addMonths(m0, -i); if (R.ditagih(s, ym) && !R.lunas(s.id, ym)) belum.push(ym); }
    belum.sort();
    return { belum, dua: belum.includes(m0) && belum.includes(U.addMonths(m0, -1)), total: belum.reduce((t, b) => t + R.tarif(b), 0) };
  };

  // ---------------- Absen ----------------
  R.absen = (s, tgl) => {
    tgl = tgl || U.today();
    const p = R.prog(s.id);
    if (!p || p.status !== 'aktif') return null;
    const set = R.set();
    const lh = (D.lastHadir || {})[s.id];
    let ref = lh || p.tglMulai || String(s.createdAt || '').slice(0, 10);
    if (p.tglStatus && p.tglStatus > ref) ref = p.tglStatus;
    if (set.hadir_mulai && set.hadir_mulai > ref) ref = U.addDays(set.hadir_mulai, -1);
    if (set.arsip_hadir_sebelum && set.arsip_hadir_sebelum > ref) ref = U.addDays(set.arsip_hadir_sebelum, -1);
    if (!U.isTgl(ref)) return null;
    let n = 0, d = U.addDays(ref, 1), g = 0;
    while (d < tgl && g++ < 200) { if (R.hariLes(d)) n++; d = U.addDays(d, 1); }
    return { hari: n, terakhir: lh || '' };
  };

  // ---------------- Kelengkapan ----------------
  R.WAJIB = ['nama', 'tempatLahir', 'tglLahir', 'kelas', 'sekolah', 'ortu', 'kecamatan', 'desa', 'rt', 'jalan', 'wa'];
  R.lengkap = (s) => R.WAJIB.every((k) => String(s[k] || '').trim());

  // ---------------- Peringatan (dashboard) ----------------
  R.peringatan = () => {
    const t = U.today();
    const ambang = +R.set().ambang_absen_hari || 10;
    const out = { tunggakan: [], absen: [], buku: [], piagam: [], waGagal: [] };
    R.siswaTerdaftar().forEach((s) => {
      const p = R.prog(s.id);
      if (!p) return;
      if (p.status === 'aktif') {
        const tg = R.tunggakan(s, t);
        if (tg.dua) out.tunggakan.push({ s, tg });
        const a = R.absen(s, t);
        if (a && a.hari >= ambang) out.absen.push({ s, a });
        if (p.buku !== 'ya') out.buku.push({ s, p });
      }
      R.programs(s.id).forEach((pp) => R.siap(pp).forEach((k) => out.piagam.push({ s, p: pp, k })));
    });
    // WA gagal 7 hari terakhir yang belum berhasil dikirim ulang
    const batas = U.addDays(t, -7);
    const log = D.logWA || [];
    const sukses = {};
    log.forEach((l) => { if (l.status === 'terkirim') sukses[l.jenis + '|' + l.tujuan + '|' + l.periode] = l.waktu; });
    log.forEach((l) => {
      if (l.status !== 'gagal' || String(l.waktu).slice(0, 10) < batas) return;
      const k = l.jenis + '|' + l.tujuan + '|' + l.periode;
      if (!(sukses[k] && sukses[k] > l.waktu)) out.waGagal.push(l);
    });
    return out;
  };
})();
