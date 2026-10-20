/* のせのせクリームソーダ
   サーバーなしで動くFlexbox練習ゲーム。問題は毎回ランダムに作ります。 */

const CONFIG = {
  // Googleアナリティクスの測定ID（例: "G-ABC123XYZ"）。空のままなら読み込みません。
  gaId: "G-B2Y74NKK4B",
  // 公開したページのURL。空ならいま開いているURLを使います。
  publicUrl: "https://hizumippc.github.io/flexbox-creamsoda/",
  rounds: 10,
  hashtags: ["のせのせクリームソーダ", "Flexbox", "CSS"],
};

/* 挑戦モードの配点（1問100点） */
const CHALLENGE = {
  accuracy: 60,     // 正解で60点。ミス1回ごとに -15点（最低15点）
  missPenalty: 15,
  accuracyMin: 15,
  speed: 30,        // 速さボーナス。fullSec 秒以内なら満点、zeroSec 秒で0点
  tidy: 10,         // 無駄なしボーナス。最短の行数より1行多いごとに -5点
  tidyPenalty: 5,
};
function speedLimits(propCount) {
  const fullSec = 6 + propCount * 4;
  return { fullSec, zeroSec: fullSec * 4 };
}

/* ---------- Googleアナリティクス ---------- */
function setupAnalytics() {
  if (!CONFIG.gaId || !location.protocol.startsWith("http")) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CONFIG.gaId);
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag("js", new Date());
  gtag("config", CONFIG.gaId);
}
function track(name, params) {
  if (typeof window.gtag === "function") window.gtag("event", name, params || {});
}

