import { questions } from './bank.js';

const topics = {
  enzymes: ['Enzymes', 'Enzymes', '3.1 Enzymes'],
  conditions: ['Enzyme conditions', 'Conditions', '3.2 Environmental Impacts on Enzyme Function'],
  energy: ['Cellular energy', 'Energy', '3.3 Cellular Energy'],
  photo: ['Photosynthesis', 'Photosynthesis', '3.4 Photosynthesis'],
  respiration: ['Cellular respiration', 'Respiration', '3.5 Cellular Respiration'],
};

const focusGroups = [
  ['Active sites and catalysis', 'Explain how active-site interactions stabilize a transition state and lower activation energy. Compare input and output energy on a reaction diagram.', [5,8,10,33,39,40,67]],
  ['Enzyme kinetics and regulation', 'Sketch a saturation curve. Compare how additional substrate affects competitive inhibition, and how changes at a regulatory site affect catalysis.', [9,13,35,37,47,48,55,60,70,71,78]],
  ['Temperature, pH, and enzyme activity', 'Compare the effects of cold, heat, and pH on rate. On a graph, identify the optimum and explain how altered protein shape can reduce activity.', [11,15,17,20,25,36,38,44,54,64,68,69,72,77,79,82]],
  ['Energy transfer and ATP', 'Trace where energy enters and leaves a system. Explain how ATP hydrolysis can drive an energetically unfavorable reaction when the reactions are coupled.', [1,12,16,28]],
  ['Conserved pathways', 'Use shared pathways such as glycolysis as evidence for common ancestry. Separate the observation from the evolutionary claim it supports.', [42,49,66]],
  ['Chemiosmosis across organelles', 'Sketch a membrane in a chloroplast and a mitochondrion. Label where protons accumulate and how their return through ATP synthase drives ATP production.', [112,166]],
  ['Light reactions and pigments', 'Trace electrons from water through the photosystems to NADPH. Explain where oxygen comes from and how light supports formation of the proton gradient.', [50,51,52,53,76,85,95,111,125,132,136,141,146,155,156,158,169,175,176,178]],
  ['Carbon fixation and photosynthesis data', 'Draw how CO₂, ATP, and NADPH feed carbon fixation. Interpret how light, CO₂, and respiration can change measured pH or net productivity.', [21,22,94,100,101,102,103,109,133]],
  ['Glycolysis, pyruvate oxidation, and fermentation', 'Follow glucose to pyruvate and then acetyl-CoA. Explain how fermentation regenerates NAD⁺ and why that lets glycolysis continue.', [24,26,27,62,96,97,98,114,115,116,117,118]],
  ['Oxidative phosphorylation', 'Trace electrons to oxygen and protons across the inner mitochondrial membrane. Predict what happens to ATP production when the gradient dissipates.', [14,128,129,130,131,134,135,138,139,145,150,151,165]],
  ['Measuring metabolic rate', 'Connect oxygen uptake to aerobic respiration. When reading a respirometry setup, identify what is measured and why a CO₂ absorber or control matters.', [63,73,90,91,179]],
];
const questionById = new Map(questions.map(question => [question.id, question]));
const focusById = new Map(focusGroups.flatMap(([title, advice, ids]) => ids.map(id => [id, { title, advice }])));
const storageKey = 'energetics-v1';
const soundToggle = document.querySelector('#sound-toggle');
const soundNotes = {
  correct: [523, 659],
  missed: [349, 294],
  complete: [523, 659, 784],
  reply: [659],
};
let muted = false;
let audio;
let soundOutput;

try {
  muted = localStorage.getItem('energetics-muted') === 'true';
} catch {
  // Sound can still be toggled in this tab.
}

function updateSoundToggle() {
  soundToggle.textContent = muted ? 'Sound off' : 'Sound on';
  soundToggle.setAttribute('aria-pressed', String(!muted));
  if (soundOutput) soundOutput.gain.value = muted ? 0 : 0.18;
  syncStudio();
}

function prepareSound() {
  if (muted || !window.AudioContext) return;
  if (!audio) {
    audio = new AudioContext();
    soundOutput = audio.createGain();
    soundOutput.gain.value = 0.18;
    soundOutput.connect(audio.destination);
  }
  if (audio.state === 'suspended') audio.resume().catch(() => {});
}

