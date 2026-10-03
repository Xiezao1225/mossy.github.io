/* =========================================================
   整卷模考
   命题蓝图：四大部分 · 满分 120 分
     第一部分 听力 30 分（短对话选择 10 / 长对话·短文选择 10 / 听力填表 10）
     第二部分 阅读 40 分（阅读理解四选一 30 / 阅读七选五 10）
     第三部分 语言运用 20 分（完形填空 10 / 短文填空 10）
     第四部分 写作 30 分（阅读表达 10 / 书面表达 20）
   ========================================================= */
const EXAM_PARTS = [
  { label: '第一部分 · 听力', points: 30, groups: [
    { kind: 'listening', match: q => q.subType === 'short_dialogue', label: '听短对话选择', points: 10, max: 1 },
    { kind: 'listening', match: q => q.subType === 'long_dialogue', label: '听长对话 / 短文选择', points: 10, max: 1 },
    { kind: 'listening', match: q => q.subType === 'table', label: '听短文填空（填表）', points: 10, max: 1 }
  ]},
  { label: '第二部分 · 阅读', points: 40, groups: [
    { kind: 'reading', label: '阅读理解（四选一）', points: 30, max: 3 },
    { kind: 'seven', label: '阅读七选五 / 六选五', points: 10, max: 1 }
  ]},
  { label: '第三部分 · 语言运用', points: 20, groups: [
    { kind: 'cloze', label: '完形填空', points: 10, max: 1 },
    { kind: 'fillgap', label: '短文填空（首字母 / 语境填词）', points: 10, max: 1 }
  ]},
  { label: '第四部分 · 写作', points: 30, groups: [
    { kind: 'readanswer', label: '阅读表达（根据文章回答问题）', points: 10, max: 1 },
    { kind: 'writing', label: '书面表达（话题作文）', points: 20, max: 1 }
  ]}
];

/* AI 全新出卷：与蓝图同结构，jobs 逐个调用 AI，合并进同一题型 */
const EXAM_AI_PLAN = [
  { label: '第一部分 · 听力', points: 30, groups: [
    { kind: 'listening', label: '听短对话选择', points: 10, jobs: [{ count: 1, sub: 'short_dialogue' }] },
    { kind: 'listening', label: '听长对话 / 短文选择', points: 10, jobs: [{ count: 1, sub: 'long_dialogue' }] },
    { kind: 'listening', label: '听短文填空（填表）', points: 10, jobs: [{ count: 1, sub: 'table' }] }
  ]},
  { label: '第二部分 · 阅读', points: 40, groups: [
    { kind: 'reading', label: '阅读理解（四选一）', points: 30, jobs: [{ count: 3, extra: '- 请生成 3 篇完整的阅读理解：JSON 数组长度必须为 3，每篇含 3-5 个小题。\n' }] },
    { kind: 'seven', label: '阅读七选五 / 六选五', points: 10, jobs: [{ count: 1 }] }
  ]},
  { label: '第三部分 · 语言运用', points: 20, groups: [
    { kind: 'cloze', label: '完形填空', points: 10, jobs: [{ count: 1 }] },
    { kind: 'fillgap', label: '短文填空（首字母 / 语境填词）', points: 10, jobs: [{ count: 1 }] }
  ]},
  { label: '第四部分 · 写作', points: 30, groups: [
    { kind: 'readanswer', label: '阅读表达（根据文章回答问题）', points: 10, jobs: [{ count: 1 }] },
    { kind: 'writing', label: '书面表达（话题作文）', points: 20, jobs: [{ count: 1 }] }
  ]}
];

function groupMatch(g, q) { return g.match ? g.match(q) : qKind(q) === g.kind; }

/* 题库筛选决定蓝图范围：选中某题型时只保留对应题型的题型组 */
function examPlanParts() {
  const typeF = $('bank-filter-type').value;
  if (typeF === 'all') return EXAM_PARTS;
  const parts = [];
  EXAM_PARTS.forEach(p => {
    const groups = p.groups.filter(g => g.kind === typeF);
    if (groups.length) parts.push({ label: p.label, points: groups.reduce((n, g) => n + g.points, 0), groups });
  });
  if (parts.length) return parts;
  return [{ label: KIND_LABEL[typeF] || typeF, points: 0,
    groups: [{ kind: typeF, label: KIND_LABEL[typeF] || typeF, points: 0, max: 50 }] }];
}

function examAIPlan() {
  const typeF = $('bank-filter-type').value;
  if (typeF === 'all') return EXAM_AI_PLAN;
  const parts = [];
  EXAM_AI_PLAN.forEach(p => {
    const groups = p.groups.filter(g => g.kind === typeF);
    if (groups.length) parts.push({ label: p.label, points: groups.reduce((n, g) => n + g.points, 0), groups });
  });
  if (parts.length) return parts;
  return [{ label: KIND_LABEL[typeF] || typeF, points: 0,
    groups: [{ kind: typeF, label: KIND_LABEL[typeF] || typeF, points: 0, jobs: [{ count: 1 }] }] }];
}

function aiPlanTarget(g) {
  const unit = { listening: '组', reading: '篇', cloze: '篇', seven: '篇', fillgap: '篇', readanswer: '篇', writing: '篇', choice: '道', verb: '篇' }[g.kind] || '道';
  const n = (g.jobs || []).reduce((a, j) => a + (parseInt(j.count, 10) || 0), 0);
  const subs = g.kind === 'listening' ? '（' + g.jobs.map(j => ({ short_dialogue: '短对话', long_dialogue: '长对话', table: '填表' }[j.sub] || '听力')).join(' + ') + '）' : '';
  return `AI 生成 ${n} ${unit}${subs} · ${g.points} 分`;
}

const exam = {
  active: false, graded: false, paper: [], sections: [], parts: [],
  source: 'bank', ai: { difficulty: 3, topic: '' }, generating: false, bankEmpty: false,
  timeLimit: 60, maxPlays: 2, remaining: 0, timer: null, startedAt: 0,
  listenState: {}, stats: null
};

function examSubCount(q) {
  if (!q) return 0;
  if (q.type === 'choice') return 1;
  if (q.type === 'reading') return (q.questions || []).length;
  if (q.type === 'cloze') return (q.blanks || []).length;
  if (q.type === 'verb') return (q.sentences || []).length;
  if (q.type === 'writing') return 0;
  if (q.type === 'listening') {
    if (q.subType === 'short_dialogue') return (q.items || []).length;
    if (q.subType === 'long_dialogue') return (q.questions || []).length;
    if (q.subType === 'table') return (q.blanks || []).length;
    return 0;
  }
  return 1;
}

