'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const pad = n => String(n).padStart(2, '0');
const source = n => `assets/videos/${pad(n)}.mp4`;
const poster = n => `assets/images/poster-${pad(n)}.webp`;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = reducedMotion.matches || Boolean(navigator.connection?.saveData);
const visibleVideos = new Set();
const viewer = $('#viewer');
const motionButton = $('#motion-toggle');
const tasks = {
  radish: { title: 'Radish to plate', instruction: 'Pick up the radish and place it on the plate.', ids: [7, 6, 5, 4] },
  cups: { title: 'Cup stacking', instruction: 'Grasp one cup and align it precisely with the other to form a stack.', ids: [11, 10, 9, 8] },
  pot: { title: 'Open pot & place pepper', instruction: 'Remove the pot lid, then pick up the pepper and place it into the pot.', ids: [15, 14, 13, 12] }
};
const realPairs = [
  { title: 'Radish to plate', ours: 16, baseline: 17, model: 'FastWAM-Joint', failure: 'Missed grasp' },
  { title: 'Cup stacking', ours: 18, baseline: 19, model: 'π₀.₅', failure: 'Collision' },
  { title: 'Open pot & place pepper', ours: 20, baseline: 21, model: 'Without epipolar residual', failure: 'Missed grasp' }
];
const simPairs = [
  { title: 'Manipulation / 01', category: 'robotwin', ours: 22, baseline: 26 },
  { title: 'Manipulation / 02', category: 'robotwin', ours: 23, baseline: 27 },
  { title: 'Manipulation / 03', category: 'robotwin', ours: 24, baseline: 28 },
  { title: 'Manipulation / 04', category: 'robotwin', ours: 25, baseline: 29 },
  { title: 'Tabletop manipulation / 01', category: 'libero', ours: 31, baseline: 32 },
  { title: 'Tabletop manipulation / 02', category: 'libero', ours: 30, baseline: 33 }
];

function frame(id, label, { speed = '', expand = true } = {}) {
  return `<div class="video-frame"><video data-src="${source(id)}" data-id="${id}" poster="${poster(id)}" muted loop playsinline controls preload="none" aria-label="${label}${speed ? `, presented at ${speed} speed` : ''}"></video><div class="video-label"><span>${label}</span>${speed ? `<span>${speed}</span>` : ''}</div>${expand ? `<button class="expand-video" data-video="${id}" data-label="${label}" data-speed="${speed}" aria-label="Enlarge ${label}" title="Enlarge video">⛶</button>` : ''}</div>`;
}

function loadVideo(video) {
  if (video.dataset.src) {
    video.src = video.dataset.src;
    delete video.dataset.src;
    video.load();
  }
}

function pauseVideo(video) {
  if (!video.paused) {
    video._systemPause = true;
    video.pause();
  }
}

async function playVideo(video, explicit = false) {
  if (!explicit && (motionPaused || video._userPaused || document.hidden || (viewer.open && !viewer.contains(video)))) return;
  loadVideo(video);
  if (explicit) video._userPaused = false;
  try { await video.play(); } catch { /* Native controls remain available if autoplay is blocked. */ }
}

const observer = new IntersectionObserver(entries => {
  for (const { target: video, isIntersecting, intersectionRatio } of entries) {
    if (isIntersecting && intersectionRatio > 0.24) {
      visibleVideos.add(video);
      if (!motionPaused) playVideo(video);
    } else {
      visibleVideos.delete(video);
      pauseVideo(video);
    }
  }
}, { threshold: [0, 0.25, 0.6] });