function playSound(cue) {
  if (muted) return;
  prepareSound();
  if (!soundOutput) return;
  const start = audio.currentTime;
  for (const [index, frequency] of soundNotes[cue].entries()) {
    const noteStart = start + index * 0.085;
    const tone = audio.createOscillator();
    const level = audio.createGain();
    tone.frequency.value = frequency;
    level.gain.setValueAtTime(0.001, noteStart);
    level.gain.exponentialRampToValueAtTime(0.32, noteStart + 0.012);
    level.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.15);
    tone.connect(level).connect(soundOutput);
    tone.start(noteStart);
    tone.stop(noteStart + 0.16);
  }
}

soundToggle.addEventListener('click', () => {
  muted = !muted;
  try {
    localStorage.setItem('energetics-muted', String(muted));
  } catch {
    // Keep the preference for this tab.
  }
  updateSoundToggle();
  if (!muted) playSound('reply');
});
const studio = document.querySelector('.study-scene');
const studioToggle = document.querySelector('#studio-toggle');
const studioLabel = document.querySelector('#studio-label');
const studioStatus = document.querySelector('#studio-status');
const studioFile = document.querySelector('#studio-file');
const customTrack = new Audio();
customTrack.loop = true;
customTrack.volume = 0.28;
const bundledTrack = './focus-music-loop.m4a';
let trackUrl = bundledTrack;
customTrack.src = bundledTrack;
let playing = false;
let musicTimer;
let musicGain;
let phraseIndex = 0;
let nextNote;
const melody = [
  [69,2],[72,1],[76,3],[74,2],[72,2],[69,4],[67,2],[71,1],[74,3],[72,2],[71,2],[67,4],
  [65,2],[69,1],[72,3],[76,2],[74,2],[72,4],[71,2],[74,1],[77,3],[76,2],[71,2],[69,5],
];

function scheduleViolin() {
  if (nextNote < audio.currentTime) nextNote = audio.currentTime + .03;
  while (nextNote < audio.currentTime + .32) {
    const [pitch, beats] = melody[phraseIndex];
    const time = nextNote;
    const duration = beats * .34;
    const frequency = 440 * 2 ** ((pitch - 69) / 12);
    const note = audio.createOscillator();
    const envelope = audio.createGain();
    const vibrato = audio.createOscillator();
    const depth = audio.createGain();
    note.setPeriodicWave(audio.createPeriodicWave(
      new Float32Array(8), new Float32Array([0,1,.36,.45,.19,.09,.10,.045]),
    ));
    note.frequency.value = frequency;
    vibrato.frequency.value = 5.2;
    depth.gain.setValueAtTime(0, time);
    depth.gain.linearRampToValueAtTime(frequency * .009, time + .2);
    vibrato.connect(depth).connect(note.frequency);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(.22, time + .09);
    envelope.gain.linearRampToValueAtTime(.16, time + duration * .67);
    envelope.gain.linearRampToValueAtTime(0, time + duration + .09);
    note.connect(envelope).connect(musicGain);
    note.start(time);
    vibrato.start(time);
    note.stop(time + duration + .1);
    vibrato.stop(time + duration + .1);
    nextNote += duration;
    phraseIndex = (phraseIndex + 1) % melody.length;
  }
}

function syncStudio() {
  studio.dataset.playing = playing;
  studioToggle.setAttribute('aria-pressed', String(playing));
  studioLabel.textContent = playing ? 'Read instead' : 'Play violin';
  customTrack.muted = muted;
  studioStatus.textContent = playing && muted ? 'Music muted' : '';
  if (!playing || muted || trackUrl) {
    clearInterval(musicTimer);
    musicTimer = undefined;
    musicGain?.disconnect();
    musicGain = undefined;
  }
  if (!playing || muted) {
    customTrack.pause();
    return;
  }
  if (trackUrl) {
    customTrack.play().catch(() => {
      if (playing && !muted && trackUrl === bundledTrack) {
        trackUrl = undefined;
        syncStudio();
        return;
      }
      if (playing && !muted && customTrack.paused) studioStatus.textContent = 'Could not play this audio file.';
    });
    return;
  }
  if (musicTimer) return;
  prepareSound();
  if (!audio) {
    studioStatus.textContent = 'Audio is unavailable in this browser.';
    return;
  }
  musicGain = audio.createGain();
  musicGain.gain.value = .58;
  musicGain.connect(soundOutput);
  nextNote = audio.currentTime + .06;
  scheduleViolin();
  musicTimer = setInterval(scheduleViolin, 120);
}

