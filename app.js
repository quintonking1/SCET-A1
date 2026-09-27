/* ESPN Watch List — front-end prototype (no backend, in-memory state) */

// Gradient pair + short label used for the fake thumbnail art, keyed by sport.
const SPORT_ART = {
  'NFL':              { label: 'NFL',  c1: '#123a6b', c2: '#0a1c33' },
  'NBA':              { label: 'NBA',  c1: '#7a2020', c2: '#2b0d0d' },
  'MLB':              { label: 'MLB',  c1: '#1d4d3a', c2: '#0b2019' },
  'Soccer':           { label: 'FC',   c1: '#24603a', c2: '#0d2417' },
  'College Football': { label: 'NCAA', c1: '#5c3a0f', c2: '#241705' },
  'Tennis':           { label: 'ATP',  c1: '#5a5a1c', c2: '#22220a' },
};

let saved = [
  { id: 's1', sport: 'NFL', title: 'Eagles vs. Cowboys', meta: 'Week 4 · Sun 4:25 PM ET', status: 'upcoming' },
  { id: 's2', sport: 'NFL', title: 'NFL Primetime', meta: 'Week 3 recap', status: 'replay', duration: '48:12' },
  { id: 's3', sport: 'NBA', title: 'Lakers vs. Warriors', meta: 'Preseason · Fri 10:00 PM ET', status: 'upcoming' },
  { id: 's4', sport: 'NBA', title: 'NBA Today', meta: 'Daily show', status: 'live' },
  { id: 's5', sport: 'MLB', title: 'Dodgers vs. Padres', meta: 'NL Wild Card · Game 2', status: 'live' },
  { id: 's6', sport: 'Soccer', title: 'Arsenal vs. Man City', meta: 'Premier League · Sat 12:30 PM ET', status: 'upcoming' },
  { id: 's7', sport: 'College Football', title: 'Michigan vs. Ohio State', meta: 'Big Ten · Sat 7:30 PM ET', status: 'upcoming' },
  { id: 's8', sport: 'Tennis', title: 'Laver Cup: Day 3 Highlights', meta: 'Full session', status: 'replay', duration: '22:40' },
];

let recommended = [
  { id: 'r1', sport: 'NFL', title: 'Monday Night Countdown', meta: 'Pregame show · Mon 6:00 PM ET', status: 'upcoming', because: 'NFL Primetime' },
  { id: 'r2', sport: 'NFL', title: 'Chiefs vs. Bills', meta: 'Week 4 · Sun 8:20 PM ET', status: 'upcoming', because: 'Eagles vs. Cowboys' },
  { id: 'r3', sport: 'NBA', title: 'Celtics vs. Knicks', meta: 'Preseason · Thu 7:30 PM ET', status: 'upcoming', because: 'Lakers vs. Warriors' },
  { id: 'r4', sport: 'NBA', title: 'The Jump: Season Preview', meta: 'Analysis', status: 'replay', duration: '31:05', because: 'NBA Today' },
  { id: 'r5', sport: 'MLB', title: 'Baseball Tonight', meta: 'Postseason edition', status: 'live', because: 'Dodgers vs. Padres' },
  { id: 'r6', sport: 'Soccer', title: 'Liverpool vs. Chelsea', meta: 'Premier League · Sun 11:30 AM ET', status: 'upcoming', because: 'Arsenal vs. Man City' },
  { id: 'r7', sport: 'College Football', title: 'Alabama vs. LSU', meta: 'SEC · Sat 3:30 PM ET', status: 'upcoming', because: 'Michigan vs. Ohio State' },
  { id: 'r8', sport: 'Tennis', title: 'ATP Finals: Championship Match', meta: 'Full replay', status: 'replay', duration: '2:14:30', because: 'Laver Cup: Day 3 Highlights' },
];

let activeFilter = 'All';

const $ = (id) => document.getElementById(id);
const chipsEl = $('chips');
const savedGrid = $('saved-grid');
const recGrid = $('rec-grid');