function registerVideos(root = document) {
  $$('video', root).forEach(video => {
    if (video.dataset.registered) return;
    video.dataset.registered = 'true';
    video.muted = true;
    video.addEventListener('pause', () => {
      if (!video._systemPause) video._userPaused = true;
      video._systemPause = false;
    });
    video.addEventListener('play', () => { video._userPaused = false; });
    video.addEventListener('pointerdown', () => loadVideo(video), { once: true });
    video.addEventListener('keydown', () => loadVideo(video), { once: true });
    video.addEventListener('error', () => {
      if (!video.parentElement || $('.load-error', video.parentElement)) return;
      const note = document.createElement('p');
      note.className = 'load-error';
      const link = document.createElement('a');
      link.href = video.currentSrc || video.dataset.src || video.src;
      link.textContent = 'Open this video directly';
      note.append('Video could not load. ', link);
      video.parentElement.append(note);
    });
    if (!viewer.contains(video)) observer.observe(video);
  });
}

function unregisterVideos(root) {
  $$('video', root).forEach(video => {
    observer.unobserve(video);
    visibleVideos.delete(video);
    pauseVideo(video);
    video.removeAttribute('src');
    video.load();
  });
}

function renderTask(key) {
  const task = tasks[key];
  const panel = $('#real-panel');
  unregisterVideos(panel);
  panel.setAttribute('aria-labelledby', `task-${key}`);
  panel.innerHTML = `<div class="real-stage"><div class="main-view">${frame(task.ids[0], `${task.title} · External recording`, { speed: '3×' })}<div class="view-caption"><strong>External recording</strong><span class="view-tag">COBOT MAGIC / SELECTED ROLLOUT</span></div></div><div class="side-views">${task.ids.slice(1).map((id, i) => frame(id, ['Scene camera', 'Left wrist', 'Right wrist'][i])).join('')}</div></div>`;
  $('#task-description').textContent = task.instruction;
  registerVideos(panel);
}

function pairVideos(pair, modal = false) {
  return `<div class="pair-body"><div class="pair-video">${frame(pair.ours, 'MVG-WAM', { speed: '10×', expand: !modal })}<div class="pair-label"><strong>MVG-WAM</strong><span class="outcome success">Success</span></div></div><div class="pair-video">${frame(pair.baseline, pair.model || 'FastWAM-Joint', { speed: '10×', expand: !modal })}<div class="pair-label"><span>${pair.model || 'FastWAM-Joint'}</span><span class="outcome failure">${pair.failure || 'Failure'}</span></div></div></div>`;
}

function pairCard(pair, index, type) {
  const label = type === 'real' ? 'REAL WORLD' : pair.category === 'robotwin' ? 'ROBOTWIN 2.0' : 'LIBERO';
  return `<article class="compare-card" ${pair.category ? `data-category="${pair.category}"` : ''}><div class="compare-card-head"><h4>${pair.title}</h4><span>${label}</span></div>${pairVideos(pair)}<div class="compare-card-foot"><span>10× speed · selected rollouts</span><button class="small-button" data-pair="${type}-${index}">Compare in detail</button></div></article>`;
}

function setupTabs(selector, attr, callback) {
  const buttons = $$(selector);
  function activate(button) {
    buttons.forEach(b => { b.setAttribute('aria-selected', String(b === button)); b.tabIndex = b === button ? 0 : -1; });
    callback(button.dataset[attr]);
  }
  buttons.forEach((button, i) => {
    button.addEventListener('click', () => activate(button));
    button.addEventListener('keydown', event => {
      let index;
      if (event.key === 'ArrowRight') index = (i + 1) % buttons.length;
      if (event.key === 'ArrowLeft') index = (i - 1 + buttons.length) % buttons.length;
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = buttons.length - 1;
      if (index !== undefined) { event.preventDefault(); buttons[index].focus(); activate(buttons[index]); }
    });
  });
}

