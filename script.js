/* =========================================================
   Undangan Digital — Ghofinda & Fida
   Logika interaktif
   ========================================================= */

/* ---------- 1. Nama tamu dari URL (?to=Nama+Tamu) ---------- */
const urlParams = new URLSearchParams(window.location.search);
const guest = urlParams.get('to');
document.getElementById('guestName').textContent =
  guest && guest.trim() ? guest.replace(/\+/g, ' ').trim() : 'Tamu Undangan';

/* ---------- 2. Musik & Buka Undangan ---------- */
const bgMusic = document.getElementById('music');
const musicBtn = document.getElementById('musicBtn');
let musicWasPlaying = false;

function setPlayingUI(isPlaying) {
  musicBtn.classList.toggle('rotating', isPlaying);
  musicBtn.setAttribute('aria-label', isPlaying ? 'Jeda musik' : 'Putar musik');
}

function openInvitation() {
  document.body.classList.remove('locked');
  document.body.style.overflow = 'auto';

  // play() harus dipanggil langsung dari gesture klik agar lolos kebijakan autoplay mobile
  const p = bgMusic.play();
  if (p !== undefined) {
    p.then(() => setPlayingUI(true))
     .catch(err => { console.log('Autoplay ditolak:', err); setPlayingUI(false); });
  }

  document.getElementById('opening').scrollIntoView({ behavior: 'smooth' });
}

function toggleMusic() {
  if (bgMusic.paused) {
    bgMusic.play().then(() => setPlayingUI(true)).catch(() => setPlayingUI(false));
  } else {
    bgMusic.pause();
    setPlayingUI(false);
  }
}

// Jeda otomatis saat tab/aplikasi di background, lanjut saat kembali
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    musicWasPlaying = !bgMusic.paused;
    if (musicWasPlaying) bgMusic.pause();
  } else if (musicWasPlaying) {
    bgMusic.play().then(() => setPlayingUI(true)).catch(() => setPlayingUI(false));
  }
});

/* ---------- 3. Toast & salin nomor rekening ---------- */
let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// Fallback untuk in-app browser lama yang belum mendukung Clipboard API / non-HTTPS
function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px;';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  document.body.removeChild(ta);
  return ok;
}

function copyToClipboard(elementId, label) {
  const text = document.getElementById(elementId).innerText.trim();
  const done = ok => showToast(ok ? label + ' berhasil disalin!' : 'Gagal menyalin, silakan salin manual');

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => done(true)).catch(() => done(legacyCopy(text)));
  } else {
    done(legacyCopy(text));
  }
}

/* ---------- 4. Hitung mundur (WIB) ---------- */
const targetDate = new Date('2026-10-23T07:00:00+07:00').getTime();
const pad = n => String(n).padStart(2, '0');

function updateCountdown() {
  const diff = targetDate - Date.now();
  if (diff > 0) {
    document.getElementById('days').textContent = Math.floor(diff / (1000 * 60 * 60 * 24));
    document.getElementById('hours').textContent = pad(Math.floor((diff / (1000 * 60 * 60)) % 24));
    document.getElementById('minutes').textContent = pad(Math.floor((diff / 1000 / 60) % 60));
    document.getElementById('seconds').textContent = pad(Math.floor((diff / 1000) % 60));
  } else {
    clearInterval(countdownTimer);
    document.getElementById('countdown').hidden = true;
    document.getElementById('countdownDone').hidden = false;
  }
}
const countdownTimer = setInterval(updateCountdown, 1000);
updateCountdown();

/* ---------- 5. Galeri lightbox ---------- */
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbCount = document.getElementById('lbCount');
const galleryItems = Array.from(document.querySelectorAll('.gallery button'));
let lbIndex = 0;

function showLightbox(i) {
  lbIndex = (i + galleryItems.length) % galleryItems.length;
  const btn = galleryItems[lbIndex];
  lbImg.src = btn.dataset.full;
  lbImg.alt = btn.querySelector('img').alt;
  lbCount.textContent = (lbIndex + 1) + ' / ' + galleryItems.length;
}
function openLightbox(i) {
  showLightbox(i);
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.remove('open');
  lbImg.removeAttribute('src');
  document.body.style.overflow = 'auto';
}

galleryItems.forEach((btn, i) => btn.addEventListener('click', () => openLightbox(i)));
document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.getElementById('lbPrev').addEventListener('click', () => showLightbox(lbIndex - 1));
document.getElementById('lbNext').addEventListener('click', () => showLightbox(lbIndex + 1));
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') showLightbox(lbIndex - 1);
  if (e.key === 'ArrowRight') showLightbox(lbIndex + 1);
});

// Swipe kiri/kanan di layar sentuh
let touchStartX = 0;
lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) showLightbox(lbIndex + (dx < 0 ? 1 : -1));
}, { passive: true });

/* ---------- 6. Ucapan & kehadiran ---------- */
function addWish() {
  const nama = document.getElementById('nama').value.trim();
  const jumlah = document.getElementById('jumlah').value.trim();
  const ucapan = document.getElementById('ucapan').value.trim();

  if (!nama || !ucapan) {
    showToast('Isi nama dan ucapan dulu ya ✨');
    return;
  }

  // Dibuat dengan textContent (bukan innerHTML) agar aman dari injeksi HTML/XSS
  const card = document.createElement('div');
  card.className = 'wish-card glass';

  const h4 = document.createElement('h4');
  h4.textContent = nama;
  card.appendChild(h4);

  if (jumlah) {
    const small = document.createElement('small');
    small.textContent = 'Jumlah tamu: ' + jumlah;
    card.appendChild(small);
  }

  const p = document.createElement('p');
  p.textContent = ucapan;
  card.appendChild(p);

  document.getElementById('wishContainer').prepend(card);

  ['nama', 'jumlah', 'ucapan'].forEach(id => { document.getElementById(id).value = ''; });
  showToast('Terima kasih atas doa & ucapannya 🤍');
}

/* ---------- 7. Animasi muncul saat scroll ---------- */
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}

/* ---------- Event binding ---------- */
document.getElementById('openBtn').addEventListener('click', openInvitation);
musicBtn.addEventListener('click', toggleMusic);

/* ---------- 8. UI: penanda menu aktif pada navigasi bawah ---------- */
(() => {
  const links = Array.from(document.querySelectorAll('.dock a'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(l => l.classList.remove('active'));
    const a = map.get(e.target.id); if (a) a.classList.add('active');
  }), { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((a, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
})();
