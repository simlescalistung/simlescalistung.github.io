/* ==========================================================================
   KUITANSI SPP — tampilan HTML & PDF (A5 landscape), dipakai Admin & publik
   Data: { nomor, bulan[], total, tglBayar, metode, penerima,
           siswa{nama,panggilan,kode,ortu}, program{program,level}, lembaga{...} }
   ========================================================================== */
(function () {
  'use strict';
  const K = {};
  window.Kuitansi = K;
  const LABEL = { ahe: 'Les Baca (Ahe)', ala: 'Les Berhitung (Ala)' };
  // Hindari "Bapak/Ibu Bpk. Roni" bila nama ortu sudah memakai sapaan
  const penyetor = (s) => {
    const o = String(s.ortu || '').trim();
    if (!o) return 'Orang tua/wali ' + (s.nama || '');
    return /^(bapak|bpk|ibu|bu|pak|ayah|bunda|mama|papa|hj|h)\b\.?/i.test(o) ? o : 'Bapak/Ibu ' + o;
  };
  const kota = (l) => (l.kecamatan || 'Sangatta').trim();
  const alamatKop = (l) => [l.nama_unit, U.alamatLengkap(l)].filter(Boolean).join(' • ');
  const penandatangan = (d) => (d.lembaga && d.lembaga.kepala_unit) || d.penerima || 'Admin';

  K.html = (d) => {
    const l = d.lembaga || {};
    const p = d.program;
    const ortu = penyetor(d.siswa);
    return `<div class="kw print-area">
      <div class="kw-head"><div class="lg">${U.logoHtml(l)}</div>
        <div style="min-width:0"><b>${U.esc(l.nama_lembaga || l.nama_aplikasi || '')}</b><small>${U.esc(alamatKop(l))}</small></div></div>
      <div class="kw-body">
        <div class="kw-title"><div><h3>KUITANSI PEMBAYARAN SPP</h3><div class="small muted mt-8">No. <b class="num" style="color:var(--p-700)">${U.esc(d.nomor || 'menunggu nomor…')}</b></div></div>
          <div class="stamp">LUNAS<small>${U.esc(U.tgl(d.tglBayar))}</small></div></div>
        <div class="kw-perf"></div>
        <div class="kw-row"><span>Telah terima dari</span><span>${U.esc(ortu)}</span></div>
        <div class="kw-row"><span>Untuk siswa</span><span>${U.esc(d.siswa.nama)}${d.siswa.panggilan ? ' (' + U.esc(d.siswa.panggilan) + ')' : ''}<br><span class="chip chip-sm chip-ahe">${U.esc(d.siswa.kode || '')}</span></span></div>
        ${p ? `<div class="kw-row"><span>Program & Level</span><span><span class="chip ${p.program === 'ala' ? 'chip-ala' : 'chip-ahe'}">${U.esc(LABEL[p.program] || '')} • Level ${U.esc(p.level)}</span></span></div>` : ''}
        <div class="kw-row"><span>Pembayaran</span><span>SPP ${U.esc(U.daftarBulan(d.bulan))}<br><small class="muted">${d.bulan.length} bulan</small></span></div>
        <div class="kw-row"><span>Metode</span><span>${U.esc(d.metode || 'Tunai')}</span></div>
        <div class="kw-amt"><div class="tiny strong" style="letter-spacing:.06em;color:var(--p-700)">TOTAL PEMBAYARAN</div>
          <div class="v num">${U.rp(d.total)}</div><div class="tb">Terbilang: ${U.esc(U.terbilang(d.total))}</div></div>
        <div class="kw-perf"></div>
        <div class="kw-sign"><div>${U.esc(kota(l))}, ${U.esc(U.tglPanjang(d.tglBayar))}<br>Penerima,${l.ttd_data ? `<div class="sig-img"><img src="${l.ttd_data}" alt="Tanda tangan"></div>` : `<div class="sig">${U.esc(penandatangan(d).split(' ')[0])}</div>`}<b>${U.esc(penandatangan(d))}</b>${l.kepala_unit ? '<div class="tiny muted">Kepala Unit</div>' : ''}</div>
          <div class="tiny muted" style="text-align:right">${U.icon('shield-check', 'ic-sm')} Kuitansi digital resmi<br>${U.esc(l.nama_aplikasi || '')}</div></div>
      </div></div>`;
  };

  const hexRgb = (h) => { h = String(h || '#6B2F8F').replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16) || 0); };
  K.pdf = async (d) => {
    const JsPDF = await U.lib.pdf();
    const l = d.lembaga || {};
    const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
    const W = 210, H = 148, M = 12;
    const pc = hexRgb(l.warna_utama);
    // Bingkai & kepala
    doc.setFillColor(255, 251, 243); doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(pc[0], pc[1], pc[2]); doc.rect(0, 0, W, 26, 'F');
    doc.setFillColor(255, 201, 60); doc.rect(0, 26, W, 1.6, 'F');
    let x0 = M;
    if (l.logo_data) {
      try {
        doc.setFillColor(255, 255, 255); doc.roundedRect(M, 4.5, 17, 17, 3, 3, 'F');
        const fmt = /image\/png/.test(l.logo_data) ? 'PNG' : 'JPEG';
        doc.addImage(l.logo_data, fmt, M + 1.2, 5.7, 14.6, 14.6);
        x0 = M + 21;
      } catch (e) { x0 = M; }
    }
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5);
    doc.text(String(l.nama_lembaga || l.nama_aplikasi || '').toUpperCase(), x0, 12.5, { maxWidth: W - x0 - M });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(alamatKop(l), x0, 18.5, { maxWidth: W - x0 - M });
    // Judul
    doc.setTextColor(43, 27, 61);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text('KUITANSI PEMBAYARAN SPP', M, 38);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(107, 95, 120);
    doc.text('No. ' + (d.nomor || '-'), M, 44);
    // Stempel LUNAS
    doc.setDrawColor(22, 163, 74); doc.setLineWidth(0.8); doc.setTextColor(22, 120, 60);
    doc.roundedRect(W - M - 42, 30, 40, 16, 3, 3);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text('LUNAS', W - M - 22, 39.5, { align: 'center' });
    doc.setFontSize(7.5); doc.text(U.tgl(d.tglBayar).toUpperCase(), W - M - 22, 44, { align: 'center' });
    // Garis perforasi
    doc.setDrawColor(220, 205, 180); doc.setLineWidth(0.3); doc.setLineDashPattern([1.5, 1.2], 0); doc.line(M, 49, W - M, 49); doc.setLineDashPattern([], 0);
    // Baris data
    const p = d.program;
    const rows = [
      ['Telah terima dari', penyetor(d.siswa)],
      ['Untuk siswa', d.siswa.nama + (d.siswa.panggilan ? ' (' + d.siswa.panggilan + ')' : '') + (d.siswa.kode ? '  •  ' + d.siswa.kode : '')],
      ['Program & Level', p ? (LABEL[p.program] || '') + '  •  Level ' + p.level : '-'],
      ['Pembayaran', 'SPP ' + U.daftarBulan(d.bulan) + ' (' + d.bulan.length + ' bulan)'],
      ['Metode', d.metode || 'Tunai']
    ];
    let y = 56;
    rows.forEach((r) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(107, 95, 120); doc.text(r[0], M, y);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(43, 27, 61); doc.text(String(r[1]), M + 38, y, { maxWidth: 110 });
      y += 7;
    });
    // Kotak jumlah
    const bx = W - M - 62;
    doc.setFillColor(Math.round(pc[0] + (255 - pc[0]) * 0.9), Math.round(pc[1] + (255 - pc[1]) * 0.9), Math.round(pc[2] + (255 - pc[2]) * 0.9));
    doc.roundedRect(bx, 92, 62, 30, 3, 3, 'F');
    doc.setTextColor(pc[0], pc[1], pc[2]); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text('TOTAL PEMBAYARAN', bx + 5, 99);
    doc.setFontSize(17); doc.text(U.rp(d.total), bx + 5, 108);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(43, 27, 61);
    doc.text(doc.splitTextToSize(U.terbilang(d.total), 54), bx + 5, 114);
    // Tanda tangan
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(43, 27, 61);
    doc.text(kota(l) + ', ' + U.tglPanjang(d.tglBayar), M, 102);
    doc.text('Penerima,', M, 108);
    if (l.ttd_data) {
      try {
        const im = await U.muatGambar(l.ttd_data);
        const tinggi = 13, lebar = Math.min(46, tinggi * im.naturalWidth / im.naturalHeight);
        doc.addImage(l.ttd_data, 'PNG', M, 109.5, lebar, lebar * im.naturalHeight / im.naturalWidth);
      } catch (e) { /* tanpa gambar */ }
    }
    doc.setFont('helvetica', 'bold'); doc.text(penandatangan(d), M, 128);
    doc.setDrawColor(43, 27, 61); doc.setLineWidth(0.2); doc.line(M, 129.5, M + 50, 129.5);
    if (l.kepala_unit) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(107, 95, 120); doc.text('Kepala Unit', M, 133.5); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(150, 140, 160);
    doc.text('Kuitansi digital resmi ' + (l.nama_aplikasi || '') + '  •  dicetak ' + U.tglPanjang(U.today()), M, H - 6);
    doc.save('Kuitansi_' + U.namaFile(d.siswa.nama) + '_' + U.namaFile((d.nomor || '').replace(/\//g, '-')) + '.pdf');
  };
})();