studioToggle.addEventListener('click', () => {
  playing = !playing;
  syncStudio();
});

studioFile.addEventListener('change', () => {
  if (!studioFile.files.length) return;
  customTrack.pause();
  if (trackUrl?.startsWith('blob:')) URL.revokeObjectURL(trackUrl);
  trackUrl = URL.createObjectURL(studioFile.files[0]);
  customTrack.src = trackUrl;
  playing = true;
  syncStudio();
});

document.querySelector('#studio-focus').addEventListener('click', () => {
  customTrack.pause();
  if (trackUrl?.startsWith('blob:')) URL.revokeObjectURL(trackUrl);
  trackUrl = bundledTrack;
  customTrack.src = bundledTrack;
  studioFile.value = '';
  syncStudio();
});

document.querySelector('#studio-default').addEventListener('click', () => {
  customTrack.pause();
  customTrack.removeAttribute('src');
  if (trackUrl?.startsWith('blob:')) URL.revokeObjectURL(trackUrl);
  trackUrl = undefined;
  studioFile.value = '';
  syncStudio();
});

updateSoundToggle();

const app = document.querySelector('#app');
const coach = document.querySelector('#coach');
const coachMessage = document.querySelector('#coach-message');
const coachToggle = document.querySelector('#coach-toggle');
const avatarButtons = document.querySelectorAll('[data-avatar]');
const avatarDock = document.querySelector('.avatar-dock');
const portraits = document.querySelectorAll('[data-mascot]');
const buddy = document.querySelector('#buddy');
const buddyTab = document.querySelector('#open-buddy');
const buddyGrip = buddy.querySelector('.buddy-grip');
const buddyThinking = document.querySelector('#buddy-thinking');
const buddyLog = document.querySelector('#buddy-log');
const buddyStatus = document.querySelector('#buddy-status');
const buddyForm = document.querySelector('#buddy-form');
const buddyInput = document.querySelector('#buddy-input');
const conversations = { neko: [], chad: [] };
const pendingAvatars = new Map();
const chatStatus = { neko: '', chad: '' };
let avatar = 'neko';
try {
  if (localStorage.getItem('energetics-avatar') === 'chad') avatar = 'chad';
} catch {
  // Avatar selection still works in this tab.
}

function renderAvatar() {
  const name = avatar === 'chad' ? 'Chad' : 'Neko';
  const template = document.querySelector(avatar === 'chad' ? '#chad-avatar' : '#mascot');
  for (const [index, portrait] of portraits.entries()) {
    const drawing = template.content.cloneNode(true);
    if (avatar === 'chad') {
      const clipId = 'chad-cutout-' + index;
      drawing.querySelector('clipPath').id = clipId;
      drawing.querySelector('image').setAttribute('clip-path', `url(#${clipId})`);
    }
    portrait.replaceChildren(drawing);
  }
  studio.dataset.avatar = avatar;
  document.querySelector('#avatar-name').textContent = name;
  coachToggle.setAttribute('aria-label', `Get encouragement from ${name}`);
  coach.setAttribute('aria-label', name);
  for (const button of avatarButtons) button.setAttribute('aria-pressed', button.dataset.avatar === avatar);
  renderConversation();
}

for (const button of avatarButtons) {
  button.addEventListener('click', () => {
    avatar = button.dataset.avatar;
    try {
      localStorage.setItem('energetics-avatar', avatar);
    } catch {
      // Keep the in-memory selection.
    }
    renderAvatar();
    if (!buddy.open) encourage(avatar === 'chad' ? 'Chad here. Let’s get those reps in.' : 'Neko here. Time for a little flex.', 'celebrate');
  });
}
renderAvatar();
let coachTimeout;

function hideCoach() {
  const restoreFocus = coach.contains(document.activeElement);
  clearTimeout(coachTimeout);
  coach.hidden = true;
  avatarDock.hidden = false;
  coachToggle.setAttribute('aria-expanded', 'false');
  if (restoreFocus) coachToggle.focus();
}

function encourage(message, mood = 'happy') {
  hideCoach();
  coach.dataset.mood = mood;
  coach.hidden = false;
  avatarDock.hidden = true;
  coachToggle.setAttribute('aria-expanded', 'true');
  coachMessage.textContent = message;
  coachTimeout = setTimeout(hideCoach, 6500);
}

