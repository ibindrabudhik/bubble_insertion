/* ============================================================
   SORTLAB — step-trace engine for bubble & insertion sort
   Each "step" knows: the array snapshot, which bars to light,
   the active pseudocode line, the active python line, the live
   variables, running counters, and a human narration.
   ============================================================ */

"use strict";

/* ----------------------------- source listings ----------------------------- */

const SOURCES = {
  bubble: {
    pseudo: [
      "function bubbleSort(A, n)            // urutkan A menaik dengan menukar tetangga",
      "  for i ← 0 to n − 2                 // tiap lintasan mengunci 1 nilai terbesar di kanan",
      "    for j ← 0 to n − i − 2           // telusuri pasangan bersebelahan yang belum terurut",
      "      if A[j] > A[j + 1]             // kalau urutan pasangan terbalik...",
      "        swap A[j], A[j + 1]          // ...tukar supaya yang lebih besar bergeser ke kanan",
      "  return A                           // larik sudah terurut, kembalikan",
    ],
    python: [
      "def bubble_sort(a):",
      "    n = len(a)",
      "    for i in range(n):",
      "        for j in range(n - i - 1):",
      "            if a[j] > a[j + 1]:",
      "                a[j], a[j + 1] = a[j + 1], a[j]",
      "    return a",
    ],
  },
  insertion: {
    pseudo: [
      "function insertionSort(A, n)         // urutkan A dengan menyisipkan tiap elemen ke kiri",
      "  for i ← 1 to n − 1                  // ambil tiap elemen mulai indeks 1",
      "    key ← A[i]                         // simpan nilai yang akan disisipkan (key)",
      "    j ← i − 1                          // mulai membandingkan dari elemen kiri key",
      "    while j ≥ 0 and A[j] > key         // selama masih ada elemen kiri yang lebih besar...",
      "      A[j + 1] ← A[j]                  // ...geser elemen itu satu langkah ke kanan",
      "      j ← j − 1                        // lanjut periksa elemen di sebelah kirinya",
      "    A[j + 1] ← key                     // taruh key pada celah kosong yang pas",
      "  return A                            // larik sudah terurut, kembalikan",
    ],
    python: [
      "def insertion_sort(a):",
      "    n = len(a)",
      "    for i in range(1, n):",
      "        key = a[i]",
      "        j = i - 1",
      "        while j >= 0 and a[j] > key:",
      "            a[j + 1] = a[j]",
      "            j -= 1",
      "        a[j + 1] = key",
      "    return a",
    ],
  },
};

const PSEUDO_KW = new Set(["function", "for", "to", "if", "while", "and", "return", "swap", "key"]);
const PY_KW = new Set(["def", "for", "in", "range", "while", "return", "and", "len", "not", "or"]);

/* ----------------------------- step generators ----------------------------- */

