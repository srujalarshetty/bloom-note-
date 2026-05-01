/* ═══════════════════════════════════════════════
   BLOOM NOTE — script.js
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── STATE ── */
  const state = {
    flowers: [],       // array of { id, type, emoji, color, posIndex }
    vase: 'glass',
    note: '',
  };

  /* ── PREDEFINED POSITIONS
     Each slot has a { top, left } in % relative to .bouquet-flowers (320×260px).
     Odd slots lean left, even lean right for a natural clustered look.
  ── */
  const SLOTS = [
    { top: 52, left: 48 },   // 0 center
    { top: 28, left: 38 },   // 1 upper-left
    { top: 28, left: 56 },   // 2 upper-right
    { top: 44, left: 28 },   // 3 mid-left
    { top: 44, left: 66 },   // 4 mid-right
    { top: 14, left: 48 },   // 5 top-center
    { top: 60, left: 36 },   // 6 lower-left
    { top: 60, left: 58 },   // 7 lower-right
    { top: 18, left: 30 },   // 8 upper far-left
    { top: 18, left: 65 },   // 9 upper far-right
    { top: 38, left: 18 },   // 10 left edge
    { top: 38, left: 76 },   // 11 right edge
  ];

  const MAX_FLOWERS = SLOTS.length;

  /* ── DOM REFS ── */
  const flowerCountEl  = document.getElementById('flowerCount');
  const bouquetFlowers = document.getElementById('bouquetFlowers');
  const bouquetEmpty   = document.getElementById('bouquetEmpty');
  const noteTextarea   = document.getElementById('bloomNote');
  const noteDisplay    = document.getElementById('noteDisplay');
  const charCountEl    = document.getElementById('charCount');
  const shareBtn       = document.getElementById('shareBtn');
  const shareResult    = document.getElementById('shareResult');
  const shareLinkInput = document.getElementById('shareLink');
  const copyBtn        = document.getElementById('copyBtn');
  const clearBtn       = document.getElementById('clearBouquet');
  const vaseBtns       = document.querySelectorAll('.vase-btn');

  /* ═══ RENDER ═══ */

  function renderBouquet() {
    /* Remove all existing tokens */
    document.querySelectorAll('.flower-token').forEach(el => el.remove());

    if (state.flowers.length === 0) {
      bouquetEmpty.style.display = 'block';
    } else {
      bouquetEmpty.style.display = 'none';
      state.flowers.forEach(f => {
        const token = createToken(f);
        bouquetFlowers.appendChild(token);
      });
    }

    /* Update counter */
    flowerCountEl.textContent = state.flowers.length;
    animateBadge();
  }

  function createToken(flower) {
    const slot = SLOTS[flower.posIndex];
    const el = document.createElement('div');
    el.classList.add('flower-token');
    el.dataset.id = flower.id;
    el.textContent = flower.emoji;
    el.title = `${flower.type} — click to remove`;
    el.style.top  = slot.top  + '%';
    el.style.left = slot.left + '%';
    el.style.background = hexToRgba(flower.color, 0.18);
    el.style.border = `1.5px solid ${hexToRgba(flower.color, 0.4)}`;
    el.addEventListener('click', () => removeFlower(flower.id));
    return el;
  }

  function renderVase(vaseType) {
    document.querySelectorAll('.vase-svg').forEach(svg => {
      svg.classList.add('d-none');
    });
    const target = document.getElementById('vase-' + vaseType);
    if (target) target.classList.remove('d-none');
  }

  function renderNote() {
    const val = state.note.trim();
    if (val) {
      noteDisplay.textContent = val;
      noteDisplay.classList.add('visible');
    } else {
      noteDisplay.classList.remove('visible');
    }
  }

  /* ═══ FLOWER MANAGEMENT ═══ */

  function addFlower(type, emoji, color) {
    if (state.flowers.length >= MAX_FLOWERS) {
      shakeStage();
      return;
    }

    /* Find a free slot */
    const usedSlots = state.flowers.map(f => f.posIndex);
    let posIndex = -1;
    for (let i = 0; i < SLOTS.length; i++) {
      if (!usedSlots.includes(i)) { posIndex = i; break; }
    }
    if (posIndex === -1) return;

    const flower = {
      id: Date.now() + Math.random(),
      type,
      emoji,
      color,
      posIndex,
    };

    state.flowers.push(flower);
    renderBouquet();
  }

  function removeFlower(id) {
    state.flowers = state.flowers.filter(f => f.id !== id);
    renderBouquet();
  }

  function clearAll() {
    state.flowers = [];
    renderBouquet();
    hideShare();
  }

  /* ═══ VASE ═══ */

  function setVase(type) {
    state.vase = type;
    vaseBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.vase === type);
    });
    renderVase(type);
  }

  /* ═══ NOTE ═══ */

  noteTextarea.addEventListener('input', () => {
    state.note = noteTextarea.value;
    charCountEl.textContent = state.note.length;
    renderNote();
    hideShare();
  });

  /* ═══ SHARE ═══ */

  function generateShareURL() {
    const data = {
      flowers: state.flowers.map(f => ({
        type: f.type,
        emoji: f.emoji,
        color: f.color,
        posIndex: f.posIndex,
      })),
      vase: state.vase,
      note: state.note,
    };
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    const url = window.location.origin + window.location.pathname + '?bloom=' + encoded;
    return url;
  }

  shareBtn.addEventListener('click', () => {
    const url = generateShareURL();
    shareLinkInput.value = url;
    shareResult.style.display = 'block';
    copyBtn.textContent = 'Copy';
    copyBtn.classList.remove('copied');
    shareResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(shareLinkInput.value).then(() => {
      copyBtn.textContent = '✓ Copied';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.classList.remove('copied');
      }, 2000);
    }).catch(() => {
      shareLinkInput.select();
      document.execCommand('copy');
      copyBtn.textContent = '✓ Copied';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.classList.remove('copied');
      }, 2000);
    });
  });

  function hideShare() {
    shareResult.style.display = 'none';
  }

  /* ═══ RESTORE FROM URL ═══ */

  function restoreFromURL() {
    const params = new URLSearchParams(window.location.search);
    const bloomParam = params.get('bloom');
    if (!bloomParam) return;

    try {
      const decoded = JSON.parse(decodeURIComponent(atob(bloomParam)));

      /* Restore vase */
      if (decoded.vase) setVase(decoded.vase);

      /* Restore flowers */
      if (Array.isArray(decoded.flowers)) {
        decoded.flowers.forEach((f, i) => {
          if (i < MAX_FLOWERS) {
            state.flowers.push({
              id: Date.now() + Math.random(),
              type: f.type,
              emoji: f.emoji,
              color: f.color,
              posIndex: f.posIndex,
            });
          }
        });
        renderBouquet();
      }

      /* Restore note */
      if (decoded.note) {
        state.note = decoded.note;
        noteTextarea.value = decoded.note;
        charCountEl.textContent = decoded.note.length;
        renderNote();
      }
    } catch (e) {
      console.warn('Could not restore bloom from URL:', e);
    }
  }

  /* ═══ CARD CLICK HANDLERS ═══ */

  document.querySelectorAll('.flower-card').forEach(card => {
    const addBtn = card.querySelector('.flower-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type  = card.dataset.flower;
        const emoji = card.dataset.emoji;
        const color = card.dataset.color;
        addFlower(type, emoji, color);
        card.classList.add('selected');
        setTimeout(() => card.classList.remove('selected'), 500);
      });
    }
  });

  /* ═══ VASE BUTTON HANDLERS ═══ */

  vaseBtns.forEach(btn => {
    btn.addEventListener('click', () => setVase(btn.dataset.vase));
  });

  /* ═══ CLEAR BUTTON ═══ */

  clearBtn.addEventListener('click', clearAll);

  /* ═══ HELPERS ═══ */

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function animateBadge() {
    flowerCountEl.classList.remove('pop');
    void flowerCountEl.offsetWidth; /* reflow */
    flowerCountEl.classList.add('pop');
    setTimeout(() => flowerCountEl.classList.remove('pop'), 300);
  }

  function shakeStage() {
    const stage = document.getElementById('bouquetStage');
    stage.style.animation = 'none';
    stage.style.transition = 'transform 0.08s ease';
    let shakes = 0;
    const interval = setInterval(() => {
      stage.style.transform = shakes % 2 === 0 ? 'translateX(5px)' : 'translateX(-5px)';
      shakes++;
      if (shakes > 5) {
        clearInterval(interval);
        stage.style.transform = '';
      }
    }, 70);
  }

  /* ═══ INIT ═══ */

  renderVase(state.vase);
  restoreFromURL();

})();