coachToggle.addEventListener('click', () => {
  encourage(avatar === 'chad' ? 'One question at a time. Every rep counts.' : 'Neko here. One question at a time. Watch this flex!', 'celebrate');
  document.querySelector('#coach-dismiss').focus();
});
document.querySelector('#coach-dismiss').addEventListener('click', () => {
  hideCoach();
  coachToggle.focus();
});
let saved = { missed: [], latest: null, session: null };

try {
  const existing = JSON.parse(localStorage.getItem(storageKey));
  if (existing) saved = existing;
} catch {
  // The current tab still works when local storage is unavailable.
}

let size = 20;
let filter = 'all';
let selected = new Set();
let choice = null;
const letters = 'ABCDE';
const escape = value => String(value).replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(saved));
  } catch {
    document.querySelector('footer span:last-child').textContent = 'Progress available in this tab';
  }
}

function show(html, moveFocus = true) {
  hideCoach();
  app.innerHTML = html;
  if (moveFocus) {
    window.scrollTo(0, 0);
    app.focus();
  }
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}

function practiceIds() {
  const groups = Object.keys(topics).map(topic => shuffle(questions.filter(question => question.topic === topic)));
  const picked = [];
  const target = size === 'all' ? questions.length : size;
  while (picked.length < target) {
    for (const group of shuffle(groups)) {
      if (group.length && picked.length < target) picked.push(group.pop().id);
    }
  }
  return shuffle(picked);
}

function tally(answers) {
  return Object.fromEntries(Object.keys(topics).map(topic => {
    const items = answers.filter(({ id }) => questionById.get(id).topic === topic);
    const correct = items.filter(item => item.correct).length;
    return [topic, { correct, total: items.length, score: items.length ? Math.round(100 * correct / items.length) : null }];
  }));
}

function radar(answers) {
  const stats = tally(answers);
  const axes = Object.entries(topics);
  const coords = (index, scale) => {
    const angle = index * Math.PI * 2 / axes.length - Math.PI / 2;
    return [215 + 101 * scale * Math.cos(angle), 137 + 101 * scale * Math.sin(angle)];
  };
  const points = scale => axes.map((_, index) => coords(index, scale).join(',')).join(' ');
  const allMeasured = axes.every(([key]) => stats[key].score !== null);
  const segments = axes.map(([key], index) => {
    const nextIndex = (index + 1) % axes.length;
    const score = stats[key].score;
    const nextScore = stats[axes[nextIndex][0]].score;
    if (allMeasured || score === null || nextScore === null) return '';
    const [x1,y1] = coords(index,score / 100);
    const [x2,y2] = coords(nextIndex,nextScore / 100);
    return `<path d="M${x1},${y1} L${x2},${y2}" stroke="#d9fd83" stroke-width="2"/>`;
  }).join('');
  return `
    <svg class="radar" viewBox="0 0 430 265" role="img" aria-label="Topic accuracy radar. Exact scores are listed below.">
      ${[.25,.5,.75,1].map(scale => `<circle cx="215" cy="137" r="${101 * scale}" fill="none" stroke="#41473e" stroke-dasharray="3 4"/>`).join('')}
      <polygon points="${points(1)}" fill="none" stroke="#4c5548"/>
      ${axes.map(([, [, label]], index) => {
        const [x,y] = coords(index,1);
        const [tx,ty] = coords(index,1.16);
        const anchor = index === 0 ? 'middle' : index < 3 ? 'start' : 'end';
        return `<path d="M215,137 L${x},${y}" stroke="#41473e"/><text x="${tx}" y="${ty + 4}" text-anchor="${anchor}">${label}</text>`;
      }).join('')}
      ${allMeasured ? `<polygon class="data" points="${axes.map(([key], index) => coords(index,stats[key].score / 100).join(',')).join(' ')}"/>` : segments}
      ${axes.map(([key], index) => {
        const score = stats[key].score;
        const [x,y] = coords(index,score === null ? 1 : score / 100);
        return `<circle cx="${x}" cy="${y}" r="4" class="${score === null ? 'missing' : 'node'}"/>`;
      }).join('')}
    </svg>
    <ul class="topic-list">${axes.map(([key, [label]]) => {
      const { correct, total, score } = stats[key];
      return `<li><span>${label}</span><span class="${total ? 'tag' : 'quiet'}">${total ? `${score}% · ${correct}/${total}` : 'Unmeasured'}</span></li>`;
    }).join('')}</ul>`;
}