function genBubble(input) {
  const a = input.slice();
  const n = a.length;
  const steps = [];
  let cmp = 0, writes = 0;
  let sortedTail = n; // indices >= sortedTail are finalized

  const base = () => {
    const r = {};
    for (let k = sortedTail; k < n; k++) r[k] = "sorted";
    return r;
  };
  const push = (p, py, note, extra, vars) => {
    const roles = base();
    if (extra) for (const k in extra) roles[k] = extra[k];
    steps.push({ arr: a.slice(), roles, p, py, note, vars: vars || {}, cmp, writes });
  };

  push(0, 0, `Mulai <b>bubble sort</b> untuk ${n} nilai. Tetangga dibandingkan berulang kali agar nilai besar "menggelembung" ke kanan.`, null, {});

  for (let i = 0; i < n - 1; i++) {
    push(1, 2, `Lintasan luar <b>i = ${i}</b>. Nilai terbesar yang belum terkunci akan menetap di kanan pada lintasan ini.`, null, { i });
    for (let j = 0; j < n - i - 1; j++) {
      push(2, 3, `Langkah dalam <b>j = ${j}</b> — periksa pasangan A[${j}] dan A[${j + 1}].`, { [j]: "compare", [j + 1]: "compare" }, { i, j });
      cmp++;
      const swap = a[j] > a[j + 1];
      push(3, 4,
        `Bandingkan <span class="hl">A[${j}] = ${a[j]}</span> dan <span class="hl">A[${j + 1}] = ${a[j + 1]}</span> &rarr; ${swap ? "urutan terbalik, tukar." : "sudah urut, biarkan."}`,
        { [j]: "compare", [j + 1]: "compare" }, { i, j });
      if (swap) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        writes += 2;
        push(4, 5, `Tukar &mdash; <b>${a[j]}</b> pindah ke kiri <b>${a[j + 1]}</b>.`, { [j]: "swap", [j + 1]: "swap" }, { i, j });
      }
    }
    sortedTail = n - 1 - i; // this position is now locked
    push(1, 2, `Lintasan selesai: indeks ${sortedTail} terkunci. <span class="hl">${n - sortedTail}</span> nilai sudah terurut.`, null, { i });
  }
  sortedTail = 0;
  push(5, 6, `Tidak ada lagi yang perlu ditukar &mdash; larik sudah terurut sepenuhnya. ✦`, null, {});
  return steps;
}

function genInsertion(input) {
  const a = input.slice();
  const n = a.length;
  const steps = [];
  let cmp = 0, writes = 0;
  let sortedCount = 1; // a[0..sortedCount-1] is the sorted prefix

  const base = () => {
    const r = {};
    for (let k = 0; k < sortedCount; k++) r[k] = "sorted";
    return r;
  };
  const push = (p, py, note, extra, vars) => {
    const roles = base();
    if (extra) for (const k in extra) roles[k] = extra[k];
    steps.push({ arr: a.slice(), roles, p, py, note, vars: vars || {}, cmp, writes });
  };

  push(0, 0, `Mulai <b>insertion sort</b> untuk ${n} nilai. A[0] adalah bagian terurut sepanjang satu; kita perbesar dengan menyisipkan tiap nilai berikutnya.`, null, {});

  for (let i = 1; i < n; i++) {
    push(1, 2, `Lintasan luar <b>i = ${i}</b>: sisipkan A[${i}] ke bagian terurut di sebelah kirinya.`, { [i]: "compare" }, { i });
    const key = a[i];
    let hole = i;
    push(2, 3, `Angkat <span class="hl">key = A[${i}] = ${key}</span>, menyisakan celah kosong di indeks ${i}.`, { [hole]: "key" }, { i, key });
    let j = i - 1;
    push(3, 4, `Mulai memindai ke kiri dari <b>j = ${j}</b>.`, { [hole]: "key" }, { i, j, key });

    while (true) {
      const inRange = j >= 0;
      if (inRange) cmp++;
      const cond = inRange && a[j] > key;
      push(4, 5,
        inRange
          ? `Apakah A[${j}] = ${a[j]} &gt; key = ${key}? ${cond ? "Ya &rarr; geser ke kanan." : "Tidak &rarr; celah inilah tempatnya."}`
          : `Sudah sampai awal (j = -1) &rarr; celah inilah tempatnya.`,
        inRange ? { [j]: "compare", [hole]: "key" } : { [hole]: "key" }, { i, j, key });
      if (!cond) break;
      a[j + 1] = a[j];
      writes++;
      hole = j;
      push(5, 6, `Geser A[${j}] = ${a[j]} ke indeks ${j + 1}; celah berpindah ke ${hole}.`, { [j + 1]: "swap", [hole]: "key" }, { i, j, key });
      j--;
      push(6, 7, `Geser pemindaian ke kiri: <b>j = ${j}</b>.`, { [hole]: "key" }, { i, j, key });
    }

    a[j + 1] = key;
    writes++;
    sortedCount = i + 1;
    push(7, 8, `Taruh <span class="hl">key = ${key}</span> di indeks ${j + 1}. Bagian A[0..${i}] kini terurut.`, { [j + 1]: "sorted" }, { i, key });
  }
  push(8, 9, `Semua nilai sudah disisipkan &mdash; larik terurut sepenuhnya. ✦`, null, {});
  return steps;
}