const standardRows = [
  ['π₀.₅','Yes','98.8','98.2','98.0','92.4','96.9','82.74','76.76','79.75'],
  ['X-VLA','Yes','98.2','98.6','97.8','97.6','98.1','72.80','72.84','72.82'],
  ['ABot-M0','Yes','98.8','99.8','99.0','96.6','98.6','80.42','81.16','80.79'],
  ['StarVLA-α','No','99.0','99.8','98.5','94.1','97.9','88.20','88.30','88.25'],
  ['Motus','Yes','96.8','99.8','96.6','97.6','97.7','88.66','87.02','87.84'],
  ['LingBot-VA','Yes','98.5','99.6','97.2','98.5','98.5','92.93','91.55','92.24'],
  ['FastWAM','No','98.2','100.0','97.0','95.2','97.6','91.88','91.78','91.83'],
  ['FastWAM-Joint','No','99.6','99.4','98.2','96.8','98.5','90.84','90.32','90.58'],
  ['LiLa-WAM','No','98.0','98.8','97.2','94.2','97.1','90.48','89.04','89.76'],
  ['MVG-WAM','No','99.8','99.8','99.0','97.8','99.1','92.54','91.60','92.07']
];
const oodRows = [
  ['Camera','0.8','56.4','39.9','51.9'],['Robot','3.5','31.9','65.1','65.3'],['Language','23.0','79.5','94.7','90.1'],['Light','8.1','88.7','92.1','88.4'],['Background','34.8','93.3','58.1','62.3'],['Noise','15.2','75.8','56.2','57.6'],['Layout','28.5','74.2','79.3','80.8'],['Overall','15.6','69.6','68.7','70.4']
];
const c2rRows = [['C2C','70.0','77.8','64.3','69.8','72.6'],['C2R','25.8','1.9','3.2','1.3','29.2'],['Average','47.9','39.9','33.8','35.6','50.9']];
const ablationRows = [['MVG-WAM','92.05','77.65'],['w/o Epipolar Residual','91.05','75.00'],['w/o Epipolar Constraint','90.86','74.65'],['w/o View Routing','90.93','74.92'],['w/o Depth Supervision','90.96','74.81'],['FastWAM-Joint','89.44','71.96']];
const realRows = [['π₀.₅','92','88','88','89.3'],['FastWAM-Joint','86','78','72','78.7'],['MVG-WAM w/o Epipolar Residual','94','86','82','87.3'],['MVG-WAM','96','90','88','91.3']];