function buildExamSections() {
  const pool = filterBankList();
  const sections = [];
  examPlanParts().forEach(part => {
    part.groups.forEach(g => {
      const qs = shuffle(pool.filter(q => groupMatch(g, q))).slice(0, g.max || 99);
      if (qs.length) sections.push({ part: part.label, label: g.label, kind: g.kind, points: g.points || 0, list: qs });
    });
  });
  return sections;
}

/* 按题库筛选条件组卷；返回是否有题可组 */
function prepareBankPaper() {
  const parts = examPlanParts();
  const sections = buildExamSections();
  exam.parts = parts;
  exam.sections = sections;
  exam.paper = [];
  sections.forEach(s => s.list.forEach(q => exam.paper.push({ q, id: uid(), section: s, el: null })));
  exam.bankEmpty = !sections.length;
  return !exam.bankEmpty;
}

function openExam() {
  stopListening();
  if (exam.timer) { clearInterval(exam.timer); exam.timer = null; }
  exam.active = false;
  exam.graded = false;
  exam.generating = false;
  exam.stats = null;
  exam.listenState = {};
  exam.sections = [];
  exam.parts = [];
  exam.paper = [];
  exam.bankEmpty = false;
  if (exam.source === 'bank') prepareBankPaper();
  $('tabs').querySelector('[data-tab="bank"]').click();
  $('bank-practice').style.display = 'none';
  $('bank-list-card').style.display = 'none';
  $('bank-exam').style.display = 'block';
  $('exam-setup').style.display = 'block';
  $('exam-report').style.display = 'none';
  $('exam-report').innerHTML = '';
  $('exam-paper').style.display = 'none';
  $('exam-paper').innerHTML = '';
  $('exam-timer').textContent = '--:--';
  $('exam-timer').className = 'exam-timer';
  $('exam-submit').style.display = '';
  $('exam-exit').textContent = '退出';
  renderExamSetup();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function examSourceOptionsHtml() {
  const bankNote = exam.bankEmpty
    ? '<span class="muted">当前筛选条件下没有可组卷的题目</span>'
    : `<span class="muted">按当前筛选条件抽取 · ${exam.paper.length} 题可选</span>`;
  return `
    <div class="exam-src">
      <label class="exam-src-opt${exam.source === 'bank' ? ' on' : ''}">
        <input type="radio" name="exam-source" value="bank"${exam.source === 'bank' ? ' checked' : ''}>
        <span><b>从题库组卷</b>${bankNote}</span>
      </label>
      <label class="exam-src-opt${exam.source === 'ai' ? ' on' : ''}">
        <input type="radio" name="exam-source" value="ai"${exam.source === 'ai' ? ' checked' : ''}>
        <span><b>AI 全新出卷</b><span class="muted">现场生成一套新题，不写入题库 · 需已配置 API</span></span>
      </label>
    </div>`;
}

function examAIOptionsHtml() {
  const d = exam.ai.difficulty;
  const opts = [1, 2, 3, 4, 5].map(n => `<option value="${n}"${n === d ? ' selected' : ''}>${'★'.repeat(n)}${'☆'.repeat(5 - n)} ${n} 星</option>`).join('');
  return `
    <div class="exam-opt">
      <label>AI 命题难度</label>
      <select id="exam-ai-diff">${opts}</select>
    </div>
    <div class="exam-opt">
      <label>命题主题（可选）</label>
      <input type="text" id="exam-ai-topic" placeholder="如：校园生活、旅行、环保" value="${esc(exam.ai.topic)}">
    </div>
    <p class="muted small" style="margin:0 0 14px">难度/标记筛选对 AI 出卷不生效；生成的题目不会自动加入题库，交卷后可一键保存。</p>`;
}

/* AI 出卷的词汇来源：可多选一个/多个词库，与「AI 出题」页共用同一选择 */
function examVocabHtml() {
  return `
    <div class="exam-vocab">
      <div class="row between" style="margin:20px 0 10px;flex-wrap:wrap">
        <b style="font-family:var(--serif);font-size:14.5px;font-weight:600">词汇来源（可多选词库）</b>
        <div class="row">
          <button class="btn sm" type="button" id="exam-sel-all">全选</button>
          <button class="btn sm" type="button" id="exam-sel-none">清空</button>
        </div>
      </div>
      <div class="lib-picker" id="exam-lib-picker"></div>
      <div class="row" style="margin-top:10px;flex-wrap:wrap;gap:14px;align-items:center">
        <label class="switch" style="margin:0"><input type="checkbox" id="exam-key-only">只取重点词汇</label>
        <label class="switch" style="margin:0"><input type="checkbox" id="exam-lib-only">仅使用所选词库词汇</label>
        <span class="muted small" id="exam-pool-info"></span>
      </div>
      <p class="muted small" style="margin:8px 0 0">所选词库的单词与释义会写入命题提示词；勾选「仅使用所选词库词汇」时 AI 只用这些词命题。不勾选任何词库则按主题自由出题，选择结果与「AI 出题」页共用。</p>
    </div>`;
}

function renderExamSetup() {
  const isAI = exam.source === 'ai';
  const totalQ = exam.paper.length;
  const totalSub = exam.paper.reduce((n, r) => n + examSubCount(r.q), 0);
  const secPointsOf = s => (s.points > 0 ? s.points : s.list.reduce((n, q) => n + examSubCount(q), 0));
  let secHtml = '';
  let planTotal = 0;
  if (isAI) {
    secHtml = examAIPlan().map(p => {
      planTotal += p.points;
      const items = p.groups.map(g =>
        `<li><b>${esc(g.label)}</b><span class="muted">${esc(aiPlanTarget(g))}</span></li>`).join('');
      return `<li class="exam-part-row"><b>${esc(p.label)}</b><span>${p.points} 分</span></li>${items}`;
    }).join('');
  } else {
    secHtml = (exam.parts || []).map(p => {
      const items = p.groups.map(g => {
        const s = (exam.sections || []).find(x => x.part === p.label && x.label === g.label);
        if (!s) {
          return `<li class="miss"><b>${esc(g.label)}</b><span class="muted">题库暂无 · ${g.points} 分不计</span></li>`;
        }
        const subs = s.list.reduce((n, q) => n + examSubCount(q), 0);
        const pts = secPointsOf(s);
        planTotal += pts;
        return `<li><b>${esc(s.label)}</b><span class="muted">${s.list.length} 题 · ${subs} 小题 · ${pts} 分</span></li>`;
      }).join('');
      const partPts = p.groups.reduce((n, g) => {
        const s = (exam.sections || []).find(x => x.part === p.label && x.label === g.label);
        return n + (s ? secPointsOf(s) : 0);
      }, 0);
      return `<li class="exam-part-row"><b>${esc(p.label)}</b><span>${partPts} / ${p.points} 分</span></li>${items}`;
    }).join('');
  }
  const headLine = isAI
    ? `AI 将现场命题，组成一套<b>全新</b>试卷 · 满分 <b>${planTotal}</b> 分`
    : exam.bankEmpty
      ? '<b>没有可组卷的题目</b>：请调整题库筛选条件，或改用 AI 全新出卷'
      : `本卷满分 <b>${planTotal}</b> 分 · 共 <b>${totalQ}</b> 题、<b>${totalSub}</b> 个计分小题${totalSub ? '' : '（作文交卷后由 AI 批改给分）'}`;
  $('exam-sub').textContent = isAI
    ? 'AI 全新出卷 · 不写入题库'
    : `按题库筛选条件自动组卷 · 共 ${totalQ} 题`;
  const canStart = isAI || !exam.bankEmpty;
  $('exam-setup').innerHTML = `
    <div class="exam-setup-grid">
      <div>
        ${examSourceOptionsHtml()}
        <div class="exam-total">${headLine}</div>
        <ul class="exam-sec-list">${secHtml}</ul>
        ${isAI ? examAIOptionsHtml() + examVocabHtml() : ''}
      </div>
      <div>
        <div class="exam-opt">
          <label>考试时长</label>
          <select id="exam-mins">
            <option value="30">30 分钟</option>
            <option value="45">45 分钟</option>
            <option value="60" selected>60 分钟</option>
            <option value="90">90 分钟</option>
            <option value="120">120 分钟</option>
          </select>
        </div>
        <div class="exam-opt">
          <label>听力播放次数上限</label>
          <select id="exam-plays">
            <option value="1">1 遍</option>
            <option value="2" selected>2 遍</option>
            <option value="0">不限（练习模式）</option>
          </select>
        </div>
        <div class="row" style="margin-top:18px">
          <button class="btn primary" id="exam-begin"${canStart ? '' : ' disabled'}>开始考试</button>
          <button class="btn" id="exam-cancel">取消</button>
        </div>
        <p class="muted small" style="margin-top:14px">考试期间不即时判分，交卷后统一给出答案与解析；听力原文与作文 AI 批改在交卷后可用。</p>
      </div>
    </div>
    <div id="exam-gen-status" class="ai-status" style="display:none"></div>`;
  renderLibPickers();
}

function renderExamQuestion(q) {
  if (q.type === 'choice') return renderChoice(q);
  if (q.type === 'reading') return renderReading(q);
  if (q.type === 'cloze') return renderCloze(q, { useOptions: !q.noOptions, locked: true });
  if (q.type === 'verb') return renderVerb(q, { useOptionsVerb: true, locked: true });
  if (q.type === 'listening') return renderListening(q);
  if (q.type === 'writing') return renderWriting(q);
  return '<div class="ai-error">未知题型</div>';
}

/* 题型组分值：题库缺题导致小题数不足时，仍按题型满分计（每小题等分） */
function sectionPoints(s) {
  if (s.points > 0) return s.points;
  return s.list.reduce((n, q) => n + examSubCount(q), 0);
}
function examPartPoints(partLabel) {
  return (exam.sections || []).reduce((n, s) => n + (s.part === partLabel ? sectionPoints(s) : 0), 0);
}

function renderExamPaper() {
  let html = '';
  let cur = null;
  let curPart = null;
  let secIdx = 0;
  exam.paper.forEach(rec => {
    if (rec.section !== cur) {
      if (cur) html += '</section>';
      if (rec.section.part !== curPart) {
        curPart = rec.section.part;
        html += `<div class="exam-part-head"><span class="ep-title">${esc(curPart)}</span><span class="ep-points">共 ${examPartPoints(curPart)} 分</span></div>`;
      }
      cur = rec.section;
      secIdx++;
      const subs = cur.list.reduce((n, q) => n + examSubCount(q), 0);
      html += `<section class="exam-section">
        <div class="exam-sec-head">
          <span class="eh-num">${secIdx < 10 ? '0' + secIdx : secIdx}</span>
          <span class="eh-title">${esc(cur.label)}</span>
          <span class="eh-note">${cur.list.length} 题 · ${subs} 小题 · ${sectionPoints(cur)} 分</span>
        </div>`;
    }
    html += `<div class="exam-q" data-eid="${rec.id}">${renderExamQuestion(rec.q)}</div>`;
  });
  if (cur) html += '</section>';
  $('exam-paper').innerHTML = html;
}

function bindExamPaper() {
  const paper = $('exam-paper');
  applyAllMarks(paper);
  exam.paper.forEach(rec => {
    rec.el = paper.querySelector(`.exam-q[data-eid="${rec.id}"]`);
    if (!rec.el) return;
    if (rec.q.type === 'listening') {
      const st = { listenPlayed: 0, listenItemPlayed: {} };
      exam.listenState[rec.id] = st;
      setupListeningUI(rec.q, { root: rec.el, state: st, maxPlays: exam.maxPlays, gradeOnBlur: false });
    }
    if (rec.q.type === 'writing') {
      const btn = rec.el.querySelector('.writing-submit');
      const st = rec.el.querySelector('.writing-status');
      if (btn) { btn.disabled = true; btn.textContent = '交卷后可提交 AI 批改'; }
      if (st) st.textContent = '考试中不可提交';
    }
  });
}

/* AI 全新出卷：按计划逐板块调用 AI，返回题目分组 */
async function generateExamSections() {
  if (!settings || !settings.endpoint || !settings.key || !settings.model) {
    toast('请先在「设置」中配置 API', 'err');
    $('tabs').querySelector('[data-tab="settings"]').click();
    return [];
  }
  const plan = examAIPlan();
  const status = $('exam-gen-status');
  const btn = $('exam-begin');
  const setNote = (text, cls) => {
    if (!status) return;
    status.style.display = 'block';
    status.className = 'ai-status' + (cls ? ' ' + cls : '');
    status.textContent = text;
  };
  exam.generating = true;
  if (btn) { btn.disabled = true; btn.textContent = 'AI 出卷中…'; }
  const sections = [];
  const errors = [];
  const flat = [];
  plan.forEach(p => p.groups.forEach(g => flat.push(Object.assign({ part: p.label }, g))));
  try {
    for (let i = 0; i < flat.length; i++) {
      const g = flat[i];
      setNote(`正在生成：${g.label}（${i + 1}/${flat.length}）…`);
      const list = [];
      for (const job of (g.jobs || [])) {
        try {
          const got = await generateQuestions(g.kind, {
            topic: exam.ai.topic, difficulty: exam.ai.difficulty,
            count: job.count, level: job.level || 'A',
            listeningSub: job.sub, extra: job.extra || '',
            vocabPrefix: 'exam'
          });
          list.push(...got);
        } catch (err) {
          errors.push(`${g.label}：${err.message}`);
        }
      }
      if (list.length) sections.push({ part: g.part, label: g.label, kind: g.kind, points: g.points || 0, list });
    }
  } finally {
    exam.generating = false;
    if (btn) { btn.disabled = false; btn.textContent = '开始考试'; }
  }
  if (errors.length) {
    setNote(`部分板块生成失败 —— ${errors.join('；')}`, 'err');
    if (!sections.length) { toast('AI 出卷失败，请检查 API 配置后重试', 'err'); return []; }
    toast(`有 ${errors.length} 个板块生成失败，已用其余板块组卷`, 'err');
  } else {
    setNote(`生成完成：${sections.reduce((n, s) => n + s.list.length, 0)} 道题`, 'ok');
  }
  return sections;
}

async function beginExam() {
  if (exam.generating) return;
  const mins = parseInt($('exam-mins').value, 10) || 60;
  const playsRaw = parseInt($('exam-plays').value, 10);
  if (exam.source === 'ai') {
    const sections = await generateExamSections();
    if (!sections.length) return;
    exam.parts = examAIPlan();
    exam.sections = sections;
    exam.paper = [];
    sections.forEach(s => s.list.forEach(q => exam.paper.push({ q, id: uid(), section: s, el: null })));
  } else {
    if (exam.bankEmpty || !exam.paper.length) { toast('没有可组卷的题目，请调整筛选条件或改用 AI 出卷', 'err'); return; }
  }
  exam.timeLimit = mins;
  exam.maxPlays = isNaN(playsRaw) ? 2 : playsRaw;
  exam.active = true;
  exam.graded = false;
  exam.startedAt = Date.now();
  exam.remaining = mins * 60;
  $('exam-setup').style.display = 'none';
  $('exam-report').style.display = 'none';
  $('exam-paper').style.display = 'block';
  renderExamPaper();
  bindExamPaper();
  updateExamTimer();
  if (exam.timer) clearInterval(exam.timer);
  exam.timer = setInterval(examTick, 1000);
  toast(`考试开始 · ${exam.source === 'ai' ? 'AI 全新出卷' : '题库组卷'} · 时长 ${mins} 分钟`, 'ok');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function examTimerText(sec) {
  sec = Math.max(0, parseInt(sec, 10) || 0);
  const s = sec % 60, m = Math.floor(sec / 60);
  const pad = n => (n < 10 ? '0' : '') + n;
  if (m >= 60) return pad(Math.floor(m / 60)) + ':' + pad(m % 60) + ':' + pad(s);
  return pad(m) + ':' + pad(s);
}

function updateExamTimer() {
  const el = $('exam-timer');
  el.textContent = examTimerText(exam.remaining);
  el.classList.toggle('warn', exam.remaining <= 300 && exam.remaining > 60);
  el.classList.toggle('over', exam.remaining <= 60);
}

function examTick() {
  if (!exam.active || exam.graded) return;
  exam.remaining--;
  if (exam.remaining <= 0) {
    exam.remaining = 0;
    updateExamTimer();
    finishExam(true);
    return;
  }
  updateExamTimer();
  if (exam.remaining === 300) toast('还剩 5 分钟');
  if (exam.remaining === 60) toast('还剩 1 分钟', 'err');
}

function countExamAnswered() {
  let done = 0, total = 0;
  exam.paper.forEach(rec => {
    const q = rec.q, el = rec.el;
    if (!el) return;
    const has = sel => !!el.querySelector(sel);
    if (q.type === 'choice') {
      total++; if (has('.q-options .q-option.chosen')) done++;
    } else if (q.type === 'reading') {
      if (q.mode === 'open') {
        (q.questions || []).forEach((_, i) => {
          total++;
          const inp = el.querySelector(`input.ra-input[data-sidx="${i}"]`);
          if (inp && inp.value.trim()) done++;
        });
      } else {
        (q.questions || []).forEach((sq, i) => { total++; if (has(`.q-options[data-sidx="${i}"] .q-option.chosen`)) done++; });
      }
    } else if (q.type === 'cloze') {
      const allOpts = (q.blanks || []).every(b => Array.isArray(b.options) && b.options.length >= 2);
      (q.blanks || []).forEach((b, i) => {
        total++;
        if (allOpts) { if (has(`.blank-opts[data-bidx="${i}"] .blank-opt.chosen`)) done++; }
        else { const inp = el.querySelector(`input[data-cidx="${i}"]`); if (inp && inp.value.trim()) done++; }
      });
    } else if (q.type === 'verb') {
      const allOpts = (q.sentences || []).every(s => Array.isArray(s.options) && s.options.length >= 2);
      (q.sentences || []).forEach((s, i) => {
        total++;
        if (allOpts) { if (has(`.blank-opts[data-bidx="${i}"] .blank-opt.chosen`)) done++; }
        else { const inp = el.querySelector(`input.verb-input[data-vidx="${i}"]`); if (inp && inp.value.trim()) done++; }
      });
    } else if (q.type === 'listening') {
      if (q.subType === 'short_dialogue') {
        (q.items || []).forEach((it, i) => { total++; if (has(`.q-options[data-lidx="${i}"] .q-option.chosen`)) done++; });
      } else if (q.subType === 'long_dialogue') {
        (q.questions || []).forEach((sq, i) => { total++; if (has(`.q-options[data-sidx="${i}"] .q-option.chosen`)) done++; });
      } else if (q.subType === 'table') {
        (q.blanks || []).forEach(b => { total++; const inp = el.querySelector(`input.table-input[data-trow="${b.row}"][data-tcol="${b.col}"]`); if (inp && inp.value.trim()) done++; });
      }
    } else if (q.type === 'writing') {
      total++;
      const ta = el.querySelector('.writing-input');
      if (ta && ta.value.trim()) done++;
    }
  });
  return { done, total };
}

function finishExam(auto) {
  if (!exam.active || exam.graded) return;
  if (auto) {
    toast('时间到，已自动交卷', 'err');
  } else {
    const c = countExamAnswered();
    const left = c.total - c.done;
    const msg = `确认交卷？\n已作答 ${c.done} / ${c.total} 处` + (left > 0 ? `\n还有 ${left} 处未作答。` : '');
    if (!window.confirm(msg)) return;
  }
  gradeExam();
}

/* 书面表达 20 分：从 AI 批改结果里解析【总分】X / 20 */
function readEssayScore() {
  const rec = exam.paper.find(r => r.q && r.q.type === 'writing');
  if (!rec || !rec.el) return null;
  const box = rec.el.querySelector('.writing-appreciation');
  const txt = box ? box.textContent || '' : '';
  const m = txt.match(/(?:总分|得分|score)\s*[：:]?\s*(\d+(?:\.\d+)?)\s*[\/／]\s*20/i);
  if (m) return clamp(parseFloat(m[1]), 0, 20);
  return null;
}

/* 阅读表达（简答）宽松判分：归一化后精确 / 包含 / 关键词重合 */
function answerTextOf(a) { return Array.isArray(a) ? a.join(' / ') : String(a == null ? '' : a); }
function normalizeAnswerText(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function matchOpenAnswer(input, answer) {
  const inp = normalizeAnswerText(input);
  if (!inp) return false;
  const wordsIn = inp.split(' ').filter(Boolean);
  const variants = (Array.isArray(answer) ? answer : [answer]).map(normalizeAnswerText).filter(Boolean);
  for (const v of variants) {
    if (inp === v) return true;
    if (v.includes(inp) && inp.length >= 6) return true;
    if (inp.includes(v)) return true;
    const vw = v.split(' ').filter(w => w.length > 2);
    if (vw.length && inp.length >= 6) {
      const hit = vw.filter(w => wordsIn.includes(w)).length;
      if (hit / vw.length >= 0.6) return true;
    }
  }
  return false;
}

function gradeExam() {
  if (exam.graded) return;
  exam.graded = true;
  exam.active = false;
  stopListening();
  if (exam.timer) { clearInterval(exam.timer); exam.timer = null; }
  const used = exam.timeLimit * 60 - exam.remaining;

  let total = 0, right = 0;
  const secMap = new Map();
  exam.paper.forEach(rec => {
    const r = gradeExamQuestion(rec);
    let row = secMap.get(rec.section);
    if (!row) {
      row = { section: rec.section, label: rec.section.label, part: rec.section.part, total: 0, correct: 0 };
      secMap.set(rec.section, row);
    }
    row.total += r.total;
    row.correct += r.correct;
    total += r.total;
    right += r.correct;
  });
  const secRows = exam.sections.map(s => {
    const row = secMap.get(s);
    if (!row) return null;
    row.points = sectionPoints(s);
    // 题型满分按小题等分；作文无小题，交卷后由 AI 批改给分
    row.perSub = (row.total && s.points > 0) ? s.points / row.total : 1;
    row.earned = row.correct * row.perSub;
    row.writing = s.kind === 'writing';
    if (row.writing) { row.earned = 0; row.pending = true; }
    return row;
  }).filter(Boolean);
  const essay = readEssayScore();
  secRows.forEach(r => {
    if (!r.writing) return;
    if (essay != null) { r.earned = essay; r.pending = false; }
  });
  const partMap = new Map();
  secRows.forEach(r => {
    const key = r.part || '';
    let p = partMap.get(key);
    if (!p) { p = { label: key, points: 0, earned: 0 }; partMap.set(key, p); }
    p.points += r.points;
    p.earned += r.earned;
  });
  const parts = (exam.parts || []).map(p => partMap.get(p.label)).filter(Boolean);
  const pointsTotal = secRows.reduce((n, r) => n + r.points, 0);
  const pointsEarned = secRows.reduce((n, r) => n + r.earned, 0);
  exam.stats = { total, right, secRows, parts, pointsTotal, pointsEarned, essayScore: essay, used };

  exam.paper.forEach(rec => {
    if (!rec.el) return;
    rec.el.querySelectorAll('.lp-play-main').forEach(b => { b.disabled = true; b.classList.remove('playing'); b.textContent = '🎧 交卷后不可播放'; });
    rec.el.querySelectorAll('[data-lplay]').forEach(b => { b.disabled = true; b.classList.remove('playing'); });
    rec.el.querySelectorAll('.lp-script-toggle').forEach(b => { b.style.display = 'none'; });
    rec.el.querySelectorAll('.lp-script').forEach(s => s.classList.remove('hidden'));
    if (rec.q.type === 'writing') {
      const btn = rec.el.querySelector('.writing-submit');
      const st = rec.el.querySelector('.writing-status');
      if (btn) { btn.disabled = false; btn.textContent = '🤖 提交 AI 批改'; }
      if (st) st.textContent = '';
    }
  });

  $('exam-submit').style.display = 'none';
  $('exam-exit').textContent = '退出模考';
  renderExamReport();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function gradeExamQuestion(rec) {
  const root = rec.el, q = rec.q;
  let total = 0, correct = 0;
  if (!root) return { total, correct };
  const pushResult = html => {
    const area = root.querySelector('.q-result-area');
    if (!area) return;
    if (!area.dataset.init) { area.dataset.init = '1'; area.innerHTML = ''; }
    area.insertAdjacentHTML('beforeend', html);
  };
  const subResult = (sel, html) => { const el = root.querySelector(sel); if (el) el.innerHTML = html; };
  const optsOf = sel => [...root.querySelectorAll(sel)];
  const pick = list => list.find(o => o.classList.contains('chosen')) || null;
  const lockOpts = (list, answer, chosen) => list.forEach(o => {
    o.disabled = true;
    if (o.dataset.val === answer) o.classList.add('correct');
    else if (o === chosen) o.classList.add('wrong');
  });
  const head = (ok, chosen) => (ok ? '✅ 正确' : (chosen ? '❌ 错误' : '⚪ 未作答'));

  if (q.type === 'choice') {
    total = 1;
    const opts = optsOf('.q-options .q-option');
    const chosen = pick(opts);
    const val = chosen ? chosen.dataset.val : '';
    const ok = !!chosen && val === q.answer;
    if (ok) correct++;
    recordItem(q, ok, q.point);
    lockOpts(opts, q.answer, chosen);
    pushResult(buildResultBox(q, chosen ? val : '（未作答）', ok));

  } else if (q.type === 'reading') {
    if (q.mode === 'open') {
      (q.questions || []).forEach((sq, i) => {
        total++;
        const inp = root.querySelector(`input.ra-input[data-sidx="${i}"]`);
        const val = inp ? inp.value.trim() : '';
        const ok = matchOpenAnswer(val, sq.answer);
        if (ok) correct++;
        recordItem(q, ok, sq.point || q.point);
        if (inp) { inp.disabled = true; inp.classList.add(ok ? 'correct' : 'wrong'); }
        subResult(`.sub-result[data-sidx="${i}"]`,
          `<div class="explain-box${ok ? '' : ' ai'}"><div class="head">${head(ok, !!val)}</div>` +
          `<div style="margin-bottom:4px">你的答案：<b>${esc(val || '（空）')}</b> ｜ 参考答案：<b>${esc(answerTextOf(sq.answer))}</b></div>` +
          `${sq.explanation ? esc(sq.explanation) : '（无解析）'}</div>`);
      });
      return { total, correct };
    }
    (q.questions || []).forEach((sq, i) => {
      total++;
      const opts = optsOf(`.q-options[data-sidx="${i}"] .q-option`);
      const chosen = pick(opts);
      const val = chosen ? chosen.dataset.val : '';
      const ok = !!chosen && val === sq.answer;
      if (ok) correct++;
      recordItem(q, ok, sq.point || q.point);
      lockOpts(opts, sq.answer, chosen);
      subResult(`.sub-result[data-sidx="${i}"]`,
        `<div class="explain-box${ok ? '' : ' ai'}"><div class="head">${head(ok, chosen)}</div>` +
        `<div style="margin-bottom:4px">你的答案：<b>${esc(val || '（空）')}</b> ｜ 正确答案：<b>${esc(sq.answer)}</b></div>` +
        `${sq.explanation ? esc(sq.explanation) : '（无解析）'}</div>`);
    });

  } else if (q.type === 'cloze') {
    const allOpts = (q.blanks || []).every(b => Array.isArray(b.options) && b.options.length >= 2);
    (q.blanks || []).forEach((b, i) => {
      total++;
      let val = '', ok = false;
      if (allOpts) {
        const group = root.querySelector(`.blank-opts[data-bidx="${i}"]`);
        const chosen = group ? group.querySelector('.blank-opt.chosen') : null;
        val = chosen ? chosen.dataset.val : '';
        ok = !!chosen && val === b.answer;
        if (group) lockOpts([...group.querySelectorAll('.blank-opt')], b.answer, chosen);
        const mark = root.querySelector(`.blank-mark[data-bidx="${i}"]`);
        if (mark && val) mark.textContent = '[' + (i + 1) + '] ' + val;
      } else {
        const inp = root.querySelector(`input[data-cidx="${i}"]`);
        val = inp ? inp.value.trim() : '';
        ok = !!val && val.toLowerCase() === String(b.answer).toLowerCase();
        if (inp) { inp.disabled = true; inp.classList.add(ok ? 'correct' : 'wrong'); }
      }
      if (ok) correct++;
      recordItem(q, ok, b.point || q.point);
      pushResult(`<div class="explain-box${ok ? '' : ' ai'}"><div class="head">[${i + 1}] ${ok ? '✅ 正确' : (val ? '❌ 错误' : '⚪ 未作答')}</div>` +
        `你的答案：<b>${esc(val || '（空）')}</b> ｜ 正确答案：<b>${esc(b.answer)}</b>` +
        `${b.explanation ? `<div style="margin-top:4px">${esc(b.explanation)}</div>` : ''}</div>`);
    });

  } else if (q.type === 'verb') {
    const allOpts = (q.sentences || []).every(s => Array.isArray(s.options) && s.options.length >= 2);
    (q.sentences || []).forEach((s, i) => {
      total++;
      let val = '', ok = false;
      if (allOpts) {
        const group = root.querySelector(`.blank-opts[data-bidx="${i}"]`);
        const chosen = group ? group.querySelector('.blank-opt.chosen') : null;
        val = chosen ? chosen.dataset.val : '';
        ok = !!chosen && val === s.answer;
        if (group) lockOpts([...group.querySelectorAll('.blank-opt')], s.answer, chosen);
        const mark = root.querySelector(`.inline-input[data-vidx="${i}"]`);
        if (mark && val) {
          mark.textContent = val;
          mark.style.color = ok ? 'var(--olive)' : 'var(--accent)';
          mark.style.borderBottomColor = ok ? 'var(--olive)' : 'var(--accent)';
        }
      } else {
        const inp = root.querySelector(`input.verb-input[data-vidx="${i}"]`);
        val = inp ? inp.value.trim() : '';
        ok = !!val && val.toLowerCase() === String(s.answer).toLowerCase();
        if (inp) { inp.disabled = true; inp.classList.add(ok ? 'correct' : 'wrong'); }
      }
      if (ok) correct++;
      recordItem(q, ok, s.point || q.point);
      const line = root.querySelector(`.verb-sentence[data-vidx="${i}"] .result-line`);
      const html = `<span style="color:${ok ? 'var(--olive)' : 'var(--accent)'}">${head(ok, !!val)}</span>　你的答案：<b>${esc(val || '（空）')}</b>　正确答案：<b>${esc(s.answer)}</b>${s.explanation ? '　' + esc(s.explanation) : ''}`;
      if (line) line.innerHTML = html;
      else pushResult(`<div class="explain-box${ok ? '' : ' ai'}">${html}</div>`);
    });

  } else if (q.type === 'listening') {
    if (q.subType === 'short_dialogue') {
      (q.items || []).forEach((it, i) => {
        total++;
        const opts = optsOf(`.q-options[data-lidx="${i}"] .q-option`);
        const chosen = pick(opts);
        const val = chosen ? chosen.dataset.val : '';
        const ok = !!chosen && val === it.answer;
        if (ok) correct++;
        recordItem(q, ok, it.point || q.point);
        lockOpts(opts, it.answer, chosen);
        subResult(`.sub-result[data-lidx="${i}"]`,
          `<div class="explain-box${ok ? '' : ' ai'}"><div class="head">${head(ok, chosen)}</div>` +
          `<div style="margin-bottom:4px">你的答案：<b>${esc(val || '（空）')}</b> ｜ 正确答案：<b>${esc(it.answer)}</b></div>` +
          `${it.explanation ? esc(it.explanation) : '（无解析）'}` +
          `<div style="margin-top:8px;font-size:12.5px;color:var(--ink-3)">原文：${esc(it.script || '').replace(/\n/g, ' / ')}</div></div>`);
      });
    } else if (q.subType === 'long_dialogue') {
      (q.questions || []).forEach((sq, i) => {
        total++;
        const opts = optsOf(`.q-options[data-sidx="${i}"] .q-option`);
        const chosen = pick(opts);
        const val = chosen ? chosen.dataset.val : '';
        const ok = !!chosen && val === sq.answer;
        if (ok) correct++;
        recordItem(q, ok, sq.point || q.point);
        lockOpts(opts, sq.answer, chosen);
        subResult(`.sub-result[data-sidx="${i}"]`,
          `<div class="explain-box${ok ? '' : ' ai'}"><div class="head">${head(ok, chosen)}</div>` +
          `<div style="margin-bottom:4px">你的答案：<b>${esc(val || '（空）')}</b> ｜ 正确答案：<b>${esc(sq.answer)}</b></div>` +
          `${sq.explanation ? esc(sq.explanation) : '（无解析）'}</div>`);
      });
    } else if (q.subType === 'table') {
      (q.blanks || []).forEach(b => {
        total++;
        const inp = root.querySelector(`input.table-input[data-trow="${b.row}"][data-tcol="${b.col}"]`);
        const val = inp ? inp.value.trim() : '';
        const ok = !!val && val.toLowerCase() === String(b.answer).toLowerCase();
        if (ok) correct++;
        recordItem(q, ok, b.point || q.point);
        if (inp) { inp.disabled = true; inp.classList.add(ok ? 'correct' : 'wrong'); }
        pushResult(`<div class="explain-box${ok ? '' : ' ai'}"><div class="head">[${b.row + 1},${b.col + 1}] ${ok ? '✅ 正确' : (val ? '❌ 错误' : '⚪ 未作答')}</div>` +
          `你的答案：<b>${esc(val || '（空）')}</b> ｜ 正确答案：<b>${esc(b.answer)}</b>` +
          `${b.explanation ? ' · ' + esc(b.explanation) : ''}</div>`);
      });
    }
  }

  return { total, correct };
}

function fmtPts(n) {
  const v = Math.round((n || 0) * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/* 作文 AI 批改完成后回填书面表达得分并刷新报告 */
function applyEssayScoreToReport() {
  if (!exam.graded || !exam.stats) return;
  const score = readEssayScore();
  if (score == null) return;
  const row = exam.stats.secRows.find(r => r.writing);
  if (!row || (!row.pending && row.earned === score)) return;
  row.earned = score;
  row.pending = false;
  exam.stats.essayScore = score;
  exam.stats.parts.forEach(p => {
    p.earned = exam.stats.secRows.filter(r => r.part === p.label).reduce((n, r) => n + r.earned, 0);
  });
  exam.stats.pointsEarned = exam.stats.secRows.reduce((n, r) => n + r.earned, 0);
  renderExamReport();
}

function renderExamReport() {
  const st = exam.stats || { total: 0, right: 0, secRows: [], parts: [], pointsTotal: 0, pointsEarned: 0, used: 0 };
  const pct = st.total ? Math.round(st.right / st.total * 100) : null;
  const answered = countExamAnswered();
  const parts = st.parts || [];
  const covered = new Set();
  let rowsHtml = '';
  parts.forEach(p => {
    rowsHtml += `<tr class="part-row"><td colspan="3">${esc(p.label)}</td><td><b>${fmtPts(p.earned)} / ${fmtPts(p.points)} 分</b></td></tr>`;
    st.secRows.filter(r => r.part === p.label).forEach(r => {
      covered.add(r);
      const score = r.writing
        ? (r.pending ? `待 AI 批改 0 / ${fmtPts(r.points)}` : `${fmtPts(r.earned)} / ${fmtPts(r.points)}`)
        : `${fmtPts(r.earned)} / ${fmtPts(r.points)}`;
      rowsHtml += `<tr><td>${esc(r.label)}</td><td>${r.writing ? '—' : r.total}</td><td>${r.writing ? '—' : r.correct}</td><td>${score}</td></tr>`;
    });
  });
  st.secRows.filter(r => !covered.has(r)).forEach(r => {
    rowsHtml += `<tr><td>${esc(r.label)}</td><td>${r.total}</td><td>${r.correct}</td><td>${fmtPts(r.earned)} / ${fmtPts(r.points)}</td></tr>`;
  });
  const wrongCount = st.total - st.right;
  const autoW = !!(settings && settings.autoWrong !== false);
  const writingRec = exam.paper.find(r => r.q.type === 'writing');
  let essayHtml = '';
  if (writingRec) {
    const ta = writingRec.el && writingRec.el.querySelector('.writing-input');
    const txt = ta ? ta.value.trim() : '';
    const words = txt ? txt.split(/\s+/).filter(Boolean).length : 0;
    essayHtml = `<div class="row" style="margin-top:10px">
      <button class="btn sm" id="exam-essay-jump">查看 / AI 批改作文</button>
      <span class="muted small">${txt ? `作文已写 <b>${words}</b> 词 · 书面表达 20 分${st.essayScore == null ? '，交卷后提交 AI 批改给分' : ` · AI 批改得分 <b>${fmtPts(st.essayScore)}</b> 分`}` : '作文未填写 · 书面表达 20 分计 0'}</span>
    </div>`;
  }
  const saveHtml = exam.source === 'ai'
    ? `<div class="row" style="margin-top:10px">
        <button class="btn sm" id="exam-save-bank">📥 本卷题目加入题库</button>
        <span class="muted small">AI 生成的题目默认不入库，点此保存以便日后重做</span>
      </div>`
    : '';
  const el = $('exam-report');
  el.innerHTML = `
    <div class="exam-report-top">
      <div>
        <div class="exam-score">${st.pointsTotal
          ? fmtPts(st.pointsEarned) + '<small> / ' + fmtPts(st.pointsTotal) + ' 分</small>'
          : (st.total ? st.right + '<small> / ' + st.total + ' 小题</small>' : '作文卷')}</div>
        <div class="muted small" style="margin-top:6px">
          ${exam.source === 'ai' ? 'AI 全新出卷' : '题库组卷'}
          · ${pct == null ? '本卷无客观计分题' : '正确率 ' + pct + '%（错 ' + wrongCount + ' 小题 · ' + st.right + '/' + st.total + ' 小题）'}
          · 用时 ${examTimerText(st.used)}${exam.remaining <= 0 ? ' · 时间到自动交卷' : ''}
          · 已作答 ${answered.done}/${answered.total} 处
        </div>
      </div>
      <div class="row">
        <button class="btn" id="exam-again">再来一份</button>
        <button class="btn primary" id="exam-close">退出模考</button>
      </div>
    </div>
    <table class="exam-sec-table">
      <thead><tr><th>部分 / 题型</th><th>小题</th><th>正确</th><th>得分</th></tr></thead>
      <tbody>${rowsHtml || '<tr><td colspan="4">本卷无客观题</td></tr>'}
        <tr class="total-row"><td>总分</td><td>${st.total}</td><td>${st.right}</td><td><b>${fmtPts(st.pointsEarned)} / ${fmtPts(st.pointsTotal)} 分</b></td></tr>
      </tbody>
    </table>
    ${wrongCount > 0
      ? `<p class="small muted">做错的 ${wrongCount} 个小题${autoW ? '已自动加入错题本' : '未加入错题本（设置中已关闭自动加错题）'}。</p>`
      : '<p class="small muted">客观题全部正确 🎉</p>'}
    ${essayHtml}
    ${saveHtml}
    <div id="exam-wrong-note"></div>`;
  el.style.display = 'block';
  $('exam-paper').style.display = 'block';
}

function closeExam(force) {
  if (!force && exam.active && !exam.graded) {
    if (!window.confirm('考试进行中，退出将放弃本次成绩。确定退出？')) return;
  }
  stopListening();
  if (exam.timer) { clearInterval(exam.timer); exam.timer = null; }
  exam.active = false;
  $('bank-exam').style.display = 'none';
  $('exam-setup').innerHTML = '';
  $('exam-report').innerHTML = '';
  $('exam-report').style.display = 'none';
  $('exam-paper').innerHTML = '';
  $('exam-paper').style.display = 'none';
  $('bank-list-card').style.display = 'block';
  renderBankList();
}

$('bank-exam-start').addEventListener('click', openExam);

$('bank-exam').addEventListener('click', e => {
  const t = e.target;
  if (t.closest('#exam-begin')) return beginExam();
  if (t.closest('#exam-cancel')) return closeExam();
  if (t.closest('#exam-submit')) return finishExam(false);
  if (t.closest('#exam-exit')) return closeExam();
  if (t.closest('#exam-again')) return openExam();
  if (t.closest('#exam-close')) return closeExam(true);
  if (t.closest('#exam-essay-jump')) {
    const rec = exam.paper.find(r => r.q.type === 'writing');
    if (rec && rec.el) {
      rec.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const ta = rec.el.querySelector('.writing-input');
      if (ta) ta.focus();
    }
    return;
  }
  if (t.closest('#exam-save-bank')) return saveExamPaperToBank();
});

/* 试卷来源切换 / AI 命题参数 */
$('bank-exam').addEventListener('change', e => {
  const t = e.target;
  if (exam.generating) return;
  if (t.name === 'exam-source') {
    exam.source = t.value === 'ai' ? 'ai' : 'bank';
    if (exam.source === 'bank') prepareBankPaper();
    renderExamSetup();
    return;
  }
  if (t.id === 'exam-ai-diff') exam.ai.difficulty = clamp(parseInt(t.value) || 3, 1, 5);
  if (t.id === 'exam-ai-topic') exam.ai.topic = t.value.trim();
});

function saveExamPaperToBank() {
  if (exam.source !== 'ai') return;
  let added = 0;
  exam.paper.forEach(rec => {
    const q = rec.q;
    if (!q || !q.id) return;
    if (bank.some(b => b && b.id === q.id)) return;
    bank.push(q);
    added++;
  });
  saveBank();
  renderBankList();
  const btn = document.getElementById('exam-save-bank');
  if (btn && added) { btn.disabled = true; btn.textContent = '📥 已保存到题库'; }
  toast(added ? `已加入题库：${added} 道新题` : '本卷题目已在题库中', added ? 'ok' : 'err');
}

$('exam-paper').addEventListener('click', e => {
  if (!exam.graded) {
    const opt = e.target.closest('.q-option, .blank-opt');
    if (!opt || opt.disabled) return;
    [...opt.parentElement.children].forEach(x => {
      if (x.classList && (x.classList.contains('q-option') || x.classList.contains('blank-opt'))) x.classList.remove('chosen');
    });
    opt.classList.add('chosen');
    if (opt.classList.contains('blank-opt')) {
      const card = opt.closest('.exam-q');
      const bidx = opt.dataset.bidx;
      if (card) {
        const mark = card.querySelector(`.blank-mark[data-bidx="${bidx}"]`);
        if (mark) mark.textContent = '[' + (parseInt(bidx, 10) + 1) + '] ' + opt.dataset.val;
        const vmark = card.querySelector(`.inline-input[data-vidx="${bidx}"]`);
        if (vmark) {
          vmark.textContent = opt.dataset.val;
          vmark.style.color = 'var(--blue)';
          vmark.style.borderBottomColor = 'var(--blue)';
        }
      }
    }
    return;
  }
  const sub = e.target.closest('.writing-submit');
  if (!sub || sub.disabled) return;
  const wrap = sub.closest('.exam-q');
  const rec = exam.paper.find(r => r.el === wrap);
  if (rec) handleWritingSubmit(rec.q, { root: wrap });
});