const GENERATORS = { bubble: genBubble, insertion: genInsertion };

/* ----------------------------- tiny syntax highlighter ----------------------------- */

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function highlight(line, kws) {
  const parts = line.match(/(\s+|\/\/.*$|#.*$|[A-Za-z_]\w*|\d+|[^\s\w])/g) || [];
  let html = "", prev = "";
  for (const p of parts) {
    if (/^\s+$/.test(p)) { html += p; continue; }
    if (/^(#|\/\/)/.test(p)) { html += `<span class="t-com">${esc(p)}</span>`; continue; }
    if (/^\d+$/.test(p)) { html += `<span class="t-num">${p}</span>`; prev = p; continue; }
    if (/^[A-Za-z_]\w*$/.test(p)) {
      if (kws.has(p)) html += `<span class="t-kw">${p}</span>`;
      else if (prev === "def" || prev === "function") html += `<span class="t-fn">${p}</span>`;
      else html += `<span class="t-var">${esc(p)}</span>`;
      prev = p; continue;
    }
    html += `<span class="t-op">${esc(p)}</span>`;
  }
  return html;
}

function renderListing(container, lines, kws) {
  container.innerHTML = "";
  const lineEls = [];
  lines.forEach((line, idx) => {
    const row = document.createElement("div");
    row.className = "code-line";
    row.innerHTML =
      `<span class="gutter">${String(idx + 1).padStart(2, "0")}</span>` +
      `<span class="src">${highlight(line, kws)}</span>`;
    container.appendChild(row);
    lineEls.push(row);
  });
  return lineEls;
}

/* ----------------------------- DOM refs ----------------------------- */

const $ = (id) => document.getElementById(id);
const barsEl = $("bars");
const pseudoEl = $("pseudoCode");
const pyEl = $("pyCode");
const narrationEl = $("narration");

const els = {
  stepNow: $("stepNow"), stepTotal: $("stepTotal"),
  varI: $("varI"), varJ: $("varJ"), varKey: $("varKey"),
  cntCmp: $("cntCmp"), cntSwap: $("cntSwap"),
  pseudoChip: $("pseudoChip"),
  playGlyph: $("playGlyph"), playLabel: $("playLabel"),
  sizeRange: $("sizeRange"), sizeOut: $("sizeOut"),
  speedRange: $("speedRange"), speedOut: $("speedOut"),
};

/* ----------------------------- state ----------------------------- */

const state = {
  algo: "bubble",
  input: [],
  steps: [],
  idx: 0,
  maxVal: 1,
  playing: false,
  timer: null,
  pseudoLines: [],
  pyLines: [],
  barEls: [],
};

const ROLE_CLASS = {
  compare: " is-compare is-active",
  swap: " is-swap is-active",
  key: " is-key is-active",
  sorted: " is-sorted",
};

/* ----------------------------- build / regenerate ----------------------------- */

function randomArray(size) {
  const arr = [];
  for (let i = 0; i < size; i++) arr.push(Math.floor(Math.random() * 92) + 8); // 8..99
  return arr;
}

function buildBars() {
  barsEl.innerHTML = "";
  state.barEls = state.input.map(() => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.innerHTML = `<span class="val"></span>`;
    barsEl.appendChild(bar);
    return bar;
  });
}

function buildListings() {
  const src = SOURCES[state.algo];
  state.pseudoLines = renderListing(pseudoEl, src.pseudo, PSEUDO_KW);
  state.pyLines = renderListing(pyEl, src.python, PY_KW);
}

function regenerate(keepInput) {
  if (!keepInput) state.input = randomArray(+els.sizeRange.value);
  state.maxVal = Math.max(...state.input);
  state.steps = GENERATORS[state.algo](state.input);
  state.idx = 0;
  buildBars();
  buildListings();
  render();
}

/* ----------------------------- render a step ----------------------------- */

function render() {
  const s = state.steps[state.idx];

  s.arr.forEach((v, k) => {
    const bar = state.barEls[k];
    bar.style.height = Math.max((v / state.maxVal) * 100, 4) + "%";
    bar.firstElementChild.textContent = v;
    bar.className = "bar" + (ROLE_CLASS[s.roles[k]] || "");
  });

  highlightActive(state.pseudoLines, s.p);
  highlightActive(state.pyLines, s.py);

  els.varI.textContent = s.vars.i ?? "–";
  els.varJ.textContent = s.vars.j ?? "–";
  els.varKey.textContent = s.vars.key ?? "–";
  els.cntCmp.textContent = s.cmp;
  els.cntSwap.textContent = s.writes;

  narrationEl.innerHTML = s.note;
  els.stepNow.textContent = state.idx;
  els.stepTotal.textContent = state.steps.length - 1;
  els.pseudoChip.textContent = state.algo === "bubble" ? "bubble · berkomentar" : "insertion · berkomentar";

  $("btnPrev").disabled = state.idx === 0;
  $("btnNext").disabled = state.idx === state.steps.length - 1;
}

function highlightActive(lineEls, activeIdx) {
  lineEls.forEach((el, i) => el.classList.toggle("is-active", i === activeIdx));
}

/* ----------------------------- transport ----------------------------- */

function goto(i) {
  state.idx = Math.max(0, Math.min(i, state.steps.length - 1));
  render();
  if (state.idx === state.steps.length - 1) pause();
}

function next() { if (state.idx < state.steps.length - 1) goto(state.idx + 1); }
function prev() { if (state.idx > 0) goto(state.idx - 1); }

function speedDelay() { return 1150 - (+els.speedRange.value) * 100; } // 1→1050ms, 10→150ms

function play() {
  if (state.idx >= state.steps.length - 1) state.idx = 0;
  state.playing = true;
  els.playGlyph.textContent = "❚❚"; // pause bars
  els.playLabel.textContent = "Jeda";
  clearInterval(state.timer);
  state.timer = setInterval(() => {
    if (state.idx >= state.steps.length - 1) { pause(); return; }
    next();
  }, speedDelay());
}

function pause() {
  state.playing = false;
  els.playGlyph.textContent = "▶";
  els.playLabel.textContent = "Putar";
  clearInterval(state.timer);
}

function togglePlay() { state.playing ? pause() : play(); }

/* ----------------------------- wiring ----------------------------- */

document.querySelectorAll(".algo-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.dataset.algo === state.algo) return;
    document.querySelectorAll(".algo-tab").forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    pause();
    state.algo = tab.dataset.algo;
    regenerate(true); // re-run on the SAME array for easy comparison
  });
});

$("btnNew").addEventListener("click", () => { pause(); regenerate(false); });
$("btnReset").addEventListener("click", () => { pause(); goto(0); });
$("btnNext").addEventListener("click", () => { pause(); next(); });
$("btnPrev").addEventListener("click", () => { pause(); prev(); });
$("btnPlay").addEventListener("click", togglePlay);

els.sizeRange.addEventListener("input", () => {
  els.sizeOut.textContent = els.sizeRange.value;
});
els.sizeRange.addEventListener("change", () => { pause(); regenerate(false); });

els.speedRange.addEventListener("input", () => {
  els.speedOut.textContent = els.speedRange.value;
  if (state.playing) play(); // restart interval at new speed
});

document.addEventListener("keydown", (e) => {
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  if (e.key === " ") { e.preventDefault(); togglePlay(); }
  else if (e.key === "ArrowRight") { e.preventDefault(); pause(); next(); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); pause(); prev(); }
  else if (e.key.toLowerCase() === "n") { pause(); regenerate(false); }
});

/* ----------------------------- boot ----------------------------- */

regenerate(false);
