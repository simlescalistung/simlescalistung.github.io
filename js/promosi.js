/* ==========================================================================
   PROMOSI — prompt ChatGPT untuk poster / banner / spanduk promosi les
   (logo lembaga + kode QR menuju landing page dilampirkan sebagai gambar)
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, icon } = U;
  const A = App;
  const R = Rules;
  const D = () => A.S.data;
  const LS = 'ahe_promo_v1';

  const UKURAN = [
    ['feed', 'Feed Instagram / Facebook (1:1)', 'persegi 1:1, 1080×1080 px'],
    ['feed45', 'Feed tegak (4:5)', 'tegak 4:5, 1080×1350 px'],
    ['story', 'Status WA / Story (9:16)', 'vertikal 9:16, 1080×1920 px'],
    ['a4', 'Poster / brosur A4', 'poster tegak ukuran A4 (21 × 29,7 cm), siap cetak'],
    ['a3', 'Poster A3', 'poster tegak ukuran A3 (29,7 × 42 cm), siap cetak'],
    ['a5', 'Brosur / flyer A5', 'flyer tegak ukuran A5 (14,8 × 21 cm), siap cetak'],
    ['web', 'Banner website / sampul FB (16:9)', 'banner mendatar 16:9, 1920×1080 px'],
    ['xbanner', 'X-Banner / roll banner (60 × 160 cm)', 'banner berdiri tegak 60 × 160 cm (rasio 3:8), siap cetak'],
    ['spanduk', 'Spanduk mendatar (3 × 1 m)', 'spanduk mendatar 300 × 100 cm (rasio 3:1), siap cetak, teks besar terbaca dari jauh'],
    ['kustom', 'Ukuran lain (isi sendiri)', '']
  ];
  const GAYA = [
    ['ceria', 'Ceria anak-anak (kartun)', 'ceria, penuh warna, ramah anak dengan ilustrasi kartun yang lucu'],
    ['modern', 'Modern minimalis', 'modern minimalis, bersih, banyak ruang kosong, tipografi tegas'],
    ['islami', 'Islami', 'Islami yang anggun dan sejuk, ramah anak, dengan sentuhan pola geometris Islami'],
    ['elegan', 'Elegan / premium', 'elegan dan premium, berkelas, dengan aksen emas yang halus'],
    ['flat', 'Ilustrasi flat', 'ilustrasi flat design yang rapi dan cerah'],
    ['3d', '3D lucu', 'ilustrasi 3D lucu ala film animasi, karakter anak yang menggemaskan'],
    ['foto', 'Foto realistis', 'fotografi realistis anak-anak Indonesia yang sedang belajar dengan gembira, pencahayaan hangat'],
    ['retro', 'Retro / vintage', 'retro ceria dengan warna hangat dan tekstur kertas']
  ];
  const ORNAMEN = [
    ['huruf', 'Huruf & angka warna-warni'], ['buku', 'Buku, pensil & krayon'], ['bintang', 'Bintang & awan'], ['balon', 'Balon & confetti'],
    ['pelangi', 'Pelangi'], ['islami', 'Ornamen Islami (bulan sabit, lentera)'], ['daun', 'Daun & bunga'], ['abakus', 'Sempoa & simbol + − × ÷']
  ];
  const ORN_TEKS = { huruf: 'huruf A-B-C dan angka 1-2-3 warna-warni', buku: 'buku, pensil, dan krayon', bintang: 'bintang dan awan lembut', balon: 'balon dan confetti', pelangi: 'pelangi', islami: 'bulan sabit, bintang, dan lentera', daun: 'daun dan bunga', abakus: 'sempoa serta simbol tambah, kurang, kali, bagi' };
  const INFO = [['keunggulan', 'Keunggulan metode'], ['level', 'Program & level'], ['spp', 'Biaya SPP per bulan'], ['murid', 'Jumlah murid saat ini'], ['alamat', 'Alamat'], ['jam', 'Jam les'], ['wa', 'Nomor WhatsApp'], ['web', 'Alamat website']];

  const bawaan = () => ({
    ukuran: 'feed', lebar: '', tinggi: '', satuan: 'cm', program: 'keduanya', gaya: 'ceria',
    w1: (D().settings.warna_utama || '#6B2F8F').toUpperCase(), w2: '#F59E0B', latar: '',
    ornamen: ['huruf', 'buku', 'bintang'], ornamenLain: '',
    judul: 'PENDAFTARAN DIBUKA!', tagline: '', tambahan: '',
    info: ['keunggulan', 'level', 'alamat', 'wa'], qr: true, qrKe: 'landing', qrTeks: 'Scan untuk info & daftar'
  });
  const muat = () => Object.assign(bawaan(), U.ls.get(LS, {}) || {});
  const simpan = (o) => U.ls.set(LS, o);

  const urlSitus = () => {
    const s = D().settings || {};
    const b = (s.url_frontend || U.urlBaseFrontend()).replace(/\/+$/, '') + '/';
    return b;
  };
  const urlQr = (o) => urlSitus() + (o.qrKe === 'daftar' ? '#/daftar' : '');
  const isiLanding = (id) => { const s = (D().landing || []).find((x) => x.id === id); try { return s ? (typeof s.isi === 'string' ? JSON.parse(s.isi || '{}') : (s.isi || {})) : {}; } catch (e) { return {}; } };

  function buatPrompt(o) {
    const set = D().settings || {};
    const uk = UKURAN.find((x) => x[0] === o.ukuran) || UKURAN[0];
    const ukTeks = o.ukuran === 'kustom' ? `ukuran ${o.lebar || '?'} × ${o.tinggi || '?'} ${o.satuan}` : uk[2];
    const gaya = (GAYA.find((x) => x[0] === o.gaya) || GAYA[0])[2];
    const lembaga = (set.nama_lembaga || set.nama_aplikasi || '') + (set.nama_unit ? ' (' + set.nama_unit + ')' : '');
    const prog = o.program === 'ahe' ? 'Les Baca (metode Ahe)' : o.program === 'ala' ? 'Les Berhitung (metode Ala)' : 'Les Baca (metode Ahe) & Les Berhitung (metode Ala)';
    const orn = (o.ornamen || []).map((k) => ORN_TEKS[k]).filter(Boolean);
    if (o.ornamenLain) orn.push(o.ornamenLain);
    const info = [];
    const has = (k) => (o.info || []).includes(k);
    if (has('keunggulan')) { const k = (isiLanding('metode').kartu || []).map((c) => c.judul).filter(Boolean).slice(0, 4); if (k.length) info.push('Keunggulan: ' + k.join(' • ')); }
    if (has('level')) info.push(o.program === 'ala' ? 'Les Berhitung Level 1–16 (Pertambahan, Pengurangan, Perkalian, Pembagian)' : o.program === 'ahe' ? 'Les Baca Level 1–7 (dari mengenal huruf sampai lancar membaca)' : 'Les Baca Level 1–7 • Les Berhitung Level 1–16');
    if (has('spp')) { const t = R.tarif(U.ymNow()); if (t) info.push('Biaya SPP ' + U.rp(t) + '/bulan'); }
    if (has('murid')) { let n = 0; R.siswaTerdaftar().forEach((s) => { if (R.programs(s.id).some((p) => p.status === 'aktif')) n++; }); if (n) info.push(`Sudah ${n} murid belajar bersama kami`); }
    if (has('alamat')) { const a = isiLanding('lokasi').alamat || U.alamatLengkap(set); if (a) info.push('Alamat: ' + a); }
    if (has('jam')) info.push('Jadwal: ' + (isiLanding('lokasi').jam || 'Senin – Jumat'));
    if (has('wa') && set.wa_admin) info.push('Info & pendaftaran (WhatsApp): ' + U.tampilWa(set.wa_admin));
    if (has('web')) info.push('Website: ' + urlSitus().replace(/^https?:\/\//, '').replace(/\/$/, ''));
    const baris = [
      `Buatkan desain ${o.ukuran === 'spanduk' || o.ukuran === 'xbanner' ? 'banner' : 'poster'} promosi untuk ${prog} anak-anak dari ${lembaga}.`,
      `Ukuran: ${ukTeks}.`,
      `Gaya desain: ${gaya}.`,
      `Warna utama ${o.w1}, warna pendukung ${o.w2}${o.latar ? ', warna latar ' + o.latar : ''}. Pastikan kontras teks tinggi dan mudah dibaca.`,
      orn.length ? `Ornamen: ${orn.join(', ')}.` : '',
      set.logo_data ? 'LOGO: Saya melampirkan gambar logo lembaga. Pasang logo itu apa adanya di bagian atas poster, ukuran proporsional dan jelas. JANGAN menggambar ulang atau mengubah bentuk, warna, maupun tulisan pada logo.' : 'Sediakan ruang kosong di bagian atas untuk logo lembaga.',
      `Judul besar: "${o.judul || 'PENDAFTARAN DIBUKA!'}"`,
      o.tagline ? `Subjudul / tagline: "${o.tagline}"` : (set.slogan ? `Subjudul / tagline: "${set.slogan}"` : ''),
      `Nama lembaga: ${lembaga}`,
      info.length ? 'Cantumkan informasi berikut dengan rapi (poin-poin singkat):\n' + info.map((x) => '- ' + x).join('\n') : '',
      o.tambahan ? 'Tulisan tambahan: "' + o.tambahan.replace(/\n+/g, ' / ') + '"' : '',
      o.qr ? `KODE QR: Saya juga melampirkan gambar kode QR menuju ${o.qrKe === 'daftar' ? 'formulir pendaftaran' : 'website / landing page'} kami. Tempel gambar QR itu PERSIS apa adanya (jangan digambar ulang, diwarnai, atau dipotong) di pojok kanan bawah di atas kotak putih, ukuran cukup besar agar mudah dipindai, dengan tulisan kecil di bawahnya: "${o.qrTeks || 'Scan untuk info & daftar'}".` : '',
      'Ilustrasi utama: anak-anak Indonesia yang sedang belajar membaca dan berhitung dengan gembira bersama guru yang ramah.',
      'Semua teks berbahasa Indonesia dengan ejaan yang tepat. Jangan menambahkan teks lain di luar yang saya sebutkan.'
    ];
    return baris.filter(Boolean).join('\n');
  }

  A.page('promosi', {
    title: 'Promosi', crumb: 'Poster & Banner Promosi', wakil: true,
    render(view) {
      const o = muat();
      const set = D().settings || {};
      const opsiSel = (list, v) => list.map(([k, l]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${esc(l)}</option>`).join('');
      const chipCek = (list, sel, attr) => list.map(([k, l]) => `<label class="pr-chip"><input type="checkbox" ${attr}="${k}" ${sel.includes(k) ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('');
      view.innerHTML = `<div class="page-head"><div><h1>Poster & Banner Promosi</h1><p>Susun prompt ChatGPT untuk poster, brosur, banner website, atau spanduk promosi les — lengkap dengan logo lembaga dan kode QR menuju website.</p></div></div>
        <div class="split"><div class="stack">
          <div class="card card-pad"><h3 class="mb-12">${icon('image')} Ukuran & program</h3><div class="form-stack">
            <div class="field"><label for="pr-ukuran">Jenis / ukuran</label><select class="input" id="pr-ukuran">${opsiSel(UKURAN, o.ukuran)}</select></div>
            <div class="grid-3 ${o.ukuran === 'kustom' ? '' : 'hidden'}" id="pr-kustom"><div class="field"><label>Lebar</label><input class="input" id="pr-lebar" inputmode="decimal" value="${esc(o.lebar)}"></div><div class="field"><label>Tinggi</label><input class="input" id="pr-tinggi" inputmode="decimal" value="${esc(o.tinggi)}"></div><div class="field"><label>Satuan</label><select class="input" id="pr-satuan">${opsiSel([['cm', 'cm'], ['m', 'meter'], ['px', 'piksel']], o.satuan)}</select></div></div>
            <div class="field"><label>Program yang dipromosikan</label><div class="seg full" id="pr-program">${[['keduanya', 'Baca & Berhitung'], ['ahe', 'Les Baca'], ['ala', 'Les Berhitung']].map(([k, l]) => `<button type="button" data-prog="${k}" class="${o.program === k ? 'on' : ''}">${l}</button>`).join('')}</div></div></div></div>
          <div class="card card-pad"><h3 class="mb-12">${icon('palette')} Gaya, warna & ornamen</h3><div class="form-stack">
            <div class="field"><label for="pr-gaya">Gaya desain</label><select class="input" id="pr-gaya">${opsiSel(GAYA, o.gaya)}</select></div>
            <div class="grid-3"><div class="field"><label>Warna utama</label><label class="ps-warna"><input type="color" id="pr-w1" value="${esc(o.w1.toLowerCase())}"><span class="num" id="pr-w1-t">${esc(o.w1)}</span></label></div>
              <div class="field"><label>Warna pendukung</label><label class="ps-warna"><input type="color" id="pr-w2" value="${esc(o.w2.toLowerCase())}"><span class="num" id="pr-w2-t">${esc(o.w2)}</span></label></div>
              <div class="field"><label>Warna latar</label><label class="ps-warna"><input type="color" id="pr-latar" value="${esc((o.latar || '#FFF8E7').toLowerCase())}"><span class="num" id="pr-latar-t">${esc(o.latar || 'Otomatis')}</span></label></div></div>
            <div class="field"><label>Ornamen</label><div class="pr-chips">${chipCek(ORNAMEN, o.ornamen || [], 'data-orn')}</div>
              <input class="input mt-8" id="pr-ornlain" maxlength="120" value="${esc(o.ornamenLain)}" placeholder="Ornamen lain (opsional), mis. kereta api mainan, matahari tersenyum"></div></div></div>
          <div class="card card-pad"><h3 class="mb-12">${icon('type')} Tulisan</h3><div class="form-stack">
            <div class="field"><label for="pr-judul">Judul besar</label><input class="input" id="pr-judul" maxlength="80" value="${esc(o.judul)}"></div>
            <div class="field"><label for="pr-tagline">Subjudul / tagline</label><input class="input" id="pr-tagline" maxlength="120" value="${esc(o.tagline)}" placeholder="${esc(set.slogan || 'Contoh: Belajar membaca & berhitung jadi menyenangkan')}"></div>
            <div class="field"><label for="pr-tambahan">Tulisan tambahan (opsional)</label><textarea class="input" id="pr-tambahan" rows="2" maxlength="300" placeholder="Contoh: Gratis biaya pendaftaran bulan ini! Kuota terbatas.">${esc(o.tambahan)}</textarea></div>
            <div class="field"><label>Informasi yang dicantumkan</label><div class="pr-chips">${chipCek(INFO, o.info || [], 'data-info')}</div></div></div></div>
        </div>
        <div class="stack">
          <div class="card card-pad"><h3 class="mb-12">${icon('qr-code')} Logo & kode QR</h3>
            <div class="ps-logo">${set.logo_data ? `<div class="lg"><img src="${esc(set.logo_data)}" alt="Logo"></div><div style="flex:1;min-width:0"><b class="small">Logo lembaga</b><div class="tiny muted">Dilampirkan di ChatGPT bersama prompt</div><div class="row-gap mt-8" style="gap:6px"><button class="btn btn-primary btn-sm" id="pr-salin-logo">${icon('copy', 'ic-sm')} Salin logo</button><button class="btn btn-light btn-sm" id="pr-unduh-logo">${icon('download', 'ic-sm')} Unduh</button></div></div>`
              : `<span class="icon-dot sun">${icon('image-plus')}</span><div style="flex:1"><b class="small">Logo belum diunggah</b><div class="tiny muted">${A.S.role === 'admin' ? 'Unggah di <a href="#/pengaturan/identitas" style="font-weight:700">Pengaturan → Identitas</a>.' : 'Minta admin utama mengunggah logo.'}</div></div>`}</div>
            <label class="switch mt-12"><input type="checkbox" id="pr-qr" ${o.qr ? 'checked' : ''}><span class="track"></span><span class="small strong">Tambahkan kode QR di poster</span></label>
            <div id="pr-qr-isi" class="${o.qr ? '' : 'hidden'}"><div class="row-gap mt-12" style="align-items:flex-start"><div class="qr-mini" id="pr-qr-img"></div><div style="flex:1;min-width:0" class="form-stack">
              <div class="field"><label>QR menuju</label><div class="seg full">${[['landing', 'Website'], ['daftar', 'Formulir daftar']].map(([k, l]) => `<button type="button" data-qrke="${k}" class="${o.qrKe === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
              <div class="tiny muted" style="word-break:break-all" id="pr-qr-url">${esc(urlQr(o))}</div>
              <div class="field"><label for="pr-qrteks">Tulisan di bawah QR</label><input class="input" id="pr-qrteks" maxlength="60" value="${esc(o.qrTeks)}"></div>
              <div class="row-gap" style="gap:6px"><button class="btn btn-primary btn-sm" id="pr-salin-qr">${icon('copy', 'ic-sm')} Salin kode QR</button><button class="btn btn-light btn-sm" id="pr-unduh-qr">${icon('download', 'ic-sm')} Unduh</button></div></div></div></div></div>
          <div class="card card-pad" style="border:2px solid var(--p-100);position:sticky;top:80px"><div class="row-gap mb-12"><span class="icon-dot acc">${icon('wand-sparkles')}</span><div style="flex:1"><h3>Prompt ChatGPT</h3><div class="small muted">Diperbarui otomatis</div></div></div>
            <textarea class="input" id="pr-prompt" rows="14" readonly style="font-size:13px"></textarea>
            <div class="row-gap mt-12"><button class="btn btn-accent spacer" id="pr-salin">${icon('copy')} Salin Prompt</button><a class="btn btn-light" href="https://chatgpt.com/" target="_blank" rel="noopener">${icon('external-link')} Buka ChatGPT</a></div>
            <button class="btn btn-soft btn-block mt-8 hidden" id="pr-bagikan">${icon('share-2')} Bagikan logo + QR + prompt (HP)</button>
            <ol class="ps-langkah mt-12"><li>Buka ChatGPT di tab lain.</li>${set.logo_data ? '<li>Tekan <b>Salin logo</b> → di kotak chat ChatGPT tekan <b>Ctrl+V</b> (HP: tahan lalu <b>Tempel</b>).</li>' : ''}<li id="pr-l-qr">Tekan <b>Salin kode QR</b> → tempel lagi di kotak chat.</li><li>Tekan <b>Salin Prompt</b> → tempel, lalu kirim.</li><li>Setelah jadi, <b>pindai QR di hasil poster</b> untuk memastikan masih bisa dibuka.</li></ol>
            <button class="btn btn-ghost btn-sm mt-8" id="pr-reset">${icon('rotate-ccw', 'ic-sm')} Kembalikan pengaturan awal</button></div>
        </div></div>`;
      if (window.innerWidth >= 1100) $('.split', view).style.gridTemplateColumns = 'minmax(0,1fr) minmax(0,1fr)';

      const baca = () => {
        const x = muat();
        x.ukuran = $('#pr-ukuran').value; x.lebar = $('#pr-lebar').value.trim(); x.tinggi = $('#pr-tinggi').value.trim(); x.satuan = $('#pr-satuan').value;
        x.gaya = $('#pr-gaya').value; x.w1 = $('#pr-w1').value.toUpperCase(); x.w2 = $('#pr-w2').value.toUpperCase();
        x.ornamen = $$('[data-orn]:checked').map((c) => c.dataset.orn); x.ornamenLain = $('#pr-ornlain').value.trim();
        x.judul = $('#pr-judul').value.trim(); x.tagline = $('#pr-tagline').value.trim(); x.tambahan = $('#pr-tambahan').value.trim();
        x.info = $$('[data-info]:checked').map((c) => c.dataset.info); x.qr = $('#pr-qr').checked; x.qrTeks = $('#pr-qrteks').value.trim();
        return x;
      };
      let qrUrlTerakhir = '';
      const gambarQr = async (o2) => {
        const url = urlQr(o2); $('#pr-qr-url').textContent = url;
        if (url === qrUrlTerakhir) return; qrUrlTerakhir = url;
        try { const c = await U.qrCanvas(url, 240); const box = $('#pr-qr-img'); if (box) box.innerHTML = `<img src="${c.toDataURL('image/png')}" alt="Kode QR">`; } catch (e) { const box = $('#pr-qr-img'); if (box) box.innerHTML = `<span class="tiny muted">QR gagal dibuat</span>`; }
      };
      const segar = () => {
        const x = baca(); simpan(x);
        $('#pr-prompt').value = buatPrompt(x);
        $('#pr-w1-t').textContent = x.w1; $('#pr-w2-t').textContent = x.w2; $('#pr-latar-t').textContent = x.latar || 'Otomatis';
        $('#pr-kustom').classList.toggle('hidden', x.ukuran !== 'kustom');
        $('#pr-qr-isi').classList.toggle('hidden', !x.qr); $('#pr-l-qr').classList.toggle('hidden', !x.qr);
        if (x.qr) gambarQr(x);
      };
      $$('input, select, textarea', view).forEach((el) => { if (el.id === 'pr-prompt' || el.id === 'pr-latar') return; el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', segar); });
      $('#pr-latar').oninput = (e) => { const x = baca(); x.latar = e.target.value.toUpperCase(); simpan(x); segar(); };
      $$('[data-prog]').forEach((b) => b.onclick = () => { const x = baca(); x.program = b.dataset.prog; simpan(x); $$('[data-prog]').forEach((y) => y.classList.toggle('on', y === b)); segar(); });
      $$('[data-qrke]').forEach((b) => b.onclick = () => { const x = baca(); x.qrKe = b.dataset.qrke; simpan(x); $$('[data-qrke]').forEach((y) => y.classList.toggle('on', y === b)); segar(); });
      // Salin gambar langsung ke papan klip (tempel di ChatGPT dengan Ctrl+V)
      const bisaSalinGambar = !!(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write);
      const qrBlob = () => U.qrCanvas(urlQr(baca()), 1000).then((c) => new Promise((res) => c.toBlob(res, 'image/png')));
      const salinGambar = async (blobJanji, nama) => {
        if (!bisaSalinGambar) { U.toast('Browser ini belum bisa menyalin gambar. Pakai tombol Unduh lalu lampirkan.', 'warn', 6000); return; }
        try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobJanji })]); U.toast(nama + ' disalin — tempel (Ctrl+V) di kotak chat ChatGPT'); }
        catch (e) { U.toast('Gagal menyalin ' + nama.toLowerCase() + '. Pakai tombol Unduh lalu lampirkan.', 'warn', 6000); }
      };
      const sl = $('#pr-salin-logo'); if (sl) sl.onclick = () => salinGambar(A.pngLogo(), 'Logo');
      $('#pr-salin-qr').onclick = () => salinGambar(qrBlob(), 'Kode QR');
      // HP: bagikan logo + QR + prompt sekaligus ke aplikasi ChatGPT
      const bg = $('#pr-bagikan');
      (async () => {
        try {
          const contoh = new File([new Blob(['x'], { type: 'image/png' })], 'a.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [contoh] })) bg.classList.remove('hidden');
        } catch (e) { /* tidak didukung */ }
      })();
      bg.onclick = async () => {
        try {
          const files = [];
          if (set.logo_data) files.push(new File([await A.pngLogo()], 'logo.png', { type: 'image/png' }));
          if (baca().qr) files.push(new File([await qrBlob()], 'kode-qr.png', { type: 'image/png' }));
          await navigator.share({ files, text: $('#pr-prompt').value, title: 'Prompt poster promosi' });
        } catch (e) { if (e && e.name !== 'AbortError') U.toast('Tidak bisa membagikan. Pakai tombol Salin.', 'warn'); }
      };
      $('#pr-salin').onclick = async () => { if (await U.salin($('#pr-prompt').value)) U.toast('Prompt disalin — lampirkan logo & QR lalu tempel di ChatGPT'); };
      const ul = $('#pr-unduh-logo');
      if (ul) ul.onclick = async () => { try { U.unduhBlob(await A.pngLogo(), 'Logo-' + U.namaFile(set.nama_lembaga || set.nama_aplikasi || 'lembaga') + '.png'); U.toast('Logo diunduh'); } catch (e) { U.toast(e.message, 'bad'); } };
      $('#pr-unduh-qr').onclick = async () => {
        try { const c = await U.qrCanvas(urlQr(baca()), 1200); c.toBlob((b) => { U.unduhBlob(b, 'QR-' + (baca().qrKe === 'daftar' ? 'Pendaftaran' : 'Website') + '.png'); U.toast('Kode QR diunduh'); }, 'image/png'); }
        catch (e) { U.toast('Kode QR gagal dibuat: ' + e.message, 'bad'); }
      };
      $('#pr-reset').onclick = () => { U.ls.del(LS); A.render(); U.toast('Pengaturan promosi dikembalikan'); };
      segar();
    }
  });
})();
