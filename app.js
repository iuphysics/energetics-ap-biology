import { questions } from './bank.js';

const topics = {
  enzymes: ['Enzymes', 'Enzymes'],
  conditions: ['Enzyme conditions', 'Conditions'],
  energy: ['Cellular energy', 'Energy'],
  photo: ['Photosynthesis', 'Photosynthesis'],
  respiration: ['Cellular respiration', 'Respiration'],
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
const app = document.querySelector('#app');
const coach = document.querySelector('#coach');
const coachMessage = document.querySelector('#coach-message');
let coachTimeout;

function hideCoach() {
  clearTimeout(coachTimeout);
  coach.hidden = true;
}

function encourage(message, mood = 'happy') {
  hideCoach();
  coach.dataset.mood = mood;
  coach.hidden = false;
  coachMessage.textContent = message;
  coachTimeout = setTimeout(hideCoach, 6500);
}

document.querySelector('#coach-dismiss').addEventListener('click', hideCoach);
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
    <div class="hero"><p class="kicker">Unit 03 / Practice lab</p><h1>Cellular<br>energetics.</h1>
    <p class="lead">Practice the reactions that power life. See where your understanding is strong and which concepts to revisit.</p></div>
    <div class="grid">
      <div class="stack">
        <section class="panel"><h2>Practice set</h2><p class="quiet">Choose a set length. Each set draws from all five topics.</p>
          <div class="sets" aria-label="Set length">${[20,50,100,'all'].map(value => `<button class="set" data-size="${value}" aria-pressed="${value === size}">${value === 'all' ? 'All' : value}<small>${value === 'all' ? questions.length + ' TOTAL' : 'QUESTIONS'}</small></button>`).join('')}</div>
          <div class="actions"><button class="primary" data-action="start">Start practice →</button>
          ${saved.session ? '<button class="secondary" data-action="resume">Resume set</button>' : ''}</div>
        </section>
        <section class="panel"><div class="between"><h2>Redemption Questions</h2><span class="tag">${saved.missed.length} FLAGGED</span></div>
          <p class="quiet">Build a custom set from questions you missed. Get one right to clear it from the queue.</p>
          <div class="actions" style="margin-top:16px"><button class="secondary" data-action="review" ${saved.missed.length ? '' : 'disabled'}>Build redemption set →</button></div>
        </section>
      </div>
      <section class="panel"><div class="between"><h2>Topic radar</h2>${saved.latest ? '<button class="secondary" data-action="results">Last results</button>' : ''}</div>
        <p class="quiet">${saved.latest ? 'Accuracy on your latest completed set.' : 'Complete a set to measure your accuracy.'}</p>
        ${radar(saved.latest?.answers ?? [])}
      </section>
    </div>`, moveFocus);
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

  show(`<div class="narrow">
    <div class="between"><p class="kicker">${session.mode === 'redemption' ? 'Redemption set' : 'Practice set'}</p><button class="secondary" data-action="home">Save & exit</button></div>
    <h1>Question ${session.index + 1}</h1>
    <progress max="${session.ids.length}" value="${session.answers.length}" aria-label="Questions answered"></progress>
    <div class="between"><span class="quiet">${topics[question.topic][0]}</span><span class="metric">${session.index + 1} / ${session.ids.length}</span></div>
    <section class="panel" style="margin-top:14px">
      <div class="between"><span class="metric quiet">GUIDE ITEM ${id}</span><button class="secondary" data-action="paper" aria-pressed="false">Original colors</button></div>
      <div class="prompt">${question.images.map((image, index) => `<img src="bank/${image}.png" alt="Guide item ${id}, ${image.startsWith('context') ? 'shared stimulus' : `question excerpt ${index + 1}`}">`).join('')}</div>
      <details><summary>Question transcript</summary><p class="transcript quiet">${escape(question.transcript.replace(/[^\S\n]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n"))}</p><p class="quiet">Figures and tables appear in the guide images above.</p></details>
      <div class="answers" style="--choices:${question.choices.length}" aria-label="Answer choices">
        ${[...question.choices].map(letter => `<button class="answer ${answered && letter === question.answer ? 'correct' : ''} ${answered && letter === current && !answered.correct ? 'wrong' : ''}" data-choice="${letter}" aria-pressed="${letter === current}" ${answered ? 'disabled' : ''}>${letter}</button>`).join('')}
      </div>
      ${answered ? `<div class="feedback ${answered.correct ? '' : 'missed'}" role="status"><strong>${answered.correct ? 'Correct' : `Missed · Answer ${question.answer}`}</strong><p class="quiet">${escape(question.explanation)}</p></div>
        <button class="primary" data-action="next">${last ? 'See results →' : 'Next question →'}</button>`
        : `<button class="primary" data-action="check" ${choice ? '' : 'disabled'}>Check answer</button>`}
    </section>
  </div>`, moveFocus);
}

function check() {
  const session = saved.session;
  if (!choice || session.answers[session.index]) return;
  const id = session.ids[session.index];
  const correct = choice === questionById.get(id).answer;
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
    encourage('Three right in a row! Keep it up.');
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
  const perfect = saved.latest.answers.every(answer => answer.correct);
  encourage(perfect ? 'A perfect set! That was paw-some.' : 'Set complete! Take a look at what to focus on next.');
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
    <div class="hero"><p class="kicker">${mode === 'redemption' ? 'Redemption' : 'Practice'} results</p><h1>${score}% · ${rating}</h1>
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