function dashboard(moveFocus = true) {
  show(`
    <div class="workspace">
    <aside class="unit-nav" aria-label="Unit topics">
      <h2>Unit 3 topics</h2>
      <ol>${Object.values(topics).map(([, , title]) => {
        const [number, ...name] = title.split(' ');
        return `<li><span>${number}</span>${name.join(' ')}</li>`;
      }).join('')}</ol>
    </aside>
    <div class="workspace-content">
    <div class="hero dashboard-heading"><p class="kicker">AP Biology / Unit 3</p><h1>Cellular energetics</h1></div>
    <div class="grid">
      <div class="stack">
        <section class="panel"><h2>Practice set</h2><p class="quiet">Choose how many questions to answer.</p>
          <div class="sets" aria-label="Set length">${[20,50,100,'all'].map(value => `<button class="set" data-size="${value}" aria-pressed="${value === size}">${value === 'all' ? 'All' : value}<small>${value === 'all' ? questions.length + ' questions' : 'questions'}</small></button>`).join('')}</div>
          <div class="actions">${saved.session ? '<button class="primary" data-action="resume">Resume set</button><button class="secondary" data-action="start">New set</button>' : '<button class="primary" data-action="start">Start practice</button>'}</div>
        </section>
        <section class="panel"><div class="between"><h2>Redemption Questions</h2><span class="count">${saved.missed.length} flagged</span></div>
          <p class="quiet">Retry questions you missed.</p>
          <div class="actions review-actions"><button class="secondary" data-action="review" ${saved.missed.length ? '' : 'disabled'}>Build redemption set</button></div>
        </section>
      </div>
      <section class="panel"><div class="between"><h2>Topic accuracy</h2>${saved.latest ? '<button class="secondary" data-action="results">Last results</button>' : ''}</div>
        <p class="quiet">${saved.latest ? 'Latest completed set' : 'Your scores will appear after your first set.'}</p>
        ${radar(saved.latest?.answers ?? [])}
      </section>
    </div></div></div>`, moveFocus);
}

function begin(ids, mode) {
  if (saved.session && !window.confirm('Replace your current unfinished set?')) return;
  saved.session = { ids, mode, answers: [], index: 0 };
  choice = null;
  persist();
  quiz();
  encourage(mode === 'redemption' ? 'Round two! Show these questions what you learned.' : 'You’ve got this. One question at a time.');
}

function quiz(moveFocus = true) {
  const session = saved.session;
  if (!session) return dashboard();
  const id = session.ids[session.index];
  const question = questionById.get(id);
  const answered = session.answers[session.index];
  const current = answered?.choice ?? choice;
  const last = session.index + 1 === session.ids.length;

  show(`<div class="narrow quiz-screen">
    <div class="between quiz-toolbar"><p class="kicker">${session.mode === 'redemption' ? 'Redemption set' : 'Practice set'}</p><button class="secondary" data-action="home">Save & exit</button></div>
    <h1>Question ${session.index + 1} <span>of ${session.ids.length}</span></h1>
    <progress max="${session.ids.length}" value="${session.answers.length}" aria-label="Questions answered"></progress>
    <section class="panel quiz-card">
      <div class="between"><span class="metric quiet">GUIDE ITEM ${id}</span><button class="secondary" data-action="paper" aria-pressed="false">Original colors</button></div>
      <div class="prompt">${question.images.map((image, index) => `<img src="bank/${image}.png" alt="Guide item ${id}, ${image.startsWith('context') ? 'shared stimulus' : `question excerpt ${index + 1}`}">`).join('')}</div>
      <details><summary>Question transcript</summary><p class="transcript quiet">${escape(question.transcript.replace(/[^\S\n]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n"))}</p><p class="quiet">Figures and tables appear in the guide images above.</p></details>
      <div class="answer-heading">Select an answer</div>
      <div class="answers" style="--choices:${question.choices.length}" aria-label="Answer choices">
        ${[...question.choices].map(letter => `<button class="answer ${answered && letter === question.answer ? 'correct' : ''} ${answered && letter === current && !answered.correct ? 'wrong' : ''}" data-choice="${letter}" aria-pressed="${letter === current}" ${answered ? 'disabled' : ''}>${letter}</button>`).join('')}
      </div>
      ${answered ? `<div class="feedback ${answered.correct ? '' : 'missed'}" role="status"><strong>${answered.correct ? 'Correct' : `Missed · Answer ${question.answer}`}</strong><p class="tag answer-topic">${topics[question.topic][2]}</p><p class="quiet">${escape(question.explanation)}</p></div>
        <button class="primary" data-action="next">${last ? 'See results' : 'Next question'}</button>`
        : `<button class="primary" data-action="check" ${choice ? '' : 'disabled'}>Check answer</button>`}
    </section>
  </div>`, moveFocus);
}

