/* =========================================================
   练习流程
   ========================================================= */
const practice = { list: [], pos: 0, right: 0, mode: 'bank', state: {}, _answered: false };
Object.defineProperty(practice, 'answered', {
  get() { return this._answered; },
  set(v) {
    this._answered = !!v;
    if (this._answered) {
      const q = this.list[this.pos];
      if (q && this.state && !this.state.sawWrong) graduateWrong(q);
    }
  }
});

function filterBankList() {
  const typeF = $('bank-filter-type').value;
  const diffF = $('bank-filter-diff').value;
  const flagF = $('bank-filter-flag').value;
  const kw = $('bank-search').value.trim().toLowerCase();
  let list = bank.slice();
  if (typeF !== 'all') list = list.filter(q => qKind(q) === typeF);
  if (diffF !== 'all') list = list.filter(q => clamp(parseInt(q.difficulty)||1,1,5) === parseInt(diffF));
  if (flagF === 'flagged') list = list.filter(q => q.flagged);
  else if (flagF === 'unflagged') list = list.filter(q => !q.flagged);
  if (kw) list = list.filter(q => JSON.stringify(q).toLowerCase().includes(kw));
  return list;
}
function startPractice() {
  const list = filterBankList();
  if (!list.length) { toast('没有符合条件的题目', 'err'); return; }
  startPracticeFrom(list, 'bank');
}
function startPracticeFrom(list, mode) {
  if (!list || !list.length) { toast('没有可练习的题目', 'err'); return; }
  shuffle(list);
  practice.list = list;
  practice.pos = 0;
  practice.right = 0;
  practice.answered = false;
  practice.mode = mode || 'bank';
  practice.state = {};
  $('tabs').querySelector('[data-tab="bank"]').click();
  $('bank-exam').style.display = 'none';
  $('bank-practice').style.display = 'block';
  $('bank-list-card').style.display = 'none';
  renderPractice();
}
function exitPractice() {
  stopListening();
  $('bank-practice').style.display = 'none';
  $('bank-list-card').style.display = 'block';
}
$('bank-start').addEventListener('click', startPractice);
$('bank-shuffle').addEventListener('click', startPractice);
$('bank-exit').addEventListener('click', exitPractice);
$('bank-flag').addEventListener('click', () => {
  const q = practice.list[practice.pos];
  if (!q) return;
  toggleFlag(q);
});
$('bank-wrong-btn').addEventListener('click', () => {
  const q = practice.list[practice.pos];
  if (!q) return;
  toggleWrongManual(q);
});
$('bank-mem-btn').addEventListener('click', () => {
  const q = practice.list[practice.pos];
  if (!q) return;
  const entries = memEntriesFromQ(q);
  if (!entries.length) { toast('该题暂无可收藏的句子', 'err'); return; }
  addMemEntries(entries);
});

function toggleFlag(q) {
  if (!q) return;
  const inBank = q.id ? bank.find(x => x.id === q.id) : null;
  const t = inBank || q;
  t.flagged = !t.flagged;
  q.flagged = t.flagged;
  if (inBank) saveBank();
  renderBankList();
  syncPracticeActionButtons();
  toast(t.flagged ? '已标记本题 🚩' : '已取消标记');
}

function renderPractice() {
  stopListening();
  const total = practice.list.length;
  const pos = practice.pos;
  $('bank-pos').textContent = pos + 1;
  $('bank-total').textContent = total;
  $('bank-right').textContent = practice.right;

  const q = practice.list[pos];
  practice.answered = false;
  practice.state = {
    useOptions: q && q.type === 'cloze' ? !q.noOptions : undefined,
    useOptionsVerb: q && q.type === 'verb' ? true : undefined,
    subAnswered: new Set(),
    blankAnswered: new Set(),
    verbAnswered: new Set(),
    listenPlayed: 0,
    listenItemPlayed: {},
    sawWrong: false
  };

  const area = $('bank-question-area');
  if (!q) { area.innerHTML = '<div class="empty" style="text-align:center">题目异常</div>'; return; }

  let html = '';
  if (q.type === 'choice') html = renderChoice(q);
  else if (q.type === 'reading') html = renderReading(q);
  else if (q.type === 'cloze') html = renderCloze(q);
  else if (q.type === 'verb') html = renderVerb(q);
  else if (q.type === 'listening') html = renderListening(q);
  else if (q.type === 'writing') html = renderWriting(q);
  area.innerHTML = html;
  applyAllMarks(area);

  // 事件绑定
  if (q.type === 'verb') {
    area.querySelectorAll('input[data-vidx]').forEach(inp => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); checkVerb(q); }
      });
    });
  }
  if (q.type === 'cloze' && practice.state.useOptions === false) {
    area.querySelectorAll('input[data-cidx]').forEach(inp => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); checkClozeInput(q); }
      });
    });
  }
  if (q.type === 'listening') {
    setupListeningUI(q);
  }
  if (q.type === 'writing') {
    const ta = area.querySelector('.writing-input');
    if (ta) ta.focus();
  }
  syncPracticeActionButtons();
}

function syncPracticeActionButtons() {
  const q = practice.list[practice.pos];
  const fb = $('bank-flag'), wb = $('bank-wrong-btn'), mb = $('bank-mem-btn');
  if (!fb || !wb || !mb) return;
  fb.classList.toggle('on', !!(q && q.flagged));
  fb.textContent = q && q.flagged ? '🚩 已标记 · 点击取消' : '🚩 标记本题';
  const inW = !!(q && q.id && wrongEntry(q.id));
  wb.classList.toggle('on', inW);
  wb.textContent = inW ? '📕 在错题本 · 点击移出' : '📕 加入错题本';
  mb.style.display = q && q.type === 'writing' ? 'none' : '';
}

/* ---- 四选一 / 自由输入 切换 ---- */
$('bank-question-area').addEventListener('change', e => {
  const q = practice.list[practice.pos];
  if (!q) return;
  if (e.target.id === 'cloze-use-options') {
    practice.state.useOptions = e.target.checked;
    rerenderCurrentQuestion();
  }
  if (e.target.id === 'verb-use-options') {
    practice.state.useOptionsVerb = e.target.checked;
    rerenderCurrentQuestion();
  }
});
function rerenderCurrentQuestion() {
  const q = practice.list[practice.pos];
  if (!q) return;
  const area = $('bank-question-area');
  let html = '';
  if (q.type === 'cloze') html = renderCloze(q);
  else if (q.type === 'verb') html = renderVerb(q);
  if (html) {
    // 保留已判分状态
    const prevState = practice.state;
    area.innerHTML = html;
    practice.state = prevState;
    applyAllMarks(area);
    if (q.type === 'verb') {
      area.querySelectorAll('input[data-vidx]').forEach(inp => {
        inp.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); checkVerb(q); }
        });
      });
    }
    if (q.type === 'cloze' && practice.state.useOptions === false) {
      area.querySelectorAll('input[data-cidx]').forEach(inp => {
        inp.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); checkClozeInput(q); }
        });
      });
    }
  }
}
