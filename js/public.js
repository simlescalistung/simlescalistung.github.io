/* ==========================================================================
   HALAMAN PUBLIK — landing page, formulir pendaftaran, kuitansi
   Data landing ditampilkan instan dari cache lokal, lalu diperbarui di latar.
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, icon } = U;
  const KEY = 'ahe_landing_v1';
  const DRAFT = 'ahe_daftar_draft_v1';
  let D = U.ls.get(KEY, null);
  let previewMode = false;
  const root = $('#root');

  const set = () => (D && D.settings) || {};
  const sec = (id) => (D && D.sections || []).find((s) => s.id === id) || { id, tampil: 'ya', judul: '', subjudul: '', isi: '{}' };
  const isi = (s) => { try { return typeof s.isi === 'string' ? JSON.parse(s.isi || '{}') : (s.isi || {}); } catch (e) { return {}; } };
  const buka = () => set().pendaftaran_buka !== 'tidak';

  function terapkanIdentitas() {
    const s = set();
    U.applyTheme(s.warna_utama);
    U.applyLatar(s.warna_latar_landing);
    document.title = (s.nama_aplikasi || 'Les Baca & Berhitung') + (s.nama_lembaga ? ' — ' + s.nama_lembaga : '');
  }

  // ---------------------------------------------------------------- Data
  async function muatData() {
    try {
      const data = await U.apiGet({ action: 'getLanding' });
      if (previewMode) return;
      D = data; U.ls.set(KEY, data);
      terapkanIdentitas(); route();
    } catch (e) {
      if (!D) {
        root.innerHTML = `<div class="closed-box card card-pad"><div class="empty"><div class="art">${icon('cloud-off')}</div>
          <h4>Halaman belum dapat dimuat</h4><p>${esc(e.message)}</p><button class="btn btn-primary mt-12" onclick="location.reload()">Coba lagi</button></div></div>`;
      }
    }
  }

  // ---------------------------------------------------------------- Kerangka
  function nav(sub) {
    const s = set();
    const links = [['metode', 'Metode'], ['program', 'Program & Level'], ['galeri', 'Galeri'], ['video', 'Video'], ['lokasi', 'Lokasi'], ['kontak', 'Kontak']]
      .filter(([id]) => sec(id).tampil !== 'tidak');
    return `${s.mode_demo === 'ya' ? `<div class="demo-ribbon" title="Data di situs ini masih contoh untuk uji coba">${icon('sparkles', 'ic-sm')} Mode uji coba · data contoh</div>` : ''}<header class="pub-nav"><div class="in">
      ${sub ? `<a class="btn btn-ghost btn-icon btn-sm" href="#/" aria-label="Kembali">${icon('arrow-left')}</a>` : ''}
      <a class="pub-brand" href="#/"><span class="lg">${U.logoHtml(s)}</span><span><b>${esc(s.nama_aplikasi || 'Ahe & Ala')}</b><small>${esc(sub || s.slogan || 'Les Baca & Berhitung')}</small></span></a>
      ${sub ? '' : `<nav class="pub-links">${links.map(([id, l]) => `<a href="#/" data-go="${id}">${l}</a>`).join('')}</nav>`}
      <div class="acts">${sub ? '' : `<a class="btn btn-light btn-sm btn-masuk d-only" href="app.html?masuk=1" aria-label="Masuk (guru / admin)">${icon('log-in', 'ic-sm')}<span>Masuk</span></a>`}
        ${!sub && buka() ? `<a class="btn btn-accent btn-sm btn-pill" href="#/daftar">Daftar Sekarang</a>` : ''}</div>
    </div></header>`;
  }

  // ---------------------------------------------------------------- Landing
  const ilustrasi = () => `<svg viewBox="0 0 400 320" width="100%" height="100%" role="img" aria-label="Ilustrasi belajar">
    <defs><linearGradient id="gl" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="var(--p-100)"/><stop offset="1" stop-color="#FFF4D1"/></linearGradient></defs>
    <rect width="400" height="320" fill="url(#gl)"/>
    <circle cx="320" cy="70" r="46" fill="#FFC93C" opacity=".55"/><circle cx="70" cy="260" r="60" fill="var(--p-200)" opacity=".6"/>
    <g font-family="Nunito Sans,Arial" font-weight="900" text-anchor="middle">
      <rect x="62" y="96" width="78" height="78" rx="18" fill="var(--p)"/><text x="101" y="150" font-size="46" fill="#fff">A</text>
      <rect x="160" y="70" width="78" height="78" rx="18" fill="#F58220"/><text x="199" y="124" font-size="46" fill="#fff">B</text>
      <rect x="258" y="112" width="78" height="78" rx="18" fill="#0F8B8D"/><text x="297" y="166" font-size="46" fill="#fff">C</text>
      <rect x="110" y="196" width="70" height="70" rx="16" fill="#fff" stroke="var(--p-200)" stroke-width="3"/><text x="145" y="245" font-size="38" fill="var(--p)">1</text>
      <rect x="196" y="176" width="70" height="70" rx="16" fill="#fff" stroke="#C7EDEC" stroke-width="3"/><text x="231" y="225" font-size="38" fill="#0F8B8D">2</text>
      <rect x="282" y="210" width="70" height="70" rx="16" fill="#fff" stroke="#FFD9B5" stroke-width="3"/><text x="317" y="259" font-size="38" fill="#F58220">3</text>
    </g><path d="M352 30l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#FFC93C"/></svg>`;

  function fotoGaleri() { return (D.galeri || []).filter((g) => g.jenis === 'foto' && g.tampil !== 'tidak').sort((a, b) => (+a.urutan || 0) - (+b.urutan || 0)); }
  function videoGaleri() { return (D.galeri || []).filter((g) => g.jenis === 'video' && g.tampil !== 'tidak').sort((a, b) => (+a.urutan || 0) - (+b.urutan || 0)); }

  // Bagian baru (mis. statistik) tetap tampil walau data lama belum memilikinya
  const seksiLengkap = () => { const l = (D.sections || []).slice(); if (!l.some((s) => s.id === 'statistik')) l.push({ id: 'statistik', urutan: '1.5', tampil: 'ya', judul: 'Bersama Kami Anak Makin Percaya Diri', subjudul: 'Jumlah murid yang sedang belajar membaca dan berhitung bersama kami saat ini.', isi: '{}' }); return l; };
  const judulSeksi = (kick, s) => `<div class="sec-title"><span class="kick">${kick}</span><h2>${esc(s.judul || '')}</h2>${s.subjudul ? `<p>${esc(s.subjudul)}</p>` : ''}</div>`;
  const kosongPublik = (ic, teks) => `<div class="pub-empty"><span class="icon-dot lg">${icon(ic, 'ic-lg')}</span><p>${teks}</p></div>`;
  const R = {
    hero(s) {
      const x = isi(s);
      const foto = x.fotoUrl || (fotoGaleri()[0] || {}).url;
      const judul = esc(s.judul || 'Les Baca & Berhitung untuk Anak Hebat').replace(/(Anak Hebat)/, '<em>$1</em>');
      const poin = (x.poin || []).slice(0, 4);
      const ikonPoin = ['heart', 'calendar-check', 'award', 'star'];
      return `<section class="banner ${foto ? 'ada-foto' : ''}" id="sec-hero">
        <div class="banner-media">${foto ? `<img src="${esc(foto)}" alt="${esc(set().nama_lembaga || 'Kegiatan belajar')}" loading="eager" fetchpriority="high" referrerpolicy="no-referrer">` : ''}</div>
        <div class="banner-shade"></div>
        <div class="wrap banner-in"><div class="banner-text">
          ${buka() ? `<span class="badge">${icon('star', 'ic-sm ic-fill')} ${esc(x.badge || 'Pendaftaran Siswa Baru Dibuka')}</span>` : `<span class="badge tutup">${icon('circle-pause', 'ic-sm')} Pendaftaran sedang ditutup</span>`}
          <h1>${judul}</h1>${s.subjudul ? `<p class="lead">${esc(s.subjudul)}</p>` : ''}
          <div class="ctas">${buka() ? `<a class="btn btn-accent btn-lg btn-pill" href="#/daftar">Daftar Sekarang ${icon('arrow-right')}</a>` : ''}
            ${set().wa_admin ? `<a class="btn btn-glass btn-lg btn-pill" target="_blank" rel="noopener" href="${U.waLink(set().wa_admin, 'Assalamu\'alaikum, saya ingin bertanya tentang les baca & berhitung.')}">${icon('message-circle')} Tanya via WhatsApp</a>` : ''}</div>
        </div></div></section>
        ${poin.length ? `<div class="wrap"><div class="trust">${poin.map((t, k) => `<div class="trust-i"><span class="icon-dot ${['', 'ala', 'acc', 'sun'][k % 4]}">${icon(ikonPoin[k % 4])}</span><b>${esc(t)}</b></div>`).join('')}</div></div>` : ''}`;
    },
    statistik(s) {
      const st = D.statistik;
      if (!st || !(+st.ahe + +st.ala)) return '';
      const item = [['book-open', '', st.ahe, 'Murid Les Baca', 'Metode Ahe · Level 1–7'], ['calculator', 'ala', st.ala, 'Murid Les Berhitung', 'Metode Ala · Level 1–16'], ['award', 'sun', st.alumni, 'Alumni Berpiagam', 'Telah menuntaskan program'], ['users', 'acc', st.guru, 'Guru Pembimbing', 'Sabar & berpengalaman']].filter((x) => +x[2] > 0);
      return `<section class="sec stat-sec" id="sec-statistik"><div class="wrap">${judulSeksi('Murid Kami', s)}
        <div class="stat-band">${item.map(([ic, cls, n, l, sub]) => `<div class="stat-item"><span class="icon-dot lg ${cls}">${icon(ic, 'ic-lg')}</span><div><div class="stat-num" data-angka="${+n}">${+n}</div><b>${l}</b><small>${sub}</small></div></div>`).join('')}</div>
        <p class="stat-note">${icon('sparkles', 'ic-sm')} Total <b>${+st.ahe + +st.ala}</b> murid sedang belajar saat ini</p></div></section>`;
    },
    pengumuman() {
      const l = (D.libur || [])[0];
      if (!l) return '';
      const rentang = l.tglSelesai && l.tglSelesai !== l.tglMulai ? U.tglPanjang(l.tglMulai) + ' – ' + U.tglPanjang(l.tglSelesai) : U.tglHari(l.tglMulai);
      return `<div class="wrap" style="margin-top:-18px;position:relative;z-index:2"><div class="ann"><span class="icon-dot">${icon('calendar')}</span>
        <div><b>Pengumuman: ${esc(l.keterangan)}</b><div class="small muted">Libur ${esc(rentang)}${l.tglMasuk ? ' · Les masuk kembali <b>' + esc(U.tglHari(l.tglMasuk)) + '</b>' : ''}</div></div></div></div>`;
    },
    metode(s) {
      const k = isi(s).kartu || [];
      const warna = ['', 'ala', 'acc'];
      return `<section class="sec" id="sec-metode"><div class="wrap">${judulSeksi('Keunggulan Belajar', s)}
        <div class="cards-3 swipe">${k.map((c, i) => `<div class="mcard"><span class="icon-dot lg ${warna[i % 3]}">${icon(c.ikon || 'star', 'ic-lg')}</span><h3>${esc(c.judul)}</h3><p>${esc(c.deskripsi)}</p></div>`).join('')}</div></div></section>`;
    },
    program(s) {
      const x = isi(s);
      const lv = (a, b, akhir, lbl) => { let h = ''; for (let i = a; i <= b; i++) h += i === akhir ? `<span class="lv end">${icon('star')} ${i} ${lbl}</span>` : `<span class="lv">${i}</span>`; return h; };
      return `<section class="sec alt" id="sec-program"><div class="wrap">${judulSeksi('Struktur Kurikulum', s)}
        <div class="prog-grid">
          <div class="pcard"><div class="ph"><h3>${icon('book-open')} Les Baca (Ahe)</h3><span class="chip">Level 1–7</span></div>
            <div class="pb"><p>${esc(x.ahe || '')}</p><div class="stage" style="color:var(--p-700)">Tahapan level</div><div class="lvls">${lv(1, 7, 7, 'Piagam')}</div></div></div>
          <div class="pcard ala"><div class="ph"><h3>${icon('calculator')} Les Berhitung (Ala)</h3><span class="chip">Level 1–16</span></div>
            <div class="pb"><p>${esc(x.ala || '')}</p>
              <div class="stage">Tahap 1 · Pertambahan & Pengurangan</div><div class="lvls">${lv(1, 6, 6, 'Piagam')}</div>
              <div class="stage">Tahap 2 · Perkalian & Pembagian</div><div class="lvls">${lv(7, 16, 16, 'Piagam')}</div></div></div>
        </div></div></section>`;
    },
    galeri(s) {
      const f = fotoGaleri();
      return `<section class="sec" id="sec-galeri"><div class="wrap">${judulSeksi('Dokumentasi Kelas', s)}
        ${f.length ? '' : kosongPublik('image', 'Foto kegiatan belajar akan segera ditampilkan di sini.')}<div class="gal" id="gal">${f.map((g, i) => `<figure data-foto="${i}" ${i >= 8 ? 'class="hidden"' : ''}><img src="${esc(g.url)}" alt="${esc(g.judul)}" loading="lazy" referrerpolicy="no-referrer">${g.judul ? `<figcaption>${esc(g.judul)}</figcaption>` : ''}</figure>`).join('')}</div>
        ${f.length > 8 ? `<div style="text-align:center" class="mt-16"><button class="btn btn-soft btn-pill" data-semua>Lihat semua foto (${f.length})</button></div>` : ''}</div></section>`;
    },
    video(s) {
      const v = videoGaleri();
      return `<section class="sec alt" id="sec-video"><div class="wrap">${judulSeksi('Video Kegiatan', s)}
        ${v.length ? '' : kosongPublik('play', 'Video keseruan belajar akan segera hadir.')}<div class="vids ${v.length === 1 ? 'satu' : ''}">${v.map((g, i) => {
          const vi = U.video(g.url);
          return `<div class="vcard ${vi.tegak ? 'tegak' : ''}"><div class="vthumb ${vi.tegak ? 'tegak' : ''} src-${vi.sumber}" data-video="${i}">${vi.thumb ? `<img src="${esc(vi.thumb)}" alt="" loading="lazy">` : ''}
            <span class="src ${vi.sumber}">${esc(vi.label)}</span><span class="play">${icon(vi.sumber === 'lain' ? 'external-link' : 'play')}</span></div><div class="vb"><span>${esc(g.judul || 'Video kegiatan')}</span>${vi.sumber === 'youtube' ? '' : `<a class="vlink" target="_blank" rel="noopener" href="${esc(vi.link)}">${icon('external-link', 'ic-sm')} Buka di ${esc(vi.label)}</a>`}</div></div>`;
        }).join('')}</div></div></section>`;
    },
    lokasi(s) {
      const x = isi(s);
      const st = set();
      const alamat = x.alamat || U.alamatLengkap(st) || '';
      const titik = x.mapsLat && x.mapsLng ? x.mapsLat + ',' + x.mapsLng : '';
      const q = titik || x.mapsQuery || alamat;
      const link = x.mapsLink || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
      return `<section class="sec" id="sec-lokasi"><div class="wrap">${judulSeksi('Kunjungi Kami', s)}
        <div class="loc"><div class="map">${q ? `<iframe loading="lazy" title="Peta lokasi" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${titik ? 17 : 15}&hl=id&output=embed"></iframe>` : kosongPublik('map-pin', 'Peta lokasi belum diatur.')}</div>
          <div class="card card-pad loc-card"><div class="info-list">
            <div><span class="icon-dot sm">${icon('map-pin')}</span><div><b>Alamat</b><span class="muted">${esc(alamat || '-')}</span></div></div>
            <div><span class="icon-dot sm ala">${icon('clock')}</span><div><b>Jam Les</b><span class="muted">${esc(x.jam || 'Senin – Jumat')}</span><div class="small" style="color:var(--accent-700)">Sabtu, Minggu & hari libur khusus tutup</div></div></div>
          </div><div class="stack-sm mt-16"><a class="btn btn-soft btn-block" target="_blank" rel="noopener" href="${esc(link)}">${icon('external-link')} Petunjuk arah di Google Maps</a>
            ${buka() ? `<a class="btn btn-accent btn-block" href="#/daftar">Daftar Siswa Baru ${icon('arrow-right')}</a>` : ''}</div></div></div></div></section>`;
    }
  };

  function footer() {
    const s = set();
    const x = isi(sec('kontak'));
    const sos = [['facebook', 'Facebook', x.facebook], ['instagram', 'Instagram', x.instagram], ['youtube', 'YouTube', x.youtube], ['tiktok', 'TikTok', x.tiktok]].filter((z) => z[2]);
    const ikonTiktok = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.8 5.8 0 1 0 5 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.3-1.6z"/></svg>';
    return `<footer class="pub-foot" id="sec-kontak"><div class="wrap foot-in">
      <h3>Hubungi Kami</h3><p class="foot-sub">Ada pertanyaan seputar les? Kami siap membantu.</p>
      <div class="foot-btns">${s.wa_admin ? `<a class="sbtn wa" target="_blank" rel="noopener" href="${U.waLink(s.wa_admin, 'Assalamu\'alaikum, saya ingin bertanya tentang les baca & berhitung.')}">${icon('message-circle')}<span><small>WhatsApp</small>${esc(U.tampilWa(s.wa_admin))}</span></a>` : ''}
        ${sos.map(([k, l, u]) => `<a class="sbtn ${k}" target="_blank" rel="noopener" href="${esc(/^https?:\/\//.test(u) ? u : 'https://' + u)}">${k === 'tiktok' ? ikonTiktok : icon(k)}<span><small>Ikuti kami</small>${l}</span></a>`).join('')}</div>
      <div class="bottom">© ${new Date().getFullYear()} ${esc(s.nama_lembaga || s.nama_aplikasi || '')}</div></div></footer>`;
  }
  function landing() {
    const adaMbar = !!(set().wa_admin || buka());
    document.body.classList.toggle('has-mbar', adaMbar);
    const urut = seksiLengkap().sort((a, b) => (+a.urutan || 0) - (+b.urutan || 0));
    let html = nav();
    urut.forEach((s) => {
      if (s.tampil === 'tidak' || s.id === 'kontak') return;
      if (s.id === 'pengumuman') { html += R.pengumuman(); return; }
      if (R[s.id]) html += R[s.id](s);
    });
    html += footer();
    if (adaMbar) html += `<div class="mbar">${set().wa_admin ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="${U.waLink(set().wa_admin)}">${icon('message-circle')} Hubungi WA</a>` : ''}
      ${buka() ? `<a class="btn btn-accent" href="#/daftar">Daftar Sekarang ${icon('arrow-right')}</a>` : ''}</div>`;
    root.innerHTML = html;
    pasangLanding();
  }

  function pasangLanding() {
    // Angka statistik berjalan naik saat terlihat
    const angka = $$('[data-angka]');
    if (angka.length && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        const el = e.target, akhir = +el.dataset.angka, t0 = performance.now();
        const langkah = (t) => { const k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(akhir * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(langkah); };
        el.textContent = '0'; requestAnimationFrame(langkah);
      }), { threshold: 0.4 });
      angka.forEach((el) => io.observe(el));
    }
    // Gambar yang gagal dimuat (link mati) tidak ditampilkan sebagai ikon rusak
    $$('.banner-media img').forEach((img) => img.addEventListener('error', () => { img.closest('.banner').classList.remove('ada-foto'); img.remove(); }, { once: true }));
    $$('#gal figure img').forEach((img) => img.addEventListener('error', () => { img.closest('figure').classList.add('hidden'); }, { once: true }));
    $$('[data-go]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      const t = document.getElementById('sec-' + a.dataset.go);
      if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
    }));
    const f = fotoGaleri();
    $$('[data-foto]').forEach((el) => el.addEventListener('click', () => {
      const g = f[+el.dataset.foto];
      const lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.innerHTML = `<div><img src="${esc(g.url)}" alt="" referrerpolicy="no-referrer"><p>${esc(g.judul || '')}</p></div>`;
      lb.onclick = () => lb.remove();
      document.body.appendChild(lb);
    }));
    const semua = $('[data-semua]');
    if (semua) semua.onclick = () => { $$('#gal figure.hidden').forEach((x) => x.classList.remove('hidden')); semua.remove(); };
    const v = videoGaleri();
    $$('[data-video]').forEach((el) => el.addEventListener('click', () => {
      if (el.dataset.main) return;
      const g = v[+el.dataset.video];
      const vi = U.video(g.url);
      if (vi.sumber === 'lain') { window.open(vi.link, '_blank', 'noopener'); return; }
      el.innerHTML = vi.file ? `<video src="${esc(vi.file)}" controls autoplay playsinline></video>`
        : `<iframe src="${esc(vi.embed(true))}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Video" scrolling="no"></iframe>`;
      el.dataset.main = '1';
    }));
  }

  // ---------------------------------------------------------------- Formulir
  const KOLOM = [
    ['nama', 'Nama Lengkap', true], ['panggilan', 'Nama Panggilan'], ['tempatLahir', 'Tempat Lahir', true], ['tglLahir', 'Tanggal Lahir', true],
    ['kelas', 'Kelas', true], ['sekolah', 'Nama Sekolah', true], ['ortu', 'Nama Orang Tua', true], ['wa', 'Nomor WhatsApp', true], ['facebook', 'Nama Facebook'],
    ['kecamatan', 'Kecamatan', true], ['desa', 'Desa/Kelurahan', true], ['rt', 'RT', true], ['jalan', 'Jalan', true], ['infoDari', 'Info Dari']
  ];
  function formulir() {
    document.body.classList.remove('has-mbar');
    if (!buka()) {
      root.innerHTML = nav('Formulir Pendaftaran') + `<div class="closed-box wrap"><div class="card card-pad"><div class="empty"><div class="art">${icon('circle-pause')}</div>
        <h4>Pendaftaran sedang ditutup</h4><p>${esc(set().pesan_pendaftaran_tutup || '')}</p>
        ${set().wa_admin ? `<a class="btn btn-wa mt-12" target="_blank" rel="noopener" href="${U.waLink(set().wa_admin)}">${icon('message-circle')} Hubungi Admin</a>` : ''}
        <a class="btn btn-ghost" href="#/">Kembali ke beranda</a></div></div></div>`;
      return;
    }
    const d = U.ls.get(DRAFT, {}) || {};
    if (!d.id) { d.id = U.uid(); U.ls.set(DRAFT, d); }
    let opsi = ['Facebook', 'Instagram', 'Teman / Keluarga', 'Lainnya'];
    try { opsi = JSON.parse(set().opsi_info_dari || '[]') || opsi; } catch (e) { /* */ }
    const f = (k, label, req, input) => `<div class="field" data-f="${k}"><label for="f-${k}">${label}${req ? '<span class="req">*</span>' : ''}</label>${input}<div class="err-msg">${icon('triangle-alert', 'ic-sm')} <span>${label} wajib diisi</span></div></div>`;
    const inp = (k, ph, type, extra) => `<input class="input" id="f-${k}" name="${k}" type="${type || 'text'}" placeholder="${ph || ''}" value="${esc(d[k] || '')}" ${extra || ''}>`;
    root.innerHTML = nav('Formulir Pendaftaran') + `<form class="form-page" id="fdaftar" novalidate autocomplete="on">
      <div class="fsec" style="background:var(--p-50);border-color:var(--p-100)"><div class="row-gap"><span class="icon-dot lg">${icon('notebook-pen', 'ic-lg')}</span>
        <div style="flex:1"><h2 style="font-size:20px">Formulir Siswa Baru</h2><p class="small muted">Isi data ananda dengan benar. Kolom bertanda <span class="req">*</span> wajib diisi.</p></div><span class="chip chip-ahe">${icon('clock', 'ic-sm')} ± 5 menit</span></div></div>
      <div class="fsec"><div class="fsec-h"><span class="no">1</span><div><h3>Pilih Program <span class="req">*</span></h3><small>Pilih salah satu program belajar</small></div></div>
        <div class="prog-pick" data-f="program">
          <button type="button" class="prog-opt ${d.program === 'ahe' ? 'on' : ''}" data-prog="ahe"><span class="icon-dot">${icon('book-open', 'ic-lg')}</span><div><b>Les Baca (Ahe)</b><small>Level 1–7 · Belajar membaca bertahap tanpa mengeja</small></div><span class="chip chip-ahe tick">${icon('check', 'ic-sm')} Dipilih</span></button>
          <button type="button" class="prog-opt ala ${d.program === 'ala' ? 'on' : ''}" data-prog="ala"><span class="icon-dot ala">${icon('calculator', 'ic-lg')}</span><div><b>Les Berhitung (Ala)</b><small>Level 1–16 · Tambah-kurang hingga kali-bagi</small></div><span class="chip chip-ala tick">${icon('check', 'ic-sm')} Dipilih</span></button>
        </div><div class="err-msg mt-8" id="err-program">${icon('triangle-alert', 'ic-sm')} <span>Pilih salah satu program</span></div></div>
      <div class="fsec"><div class="fsec-h"><span class="no">2</span><div><h3>Data Anak</h3><small>Identitas calon siswa</small></div></div><div class="form-stack">
        ${f('nama', 'Nama Lengkap', 1, inp('nama', 'Sesuai akta kelahiran', 'text', 'autocomplete="name" maxlength="150"'))}
        ${f('panggilan', 'Nama Panggilan', 0, inp('panggilan', 'Contoh: Ica', 'text', 'maxlength="50"'))}
        ${f('tempatLahir', 'Tempat Lahir', 1, inp('tempatLahir', 'Contoh: Sangatta', 'text', 'maxlength="100"') + `<span class="help">${icon('info', 'ic-sm')} Otomatis huruf kapital tiap kata</span>`)}
        ${f('tglLahir', 'Tanggal Lahir', 1, inp('tglLahir', '', 'date', 'max="' + U.today() + '"'))}
        <div class="grid-2">${f('kelas', 'Kelas', 1, inp('kelas', 'TK B / Kelas 1', 'text', 'list="dl-kelas" maxlength="40"'))}${f('sekolah', 'Nama Sekolah', 1, inp('sekolah', 'Contoh: TK Pembina', 'text', 'maxlength="150"'))}</div>
        <datalist id="dl-kelas">${['PAUD', 'TK A', 'TK B', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6', 'Belum sekolah'].map((x) => `<option value="${x}">`).join('')}</datalist>
      </div></div>
      <div class="fsec"><div class="fsec-h"><span class="no">3</span><div><h3>Data Orang Tua</h3><small>Kontak wali untuk informasi les</small></div></div><div class="form-stack">
        ${f('ortu', 'Nama Orang Tua / Wali', 1, inp('ortu', 'Nama ayah atau ibu', 'text', 'maxlength="150"'))}
        ${f('wa', 'Nomor WhatsApp', 1, `<div class="input-group"><span class="prefix">+62</span>${inp('wa', '812-3456-7890', 'tel', 'inputmode="tel" autocomplete="tel" maxlength="20"')}</div>
          <span class="help" style="color:var(--wa)">${icon('message-circle', 'ic-sm')} Bukti pendaftaran dikirim ke WhatsApp ini</span>`).replace('wajib diisi', 'wajib diisi dengan benar')}
        ${f('facebook', 'Nama Facebook (opsional)', 0, inp('facebook', 'Contoh: Rina Kusuma', 'text', 'maxlength="150"'))}
      </div></div>
      <div class="fsec"><div class="fsec-h"><span class="no">4</span><div><h3>Alamat Tinggal</h3><small>Domisili saat ini</small></div></div><div class="form-stack">
        ${f('kecamatan', 'Kecamatan', 1, inp('kecamatan', 'Contoh: Sangatta Utara', 'text', 'list="dl-kec" maxlength="100"'))}
        <datalist id="dl-kec">${['Sangatta Utara', 'Sangatta Selatan', 'Bengalon', 'Teluk Pandan', 'Rantau Pulung', 'Kaliorang'].map((x) => `<option value="${x}">`).join('')}</datalist>
        ${f('desa', 'Desa / Kelurahan', 1, inp('desa', 'Contoh: Teluk Lingga', 'text', 'maxlength="100"'))}
        <div class="grid-2" style="grid-template-columns:110px 1fr">${f('rt', 'RT', 1, inp('rt', '012', 'text', 'inputmode="numeric" maxlength="10"'))}${f('jalan', 'Jalan / Gang', 1, inp('jalan', 'Jl. Yos Sudarso II No. 15', 'text', 'maxlength="150"'))}</div>
      </div></div>
      <div class="fsec"><div class="fsec-h"><span class="no">5</span><div><h3>Informasi Tambahan</h3></div></div><div class="form-stack">
        ${f('infoDari', 'Mengetahui les ini dari', 0, `<select class="input" id="f-infoDari" name="infoDari"><option value="">Pilih sumber info…</option>${opsi.map((o) => `<option ${d.infoDari === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`)}
        <div class="field"><label>Kode Registrasi ${icon('sparkles', 'ic-sm')}</label><div class="input-icon">${icon('lock')}<input class="input" readonly value="Dibuat otomatis setelah dikirim" tabindex="-1"></div></div>
        <input type="text" name="website" class="sr" tabindex="-1" autocomplete="off" aria-hidden="true">
      </div></div>
      <div class="note-box ok">${icon('shield-check')}<span><b>Privasi terjaga:</b> data ananda hanya digunakan untuk keperluan administrasi les.</span></div>
      <div class="submit-bar"><div class="in"><button class="btn btn-accent btn-lg btn-block btn-pill" type="submit" id="btn-kirim">Kirim Pendaftaran ${icon('send')}</button></div></div>
    </form>`;
    pasangForm(d);
  }

  function pasangForm(d) {
    const form = $('#fdaftar');
    const simpanDraft = U.debounce(() => U.ls.set(DRAFT, d), 300);
    form.addEventListener('input', (e) => {
      if (!e.target.name || e.target.name === 'website') return;
      d[e.target.name] = e.target.value;
      const fld = e.target.closest('.field'); if (fld) fld.classList.remove('is-error');
      simpanDraft();
    });
    $('#f-tempatLahir').addEventListener('blur', (e) => { e.target.value = U.hurufKata(e.target.value); d.tempatLahir = e.target.value; simpanDraft(); });
    $$('[data-prog]').forEach((b) => b.onclick = () => {
      d.program = b.dataset.prog; simpanDraft();
      $$('[data-prog]').forEach((x) => x.classList.toggle('on', x === b));
      $('#err-program').parentElement.classList.remove('is-error'); $('#err-program').style.display = 'none';
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#btn-kirim');
      if (btn.disabled) return;
      // Validasi di perangkat
      let pertama = null;
      if (!d.program) { $('#err-program').style.display = 'flex'; pertama = $('[data-f=program]'); }
      KOLOM.forEach(([k, , req]) => {
        const v = String(d[k] || '').trim();
        let salah = req && !v;
        if (k === 'wa' && v && (U.normWa(v).length < 10 || U.normWa(v).length > 15)) salah = true;
        const fld = $(`[data-f="${k}"]`);
        if (fld) fld.classList.toggle('is-error', !!salah);
        if (salah && !pertama) pertama = fld;
      });
      if (pertama) { pertama.scrollIntoView({ behavior: 'smooth', block: 'center' }); U.toast('Mohon lengkapi kolom yang ditandai merah', 'warn'); return; }
      btn.disabled = true;
      btn.innerHTML = `${icon('loader-circle', 'spin')} Mengirim pendaftaran…`;
      try {
        const data = Object.assign({}, d, { tempatLahir: U.hurufKata(d.tempatLahir), website: form.website.value });
        const r = await U.api('daftar', { data }, { timeout: 60000 });
        U.ls.del(DRAFT);
        sessionStorage.setItem('ahe_sukses', JSON.stringify({ kode: r.kode, nama: r.nama, program: d.program, wa: d.wa }));
        location.hash = '#/daftar/sukses/' + encodeURIComponent(r.kode);
      } catch (err) {
        U.toast(err.message, 'bad', 6000);
        btn.disabled = false;
        btn.innerHTML = `Kirim Pendaftaran ${icon('send')}`;
      }
    });
  }

  function sukses(kode) {
    document.body.classList.remove('has-mbar');
    let x = {};
    try { x = JSON.parse(sessionStorage.getItem('ahe_sukses') || '{}'); } catch (e) { /* */ }
    root.innerHTML = nav('Pendaftaran Berhasil') + `<div class="ok-page"><div class="ok-badge">${icon('circle-check')}</div>
      <h1 style="font-size:28px">Pendaftaran berhasil!</h1>
      <p class="muted mt-8">Terima kasih${x.nama ? ', <b>' + esc(x.nama) + '</b> telah terdaftar' : ''}. Simpan kode registrasi berikut:</p>
      <div class="code-box mt-16">${esc(kode)}</div>
      <div class="note-box ok mt-16" style="text-align:left">${icon('message-circle')}<span>Bukti pendaftaran dikirim ke WhatsApp <b>${esc(U.tampilWa(x.wa || ''))}</b>. Admin akan menghubungi Anda untuk jadwal dan level awal.</span></div>
      <div class="stack-sm mt-24"><button class="btn btn-soft btn-block" data-salin>${icon('copy')} Salin kode</button>
        ${set().wa_admin ? `<a class="btn btn-wa btn-block" target="_blank" rel="noopener" href="${U.waLink(set().wa_admin, 'Assalamu\'alaikum, saya sudah mendaftar dengan kode ' + kode)}">${icon('message-circle')} Konfirmasi ke Admin</a>` : ''}
        <a class="btn btn-ghost btn-block" href="#/">Kembali ke beranda</a></div></div>`;
    $('[data-salin]').onclick = async () => { if (await U.salin(kode)) U.toast('Kode disalin'); };
  }

  // ---------------------------------------------------------------- Kuitansi publik
  async function kuitansi(token) {
    document.body.classList.remove('has-mbar');
    root.innerHTML = nav('Kuitansi Pembayaran') + `<div class="form-page" style="max-width:520px"><div class="kw"><div class="kw-head"><div class="lg"></div><div style="flex:1"><div class="sk" style="height:12px;width:70%"></div></div></div>
      <div class="kw-body stack">${'<div class="sk" style="height:16px"></div>'.repeat(6)}</div></div></div>`;
    try {
      const d = await U.apiGet({ action: 'getKuitansiPublik', token });
      if (d.lembaga) U.applyTheme(d.lembaga.warna_utama);
      const wa = (d.lembaga && d.lembaga.wa_admin) || set().wa_admin;
      root.innerHTML = nav('Kuitansi Pembayaran') + `<div class="form-page" style="max-width:520px">
        <div class="row-gap mb-12"><span class="chip chip-ok">${icon('shield-check', 'ic-sm')} Kuitansi sah</span><span class="spacer"></span><span class="small muted">${esc(d.nomor)}</span></div>
        ${Kuitansi.html(d)}
        <div class="stack-sm mt-16"><button class="btn btn-primary btn-lg btn-block btn-pill" data-pdf>${icon('download')} Unduh Kuitansi (PDF)</button>
          <button class="btn btn-soft btn-block btn-pill" data-share>${icon('share-2')} Bagikan Kuitansi</button>
          ${wa ? `<a class="btn btn-wa btn-block btn-pill" target="_blank" rel="noopener" href="${U.waLink(wa, 'Assalamu\'alaikum, saya ingin bertanya tentang kuitansi ' + d.nomor)}">${icon('message-circle')} Butuh bantuan? Hubungi Admin</a>` : ''}</div>
        <p class="small muted mt-16" style="text-align:center">${icon('lock', 'ic-sm')} Tautan ini bersifat pribadi. Simpan kuitansi digital sebagai bukti pembayaran.</p></div>`;
      $('[data-pdf]').onclick = async (e) => { const b = e.currentTarget; b.disabled = true; try { await Kuitansi.pdf(d); } catch (err) { U.toast(err.message, 'bad'); } b.disabled = false; };
      $('[data-share]').onclick = async () => {
        if (navigator.share) { try { await navigator.share({ title: 'Kuitansi ' + d.nomor, url: location.href }); } catch (e) { /* batal */ } }
        else if (await U.salin(location.href)) U.toast('Tautan kuitansi disalin');
      };
    } catch (e) {
      root.innerHTML = nav('Kuitansi Pembayaran') + `<div class="closed-box wrap"><div class="card card-pad"><div class="empty"><div class="art">${icon('receipt')}</div>
        <h4>${e.kode === 'NET' ? 'Tidak ada koneksi' : 'Kuitansi tidak ditemukan'}</h4><p>${esc(e.kode === 'NET' ? e.message : 'Periksa kembali tautan yang Anda terima.')}</p>
        <button class="btn btn-primary mt-12" onclick="location.reload()">Muat ulang</button></div></div></div>`;
    }
  }

  // ---------------------------------------------------------------- Router
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#/, '') || '/');
    if (/^\/kuitansi\//.test(h)) return kuitansi(h.split('/')[2]);
    if (!D) {
      root.innerHTML = `<div class="hero"><div class="wrap hero-grid"><div class="stack"><div class="sk" style="height:28px;width:220px"></div><div class="sk" style="height:54px"></div><div class="sk" style="height:54px;width:80%"></div><div class="sk" style="height:18px;width:70%"></div></div><div class="sk" style="aspect-ratio:5/4;border-radius:28px"></div></div></div>`;
      return;
    }
    if (/^\/daftar\/sukses\//.test(h)) return sukses(h.split('/')[3]);
    if (/^\/daftar/.test(h)) return formulir();
    return landing();
  }
  window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });

  // Pratinjau langsung dari editor Admin (iframe)
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || e.data.type !== 'ahe-preview') return;
    previewMode = true;
    D = e.data.data; terapkanIdentitas();
    const y = window.scrollY; landing(); window.scrollTo(0, y);
  });
  if (window.parent !== window && /preview=1/.test(location.search)) { previewMode = true; window.parent.postMessage({ type: 'ahe-preview-ready' }, location.origin); }

  if (D) terapkanIdentitas();
  route();
  if (!previewMode) muatData();
})();
