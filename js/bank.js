/* =========================================================
   题库
   ========================================================= */
let bank = [];
function loadBank() {
  try {
    const raw = localStorage.getItem(BANK_KEY);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) return ensureQIds(p); }
  } catch (e) {}
  return [];
}
function saveBank() {
  try { localStorage.setItem(BANK_KEY, JSON.stringify(bank)); } catch (e) {}
}
function ensureQIds(list){ list.forEach(q => { if (!q.id) q.id = uid(); }); return list; }

function typeLabel(t) {
  return KIND_LABEL[t] || t;
}
/* 题型「种类」：区分七选五 / 短文填空 / 阅读表达等变体 */
const KIND_LABEL = {
  choice:'单项选择', reading:'阅读理解', cloze:'完形填空', verb:'动词填空', listening:'听力题', writing:'作文',
  seven:'阅读七选五', fillgap:'短文填空', readanswer:'阅读表达'
};
function qKind(q) {
  if (!q) return '';
  if (q.type === 'cloze') {
    if (q.seven) return 'seven';
    const hasOpts = (q.blanks || []).some(b => Array.isArray(b.options) && b.options.length >= 2);
    return (q.noOptions || !hasOpts) ? 'fillgap' : 'cloze';
  }
  if (q.type === 'reading') return q.mode === 'open' ? 'readanswer' : 'reading';
  return q.type;
}
function kindLabel(q) { return KIND_LABEL[qKind(q)] || (q && q.type) || ''; }
function listeningSubLabel(s) {
  return { short_dialogue:'短对话问答', long_dialogue:'长对话理解', table:'听力填表' }[s] || '听力';
}
function starLabel(n) {
  const v = clamp(parseInt(n) || 1, 1, 5);
  return '★'.repeat(v) + '☆'.repeat(5 - v);
}

function renderBankList() {
  $('bank-count').textContent = bank.length;
  const box = $('bank-list');
  if (!bank.length) {
    box.innerHTML = `<div class="bank-empty"><h3>题库为空</h3><p>可以在「AI 出题」生成，或点击上方「导入题目」粘贴 JSON。</p></div>`;
    return;
  }
  const groups = {};
  bank.forEach(q => { const k = qKind(q); (groups[k] || (groups[k] = [])).push(q); });
  let html = '';
  const order = ['listening','reading','seven','cloze','fillgap','readanswer','writing','choice','verb'];
  Object.keys(groups).sort((a, b) => order.indexOf(a) - order.indexOf(b)).forEach(t => {
    const list = groups[t]; if (!list.length) return;
    html += `<div style="margin-bottom:18px">
      <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);margin-bottom:8px">
        ${KIND_LABEL[t] || t} · ${list.length} 题
      </div>
      <div class="table-wrap"><table><tbody>
      ${list.map((q, i) => `
        <tr>
          <td style="width:40px" class="muted small">${i + 1}</td>
          <td>${esc(briefOf(q))}</td>
          <td style="width:100px" class="muted small">${starLabel(q.difficulty)}</td>
          <td style="width:70px"><button class="icon-btn" data-bank-del="${q.id}" title="删除">✕</button></td>
        </tr>`).join('')}
      </tbody></table></div>
    </div>`;
  });
  box.innerHTML = html;
}
function briefOf(q) {
  if (q.type === 'choice') return (q.question || '').slice(0, 80);
  if (q.type === 'reading') return (q.title || '阅读') + ' · ' + (q.passage || '').slice(0, 50) + '…';
  if (q.type === 'cloze')  return (q.passage || '').slice(0, 70) + '…';
  if (q.type === 'verb')   return (q.sentences?.[0]?.text || '').slice(0, 70) + '…';
  if (q.type === 'listening') {
    if (q.subType === 'short_dialogue') return `短对话 · ${(q.items||[]).length} 组`;
    if (q.subType === 'long_dialogue') return `长对话 · ${(q.questions||[]).length} 小题`;
    if (q.subType === 'table') return `填表 · ${q.title || ''}`;
    return '听力题';
  }
  if (q.type === 'writing') return (q.prompt || '').slice(0, 70);
  return '';
}
$('bank-list').addEventListener('click', e => {
  const btn = e.target.closest('button[data-bank-del]');
  if (!btn) return;
  if (!confirm('确定删除该题？')) return;
  bank = bank.filter(q => q.id !== btn.dataset.bankDel);
  saveBank(); renderBankList();
  toast('已删除');
});

$('bank-import-btn').addEventListener('click', () => {
  const a = $('bank-import-area');
  a.style.display = a.style.display === 'none' ? 'block' : 'none';
});
$('bank-import-cancel').addEventListener('click', () => $('bank-import-area').style.display = 'none');
$('bank-import-file').addEventListener('click', () => $('bank-file-input').click());
$('bank-file-input').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => { $('bank-import-json').value = ev.target.result; };
  r.readAsText(f, 'utf-8');
  e.target.value = '';
});
$('bank-import-confirm').addEventListener('click', () => {
  const t = $('bank-import-json').value.trim();
  if (!t) { toast('请先粘贴 JSON', 'err'); return; }
  const res = importQuestions(t);
  if (res.added) {
    $('bank-import-json').value = '';
    $('bank-import-area').style.display = 'none';
  }
});

function resolveAnswer(ans, opts) {
  ans = String(ans || '').trim();
  if (opts.includes(ans)) return ans;
  const letter = ans.toUpperCase().replace(/^([A-Z])\..*$/, '$1');
  const idx = letter.charCodeAt(0) - 65;
  if (idx >= 0 && idx < opts.length) return opts[idx];
  return '';
}

/* ---- 正确答案位置均衡：避免 AAA/BBB 连排 ---- */
function collectOptionGroups(q, out) {
  out = out || [];
  if (!q) return out;
  const push = (obj, key) => out.push({
    opts: obj[key],
    ans: obj.answer,
    set: arr => { obj[key] = arr; }
  });
  if (q.type === 'choice') push(q, 'options');
  else if (q.type === 'reading') (q.questions || []).forEach(sq => push(sq, 'options'));
  else if (q.type === 'cloze') (q.blanks || []).forEach(b => { if ((b.options || []).length >= 2) push(b, 'options'); });
  else if (q.type === 'listening') {
    const list = q.subType === 'short_dialogue' ? (q.items || []) : (q.subType === 'long_dialogue' ? (q.questions || []) : []);
    list.forEach(it => push(it, 'options'));
  }
  return out;
}