function check() {
  const session = saved.session;
  if (!choice || session.answers[session.index]) return;
  const id = session.ids[session.index];
  const correct = choice === questionById.get(id).answer;
  playSound(correct ? 'correct' : 'missed');
  session.answers.push({ id, choice, correct });
  const queue = new Set(saved.missed);
  if (correct && session.mode === 'redemption') queue.delete(id);
  if (!correct) queue.add(id);
  saved.missed = [...queue];
  persist();
  quiz(false);
  app.querySelector('[data-action="next"]').focus();
  const streak = session.answers.slice(-3);
  if (!correct) {
    const messages = ['Take a breath and read the explanation. You can try this one again.', 'That one’s in your redemption queue. Keep going!', 'A tricky one. Use the explanation to spot what you missed.'];
    encourage(messages[session.index % messages.length], 'calm');
  } else if (streak.length === 3 && streak.every(answer => answer.correct) && !session.answers.at(-4)?.correct) {
    encourage('Three right in a row! Keep it up.', 'celebrate');
  } else if (session.index === 0) {
    encourage('First one down. Nice start!');
  }
}

function advance() {
  const session = saved.session;
  if (!session.answers[session.index]) return;
  choice = null;
  if (session.index + 1 < session.ids.length) {
    session.index++;
    persist();
    quiz();
    return;
  }
  saved.latest = { mode: session.mode, answers: session.answers };
  saved.session = null;
  persist();
  results();
  playSound('complete');
  const perfect = saved.latest.answers.every(answer => answer.correct);
  encourage(perfect ? 'A perfect set! That was paw-some.' : 'Set complete! Take a look at what to focus on next.', 'celebrate');
}

function results() {
  const { answers, mode } = saved.latest;
  const right = answers.filter(answer => answer.correct).length;
  const score = Math.round(100 * right / answers.length);
  const rating = score >= 90 ? 'Excellent' : score >= 75 ? 'Strong' : score >= 60 ? 'Developing' : 'Needs review';
  const gaps = focusGroups.map(([title, advice, ids]) => ({
    title, advice, missed: answers.filter(({ id, correct }) => !correct && ids.includes(id)).length,
  })).filter(item => item.missed).sort((a,b) => b.missed - a.missed);
  show(`
    <div class="hero results-heading"><p class="kicker">${mode === 'redemption' ? 'Redemption' : 'Practice'} results</p><h1>${score}% · ${rating}</h1>
    <p class="lead">${right} of ${answers.length} correct · ${answers.length - right} missed</p></div>
    <div class="grid">
      <section class="panel"><h2>What to focus on</h2>
        ${gaps.length ? `<ul class="focus-list">${gaps.map(({title,advice,missed}) => `<li><div class="between"><h3>${title}</h3><span class="tag">${missed} MISSED</span></div><p class="quiet">${advice}</p></li>`).join('')}</ul>` : '<p class="quiet">You answered every question in this set correctly.</p>'}
        <div class="actions" style="margin-top:18px"><button class="secondary" data-action="home">Dashboard</button>${saved.missed.length ? '<button class="primary" data-action="review">Review flagged questions →</button>' : ''}</div>
      </section>
      <section class="panel"><h2>Topic radar</h2>${radar(answers)}</section>
    </div>`);
}

function visibleMisses() {
  return saved.missed.map(id => questionById.get(id)).filter(question => filter === 'all' || question.topic === filter);
}

