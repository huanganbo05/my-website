let state = 'idle';
let waitTimer = null;
let startTs = 0;

const panel = document.getElementById('panel');
const msg = document.getElementById('msg');
const startBtn = document.getElementById('start');
const resetBtn = document.getElementById('reset');

const elLast = document.getElementById('last');
const elBest = document.getElementById('best');
const elAvg = document.getElementById('avg');
const elTries = document.getElementById('tries');
const elHist = document.getElementById('history');

const BEST_KEY = 'rx_best_ms';
const HISTORY_KEY = 'rx_history_ms';

let best = Number(localStorage.getItem(BEST_KEY)) || null;
let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

function ms(n) { return Math.round(n); }
function fmt(n) { return n === null ? '—' : `${ms(n)} ms`; }

function updateStats() {
    const last = history.length ? history[history.length - 1] : null;
    elLast.textContent = fmt(last);
    elBest.textContent = fmt(best);
    if (history.length) {
        const last5 = history.slice(-5);
        const avg = last5.reduce((a, b) => a + b, 0) / last5.length;
        elAvg.textContent = `${ms(avg)} ms`;
    } else elAvg.textContent = '—';
    elTries.textContent = history.length;
    elHist.textContent = history.length ? history.map(x => `${ms(x)} ms`).slice(-10).join(', ') : '—';
}
updateStats();

function setPanel(mode, textBig, textSmall) {
    panel.className = `panel ${mode}`;
    panel.style.background = "";
    msg.innerHTML = `<div class="big">${textBig}</div>${textSmall ? `<div class="muted">${textSmall}</div>` : ""
        }`;
}

function start() {
    if (state === 'waiting' || state === 'now') return;
    state = 'ready';
    setPanel(
        'ready',
        'Get Ready...',
        'Wait until the background turns green, then click or press Space/Enter. (Clicking too early is a foul)'
    );
    const delay = 1000 + Math.random() * 2000;
    clearTimeout(waitTimer);
    waitTimer = setTimeout(() => {
        state = 'now';
        setPanel(
            'now',
            'NOW!',
            'Click or press Space/Enter as fast as you can!'
        );
        startTs = performance.now();
    }, delay);
}

function tooSoon() {
    state = 'toosoon';
    clearTimeout(waitTimer);
    setPanel(
        'toosoon',
        'Too soon 😅',
        'You clicked before it turned green. Press Start to try again.'
    );
}

function clicked() {
    if (state === 'ready') { tooSoon(); return; }
    if (state !== 'now') return;

    const rt = performance.now() - startTs;
    history.push(rt);

    if (best === null || rt < best) {
        best = rt;
        localStorage.setItem(BEST_KEY, String(ms(best)));
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.map(ms)));
    updateStats();

    let feedback = "";
    let colorClass = "";
    if (rt <= 250) {
        feedback = "Amazing! Lightning fast ⚡";
        colorClass = "green";
    } else if (rt <= 500) {
        feedback = "Good job 🙂";
        colorClass = "yellow";
    } else {
        feedback = "Too slow 😅 Keep practicing!";
        colorClass = "red";
    }

    state = 'idle';
    setPanel('wait', `${ms(rt)} ms`, feedback);
    panel.style.background =
        colorClass === "green" ? "#d4fdd4" :
            colorClass === "yellow" ? "#fff8d4" :
                "#ffd4d4";
}

function reset() {
    best = null; history = [];
    localStorage.removeItem(BEST_KEY);
    localStorage.removeItem(HISTORY_KEY);
    updateStats();
}

startBtn.addEventListener('click', start);
resetBtn.addEventListener('click', reset);
panel.addEventListener('click', () => {
    if (state === 'ready') tooSoon();
    else if (state === 'now') clicked();
});

function onKey(e) {
    if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (state === 'ready') tooSoon();
        else if (state === 'now') clicked();
        else start();
    }
}
document.addEventListener('keydown', onKey);

document.addEventListener('visibilitychange', () => {
    if (document.hidden && (state === 'ready' || state === 'now')) {
        clearTimeout(waitTimer);
        state = 'idle';
        setPanel('wait', 'Interrupted', 'Switching tabs interrupted the test. Press Start to try again.');
    }
});