function table(headers, rows, caption, group = '') {
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="${caption}"><table><caption>${caption}</caption><thead>${group}<tr>${headers.map((h, i) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr${row[0] === 'MVG-WAM' ? ' class="ours"' : ''}>${row.map((cell, i) => i === 0 ? `<th scope="row">${cell}</th>` : `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function renderResults(key) {
  const panel = $('#result-panel');
  panel.setAttribute('aria-labelledby', `result-tab-${key}`);
  const callout = (number, copy) => `<div class="result-callout"><strong>${number}</strong><p>${copy}</p></div>`;
  if (key === 'standard') {
    panel.innerHTML = table(['Method','Emb. PT.','Spatial','Object','Goal','Long','Average','Clean','Random','Average'], standardRows, 'Paper, Table I. Success rates (%). Emb. PT. denotes additional embodied or robot-data pretraining.', '<tr><th colspan="2" scope="colgroup"></th><th colspan="5" scope="colgroup">LIBERO</th><th colspan="3" scope="colgroup">RoboTwin 2.0</th></tr>') +
      '<p class="result-note">LIBERO: 50 trials per task. RoboTwin 2.0: 100 trials per task and domain. RoboTwin training includes 50 clean and 500 randomized demonstrations per task, so the standard Random result is not an out-of-distribution evaluation.</p>' + callout('+1.49 pts', '<b>RoboTwin 2.0 over FastWAM-Joint.</b> MVG-WAM reaches 92.07% without additional embodied pretraining. LingBot-VA, which uses embodied pretraining, reports 92.24%.');
  } else if (key === 'ood') {
    panel.innerHTML = '<h3 class="subresult-title">LIBERO-Plus · Seven distribution shifts</h3>' + table(['Shift','OpenVLA','OpenVLA-OFT','FastWAM-Joint','MVG-WAM'], oodRows, 'Paper, Table II. The LIBERO policy is evaluated unchanged on LIBERO-Plus.') +
      '<p class="result-note">MVG-WAM improves pooled success from 68.7% to 70.4%. Gains are largest for Camera (+12.0 points) and Background (+4.2 points). Language and Light performance decreases relative to FastWAM-Joint.</p>' +
      '<h3 class="subresult-title">RoboTwin 2.0 · Clean2Random</h3>' + table(['Domain','X-WAM','FastWAM','AHA-WAM','FastWAM-Joint','MVG-WAM'], c2rRows, 'Paper, Table III. C2C = Clean2Clean; C2R = Clean2Random. X-WAM, FastWAM, and AHA-WAM follow the cited leaderboard snapshot.') +
      '<p class="result-note">FastWAM-Joint and MVG-WAM are trained on the same 2,500 clean demonstrations, with no randomized RoboTwin training data, for 100k updates. Both use 100 trials per task in each test domain.</p>' + callout('+27.9 pts', '<b>Clean2Random over FastWAM-Joint.</b> Success increases from 1.3% to 29.2%. Unseen randomized conditions remain substantially harder than Clean2Clean (72.6%).');
  } else if (key === 'ablation') {
    panel.innerHTML = table(['Variant','All 50 tasks','Hard-13'], ablationRows, 'Paper, Table IV. Reduced training regime: 50 clean and 200 randomized demonstrations per task.') +
      '<p class="result-note">All variants share the training data and evaluation seeds. Hard-13 is fixed by an independent FastWAM-Joint validation pass. These results come from a separate reduced-data run and should not be substituted for the standard benchmark scores.</p>' + callout('+5.69 pts', '<b>On Hard-13 over FastWAM-Joint.</b> Removing the epipolar residual, epipolar constraint, camera-aware routing, or depth supervision reduces performance.');
  } else {
    panel.innerHTML = table(['Model','Radish to plate','Cup stacking','Open pot + pepper','Mean'], realRows, 'Paper, Table V. Cobot Magic: 50 trials per task; interventions and safety stops count as failures.') +
      '<p class="result-note">100 RGB-D training and 10 validation demonstrations per task; one three-task policy fine-tuned for 20k updates. The scene-view camera is wrist-mounted at a fixed observation angle.</p>' + callout('137 / 150', '<b>Successful real-world trials.</b> The controller executes 24-waypoint chunks at 20 Hz. An H100 policy call takes 0.81 s, including preprocessing and geometry encoding.');
  }
}

function openViewer(title, markup) {
  visibleVideos.forEach(pauseVideo);
  $('#viewer-title').textContent = title;
  $('#viewer-content').innerHTML = markup;
  document.body.classList.add('modal-open');
  viewer.showModal();
  registerVideos(viewer);
  $$('video', viewer).forEach(v => { loadVideo(v); if (!motionPaused) playVideo(v, true); });
}

viewer.addEventListener('close', () => {
  unregisterVideos(viewer);
  $('#viewer-content').innerHTML = '';
  document.body.classList.remove('modal-open');
  visibleVideos.forEach(v => playVideo(v));
});
$('.close-viewer').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', event => {
  const r = viewer.getBoundingClientRect();
  if (event.target === viewer && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) viewer.close();
});

document.addEventListener('click', event => {
  const expand = event.target.closest('[data-video]');
  if (expand) {
    const n = Number(expand.dataset.video);
    const label = expand.dataset.label;
    openViewer(label, `<video src="${source(n)}" poster="${poster(n)}" controls muted loop playsinline preload="metadata" aria-label="${label}"></video>${expand.dataset.speed ? `<p class="viewer-note">${expand.dataset.speed} speed, as presented in the source demonstration.</p>` : ''}`);
  }
  const pairButton = event.target.closest('[data-pair]');
  if (pairButton) {
    const [type, index] = pairButton.dataset.pair.split('-');
    const pair = (type === 'real' ? realPairs : simPairs)[Number(index)];
    openViewer(`${pair.title} · Method comparison`, pairVideos(pair, true) + '<p class="viewer-note">Selected rollouts, presented at 10× speed. Use each player’s controls to inspect the execution.</p><button class="small-button" id="replay-pair">Replay both</button>');
    $('#replay-pair').addEventListener('click', () => restartVideos(viewer));
  }
  const figure = event.target.closest('[data-figure]');
  if (figure) {
    const key = figure.dataset.figure;
    const title = key === 'architecture' ? 'MVG-WAM architecture' : 'Short-horizon RGB prediction';
    openViewer(title, `<img src="assets/images/${key}.webp" alt="${$('img', figure).alt}">`);
  }
});

async function restartVideos(root) {
  const videos = $$('video', root);
  await Promise.all(videos.map(async video => {
    loadVideo(video);
    if (video.readyState < 1) await new Promise(resolve => {
      const done = () => { clearTimeout(timer); video.removeEventListener('loadedmetadata', done); video.removeEventListener('error', done); resolve(); };
      const timer = setTimeout(done, 6000);
      video.addEventListener('loadedmetadata', done, { once: true });
      video.addEventListener('error', done, { once: true });
    });
    if (video.readyState >= 1) video.currentTime = 0;
  }));
  videos.forEach(v => playVideo(v, true));
}

function updateMotion() {
  motionButton.textContent = motionPaused ? 'Enable motion' : 'Pause motion';
  motionButton.setAttribute('aria-pressed', String(motionPaused));
  if (motionPaused) $$('video').forEach(pauseVideo);
  else visibleVideos.forEach(v => playVideo(v));
}
motionButton.addEventListener('click', () => { motionPaused = !motionPaused; updateMotion(); });
reducedMotion.addEventListener('change', event => { motionPaused = event.matches; updateMotion(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) $$('video').forEach(pauseVideo);
  else if (viewer.open) { if (!motionPaused) $$('video', viewer).forEach(v => playVideo(v)); }
  else visibleVideos.forEach(v => playVideo(v));
});

$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.filter;
  $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  $$('.simulation-grid .compare-card').forEach(card => {
    card.hidden = category !== 'all' && card.dataset.category !== category;
    if (card.hidden) $$('video', card).forEach(pauseVideo);
  });
}));

$('#copy-citation').addEventListener('click', async () => {
  const text = $('#bibtex').textContent;
  let copied = false;
  try { await navigator.clipboard.writeText(text); copied = true; } catch {
    const input = document.createElement('textarea');
    input.value = text; input.style.cssText = 'position:fixed;opacity:0;left:-10000px';
    document.body.append(input); input.select();
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    input.remove(); $('#copy-citation').focus();
  }
  $('#copy-status').textContent = copied ? 'BibTeX copied.' : 'Select the citation text and copy it manually.';
  $('#copy-citation').textContent = copied ? 'Copied' : 'Copy BibTeX';
  setTimeout(() => { $('#copy-citation').textContent = 'Copy BibTeX'; }, 2500);
});

setupTabs('[data-task]', 'task', renderTask);
setupTabs('[data-result]', 'result', renderResults);
$('#restart-real').addEventListener('click', () => restartVideos($('#real-panel')));
$('#real-comparisons').innerHTML = realPairs.map((pair, i) => pairCard(pair, i, 'real')).join('');
$('#simulation-grid').innerHTML = simPairs.map((pair, i) => pairCard(pair, i, 'sim')).join('');
$('#concept-views').innerHTML = [2, 1, 3].map((id, i) => frame(id, ['SCENE', 'LEFT WRIST', 'RIGHT WRIST'][i], { expand: false })).join('');
renderTask('radish');
renderResults('standard');
registerVideos();
updateMotion();

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    $$('.header nav a').forEach(a => a.classList.toggle('active', a.hash === `#${entry.target.id}`));
  });
}, { rootMargin: '-20% 0px -60% 0px' });
$$('main > section[id]').forEach(section => sectionObserver.observe(section));