/* ---------- 乱数（同じシードなら同じ問題になる） ---------- */
function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function makeRng(seedStr) {
  let a = hashSeed(seedStr);
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function newSeed() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/* ---------- 味と絵（ソーダはメロンソーダだけ） ---------- */
const FLAVORS = {
  vanilla: { name: "バニラ", color: "#fffaf0", edge: "#e8d9c0" },
  ichigo: { name: "いちご", color: "#ffc2d4", edge: "#f08aa8" },
  matcha: { name: "抹茶", color: "#c9e4a6", edge: "#8fb866" },
  choco: { name: "チョコ", color: "#a9765a", edge: "#7a5038" },
};
const SODA = { color: "#5fd39a", deep: "#36b37a" };

function glassSvg(flavor) {
  const f = FLAVORS[flavor];
  return `<svg viewBox="0 0 72 96" aria-hidden="true">
    <circle cx="36" cy="33" r="20" fill="none" stroke="${f.edge}" stroke-width="2.5" stroke-dasharray="5 4"/>
    <rect x="44" y="14" width="5" height="44" rx="2" fill="#ff8fb1" transform="rotate(14 46 36)"/>
    <path d="M12 42 H60 L55 92 Q55 94 53 94 H19 Q17 94 17 92 Z" fill="rgba(255,255,255,.6)" stroke="#d9c8bd" stroke-width="2"/>
    <path d="M14.5 52 H57.5 L54.3 90 Q54 92 52 92 H20 Q18 92 17.7 90 Z" fill="${SODA.color}"/>
    <path d="M14.5 52 H57.5 L57 58 H15 Z" fill="${SODA.deep}" opacity=".35"/>
    <circle cx="26" cy="72" r="2.5" fill="#fff" opacity=".7"/>
    <circle cx="40" cy="64" r="2" fill="#fff" opacity=".7"/>
    <circle cx="33" cy="82" r="3" fill="#fff" opacity=".6"/>
    <rect x="18" y="46" width="4" height="40" rx="2" fill="#fff" opacity=".45"/>
  </svg>`;
}
function scoopSvg(flavor) {
  const f = FLAVORS[flavor];
  return `<svg viewBox="0 0 72 96" aria-hidden="true">
    <path d="M16 38 Q16 14 36 13 Q56 14 56 38 Q52 44 47 40 Q43 46 38 41 Q33 47 28 41 Q23 46 20 40 Q17 43 16 38 Z" fill="${f.color}" stroke="${f.edge}" stroke-width="2"/>
    <ellipse cx="28" cy="24" rx="6" ry="3.5" fill="#fff" opacity=".55"/>
    <circle cx="38" cy="9" r="6" fill="#e8364f"/>
    <path d="M38 4 Q41 -2 46 -3" stroke="#6b8e23" stroke-width="2" fill="none"/>
    <circle cx="36" cy="7" r="1.6" fill="#fff" opacity=".7"/>
  </svg>`;
}

/* ---------- プロパティの説明 ---------- */
const PROPS = {
  "justify-content": {
    values: ["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"],
    short: "並ぶ向きにそって寄せる",
    help: `<h3>justify-content</h3>
      <p>並ぶ向き（ふつうは横）にそって、アイスをどこに寄せるかを決めます。</p>
      <ul>
        <li><code>flex-start</code> はじめ側に寄せる（はじめの値）</li>
        <li><code>flex-end</code> おわり側に寄せる</li>
        <li><code>center</code> まんなかに集める</li>
        <li><code>space-between</code> 両はしにくっつけて、あいだを均等にあける</li>
        <li><code>space-around</code> それぞれのまわりに同じすきまをつける</li>
        <li><code>space-evenly</code> すきまを全部同じ幅にする</li>
      </ul>`,
  },
  "align-items": {
    values: ["flex-start", "flex-end", "center", "stretch"],
    short: "並ぶ向きと直角にそろえる",
    help: `<h3>align-items</h3>
      <p>並ぶ向きと直角の方向（ふつうは縦）で、アイスをどこにそろえるかを決めます。</p>
      <ul>
        <li><code>flex-start</code> はじめ側（ふつうは上）</li>
        <li><code>flex-end</code> おわり側（ふつうは下）</li>
        <li><code>center</code> まんなか</li>
        <li><code>stretch</code> のばす（はじめの値。大きさが決まっていると上にそろう）</li>
      </ul>`,
  },
  "flex-direction": {
    values: ["row", "row-reverse", "column", "column-reverse"],
    short: "並ぶ向きを決める",
    help: `<h3>flex-direction</h3>
      <p>アイスが並ぶ向きを決めます。向きが変わると justify-content と align-items の効く方向も入れかわります。</p>
      <ul>
        <li><code>row</code> 左から右へ横に並ぶ（はじめの値）</li>
        <li><code>row-reverse</code> 右から左へ、順番も逆になる</li>
        <li><code>column</code> 上から下へ縦に並ぶ</li>
        <li><code>column-reverse</code> 下から上へ、順番も逆になる</li>
      </ul>`,
  },
};
const ALLOWED = Object.keys(PROPS);

/* ---------- 問題づくり ---------- */
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function randInt(rng, min, max) { return min + Math.floor(rng() * (max - min + 1)); }

function makeRound(rng, i) {
  let props, answer = {}, count, flavors;

  if (i < 3) {
    props = ["justify-content"];
    count = randInt(rng, i === 0 ? 1 : 2, 3);
    answer["justify-content"] = pick(rng, PROPS["justify-content"].values.slice(1));
  } else if (i < 5) {
    props = ["justify-content", "align-items"];
    count = randInt(rng, 1, 3);
    answer["justify-content"] = pick(rng, PROPS["justify-content"].values);
    answer["align-items"] = pick(rng, ["flex-end", "center"]);
  } else if (i < 7) {
    props = ["flex-direction", "justify-content", "align-items"];
    count = randInt(rng, 2, 3);
    answer["flex-direction"] = "column";
    answer["justify-content"] = pick(rng, PROPS["justify-content"].values);
    answer["align-items"] = pick(rng, ["flex-start", "flex-end", "center"]);
  } else {
    props = ["flex-direction", "justify-content", "align-items"];
    answer["flex-direction"] = pick(rng, ["row-reverse", "column-reverse"]);
    count = answer["flex-direction"] === "row-reverse" ? randInt(rng, 2, 4) : randInt(rng, 2, 3);
    answer["justify-content"] = pick(rng, PROPS["justify-content"].values);
    answer["align-items"] = pick(rng, ["flex-start", "flex-end", "center"]);
  }

  if (i < 7) {
    const f = pick(rng, ["vanilla", "vanilla", "ichigo", "matcha"]);
    flavors = Array(count).fill(f);
  } else {
    // 味をばらばらにして、順番（reverse）が大事になるようにする
    const pool = Object.keys(FLAVORS);
    flavors = [];
    for (let k = 0; k < count; k++) flavors.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return { props, answer, count, flavors, minimal: null };
}

// まれに「最初から正解の位置」になる問題ができたら作り直す
function dropTrivialRounds() {
  for (let i = 0; i < state.rounds.length; i++) {
    let tries = 0;
    while (tries < 20 && isTrivial(state.rounds[i])) {
      state.rounds[i] = makeRound(state.rng, i);
      tries++;
    }
  }
}
function isTrivial(r) {
  const dir = r.answer["flex-direction"] || "row";
  const jc = r.answer["justify-content"] || "flex-start";
  const ai = r.answer["align-items"] || "stretch";
  const startJ = jc === "flex-start" || (r.count === 1 && jc === "space-between");
  const startA = ai === "flex-start" || ai === "stretch";
  if (dir === "row") return startJ && startA;
  if (dir === "column") return r.count === 1 && startJ && startA;
  return false;
}

const TITLES = [
  [100, "伝説の喫茶マスター", "1杯もこぼさない、完ぺきなクリームソーダです。"],
  [85, "看板ソーダ職人", "常連さんがつく腕前です。"],
  [65, "一人前の店員さん", "もう少しで看板メニューです。"],
  [40, "見習い店員さん", "説明を読みながら、もう一度いってみよう。"],
  [0, "アイスがとけちゃった", "練習モードで慣れてから、再挑戦！"],
];
function titleFor(score) { return TITLES.find((t) => score >= t[0]); }

const INPUT_LABELS = { pick: "選択式", assist: "補助入力", free: "自由入力" };
const INPUT_NOTES = {
  pick: "プロパティごとに値を選ぶだけ。はじめての人におすすめ。",
  assist: "文字を打つとコードの候補が出ます。VSCodeと同じ感覚の入力練習に。",
  free: "全部自分で書きます。腕に自信がある人向け。",
};

/* ---------- 状態 ---------- */
const state = {
  seed: "", rng: null, round: 0, rounds: [], results: [],
  game: "practice", input: "pick",
  misses: 0, hints: 0, revealed: [], solved: false, pickRows: [],
  roundStart: 0, startedAt: 0, timerId: 0, fromShare: false,
};

const $ = (id) => document.getElementById(id);
const els = {
  target: $("tray-target"), player: $("soda-table"), board: $("board"),
  input: $("css-input"), suggest: $("suggest"), pickBox: $("input-pick"), typeBox: $("input-type"),
  msg: $("msg"), help: $("help-body"), timer: $("timer"),
  check: $("btn-check"), hint: $("btn-hint"), skip: $("btn-skip"), next: $("btn-next"),
};
const isChallenge = () => state.game === "challenge";

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("is-active", s.id === "screen-" + name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- 答え方の切りかえ ---------- */
function setInput(mode, keepAnswer) {
  const current = keepAnswer ? readUserCss().styles : null;
  state.input = mode;
  document.querySelectorAll(".seg-btn[data-input]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.input === mode)));
  $("input-note").textContent = INPUT_NOTES[mode];
  els.typeBox.hidden = mode === "pick";
  els.pickBox.hidden = mode !== "pick";
  $("assist-note").hidden = mode !== "assist";
  $("kbd-note").hidden = mode === "pick";
  closeSuggest();
  if (current) writeUserCss(current);
}

function writeUserCss(styles) {
  if (state.input === "pick") {
    state.pickRows = Object.entries(styles)
      .filter(([k, v]) => PROPS[k] && PROPS[k].values.includes(v))
      .map(([prop, value]) => ({ prop, value }));
    if (!state.pickRows.length) state.pickRows = [{ prop: "", value: "" }];
    renderPick();
  } else {
    els.input.value = Object.entries(styles).map(([k, v]) => `${k}: ${v};`).join("\n");
  }
}

/* ---------- 選択式（プロパティ名も値も選ぶ・行は＋で足す） ---------- */
function renderPick() {
  const used = state.pickRows.map((r) => r.prop);
  els.pickBox.innerHTML = state.pickRows.map((row, k) => {
    const propOptions = ALLOWED.filter((p) => p === row.prop || !used.includes(p))
      .map((p) => `<option value="${p}" ${p === row.prop ? "selected" : ""}>${p}</option>`).join("");
    const valueOptions = row.prop
      ? PROPS[row.prop].values.map((v) => `<option value="${v}" ${v === row.value ? "selected" : ""}>${v}</option>`).join("")
      : "";
    return `<div class="pick-row" data-k="${k}">
      <select class="pick-prop" aria-label="${k + 1}行目のプロパティ">
        <option value="">（プロパティ）</option>${propOptions}
      </select><span class="colon">:</span>
      <select class="pick-value" aria-label="${k + 1}行目の値" ${row.prop ? "" : "disabled"}>
        <option value="">（値）</option>${valueOptions}
      </select><span class="semi">;</span>
      <button type="button" class="pick-del" aria-label="${k + 1}行目を消す" title="この行を消す">×</button>
    </div>`;
  }).join("") + (state.pickRows.length < ALLOWED.length
    ? `<button type="button" class="pick-add">＋ 行を追加</button>` : "");
}

function bindPickEvents() {
  els.pickBox.addEventListener("change", (e) => {
    const rowEl = e.target.closest(".pick-row");
    if (!rowEl) return;
    const row = state.pickRows[Number(rowEl.dataset.k)];
    if (e.target.classList.contains("pick-prop")) {
      row.prop = e.target.value; row.value = "";
      renderPick();
      const next = els.pickBox.querySelector(`.pick-row[data-k="${rowEl.dataset.k}"] .pick-value`);
      if (next && !next.disabled) next.focus();
    } else if (e.target.classList.contains("pick-value")) {
      row.value = e.target.value;
    }
  });
  els.pickBox.addEventListener("click", (e) => {
    if (e.target.classList.contains("pick-add")) {
      state.pickRows.push({ prop: "", value: "" });
      renderPick();
      const sels = els.pickBox.querySelectorAll(".pick-prop");
      sels[sels.length - 1].focus();
    } else if (e.target.classList.contains("pick-del")) {
      const k = Number(e.target.closest(".pick-row").dataset.k);
      state.pickRows.splice(k, 1);
      if (!state.pickRows.length) state.pickRows = [{ prop: "", value: "" }];
      renderPick();
    }
  });
}

/* ---------- 補助入力（候補を出す） ---------- */
let suggestItems = [], suggestIndex = 0;

function lineContext() {
  const pos = els.input.selectionStart;
  const text = els.input.value;
  const start = text.lastIndexOf("\n", pos - 1) + 1;
  const before = text.slice(start, pos);
  return { pos, start, before };
}

function updateSuggest() {
  if (state.input !== "assist") return closeSuggest();
  const { before } = lineContext();
  const colon = before.indexOf(":");
  let items = [];
  if (colon === -1) {
    const word = before.trim().toLowerCase();
    if (!word) return closeSuggest();
    items = ALLOWED.filter((p) => p.startsWith(word) || p.includes(word))
      .map((p) => ({ kind: "prop", value: p, note: "" })); // VSCodeと同じく、候補はコードだけ
  } else {
    const prop = before.slice(0, colon).trim().toLowerCase();
    const word = before.slice(colon + 1).trim().toLowerCase();
    if (!PROPS[prop] || word.includes(";")) return closeSuggest();
    items = PROPS[prop].values.filter((v) => v.startsWith(word) || (word && v.includes(word)))
      .map((v) => ({ kind: "value", value: v, note: "" }));
    if (items.length === 1 && items[0].value === word) items = [];
  }
  if (!items.length) return closeSuggest();
  suggestItems = items; suggestIndex = 0;
  renderSuggest();
}
function renderSuggest() {
  els.suggest.innerHTML = suggestItems.map((it, k) =>
    `<li role="option" data-k="${k}" class="${k === suggestIndex ? "is-active" : ""}" aria-selected="${k === suggestIndex}">${it.value}${it.note ? `<small>${it.note}</small>` : ""}</li>`).join("");
  els.suggest.hidden = false;
}
function closeSuggest() { suggestItems = []; els.suggest.hidden = true; }

function acceptSuggest(k) {
  const it = suggestItems[k];
  if (!it) return;
  const { pos, start, before } = lineContext();
  const text = els.input.value;
  const lineEnd = text.indexOf("\n", pos) === -1 ? text.length : text.indexOf("\n", pos);
  const after = text.slice(pos, lineEnd);
  let newLine, caretIn;
  if (it.kind === "prop") {
    const indent = before.match(/^\s*/)[0];
    newLine = `${indent}${it.value}: `;
    caretIn = newLine.length;
  } else {
    const colon = before.indexOf(":");
    newLine = `${before.slice(0, colon + 1)} ${it.value};`;
    caretIn = newLine.length;
    const isLast = lineEnd === text.length;
    if (isLast) { newLine += "\n"; caretIn += 1; }
  }
  const rest = it.kind === "prop" ? after.replace(/^[a-z-]*/i, "") : "";
  els.input.value = text.slice(0, start) + newLine + rest + text.slice(lineEnd);
  const caret = start + caretIn;
  els.input.setSelectionRange(caret, caret);
  els.input.focus();
  closeSuggest();
  if (it.kind === "prop") updateSuggestAfterColon();
}
function updateSuggestAfterColon() {
  // プロパティを決めたら、続けて値の候補を出す
  const { before } = lineContext();
  const prop = before.split(":")[0].trim();
  if (!PROPS[prop]) return;
  suggestItems = PROPS[prop].values.map((v) => ({ kind: "value", value: v, note: "" }));
  suggestIndex = 0;
  renderSuggest();
}

/* ---------- 盤面 ---------- */
function applyStyles(el, styles) {
  el.removeAttribute("style");
  for (const [k, v] of Object.entries(styles)) el.style.setProperty(k, v);
}
function rectsOf(container) {
  return [...container.children].map((el) => ({ el, f: el.dataset.flavor, r: el.getBoundingClientRect() }));
}
// アイスと点線を1つずつ組み合わせて、合っているものと外れているものを返す
function matchLayout(targetRects, playerRects) {
  const pool = targetRects.map((t) => ({ ...t, used: false }));
  const missed = [];
  playerRects.forEach((p) => {
    const g = pool.find((t) => !t.used && t.f === p.f && Math.abs(t.r.left - p.r.left) < 4 && Math.abs(t.r.top - p.r.top) < 4);
    if (g) g.used = true; else missed.push(p.el);
  });
  return { ok: missed.length === 0, missed, empty: pool.filter((t) => !t.used).map((t) => t.el) };
}
function sameLayout(a, b) { return matchLayout(a, b).ok; }
function isSolved() { return sameLayout(rectsOf(els.target), rectsOf(els.player)); }

// 書ける答えを全部ためして、行数がいちばん少ないものを集める
function shortestAnswers() {
  const goal = rectsOf(els.target);
  const choices = ALLOWED.map((p) => [null, ...PROPS[p].values]);
  const found = [];
  const walk = (idx, styles) => {
    if (idx === ALLOWED.length) {
      applyStyles(els.player, styles);
      if (sameLayout(goal, rectsOf(els.player))) found.push({ ...styles });
      return;
    }
    for (const v of choices[idx]) {
      const next = { ...styles };
      if (v) next[ALLOWED[idx]] = v;
      walk(idx + 1, next);
    }
  };
  walk(0, {});
  applyStyles(els.player, {});
  const min = Math.min(...found.map((s) => Object.keys(s).length));
  return found.filter((s) => Object.keys(s).length === min);
}

function renderRound() {
  const r = state.rounds[state.round];
  els.target.innerHTML = r.flavors.map((f) => `<div class="item glass" data-flavor="${f}">${glassSvg(f)}</div>`).join("");
  els.player.innerHTML = r.flavors.map((f) => `<div class="item scoop" data-flavor="${f}">${scoopSvg(f)}</div>`).join("");
  applyStyles(els.target, r.answer);
  r.shortest = shortestAnswers();
  r.minimal = r.shortest[0];
  applyStyles(els.player, {});

  $("round-num").textContent = `${state.round + 1} / ${state.rounds.length}`;
  updateScoreNow();
  const names = [...new Set(r.flavors)].map((f) => FLAVORS[f].name).join("・");
  $("round-title").textContent = `${names}アイスを${r.count}つのせよう`;
  $("round-text").textContent = state.round >= 7
    ? "味がちがうので、順番にも注意。点線と同じ味のアイスをのせます。"
    : "点線のところにアイスがのるように、CSSを書こう。点線の枠がFlexboxの箱のはしです。";
  // 「この問題で使うプロパティ」はヒントを押したときだけ出す
  els.help.innerHTML = "";
  $("help").hidden = true;

  // 入力欄
  els.input.value = "";
  els.input.placeholder = state.input === "assist" ? "ここに打つと候補が出ます（例: ju）" : r.props.map((p) => `${p}: ;`).join("\n");
  els.input.rows = Math.max(3, r.props.length + 1);
  state.pickRows = [{ prop: "", value: "" }];
  renderPick();
  setInput(state.input, false);

  state.misses = 0; state.hints = 0; state.revealed = []; state.solved = false;
  setMsg("", "");
  els.check.hidden = false; els.skip.hidden = false; els.next.hidden = true;
  els.hint.hidden = isChallenge(); els.hint.disabled = false;
  state.roundStart = performance.now();
  if (state.input !== "pick") els.input.focus({ preventScroll: true });
}

function readUserCss() {
  const styles = {}, unknown = [];
  if (state.input === "pick") {
    state.pickRows.forEach((row) => { if (row.prop && row.value) styles[row.prop] = row.value; });
    return { styles, unknown };
  }
  els.input.value.replace(/\/\*[\s\S]*?\*\//g, "").split(/[;\n]/).forEach((line) => {
    const m = line.match(/^\s*([a-zA-Z-]+)\s*:\s*([^;]+?)\s*$/);
    if (!m) { if (line.trim()) unknown.push(line.trim()); return; }
    const prop = m[1].toLowerCase(), val = m[2].toLowerCase();
    if (ALLOWED.includes(prop)) styles[prop] = val;
    else unknown.push(prop);
  });
  return { styles, unknown };
}

// 位置が変わるときに、すべるように動かす
function moveWithAnimation(styles) {
  const items = [...els.player.children];
  const before = items.map((el) => el.getBoundingClientRect());
  applyStyles(els.player, styles);
  items.forEach((el, k) => {
    const after = el.getBoundingClientRect();
    const dx = before[k].left - after.left, dy = before[k].top - after.top;
    if (!dx && !dy) return;
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.3,1.3,.5,1)" });
  });
}

function clearMarks() {
  els.board.querySelectorAll(".is-off, .is-empty").forEach((el) => el.classList.remove("is-off", "is-empty"));
}

const DEFAULTS = { "justify-content": ["flex-start", "normal"], "align-items": ["stretch", "normal", "flex-start"], "flex-direction": ["row"] };

// いらない行と、その理由を調べる
function extraLineReasons(styles, unknown) {
  const reasons = [];
  for (const p of Object.keys(styles)) {
    const test = { ...styles }; delete test[p];
    applyStyles(els.player, test);
    if (!isSolved()) continue;
    if (DEFAULTS[p] && DEFAULTS[p].includes(styles[p])) {
      reasons.push(p === "align-items"
        ? `align-items: ${styles[p]} は書かなくても同じ（アイスの大きさが決まっているので、最初から上（はじめ側）にそろう）`
        : `${p}: ${styles[p]} は最初から入っている値なので、書かなくても同じ`);
    } else {
      reasons.push(`${p}: ${styles[p]} は消しても同じ位置になる`);
    }
  }
  applyStyles(els.player, styles);
  unknown.forEach((u) => reasons.push(`「${u}」はこのゲームでは効かない行`));
  return reasons;
}

function answerText(styles) {
  const lines = Object.entries(styles).map(([k, v]) => `${k}: ${v};`);
  return lines.length ? lines.join("\n") : "（何も書かなくてOK）";
}
function shortestText(r) {
  const list = r.shortest.slice(0, 4).map(answerText);
  const head = r.shortest.length > 1 ? `いちばん短い答え（${r.shortest.length}通り。どれでも正解）` : "いちばん短い答え";
  return head + "\n" + list.join("\n― または ―\n") + (r.shortest.length > 4 ? `\nほか${r.shortest.length - 4}通り` : "");
}
function setMsg(text, cls, extra) {
  els.msg.className = "msg " + (cls || "");
  els.msg.textContent = text;
  if (extra) {
    const span = document.createElement("span");
    span.className = "answer"; span.textContent = extra;
    els.msg.appendChild(span);
  }
}

function totalScore() { return state.results.reduce((a, b) => a + b.total, 0); }
function updateScoreNow() { $("score-now").textContent = totalScore(); }

function scoreRound(seconds, extraLines) {
  if (!isChallenge()) {
    const total = Math.max(2, 10 - state.misses * 2 - state.hints * 3);
    return { total, max: 10 };
  }
  const r = state.rounds[state.round];
  const accuracy = Math.max(CHALLENGE.accuracyMin, CHALLENGE.accuracy - state.misses * CHALLENGE.missPenalty);
  const { fullSec, zeroSec } = speedLimits(Object.keys(r.minimal).length || 1);
  const ratio = seconds <= fullSec ? 1 : Math.max(0, 1 - (seconds - fullSec) / (zeroSec - fullSec));
  const speed = Math.round(CHALLENGE.speed * ratio);
  const tidy = Math.max(0, CHALLENGE.tidy - extraLines * CHALLENGE.tidyPenalty);
  return { total: accuracy + speed + tidy, max: 100, accuracy, speed, tidy };
}

function check() {
  if (state.solved) return;
  closeSuggest(); clearMarks();
  const { styles, unknown } = readUserCss();
  moveWithAnimation(styles);
  const r = state.rounds[state.round];
  const seconds = (performance.now() - state.roundStart) / 1000;
  setTimeout(() => {
    const result = matchLayout(rectsOf(els.target), rectsOf(els.player));
    if (result.ok) {
      state.solved = true;
      const lines = Object.keys(styles).length + unknown.length;
      const minLines = Object.keys(r.minimal).length;
      const extraLines = Math.max(0, lines - minLines);
      const res = scoreRound(seconds, extraLines);
      res.seconds = seconds;
      state.results.push(res);
      [...els.player.children].forEach((el) => el.classList.add("landed"));
      let head = `のった！ +${res.total}点`;
      if (isChallenge()) head += `（正確さ${res.accuracy}・速さ${res.speed}・無駄なし${res.tidy}）`;
      let note = "";
      if (extraLines) {
        const reasons = extraLineReasons(styles, unknown);
        note = `\n\nあなたは${lines}行、最短は${minLines}行でした。`;
        note += reasons.length ? "\n" + reasons.map((t) => "・" + t).join("\n") : "\n組み合わせを変えると、もっと少ない行で書けます。";
      }
      setMsg(head, "ok", shortestText(r) + note);
      finishRoundUi();
    } else {
      state.misses++;
      result.missed.forEach((el) => el.classList.add("is-off"));
      result.empty.forEach((el) => el.classList.add("is-empty"));
      els.board.classList.remove("shake"); void els.board.offsetWidth; els.board.classList.add("shake");
      let text = "おしい！赤く光っているアイスがズレています。光っている点線にのせよう。";
      if (unknown.length) text = `「${unknown.join("、")}」はこのゲームでは使えません。説明にあるプロパティを使おう。`;
      else if (!Object.keys(styles).length) text = state.input === "pick" ? "プロパティと値を選んでから「のせる！」を押そう。" : "プロパティと値を「名前: 値;」の形で書いてみよう。";
      setMsg(text, "ng");
    }
  }, 430);
}

function hint() {
  if (isChallenge() || state.hints) return;
  const r = state.rounds[state.round];
  // 最短の答えに出てくるプロパティ（何通りかあるときは全部）
  const sets = r.shortest.map((st) => Object.keys(st).sort().join(","));
  const used = ALLOWED.filter((p) => r.shortest.some((st) => p in st));
  const oneWay = new Set(sets).size === 1;
  els.help.innerHTML = (oneWay ? "" : `<p class="help-note">組み合わせ方が何通りかあります。このうち必要なものを使おう。</p>`)
    + used.map((p) => PROPS[p].help).join("");
  $("help").hidden = false;
  $("help").open = true;
  state.hints = 1;
  els.hint.disabled = true;
  setMsg(`ヒント：この問題で使うプロパティを下に出しました(-3点)。値は自分で考えよう。`, "");
}

function skip() {
  if (state.solved) return;
  const r = state.rounds[state.round];
  state.solved = true; clearMarks();
  state.results.push(isChallenge()
    ? { total: 0, max: 100, accuracy: 0, speed: 0, tidy: 0, skipped: true }
    : { total: 0, max: 10, skipped: true });
  moveWithAnimation(r.minimal);
  setMsg("答えを見ました（この問題は0点）。", "", shortestText(r));
  finishRoundUi();
}

function finishRoundUi() {
  updateScoreNow();
  els.check.hidden = true; els.hint.hidden = true; els.skip.hidden = true; els.next.hidden = false;
  els.next.textContent = state.round + 1 >= state.rounds.length ? "結果を見る" : "つぎへ";
  els.next.focus({ preventScroll: true });
}

function next() {
  state.round++;
  if (state.round >= state.rounds.length) return showResult();
  renderRound();
}

/* ---------- タイマー（挑戦モード） ---------- */
function startTimer() {
  stopTimer();
  els.timer.hidden = !isChallenge();
  if (!isChallenge()) return;
  state.timerId = setInterval(() => {
    if (state.solved) return;
    els.timer.textContent = ((performance.now() - state.roundStart) / 1000).toFixed(1) + "秒";
  }, 100);
}
function stopTimer() { clearInterval(state.timerId); }

/* ---------- 開始と結果 ---------- */
function startGame(seed, game) {
  state.seed = seed;
  state.game = game;
  state.rng = makeRng(seed);
  state.rounds = Array.from({ length: CONFIG.rounds }, (_, i) => makeRound(state.rng, i));
  dropTrivialRounds();
  state.round = 0; state.results = []; state.startedAt = Date.now();
  const tag = $("mode-tag");
  tag.textContent = isChallenge() ? "挑戦" : "練習";
  tag.classList.toggle("is-challenge", isChallenge());
  showScreen("game");
  renderRound();
  startTimer();
  track("game_start", { seed, game, input: state.input });
}

function shareUrl() {
  let base = CONFIG.publicUrl;
  if (!base && location.protocol.startsWith("http")) base = location.origin + location.pathname;
  return base ? `${base}?seed=${state.seed}&mode=${state.game}` : "";
}

function showResult() {
  stopTimer();
  const total = totalScore();
  const max = state.results.reduce((a, b) => a + b.max, 0);
  const score = Math.floor((total / max) * 100);
  const [, title, comment] = titleFor(score);
  const sec = Math.round((Date.now() - state.startedAt) / 1000);
  const modeName = isChallenge() ? "挑戦モード" : "練習モード";

  $("result-label").textContent = `本日のクリームソーダ完成度（${modeName}・${INPUT_LABELS[state.input]}）`;
  $("result-score").textContent = score;
  $("result-title").textContent = title;
  $("result-time").textContent = `${comment}　かかった時間 ${Math.floor(sec / 60)}分${sec % 60}秒`;

  const bd = $("breakdown");
  let shareDetail = "";
  if (isChallenge()) {
    const sum = (k) => state.results.reduce((a, b) => a + (b[k] || 0), 0);
    const n = state.results.length;
    const parts = [
      ["正確さ", sum("accuracy"), CHALLENGE.accuracy * n],
      ["速さ", sum("speed"), CHALLENGE.speed * n],
      ["無駄のなさ", sum("tidy"), CHALLENGE.tidy * n],
    ];
    bd.innerHTML = parts.map(([name, v, m]) => `<div class="bd-item"><span>${name}</span><b>${v}</b><small> / ${m}</small></div>`).join("");
    bd.hidden = false;
    shareDetail = `\n正確さ${parts[0][1]}／速さ${parts[1][1]}／無駄のなさ${parts[2][1]}`;
  } else {
    bd.hidden = true;
  }
  $("result-dots").innerHTML = state.results.map((res, k) => {
    const cls = res.total === res.max ? "full" : res.total > 0 ? "part" : "zero";
    return `<span class="dot ${cls}" title="${k + 1}問目 ${res.total}点">${res.total}</span>`;
  }).join("");

  const text = `「のせのせクリームソーダ」${modeName}でFlexboxに挑戦🍈\n完成度 ${score}点（${title}）${shareDetail}\n同じ問題で勝負してみる？`;
  const params = new URLSearchParams({ text, hashtags: CONFIG.hashtags.join(",") });
  const url = shareUrl();
  if (url) params.set("url", url);
  $("btn-share").href = "https://twitter.com/intent/tweet?" + params.toString();
  showScreen("result");
  track("game_finish", { seed: state.seed, game: state.game, input: state.input, score, seconds: sec });
}

/* ---------- イベント ---------- */
function init() {
  setupAnalytics();
  bindPickEvents();
  const y = $("copy-year"); if (y) y.textContent = new Date().getFullYear();
  setInput("pick", false);
  $("start-visual").innerHTML = glassSvg("vanilla") + scoopSvg("vanilla") + glassSvg("ichigo");

  const q = new URLSearchParams(location.search);
  const urlSeed = q.get("seed"), urlMode = q.get("mode");
  if (urlSeed && /^[a-z0-9]{1,16}$/i.test(urlSeed)) {
    state.seed = urlSeed; state.fromShare = true;
    const note = $("seed-note");
    note.hidden = false;
    note.textContent = urlMode === "challenge"
      ? "シェアされた問題です。友だちと同じ10問で「挑戦モード」に挑みましょう。"
      : "シェアされた問題です。友だちと同じ10問であそべます。";
  }

  document.querySelectorAll(".seg-btn[data-input]").forEach((b) =>
    b.addEventListener("click", () => setInput(b.dataset.input, $("screen-game").classList.contains("is-active"))));
  document.querySelectorAll(".mode-card").forEach((b) =>
    b.addEventListener("click", () => startGame(state.fromShare ? state.seed : newSeed(), b.dataset.game)));
  els.check.addEventListener("click", check);
  els.hint.addEventListener("click", hint);
  els.skip.addEventListener("click", skip);
  els.next.addEventListener("click", next);
  $("btn-again").addEventListener("click", () => { state.fromShare = false; startGame(newSeed(), state.game); });
  $("btn-same").addEventListener("click", () => startGame(state.seed, state.game));
  $("btn-top").addEventListener("click", () => { state.fromShare = false; $("seed-note").hidden = true; showScreen("start"); });

  els.input.addEventListener("input", updateSuggest);
  els.input.addEventListener("click", updateSuggest);
  els.input.addEventListener("blur", () => setTimeout(closeSuggest, 150));
  els.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); check(); return; }
    if (els.suggest.hidden) return;
    if (e.key === "ArrowDown") { e.preventDefault(); suggestIndex = (suggestIndex + 1) % suggestItems.length; renderSuggest(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); suggestIndex = (suggestIndex - 1 + suggestItems.length) % suggestItems.length; renderSuggest(); }
    else if (e.key === "Tab" || e.key === "Enter") { e.preventDefault(); acceptSuggest(suggestIndex); }
    else if (e.key === "Escape") { closeSuggest(); }
  });
  els.suggest.addEventListener("pointerdown", (e) => {
    const li = e.target.closest("li");
    if (li) { e.preventDefault(); acceptSuggest(Number(li.dataset.k)); }
  });
}
init();