function redemption(moveFocus = true) {
  const visible = visibleMisses();
  show(`<div class="narrow"><p class="kicker">Review queue</p><h1>Redemption Questions</h1>
    <p class="lead">Choose the questions you want to retry. A correct retry clears that item.</p>
    <section class="panel" style="margin-top:24px">
      <div class="between"><label>Topic <select id="filter">
        <option value="all">All topics</option>${Object.entries(topics).map(([key,[label]]) => `<option value="${key}" ${filter === key ? 'selected' : ''}>${label}</option>`).join('')}
      </select></label><button class="secondary" data-action="toggle" ${visible.length ? '' : 'disabled'}>${visible.length && visible.every(question => selected.has(question.id)) ? 'Clear visible' : 'Select visible'}</button></div>
      ${visible.length ? `<ul class="review-list">${visible.map(question => `<li><label><input type="checkbox" data-id="${question.id}" ${selected.has(question.id) ? 'checked' : ''}> <span>Guide item ${question.id} <span class="quiet">· ${focusById.get(question.id)?.title ?? topics[question.topic][0]}</span></span></label></li>`).join('')}</ul>` : '<p class="quiet">No flagged questions in this view.</p>'}
      <div class="actions" style="margin-top:18px"><button class="primary" data-action="redeem" ${selected.size ? '' : 'disabled'}>Start redemption (${selected.size}) →</button><button class="secondary" data-action="home">Dashboard</button></div>
    </section></div>`, moveFocus);
}

app.addEventListener('click', event => {
  const control = event.target.closest('button');
  if (!control || control.disabled) return;
  if (control.dataset.size) {
    size = control.dataset.size === 'all' ? 'all' : Number(control.dataset.size);
    for (const button of app.querySelectorAll('[data-size]')) button.setAttribute('aria-pressed', button === control);
  }
  if (letters.includes(control.dataset.choice ?? '-') && control.dataset.choice) {
    choice = control.dataset.choice;
    for (const button of app.querySelectorAll('[data-choice]')) button.setAttribute('aria-pressed', button === control);
    app.querySelector('[data-action="check"]').disabled = false;
  }
  switch (control.dataset.action) {
    case 'home': dashboard(); break;
    case 'start': begin(practiceIds(), 'practice'); break;
    case 'resume': choice = null; quiz(); break;
    case 'results': results(); break;
    case 'check': check(); break;
    case 'next': advance(); break;
    case 'paper': control.setAttribute('aria-pressed', app.querySelector('.prompt').classList.toggle('light')); break;
    case 'review': filter = 'all'; selected = new Set(saved.missed); redemption(); break;
    case 'redeem': begin(shuffle([...selected]), 'redemption'); break;
    case 'toggle': {
      const visible = visibleMisses();
      const clear = visible.every(question => selected.has(question.id));
      for (const { id } of visible) {
        if (clear) selected.delete(id);
        else selected.add(id);
      }
      redemption(false);
      app.querySelector('[data-action="toggle"]').focus();
      break;
    }
  }
});

app.addEventListener('change', event => {
  if (event.target.id === 'filter') {
    filter = event.target.value;
    redemption(false);
    app.querySelector('#filter').focus();
  } else if (event.target.dataset.id) {
    const id = Number(event.target.dataset.id);
    if (event.target.checked) selected.add(id);
    else selected.delete(id);
    redemption(false);
    app.querySelector(`[data-id="${id}"]`).focus();
  }
});

document.querySelector('#home').addEventListener('click', () => dashboard());
dashboard(false);

function renderConversation() {
  const name = avatar === 'chad' ? 'Chad' : 'Neko';
  document.querySelector('#buddy-subtitle').textContent = `Studying with ${name}`;
  buddyLog.replaceChildren();
  if (!conversations[avatar].length) {
    const empty = document.createElement('p');
    empty.className = 'quiet';
    empty.textContent = 'Ask for a hint, a concept explanation, or a quick practice question.';
    buddyLog.append(empty);
  }
  for (const turn of conversations[avatar]) {
    const message = document.createElement('div');
    message.className = `buddy-message ${turn.role}`;
    const speaker = document.createElement('strong');
    speaker.textContent = turn.role === 'user' ? 'You' : name;
    const content = document.createElement('p');
    content.textContent = turn.content;
    message.append(speaker, content);
    buddyLog.append(message);
  }
  buddyStatus.textContent = chatStatus[avatar];
  buddyThinking.hidden = !pendingAvatars.has(avatar);
  buddyForm.querySelector('button').disabled = pendingAvatars.has(avatar);
  buddyLog.scrollTop = buddyLog.scrollHeight;
}

function buddyContext() {
  const session = saved.session;
  if (!session || !app.querySelector('.quiz-screen')) return '';
  const id = session.ids[session.index];
  const answer = session.answers[session.index];
  if (!answer) return 'The student is in an active Unit 3 quiz. Provide hints without revealing an answer.';
  const question = questionById.get(id);
  return `Checked question, ${topics[question.topic][2]}. ${question.transcript.replace(/\s+/g, ' ').slice(0, 1750)}
Student chose ${answer.choice}. Correct choice: ${question.answer}. Explanation: ${question.explanation.slice(0, 450)}`;
}