function spreadAnswerLetters(questions) {
  const groups = [];
  (questions || []).forEach(q => collectOptionGroups(q, groups));
  if (!groups.length) return 0;
  const seq = [];
  const rounds = Math.ceil(groups.length / 4) + 1;
  for (let r = 0; r < rounds; r++) seq.push(...shuffle([0, 1, 2, 3]));
  let prev = -1;
  groups.forEach((g, i) => {
    const opts = g.opts || [];
    const n = opts.length;
    if (n < 2) return;
    const ansIdx = opts.indexOf(g.ans);
    if (ansIdx < 0) return;
    let t = seq[i] % n;
    let guard = 0;
    while (t === prev && guard++ < n) t = (t + 1) % n;
    prev = t;
    const pool = opts.slice();
    pool.splice(ansIdx, 1);
    shuffle(pool);
    const arr = [];
    let pi = 0;
    for (let k = 0; k < n; k++) arr.push(k === t ? g.ans : (pi < pool.length ? pool[pi++] : opts[k % n]));
    g.set(arr);
  });
  return groups.length;
}

/* ---- 词性提示（综合填空自由填词用） ---- */
const POS_LABELS = ['名词','动词','形容词','副词','数词','冠词','代词','介词','连词','感叹词'];
const POS_NO_HINT = new Set(['代词','介词','连词']);   // 代词/介词/连词不做提示
/* 动词填空自由填词时，填空框后固定显示的提示标签（需求为「名词」；如需改成「动词」，只改这一行） */
const VERB_BLANK_HINT = '名词';
const POS_ALIASES = {
  'noun':'名词', 'n':'名词', '名词':'名词',
  'verb':'动词', 'v':'动词', '动词':'动词',
  'adjective':'形容词', 'adj':'形容词', '形容词':'形容词', '形':'形容词',
  'adverb':'副词', 'adv':'副词', '副词':'副词', '副':'副词',
  'numeral':'数词', 'num':'数词', '数词':'数词', '数':'数词',
  'article':'冠词', 'art':'冠词', '冠词':'冠词',
  'pronoun':'代词', 'pron':'代词', '代词':'代词',
  'preposition':'介词', 'prep':'介词', '介词':'介词',
  'conjunction':'连词', 'conj':'连词', '连词':'连词',
  'interjection':'感叹词', 'int':'感叹词', '感叹词':'感叹词'
};

/* 归一化 AI 返回的词性：兼容 noun / n. / 名词（可数）等写法；代词、介词、连词返回空串 */
function normalizePos(v) {
  const raw = String(v == null ? '' : v).trim();
  if (!raw) return '';
  const key = raw.replace(/[（(][^)）]*[)）]/g, '').replace(/[\s.、,，;/｜|]/g, '').toLowerCase();
  let label = POS_ALIASES[key] || POS_LABELS.find(p => raw.includes(p)) || '';
  if (!label || POS_NO_HINT.has(label)) return '';
  return label;
}