const ICONS = {
  add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  remove: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

/* ---------- helpers ---------- */

function badge(item) {
  if (item.status === 'live') return '<span class="badge live">Live</span>';
  if (item.status === 'replay') return '<span class="badge">Replay</span>';
  return '<span class="badge">Upcoming</span>';
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function cardHtml(item, mode) {
  const art = SPORT_ART[item.sport] || { label: item.sport.slice(0, 4).toUpperCase(), c1: '#333', c2: '#111' };
  const isAdd = mode === 'add';
  return `
    <li class="card" data-id="${item.id}">
      <div class="thumb" style="--c1:${art.c1};--c2:${art.c2}">
        <span class="thumb-label">${escapeHtml(art.label)}</span>
        ${badge(item)}
        ${item.duration ? `<span class="duration">${escapeHtml(item.duration)}</span>` : ''}
      </div>
      <div class="card-body">
        <div class="card-text">
          <p class="sport-tag">${escapeHtml(item.sport)}</p>
          <h3 class="card-title">${escapeHtml(item.title)}</h3>
          <p class="card-meta">${escapeHtml(item.meta)}</p>
          ${item.because ? `<p class="card-reason">Because you saved <span>${escapeHtml(item.because)}</span></p>` : ''}
        </div>
        <button class="icon-btn ${isAdd ? 'add' : 'remove'}"
                data-action="${isAdd ? 'add' : 'remove'}"
                data-id="${item.id}"
                title="${isAdd ? 'Add to Watch List' : 'Remove from Watch List'}"
                aria-label="${isAdd ? 'Add' : 'Remove'} ${escapeHtml(item.title)} ${isAdd ? 'to' : 'from'} your Watch List">
          ${isAdd ? ICONS.add : ICONS.remove}
        </button>
      </div>
    </li>`;
}

let toastTimer;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ---------- render ---------- */

function renderChips() {
  const counts = saved.reduce((acc, i) => {
    acc[i.sport] = (acc[i.sport] || 0) + 1;
    return acc;
  }, {});
  const sports = Object.keys(counts).sort();

  // Drop a filter whose sport no longer has any saved items.
  if (activeFilter !== 'All' && !counts[activeFilter]) activeFilter = 'All';

  chipsEl.innerHTML = [['All', saved.length], ...sports.map((s) => [s, counts[s]])]
    .map(([name, count]) => `
      <button class="chip" data-sport="${escapeHtml(name)}" aria-pressed="${name === activeFilter}">
        ${escapeHtml(name)}<span class="chip-count">${count}</span>
      </button>`)
    .join('');
}

function renderSaved() {
  const list = activeFilter === 'All' ? saved : saved.filter((i) => i.sport === activeFilter);
  savedGrid.innerHTML = list.map((i) => cardHtml(i, 'remove')).join('');
  $('saved-empty').hidden = list.length > 0;
  $('saved-count').textContent = saved.length;
}

function renderRecommended() {
  // Surface recommendations for the sports the user saves most first.
  const weight = saved.reduce((acc, i) => {
    acc[i.sport] = (acc[i.sport] || 0) + 1;
    return acc;
  }, {});
  const list = [...recommended].sort((a, b) => (weight[b.sport] || 0) - (weight[a.sport] || 0));
  recGrid.innerHTML = list.map((i) => cardHtml(i, 'add')).join('');
  $('rec-empty').hidden = list.length > 0;
}

function renderAll() {
  renderChips();
  renderSaved();
  renderRecommended();
}

/* ---------- actions ---------- */

function addToSaved(id) {
  const idx = recommended.findIndex((i) => i.id === id);
  if (idx === -1) return;
  const [item] = recommended.splice(idx, 1);
  saved.unshift({ ...item, because: undefined });

  renderChips();
  renderSaved();
  renderRecommended();

  // Highlight the freshly added card when it is visible under the current filter.
  const added = savedGrid.querySelector(`.card[data-id="${item.id}"]`);
  if (added) added.classList.add('is-entering');
  toast(`Added “${item.title}” to your Watch List`);
}

function removeFromSaved(id) {
  const card = savedGrid.querySelector(`.card[data-id="${id}"]`);
  const item = saved.find((i) => i.id === id);
  if (!item) return;
  saved = saved.filter((i) => i.id !== id);

  const finish = () => {
    renderChips();
    renderSaved();
    renderRecommended();
    toast(`Removed “${item.title}”`);
  };

  if (card) {
    card.classList.add('is-leaving');
    setTimeout(finish, 160);
  } else {
    finish();
  }
}

/* ---------- events (delegated) ---------- */

chipsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  activeFilter = chip.dataset.sport;
  renderChips();
  renderSaved();
});

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.icon-btn');
  if (!btn) return;
  if (btn.dataset.action === 'add') addToSaved(btn.dataset.id);
  else removeFromSaved(btn.dataset.id);
});

renderAll();