let buddyPosition;
let drag;

function positionBuddy(left, top) {
  const margin = 10;
  const maxLeft = Math.max(margin, window.innerWidth - buddy.offsetWidth - margin);
  const maxTop = Math.max(margin, window.innerHeight - buddy.offsetHeight - margin);
  buddyPosition = {
    left: Math.max(margin, Math.min(left, maxLeft)),
    top: Math.max(margin, Math.min(top, maxTop)),
  };
  buddy.style.left = `${buddyPosition.left}px`;
  buddy.style.top = `${buddyPosition.top}px`;
}

buddyTab.addEventListener('click', () => {
  if (buddy.open) {
    buddy.close();
    return;
  }
  hideCoach();
  buddy.show();
  const tab = buddyTab.getBoundingClientRect();
  const position = buddyPosition ?? { left: tab.left, top: tab.top - buddy.offsetHeight - 8 };
  positionBuddy(position.left, position.top);
  buddyTab.setAttribute('aria-expanded', 'true');
  buddyInput.focus({ preventScroll: true });
});

buddyGrip.addEventListener('pointerdown', event => {
  if (event.button !== 0 || drag) return;
  drag = { id: event.pointerId, x: event.clientX - buddyPosition.left, y: event.clientY - buddyPosition.top };
  buddyGrip.setPointerCapture(event.pointerId);
  buddyGrip.classList.add('dragging');
});

buddyGrip.addEventListener('pointermove', event => {
  if (drag?.id !== event.pointerId) return;
  positionBuddy(event.clientX - drag.x, event.clientY - drag.y);
});

buddyGrip.addEventListener('lostpointercapture', event => {
  if (drag?.id !== event.pointerId) return;
  drag = undefined;
  buddyGrip.classList.remove('dragging');
});

buddyGrip.addEventListener('keydown', event => {
  const offsets = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };
  const offset = offsets[event.key];
  if (!offset) return;
  event.preventDefault();
  positionBuddy(buddyPosition.left + offset[0], buddyPosition.top + offset[1]);
});

buddy.addEventListener('keydown', event => {
  if (event.key === 'Escape') buddy.close();
});

window.addEventListener('resize', () => {
  if (buddy.open) positionBuddy(buddyPosition.left, buddyPosition.top);
});

buddy.addEventListener('close', () => {
  buddyTab.setAttribute('aria-expanded', 'false');
  buddyTab.focus({ preventScroll: true });
  for (const name of Object.keys(conversations)) {
    pendingAvatars.get(name)?.abort();
    pendingAvatars.delete(name);
    conversations[name] = [];
    chatStatus[name] = '';
  }
  buddyInput.value = '';
  renderConversation();
});

buddyForm.addEventListener('submit', async event => {
  event.preventDefault();
  const currentAvatar = avatar;
  const question = buddyInput.value.trim();
  if (!question || pendingAvatars.has(currentAvatar)) return;
  prepareSound();

  const conversation = conversations[currentAvatar];
  const controller = new AbortController();
  pendingAvatars.set(currentAvatar, controller);
  chatStatus[currentAvatar] = '';
  conversation.push({ role: 'user', content: question });
  buddyInput.value = '';
  renderConversation();

  try {
    const response = await fetch('/api/study-buddy', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        avatar: currentAvatar,
        messages: conversation.slice(-13),
        context: buddyContext(),
      }),
    });
    if (!response.headers.get('Content-Type')?.includes('application/json')) {
      throw new Error('Start Energetics with server.py to connect Study Buddy.');
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    if (controller.signal.aborted) return;
    conversation.push({ role: 'assistant', content: result.answer });
    if (buddy.open && avatar === currentAvatar) playSound('reply');
    chatStatus[currentAvatar] = '';
  } catch (error) {
    if (controller.signal.aborted) return;
    conversation.pop();
    chatStatus[currentAvatar] = error.message || 'Could not connect. Try again.';
    if (avatar === currentAvatar && !buddyInput.value) buddyInput.value = question;
  } finally {
    if (pendingAvatars.get(currentAvatar) === controller) {
      pendingAvatars.delete(currentAvatar);
      renderConversation();
    }
  }
});