function normalizeQuestion(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const t = String(raw.type || '').toLowerCase();
  const diff = clamp(parseInt(raw.difficulty) || 3, 1, 5);

  if (t === 'choice') {
    const opts = Array.isArray(raw.options) ? raw.options.map(String).filter(Boolean) : [];
    const ans = resolveAnswer(raw.answer, opts);
    if (opts.length < 2 || !ans) return null;
    return {
      id: uid(), type:'choice', difficulty: diff,
      point: String(raw.point || raw.knowledgePoint || '').trim(),
      question: String(raw.question || '').trim() || '请选择正确答案',
      options: opts, answer: ans,
      explanation: String(raw.explanation || '').trim(),
      word: String(raw.word || '').trim(),
      meaning: String(raw.meaning || '').trim(),
      phonetic: String(raw.phonetic || '').trim(),
      example: String(raw.example || '').trim()
    };
  }
  if (t === 'reading') {
    const qs = Array.isArray(raw.questions) ? raw.questions : [];
    const open = raw.mode === 'open';
    const normQs = qs.map(sq => {
      if (open) {
        const question = String(sq.question || '').trim();
        const ans = Array.isArray(sq.answer)
          ? sq.answer.map(String).map(s => s.trim()).filter(Boolean)
          : String(sq.answer == null ? '' : sq.answer).trim();
        if (!question || (Array.isArray(ans) ? !ans.length : !ans)) return null;
        return {
          question, answer: ans,
          point: String(sq.point || '').trim(),
          explanation: String(sq.explanation || '').trim()
        };
      }
      const opts = Array.isArray(sq.options) ? sq.options.map(String).filter(Boolean) : [];
      const ans = resolveAnswer(sq.answer, opts);
      if (opts.length < 2 || !ans) return null;
      return {
        question: String(sq.question || '').trim(),
        options: opts, answer: ans,
        point: String(sq.point || '').trim(),
        explanation: String(sq.explanation || '').trim()
      };
    }).filter(Boolean);
    if (!normQs.length || !raw.passage) return null;
    const rq = {
      id: uid(), type:'reading', difficulty: diff,
      point: String(raw.point || '').trim(),
      level: String(raw.level || 'A').toUpperCase().slice(0,1),
      title: String(raw.title || (open ? '阅读表达' : '阅读理解')).trim(),
      passage: String(raw.passage || '').trim(),
      questions: normQs
    };
    if (open) rq.mode = 'open';
    return rq;
  }
  if (t === 'cloze') {
    const blanks = Array.isArray(raw.blanks) ? raw.blanks : [];
    const noOptions = !!raw.noOptions;
    const normBlanks = blanks.map(b => {
      let opts = Array.isArray(b.options) ? b.options.map(String).filter(Boolean) : [];
      if (noOptions) opts = [];
      const rawAns = String(b.answer == null ? '' : b.answer).trim();
      // 有选项时把答案归一到选项原文；没有选项即为自由填词，直接使用 answer 原文
      const ans = opts.length ? resolveAnswer(rawAns, opts) : rawAns;
      if (!ans) return null;
      return {
        options: opts,
        answer: ans,
        hint: String(b.hint || b.firstLetter || '').trim(),
        pos: normalizePos(b.pos || b.posHint || b.partOfSpeech || b.wordClass),
        point: String(b.point || '').trim(),
        explanation: String(b.explanation || '').trim()
      };
    }).filter(Boolean);
    if (!normBlanks.length || !raw.passage) return null;
    const rc = {
      id: uid(), type:'cloze', difficulty: diff,
      point: String(raw.point || '').trim(),
      passage: String(raw.passage || '').trim(),
      blanks: normBlanks
    };
    if (raw.seven) rc.seven = true;
    if (noOptions) rc.noOptions = true;
    return rc;
  }
  if (t === 'verb') {
    const ss = Array.isArray(raw.sentences) ? raw.sentences : [];
    const normS = ss.map(s => {
      const text = String(s.text || '').trim();
      const ans = String(s.answer || '').trim();
      if (!text || !ans) return null;
      return { text, answer: ans, hint: String(s.hint || '').trim(), point: String(s.point || '').trim(), explanation: String(s.explanation || '').trim() };
    }).filter(Boolean);
    if (!normS.length) return null;
    return { id: uid(), type:'verb', difficulty: diff, point: String(raw.point || '').trim(), sentences: normS };
  }
  if (t === 'listening') {
    const sub = String(raw.subType || raw.subtype || 'short_dialogue').toLowerCase();
    const prepTime = clamp(parseInt(raw.prepTime) || 30, 0, 180);
    const instructions = String(raw.instructions || '').trim();

    if (sub === 'short_dialogue') {
      const items = Array.isArray(raw.items) ? raw.items : [];
      const normItems = items.map(it => {
        const opts = Array.isArray(it.options) ? it.options.map(String).filter(Boolean) : [];
        const ans = resolveAnswer(it.answer, opts);
        if (!opts.length || !ans) return null;
        return {
          script: String(it.script || '').trim(),
          question: String(it.question || '').trim(),
          options: opts, answer: ans,
          point: String(it.point || '').trim(),
          explanation: String(it.explanation || '').trim()
        };
      }).filter(Boolean);
      if (!normItems.length) return null;
      return {
        id: uid(), type:'listening', subType:'short_dialogue', difficulty: diff,
        point: String(raw.point || '').trim(),
        instructions: instructions || '听录音两遍，从ABC三个选项中选出能回答所给句子的正确答案。',
        prepTime, items: normItems
      };
    }
    if (sub === 'long_dialogue') {
      const script = String(raw.script || '').trim();
      const qs = Array.isArray(raw.questions) ? raw.questions : [];
      const normQs = qs.map(sq => {
        const opts = Array.isArray(sq.options) ? sq.options.map(String).filter(Boolean) : [];
        const ans = resolveAnswer(sq.answer, opts);
        if (!opts.length || !ans) return null;
        return {
          question: String(sq.question || '').trim(),
          options: opts, answer: ans,
          point: String(sq.point || '').trim(),
          explanation: String(sq.explanation || '').trim()
        };
      }).filter(Boolean);
      if (!script || !normQs.length) return null;
      return {
        id: uid(), type:'listening', subType:'long_dialogue', difficulty: diff,
        point: String(raw.point || '').trim(),
        instructions: instructions || '听录音两遍，从ABC三个选项中选出正确答案。',
        prepTime, script, questions: normQs
      };
    }
    if (sub === 'table') {
      const script = String(raw.script || '').trim();
      const cols = Array.isArray(raw.columns) ? raw.columns.map(String) : [];
      const rows = Array.isArray(raw.rows) ? raw.rows.map(r => Array.isArray(r) ? r.map(String) : []) : [];
      const blanks = Array.isArray(raw.blanks) ? raw.blanks.map(b => ({
        row: parseInt(b.row),
        col: parseInt(b.col),
        answer: String(b.answer || '').trim(),
        explanation: String(b.explanation || '').trim()
      })).filter(b => !isNaN(b.row) && !isNaN(b.col) && b.answer) : [];
      if (!cols.length || !rows.length || !blanks.length) return null;
      return {
        id: uid(), type:'listening', subType:'table', difficulty: diff,
        point: String(raw.point || '').trim(),
        instructions: instructions || '听录音两遍，完成下面的表格。',
        prepTime, script,
        title: String(raw.title || '听力填表').trim(),
        columns: cols, rows, blanks
      };
    }
    return null;
  }
  if (t === 'writing') {
    if (!raw.prompt) return null;
    return {
      id: uid(), type:'writing', difficulty: diff,
      prompt: String(raw.prompt || '').trim(),
      hints: Array.isArray(raw.hints) ? raw.hints.map(String).filter(Boolean) : [],
      sample: String(raw.sample || '').trim()
    };
  }
  return null;
}

function importQuestions(text) {
  let data;
  try { data = JSON.parse(text); }
  catch (e) { toast('JSON 解析失败：' + e.message, 'err'); return { added: 0, skipped: 0 }; }
  if (!Array.isArray(data)) {
    if (data && Array.isArray(data.questions)) data = data.questions;
    else if (data && typeof data === 'object') data = [data];
    else { toast('JSON 格式不支持', 'err'); return { added: 0, skipped: 0 }; }
  }
  let added = 0, skipped = 0;
  const normalized = [];
  data.forEach(item => {
    const q = normalizeQuestion(item);
    if (q) { normalized.push(q); added++; } else skipped++;
  });
  spreadAnswerLetters(normalized);
  normalized.forEach(q => bank.push(q));
  saveBank(); renderBankList();
  toast(`导入完成：新增 ${added} 题${skipped ? `，跳过 ${skipped} 题` : ''}`, added ? 'ok' : 'err');
  return { added, skipped };
}

$('bank-export-btn').addEventListener('click', () => {
  if (!bank.length) { toast('题库为空', 'err'); return; }
  const data = bank.map(({ id, ...rest }) => rest);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `questionbank_${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(url);
  toast('已导出', 'ok');
});
$('bank-clear-btn').addEventListener('click', () => {
  if (!bank.length) { toast('题库已经是空的'); return; }
  if (!confirm(`确定清空全部 ${bank.length} 道题？`)) return;
  bank = []; saveBank(); renderBankList(); exitPractice();
  toast('题库已清空');
});

/* =========================================================
   统计 / 错题本 / 背记册 存储与记录
   ========================================================= */
function loadJSON(key, fallback) {
  try { const raw = localStorage.getItem(key); if (raw) { const v = JSON.parse(raw); if (v != null) return v; } } catch (e) {}
  return fallback;
}
function saveJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

let wrongBook = [];
let memBook = [];
let stats = { types: {}, points: {}, dict: {}, listen: { right: 0, total: 0 }, mem: { right: 0, total: 0 } };

function normalizeStats(s) {
  s = (s && typeof s === 'object') ? s : {};
  const cnt = v => (v && typeof v === 'object') ? { right: +v.right || 0, total: +v.total || 0 } : { right: 0, total: 0 };
  return {
    types: (s.types && typeof s.types === 'object') ? s.types : {},
    points: (s.points && typeof s.points === 'object') ? s.points : {},
    dict: (s.dict && typeof s.dict === 'object') ? s.dict : {},
    listen: cnt(s.listen),
    mem: cnt(s.mem)
  };
}
function loadWrongBook() { const v = loadJSON(WRONG_KEY, []); wrongBook = Array.isArray(v) ? v : []; }
function saveWrongBook() { saveJSON(WRONG_KEY, wrongBook); }
function loadMemBook() { const v = loadJSON(MEM_KEY, []); memBook = Array.isArray(v) ? v : []; }
function saveMemBook() { saveJSON(MEM_KEY, memBook); }
function loadStats() { stats = normalizeStats(loadJSON(STATS_KEY, null)); }
function saveStats() { saveJSON(STATS_KEY, stats); }

/* 记录一次小题作答；答错时自动进错题本 */
function recordItem(q, correct, point) {
  if (!q) return;
  const type = qKind(q) || 'other';
  const T = stats.types[type] || (stats.types[type] = { wrong: 0, total: 0 });
  T.total++;
  if (!correct) T.wrong++;
  const p = String(point == null ? '' : point).trim() || String(q.point || '').trim();
  if (p) {
    const P = stats.points[p] || (stats.points[p] = { wrong: 0, total: 0 });
    P.total++;
    if (!correct) P.wrong++;
  }
  if (!correct) {
    if (practice.state) practice.state.sawWrong = true;
    if (settings && settings.autoWrong !== false) touchWrong(q);
  }
  saveStats();
}
function statDict(libName, right) {
  const d = stats.dict[libName] || (stats.dict[libName] = { right: 0, total: 0 });
  d.total++;
  if (right) d.right++;
  saveStats();
}
function statMem(right) {
  stats.mem = stats.mem || { right: 0, total: 0 };
  stats.mem.total++;
  if (right) stats.mem.right++;
  saveStats();
}
function statListen(right) {
  stats.listen = stats.listen || { right: 0, total: 0 };
  stats.listen.total++;
  if (right) stats.listen.right++;
  saveStats();
}

/* ---- 统计渲染 ---- */
function errRate(wrong, total) { return total ? Math.round(wrong / total * 100) : 0; }
function accRate(right, total) { return total ? Math.round(right / total * 100) : 0; }
function errClass(r) { return r >= 50 ? 'hi' : r >= 25 ? 'mid' : 'lo'; }
function accClass(r) { return r >= 80 ? 'lo' : r >= 60 ? 'mid' : 'hi'; }

function renderStats() {
  const tiles = $('stat-tiles');
  const types = stats.types || {};
  let tTotal = 0, tWrong = 0;
  Object.values(types).forEach(t => { tTotal += (+t.total) || 0; tWrong += (+t.wrong) || 0; });
  let dTotal = 0, dRight = 0;
  Object.values(stats.dict || {}).forEach(d => { dTotal += (+d.total) || 0; dRight += (+d.right) || 0; });
  const mem = stats.mem || { right: 0, total: 0 };
  const listen = stats.listen || { right: 0, total: 0 };
  const tile = (num, unit, lab) => `<div class="tile"><div class="t-num">${num}${unit ? `<small> ${unit}</small>` : ''}</div><div class="t-lab">${lab}</div></div>`;
  if (tiles) tiles.innerHTML = [
    tile(tTotal, '小题', '累计作答'),
    tile(tTotal ? accRate(tTotal - tWrong, tTotal) : 0, tTotal ? '%' : '', tTotal ? `正确率（${tTotal - tWrong}/${tTotal}）` : '正确率'),
    tile(wrongBook.length, '题', '错题本'),
    tile(memBook.length, '句', '背记册'),
    tile(dTotal ? accRate(dRight, dTotal) : 0, dTotal ? '%' : '', '单词默写正确率'),
    tile(listen.total ? accRate(listen.right, listen.total) : 0, listen.total ? '%' : '', '单词听力正确率'),
    tile(mem.total ? accRate(mem.right, mem.total) : 0, mem.total ? '%' : '', '背记默写正确率')
  ].join('');

  /* 01 题型出错率 */
  const typeBox = $('chart-type');
  if (typeBox) {
    const rows = Object.keys(types).filter(k => types[k] && types[k].total);
    if (!rows.length) typeBox.innerHTML = '<div class="empty-mini">暂无数据 —— 去题库做几道题吧</div>';
    else typeBox.innerHTML = `<div class="chart">${rows.map(k => {
      const t = types[k];
      const r = errRate(t.wrong, t.total);
      return `<div class="bar-col">
        <div class="bar-val">${r}%</div>
        <div class="bar-track"><div class="bar-fill ${errClass(r)}" style="height:${Math.max(r, 3)}%"></div></div>
        <div class="bar-label">${esc(typeLabel(k))}<div class="bar-sub">错 ${t.wrong} / ${t.total}</div></div>
      </div>`;
    }).join('')}</div>`;
  }

  /* 02 考点出错对比 + 难点 */
  const pointBox = $('chart-point');
  const hardBox = $('point-hard');
  const points = Object.keys(stats.points || {}).filter(k => stats.points[k] && stats.points[k].total);
  points.sort((a, b) => errRate(stats.points[b].wrong, stats.points[b].total) - errRate(stats.points[a].wrong, stats.points[a].total) || stats.points[b].wrong - stats.points[a].wrong);
  if (pointBox) {
    if (!points.length) pointBox.innerHTML = '<div class="empty-mini">题目暂未提供 point（考点）字段 —— AI 出题时会自动要求填写</div>';
    else pointBox.innerHTML = `<div class="hbars">${points.slice(0, 12).map(k => {
      const p = stats.points[k];
      const r = errRate(p.wrong, p.total);
      return `<div class="hbar-row">
        <div class="hbar-name" title="${esc(k)}">${esc(k)}</div>
        <div class="hbar-track"><div class="hbar-fill ${errClass(r)}" style="width:${Math.max(r, 2)}%"></div></div>
        <div class="hbar-val">${r}%</div>
      </div>`;
    }).join('')}</div>`;
  }
  if (hardBox) {
    const hard = points.filter(k => stats.points[k].wrong >= 2);
    if (!hard.length) hardBox.innerHTML = '<div class="empty-mini">暂无反复出错的考点</div>';
    else hardBox.innerHTML = `<div class="hbars">${hard.map(k => {
      const p = stats.points[k];
      return `<div class="hbar-row">
        <div class="hbar-name" title="${esc(k)}">${esc(k)}</div>
        <div class="hbar-track"><div class="hbar-fill hi" style="width:${Math.max(errRate(p.wrong, p.total), 4)}%"></div></div>
        <div class="hbar-val">错 ${p.wrong} 次</div>
      </div>`;
    }).join('')}</div>`;
  }

  /* 03 默写正确率（按词库） */
  const dictBox = $('chart-dict');
  if (dictBox) {
    const libs = Object.keys(stats.dict || {}).filter(k => stats.dict[k] && stats.dict[k].total);
    libs.sort((a, b) => accRate(stats.dict[a].right, stats.dict[a].total) - accRate(stats.dict[b].right, stats.dict[b].total));
    if (!libs.length) dictBox.innerHTML = '<div class="empty-mini">还没有默写记录 —— 去「单词默写」练几组</div>';
    else dictBox.innerHTML = `<div class="hbars">${libs.map(k => {
      const d = stats.dict[k];
      const r = accRate(d.right, d.total);
      return `<div class="hbar-row">
        <div class="hbar-name" title="${esc(k)}">${esc(k)}</div>
        <div class="hbar-track"><div class="hbar-fill ${accClass(r)}" style="width:${Math.max(r, 2)}%"></div></div>
        <div class="hbar-val">${r}%</div>
      </div>`;
    }).join('')}</div>`;
  }

  /* 04 背记册默写 */
  const memBox = $('chart-mem');
  if (memBox) {
    if (!mem.total) memBox.innerHTML = '<div class="empty-mini">还没有默写记录 —— 收藏句子后去「错题 · 背记」页默写</div>';
    else {
      const r = accRate(mem.right, mem.total);
      memBox.innerHTML = `<div class="stat-tiles">
        ${tile(mem.right, '句', '默写正确')}
        ${tile(mem.total - mem.right, '句', '默写错误')}
        ${tile(r, '%', '正确率')}
      </div>`;
    }
  }

  /* 05 单词听力 */
  const lBox = $('chart-listen');
  if (lBox) {
    if (!listen.total) lBox.innerHTML = '<div class="empty-mini">还没有听力记录 —— 去「单词听力」练几题</div>';
    else {
      const r = accRate(listen.right, listen.total);
      lBox.innerHTML = `<div class="stat-tiles">
        ${tile(listen.right, '题', '听音选义正确')}
        ${tile(listen.total - listen.right, '题', '听音选义错误')}
        ${tile(r, '%', '正确率')}
      </div>`;
    }
  }
}
$('stat-clear').addEventListener('click', () => {
  if (!confirm('确定清空全部统计数据（题型/考点/默写正确率）？错题本与背记册不受影响。')) return;
  stats = normalizeStats(null);
  saveStats();
  renderStats();
  toast('统计数据已清空');
});

/* ---- 划词高亮标记 ---- */
let marks = {};   // zoneKey -> [{s, e, c:'a'|'b'}]
function loadMarks() { const v = loadJSON(MARKS_KEY, {}); marks = (v && typeof v === 'object') ? v : {}; }
function saveMarks() { saveJSON(MARKS_KEY, marks); }

function zoneTextNodes(zone) {
  const w = document.createTreeWalker(zone, NodeFilter.SHOW_TEXT);
  const out = []; let off = 0;
  while (w.nextNode()) { const n = w.currentNode; out.push({ node: n, s: off, e: off + n.nodeValue.length }); off += n.nodeValue.length; }
  return out;
}
function offsetInZone(zone, node, offset) {
  const r = document.createRange();
  r.selectNodeContents(zone);
  try { r.setEnd(node, offset); } catch (e) { return -1; }
  return r.toString().length;
}
function clearZoneMarks(zone) {
  zone.querySelectorAll('span.hl').forEach(sp => {
    const p = sp.parentNode;
    while (sp.firstChild) p.insertBefore(sp.firstChild, sp);
    p.removeChild(sp);
  });
}
function applyMarksToZone(zone) {
  const key = zone.dataset.hlZone;
  if (!key) return;
  const zt = zone.textContent;
  const list = (marks[key] || []).map(m => {
    if (m.t && zt.slice(m.s, m.e) === m.t) return m;
    if (m.t) { const i = zt.indexOf(m.t); if (i >= 0) return { s: i, e: i + m.t.length, c: m.c }; }
    return null;
  }).filter(Boolean);
  clearZoneMarks(zone);
  list.forEach(m => {
    zoneTextNodes(zone).forEach(({ node, s, e }) => {
      if (e <= m.s || s >= m.e) return;
      const from = Math.max(m.s, s) - s, to = Math.min(m.e, e) - s;
      let t = node;
      if (to < t.nodeValue.length) t.splitText(to);
      if (from > 0) t = t.splitText(from);
      if (!t.nodeValue) return;
      const span = document.createElement('span');
      span.className = 'hl hl-' + (m.c === 'b' ? 'b' : 'a');
      t.parentNode.insertBefore(span, t);
      span.appendChild(t);
    });
  });
}
function applyAllMarks(root) {
  (root || document).querySelectorAll('[data-hl-zone]').forEach(applyMarksToZone);
}

const hlPop = $('hl-pop');
let hlSel = null;
function hideHlPop() { hlPop.classList.remove('show'); hlSel = null; }
function showHlPop(x, y, zone, s, e) {
  hlSel = { zone, s, e };
  hlPop.classList.add('show');
  const w = hlPop.offsetWidth || 190, h = hlPop.offsetHeight || 34;
  hlPop.style.left = Math.min(Math.max(8, x), Math.max(8, window.innerWidth - w - 8)) + 'px';
  hlPop.style.top = (y + h + 8 > window.innerHeight ? y - h - 8 : y + 8) + 'px';
}

document.addEventListener('mouseup', e => {
  if (hlPop.contains(e.target)) return;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || sel.isCollapsed) { hideHlPop(); return; }
  const range = sel.getRangeAt(0);
  const zoneOf = n => {
    const el = n && n.nodeType === 3 ? n.parentElement : n;
    return el && el.closest ? el.closest('[data-hl-zone]') : null;
  };
  const z1 = zoneOf(range.startContainer), z2 = zoneOf(range.endContainer);
  if (!z1 || z1 !== z2) { hideHlPop(); return; }
  const se = range.startContainer, ee = range.endContainer;
  const inField = n => { const el = n && n.nodeType === 3 ? n.parentElement : n; return el && el.closest && el.closest('input, textarea, button'); };
  if (inField(se) || inField(ee)) { hideHlPop(); return; }
  const s = offsetInZone(z1, range.startContainer, range.startOffset);
  const en = offsetInZone(z1, range.endContainer, range.endOffset);
  if (s < 0 || en <= s) { hideHlPop(); return; }
  const rect = range.getBoundingClientRect();
  showHlPop(rect.left, rect.bottom, z1, s, en);
});

document.addEventListener('click', e => {
  if (hlPop.contains(e.target)) return;
  const sp = e.target.closest('span.hl');
  if (sp) {
    const zone = sp.closest('[data-hl-zone]');
    if (!zone) return;
    const s = offsetInZone(zone, sp.firstChild, 0);
    if (s < 0) return;
    const rect = sp.getBoundingClientRect();
    showHlPop(rect.left, rect.bottom, zone, s, s + sp.textContent.length);
    return;
  }
  const sel = window.getSelection();
  if (sel && !sel.isCollapsed && sel.rangeCount) return;   // 刚选中文本，保留气泡
  hideHlPop();
}, true);

hlPop.addEventListener('click', e => {
  const btn = e.target.closest('button[data-c]');
  if (!btn || !hlSel) return;
  const c = btn.dataset.c;
  const { zone, s, e: en } = hlSel;
  const key = zone.dataset.hlZone;
  const t = zone.textContent.slice(s, en);
  let list = (marks[key] || []).filter(m => !(m.s < en && s < m.e));
  if (c) list.push({ s, e: en, c, t });
  if (list.length) marks[key] = list; else delete marks[key];
  saveMarks();
  applyMarksToZone(zone);
  window.getSelection().removeAllRanges();
  hideHlPop();
  toast(c === 'a' ? '已标记 🟨' : c === 'b' ? '已标记 🟥' : '已移除标记');
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') hideHlPop(); });
window.addEventListener('scroll', () => { if (hlSel) hideHlPop(); }, true);

/* ---- 错题本 ---- */
function wrongEntry(qid) { return wrongBook.find(e => e && e.qid === qid); }
function touchWrong(q) {
  if (!q || !q.id) return;
  let snap;
  try { snap = JSON.parse(JSON.stringify(q)); } catch (e) { snap = q; }
  const ex = wrongEntry(q.id);
  if (ex) {
    ex.wrongCount = (ex.wrongCount || 0) + 1;
    ex.streak = 0;
    ex.lastAt = Date.now();
    ex.q = snap;
  } else {
    wrongBook.push({ qid: q.id, q: snap, wrongCount: 1, rightCount: 0, streak: 0, addedAt: Date.now(), lastAt: Date.now() });
  }
  saveWrongBook();
}
function toggleWrongManual(q) {
  if (!q || !q.id) return;
  const ex = wrongEntry(q.id);
  if (ex) {
    wrongBook = wrongBook.filter(e => e.qid !== q.id);
    toast('已移出错题本');
  } else {
    let snap; try { snap = JSON.parse(JSON.stringify(q)); } catch (e) { snap = q; }
    wrongBook.push({ qid: q.id, q: snap, wrongCount: 0, rightCount: 0, streak: 0, manual: true, addedAt: Date.now(), lastAt: Date.now() });
    toast('已加入错题本 📕', 'ok');
  }
  saveWrongBook(); renderWrongBook(); syncPracticeActionButtons();
}
function graduateWrong(q) {
  if (!q || practice.mode !== 'wrong') return;
  const entry = wrongEntry(q.id);
  if (!entry) return;
  entry.rightCount = (entry.rightCount || 0) + 1;
  entry.streak = (entry.streak || 0) + 1;
  entry.lastAt = Date.now();
  const g = (settings && settings.wrongGraduation) || 'never';
  if (g === 'once' || (g === 'twice' && entry.streak >= 2)) {
    wrongBook = wrongBook.filter(e => e.qid !== q.id);
    saveWrongBook(); renderWrongBook();
    toast('🎉 已掌握，从错题本移除', 'ok');
  } else {
    saveWrongBook(); renderWrongBook();
  }
}

function renderWrongBook() {
  const el = $('wb-count'); if (el) el.textContent = wrongBook.length;
  const box = $('wb-list'); if (!box) return;
  if (!wrongBook.length) { box.innerHTML = '<div class="empty-mini">错题本为空 —— 做题答错会自动收录</div>'; return; }
  const rows = wrongBook.slice().sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0)).map(e => {
    const q = e.q || {};
    return `<tr>
      <td style="width:92px"><span class="badge gray" style="margin:0">${esc(kindLabel(q))}</span></td>
      <td>${esc(briefOf(q))}</td>
      <td style="width:150px" class="muted small">错 ${e.wrongCount || 0} 次 · 对 ${e.rightCount || 0} 次${e.streak ? ` · 连对 ${e.streak}` : ''}</td>
      <td style="width:70px"><button class="icon-btn" data-wb-del="${esc(e.qid)}" title="移出错题本">✕</button></td>
    </tr>`;
  }).join('');
  box.innerHTML = `<div class="table-wrap"><table><tbody>${rows}</tbody></table></div>`;
}

/* ---- 背记册 ---- */
const MEM_STOP = new Set(('the,and,that,with,this,from,have,has,had,were,been,they,their,would,could,should,' +
  'about,which,when,what,will,your,there,then,than,into,over,under,after,before,because,while,upon,also,' +
  'must,shall,very,more,most,some,such,only,other,another,each,both,any,all,but,for,are,was,did,does,' +
  'who,whom,how,why,where,may,might,can,let,us,our,you,she,him,her,his,its,not,very,these,those,here,' +
  'been,being,did,went,goes,does,done,made,take,taken,given,get,got,like,love,look,looked,one,two,three').split(','));
function libWordSet() {
  const s = new Set();
  libraries.forEach(l => (l.words || []).forEach(w => s.add(String(w.word || '').trim().toLowerCase())));
  return s;
}
function escapeRegExp(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/* 自动从句子里挖一个词作为空（优先挖词库中的词） */
function autoMask(text, libSet) {
  const re = /[A-Za-z][A-Za-z'’-]*/g;
  const ms = [];
  let m;
  while ((m = re.exec(text))) ms.push({ word: m[0], idx: m.index });
  if (!ms.length) return null;
  const clean = w => w.replace(/[^A-Za-z'’-]/g, '');
  let pick = ms.find(x => libSet.has(clean(x.word).toLowerCase()) && !MEM_STOP.has(clean(x.word).toLowerCase()));
  if (!pick) pick = ms.filter(x => !MEM_STOP.has(clean(x.word).toLowerCase())).sort((a, b) => clean(b.word).length - clean(a.word).length)[0];
  if (!pick) pick = ms.slice().sort((a, b) => clean(b.word).length - clean(a.word).length)[0];
  if (!pick) return null;
  return {
    text: text.slice(0, pick.idx) + '___' + text.slice(pick.idx + pick.word.length),
    answers: [pick.word]
  };
}
function splitSentenceRanges(text) {
  const out = [];
  const re = /[^.!?。！？]+[.!?。！？]*/g;
  let m;
  while ((m = re.exec(text))) {
    if (m[0].trim()) out.push({ start: m.index, end: m.index + m[0].length });
  }
  if (!out.length && text.trim()) out.push({ start: 0, end: text.length });
  return out;
}
function listeningScriptsOf(q) {
  const list = [];
  if (q.subType === 'short_dialogue') (q.items || []).forEach(it => { if (it.script) list.push({ s: it.script, note: it.explanation || (it.answer ? '答案 ' + it.answer : '') }); });
  else if (q.script) list.push({ s: q.script, note: '' });
  return list;
}

/* 从当前题抽取可收藏的句子（挖空式） */
function memEntriesFromQ(q) {
  const out = [];
  const libSet = libWordSet();
  const add = (text, answers, note, src) => {
    if (!text || !answers || !answers.length || out.length >= 10) return;
    if (!/_+/.test(text)) return;
    out.push({ text: text.trim(), answers: answers.map(String), note: String(note || '').trim(), src: src || kindLabel(q), qid: q.id });
  };

  if (q.type === 'verb') {
    (q.sentences || []).forEach(s => {
      if (/_+/.test(s.text)) add(s.text, [s.answer], [s.hint ? `提示词 ${s.hint}` : '', s.explanation || ''].filter(Boolean).join(' · '), '动词填空');
      else { const a = autoMask(s.text, libSet); if (a) add(a.text, a.answers, s.explanation || '', '动词填空'); }
    });
  } else if (q.type === 'cloze') {
    const base = q.passage || '';
    const blanks = [];
    const bre = /_+/g;
    let bm;
    while ((bm = bre.exec(base))) blanks.push({ s: bm.index, e: bm.index + bm[0].length });
    const sents = splitSentenceRanges(base);
    blanks.forEach((b, gi) => {
      const target = (q.blanks || [])[gi];
      if (!target || !target.answer) return;
      const sen = sents.find(x => b.s >= x.start && b.s < x.end) || {
        start: Math.max(0, b.s - 70), end: Math.min(base.length, b.e + 70)
      };
      const winBlanks = blanks.filter(x => x.s >= sen.start && x.e <= sen.end);
      const tIdx = winBlanks.indexOf(b);
      if (tIdx < 0) return;
      let cursor = sen.start;
      let built = '';
      winBlanks.forEach((wb, wi) => {
        built += base.slice(cursor, wb.s);
        if (wi === tIdx) built += '___';
        else { const gb = q.blanks[blanks.indexOf(wb)]; built += (gb && gb.answer) || '___'; }
        cursor = wb.e;
      });
      built += base.slice(cursor);
      const note = [target.pos ? `（${target.pos}）` : '', target.explanation || ''].filter(Boolean).join(' ');
      add(built, [target.answer], note, '完形填空');
    });
  } else if (q.type === 'choice') {
    if (q.example && q.word) {
      const re = new RegExp(escapeRegExp(q.word), 'i');
      if (re.test(q.example)) add(q.example.replace(re, '___'), [q.word], q.meaning || '', '例句');
      else { const a = autoMask(q.example, libSet); if (a) add(a.text, a.answers, q.meaning || '', '例句'); }
    }
    const src = q.example ? '例句' : '单项选择';
    if (q.example) { const a2 = autoMask(q.example, libSet); if (a2) add(a2.text, a2.answers, q.meaning || q.explanation || '', src); }
    if (!q.example && q.question) { const a3 = autoMask(q.question, libSet); if (a3) add(a3.text, a3.answers, q.explanation || (q.answer ? '考点答案：' + q.answer : ''), '单项选择'); }
  } else if (q.type === 'reading') {
    const ranges = splitSentenceRanges(q.passage || '').slice(0, 5);
    ranges.forEach(r => {
      const seg = (q.passage || '').slice(r.start, r.end).trim();
      const a = autoMask(seg, libSet);
      if (a) add(a.text, a.answers, q.title || '', '阅读积累');
    });
  } else if (q.type === 'listening') {
    listeningScriptsOf(q).forEach(sc => {
      sc.s.split(/\n+/).forEach(line => {
        const clean = line.replace(/^\s*[A-Za-z]{1,3}\s*[:：]\s*/, '').trim();
        if (clean.length < 8) return;
        const a = autoMask(clean, libSet);
        if (a) add(a.text, a.answers, sc.note, '听力原文');
      });
    });
  }
  return out.slice(0, 10);
}

function addMemEntries(list, quiet) {
  let added = 0, dup = 0;
  const seen = new Set(memBook.map(e => `${e.text}\u0001${(e.answers || []).join('/')}`));
  (list || []).forEach(e => {
    const key = `${e.text}\u0001${e.answers.join('/')}`;
    if (seen.has(key)) { dup++; return; }
    seen.add(key);
    memBook.push({
      id: uid(), text: e.text, answers: e.answers, note: e.note || '',
      src: e.src || '', qid: e.qid || '', right: 0, wrong: 0, addedAt: Date.now()
    });
    added++;
  });
  saveMemBook(); renderMemBook();
  if (!quiet) toast(added ? `已加入背记册 ${added} 句${dup ? `，${dup} 句已存在` : ''}` : (dup ? '这些句子都已在背记册中' : '没有可收藏的句子'), added ? 'ok' : (dup ? '' : 'err'));
  return added;
}

function renderMemBook() {
  const el = $('mb-count'); if (el) el.textContent = memBook.length;
  const box = $('mb-list'); if (!box) return;
  if (!memBook.length) { box.innerHTML = '<div class="empty-mini">背记册为空 —— 点右上角「📖 快速加句」添加，或做题时点「📖 加入背记册」收藏</div>'; return; }
  const rows = memBook.slice().sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)).map(e => {
    const marked = esc(e.text).replace(/_+/g, '<span class="blank">_____</span>');
    return `<tr>
      <td style="width:86px"><span class="badge gold" style="margin:0">${esc(e.src || '句子')}</span></td>
      <td><div class="mb-sentence">${marked}</div><div class="mb-note">${esc((e.answers || []).join(' / '))}${e.note ? ' · ' + esc(e.note) : ''}</div></td>
      <td style="width:92px" class="muted small">对 ${e.right || 0} · 错 ${e.wrong || 0}</td>
      <td style="width:70px"><button class="icon-btn" data-mb-del="${esc(e.id)}" title="移出背记册">✕</button></td>
    </tr>`;
  }).join('');
  box.innerHTML = `<div class="table-wrap"><table><tbody>${rows}</tbody></table></div>`;
}

$('wb-list').addEventListener('click', e => {
  const btn = e.target.closest('button[data-wb-del]');
  if (!btn) return;
  wrongBook = wrongBook.filter(x => x.qid !== btn.dataset.wbDel);
  saveWrongBook(); renderWrongBook(); toast('已移出错题本');
});
$('mb-list').addEventListener('click', e => {
  const btn = e.target.closest('button[data-mb-del]');
  if (!btn) return;
  memBook = memBook.filter(x => x.id !== btn.dataset.mbDel);
  saveMemBook(); renderMemBook(); toast('已移出背记册');
});
$('wb-clear').addEventListener('click', () => {
  if (!wrongBook.length) { toast('错题本已经是空的'); return; }
  if (!confirm(`确定清空错题本（${wrongBook.length} 题）？`)) return;
  wrongBook = []; saveWrongBook(); renderWrongBook(); toast('错题本已清空');
});
$('mb-clear').addEventListener('click', () => {
  if (!memBook.length) { toast('背记册已经是空的'); return; }
  if (!confirm(`确定清空背记册（${memBook.length} 句）？`)) return;
  memBook = []; saveMemBook(); renderMemBook(); toast('背记册已清空');
});
$('wb-redo').addEventListener('click', () => {
  const list = wrongBook.map(e => e.q).filter(q => q && q.type);
  if (!list.length) { toast('错题本为空', 'err'); return; }
  startPracticeFrom(list, 'wrong');
});

/* ---- 背记册挖空默写 ---- */
const mem = { list: [], pos: 0, right: 0, answered: false, solved: '' };

function startMemPractice() {
  if (!memBook.length) { toast('背记册为空', 'err'); return; }
  mem.list = shuffle(memBook.slice());
  mem.pos = 0;
  mem.right = 0;
  $('mem-practice').style.display = 'block';
  renderMemQuestion();
  $('mem-practice').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function exitMemPractice() {
  stopLoop(); try { speechSynthesis.cancel(); } catch (e) {}
  $('mem-practice').style.display = 'none';
}
function renderMemQuestion() {
  const e = mem.list[mem.pos];
  $('mem-pos').textContent = Math.min(mem.pos + 1, mem.list.length);
  $('mem-total').textContent = mem.list.length;
  $('mem-right').textContent = mem.right;
  if (!e) {
    toast(`默写完成：正确 ${mem.right} / ${mem.list.length}`, 'ok');
    exitMemPractice();
    return;
  }
  mem.answered = false;
  mem.solved = '';
  let html = '';
  let bi = 0;
  let last = 0;
  let m;
  const re = /_+/g;
  while ((m = re.exec(e.text))) {
    html += esc(e.text.slice(last, m.index));
    const ans = (e.answers || [])[bi];
    html += ans
      ? `<input class="mem-input" data-mi="${bi}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="${ans.replace(/[^A-Za-z]/g, '').length || 1}字母">`
      : '<span class="blank" style="color:var(--accent);font-weight:600">_____</span>';
    bi++;
    last = m.index + m[0].length;
  }
  html += esc(e.text.slice(last));
  $('mem-sentence').innerHTML = html;
  $('mem-src').textContent = [e.src, e.note].filter(Boolean).join(' · ');
  $('mem-feedback').textContent = '';
  $('mem-feedback').className = 'feedback';
  $('mem-sentence').querySelectorAll('.mem-input').forEach(inp => {
    inp.addEventListener('keydown', ev => {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      if (mem.answered) memNext(); else memSubmit();
    });
  });
  const first = $('mem-sentence').querySelector('.mem-input');
  if (first) first.focus();
}
function memSolvedText(e) {
  let bi = 0;
  return e.text.replace(/_+/g, () => (e.answers || [])[bi++] ?? '_____');
}
function memSubmit() {
  const e = mem.list[mem.pos];
  if (!e || mem.answered) return;
  const inputs = [...$('mem-sentence').querySelectorAll('.mem-input')];
  if (!inputs.length) { toast('该句没有可输入的空', 'err'); return; }
  if (!inputs.some(i => i.value.trim())) { toast('请输入答案', 'err'); if (inputs[0]) inputs[0].focus(); return; }
  mem.answered = true;
  let allRight = true;
  inputs.forEach(inp => {
    const i = parseInt(inp.dataset.mi);
    const ans = String((e.answers || [])[i] || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const val = inp.value.trim().toLowerCase().replace(/\s+/g, ' ');
    const ok = !!val && val === ans;
    inp.classList.add(ok ? 'correct' : 'wrong');
    inp.disabled = true;
    if (!ok) allRight = false;
  });
  const solved = memSolvedText(e);
  mem.solved = solved;
  e.noteShown = true;
  if (allRight) {
    mem.right++;
    e.right = (e.right || 0) + 1;
    statMem(true);
    $('mem-feedback').className = 'feedback ok';
    $('mem-feedback').innerHTML = `✅ 正确${e.note ? '　' + esc(e.note) : ''}`;
    speak(solved, { rate: 0.9 });
    setTimeout(() => { if (mem.answered && mem.list[mem.pos] === e) memNext(); }, 1400);
  } else {
    e.wrong = (e.wrong || 0) + 1;
    statMem(false);
    $('mem-feedback').className = 'feedback err';
    $('mem-feedback').innerHTML = `❌ 正确答案：<b>${esc((e.answers || []).join(' / '))}</b>${e.note ? '　' + esc(e.note) : ''}
      <div class="small muted" style="margin-top:4px">${esc(solved)}</div>`;
    speak(solved, { rate: 0.85 });
  }
  saveMemBook(); renderMemBook();
  $('mem-right').textContent = mem.right;
}
function memNext() {
  mem.pos++;
  renderMemQuestion();
}
$('mb-dict').addEventListener('click', startMemPractice);
$('mem-submit').addEventListener('click', memSubmit);
$('mem-next').addEventListener('click', memNext);
$('mem-exit').addEventListener('click', () => { exitMemPractice(); toast('已退出默写'); });
$('mem-hint').addEventListener('click', () => {
  const e = mem.list[mem.pos];
  if (!e || mem.answered) return;
  const inputs = [...$('mem-sentence').querySelectorAll('.mem-input')];
  const target = inputs.find(i => !i.value.trim());
  if (!target) return;
  const ans = String((e.answers || [])[parseInt(target.dataset.mi)] || '');
  target.value = ans.slice(0, 1);
  target.focus();
  target.setSelectionRange(1, 1);
  $('mem-feedback').className = 'feedback';
  $('mem-feedback').textContent = `提示：${ans.slice(0, 1)}${' _'.repeat(Math.max(0, ans.replace(/\s/g, '').length - 1))}`;
});
$('mem-speak').addEventListener('click', () => {
  const e = mem.list[mem.pos];
  if (!e) return;
  if (!mem.answered) { toast('提交答案后可听完整句子', 'err'); return; }
  speak(mem.solved || memSolvedText(e), { rate: 0.9 });
});
