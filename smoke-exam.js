const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

const SAMPLES = [
  { id: 'c1', type: 'choice', difficulty: 3, question: 'How ___ you?', options: ['am', 'is', 'are', 'be'], answer: 'are', explanation: 'you 用 are' },
  { id: 'c2', type: 'choice', difficulty: 2, question: 'This is ___ apple.', options: ['a', 'an', 'the', '/'], answer: 'an', explanation: '元音音素前用 an' },
  { id: 'r1', type: 'reading', difficulty: 3, level: 'A', title: 'My Day', passage: 'I get up at six. I go to school at seven.', questions: [
    { question: 'When does he get up?', options: ['At six', 'At seven', 'At eight'], answer: 'At six', explanation: '' },
    { question: 'Where does he go?', options: ['Home', 'School', 'Park'], answer: 'School', explanation: '' }
  ]},
  { id: 'z1', type: 'cloze', difficulty: 3, passage: 'I ___ an apple. He ___ bananas.', blanks: [
    { options: ['eat', 'eats', 'eating', 'ate'], answer: 'eat', pos: '动词', explanation: 'I 后用 eat' },
    { options: ['eat', 'eats', 'eating', 'ate'], answer: 'eats', pos: '动词', explanation: 'He 三单' }
  ]},
  { id: 'z2', type: 'cloze', difficulty: 2, passage: 'She ___ to school yesterday.', blanks: [
    { answer: 'went', pos: '动词', explanation: 'yesterday 过去式' }
  ]},
  { id: 'v1', type: 'verb', difficulty: 2, sentences: [
    { text: 'He ___ (go) to school yesterday.', answer: 'went', hint: 'go', options: ['go', 'went', 'goes', 'going'], explanation: '过去式' },
    { text: 'They ___ (be) students.', answer: 'are', hint: 'be', options: ['is', 'are', 'am', 'be'], explanation: '复数用 are' }
  ]},
  { id: 'l1', type: 'listening', subType: 'short_dialogue', difficulty: 3, instructions: '听录音选答案', prepTime: 5, items: [
    { script: 'W: How are you?\nM: I am fine.', question: 'How is the man?', options: ['Fine', 'Bad', 'Sad'], answer: 'Fine', explanation: '' }
  ]},
  { id: 'l2', type: 'listening', subType: 'long_dialogue', difficulty: 3, instructions: '听长对话', prepTime: 5, script: 'W: What time is it?\nM: It is eight.', questions: [
    { question: 'What time is it?', options: ['Seven', 'Eight', 'Nine'], answer: 'Eight', explanation: '' }
  ]},
  { id: 'l3', type: 'listening', subType: 'table', difficulty: 3, instructions: '听录音填表', prepTime: 5, title: '课程表', columns: ['Day', 'Subject'], rows: [['Monday', ''], ['Tuesday', '']], blanks: [
    { row: 0, col: 1, answer: 'Math', explanation: '' },
    { row: 1, col: 1, answer: 'English', explanation: '' }
  ], script: 'On Monday we have Math. On Tuesday we have English.' },
  { id: 'w1', type: 'writing', difficulty: 3, prompt: '以 My School 为题写一篇短文。', hints: ['60 词左右'], sample: 'I like my school.' }
];

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + e.message));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

const html = fs.readFileSync('project.html', 'utf8');
const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    window.localStorage.setItem('eng_question_bank_v2', JSON.stringify(SAMPLES));
    window.speechSynthesis = {
      getVoices: () => [],
      speak: u => { setTimeout(() => { if (u.onend) u.onend(); }, 5); },
      cancel: () => {}
    };
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    window.confirm = () => true;
  }
});

const w = dom.window;
w.scrollTo = () => {};
w.HTMLElement.prototype.scrollIntoView = function () {};
w.addEventListener('error', e => errors.push('window error: ' + e.message));

const $ = id => w.document.getElementById(id);
const ev = code => w.eval(code);

function subCount(q) {
  if (q.type === 'choice') return 1;
  if (q.type === 'reading') return q.questions.length;
  if (q.type === 'cloze') return q.blanks.length;
  if (q.type === 'verb') return q.sentences.length;
  if (q.type === 'writing') return 0;
  if (q.subType === 'short_dialogue') return q.items.length;
  if (q.subType === 'long_dialogue') return q.questions.length;
  if (q.subType === 'table') return q.blanks.length;
  return 0;
}

function answerAll(mode) {
  ev(`(function(){
    window.__answerAll = function(mode){
      exam.paper.forEach(rec => {
        const q = rec.q, el = rec.el;
        const pick = (group, correctVal) => {
          const opts = [...group.querySelectorAll('.q-option, .blank-opt')].filter(o => !o.disabled);
          if (!opts.length) return;
          let t = mode === 'right' ? opts.find(o => o.dataset.val === correctVal) : opts.find(o => o.dataset.val !== correctVal);
          (t || opts[0]).click();
        };
        if (q.type === 'choice') pick(el.querySelector('.q-options'), q.answer);
        else if (q.type === 'reading') q.questions.forEach((sq, i) => pick(el.querySelector('.q-options[data-sidx="'+i+'"]'), sq.answer));
        else if (q.type === 'cloze') {
          const allOpts = q.blanks.every(b => b.options && b.options.length >= 2);
          q.blanks.forEach((b, i) => {
            if (allOpts) pick(el.querySelector('.blank-opts[data-bidx="'+i+'"]'), b.answer);
            else { const inp = el.querySelector('input[data-cidx="'+i+'"]'); if (inp) inp.value = mode === 'right' ? b.answer : 'zzz'; }
          });
        }
        else if (q.type === 'verb') {
          const allOpts = q.sentences.every(s => s.options && s.options.length >= 2);
          q.sentences.forEach((s, i) => {
            if (allOpts) pick(el.querySelector('.blank-opts[data-bidx="'+i+'"]'), s.answer);
            else { const inp = el.querySelector('input.verb-input[data-vidx="'+i+'"]'); if (inp) inp.value = mode === 'right' ? s.answer : 'zzz'; }
          });
        }
        else if (q.type === 'listening') {
          if (q.subType === 'short_dialogue') q.items.forEach((it, i) => pick(el.querySelector('.q-options[data-lidx="'+i+'"]'), it.answer));
          else if (q.subType === 'long_dialogue') q.questions.forEach((sq, i) => pick(el.querySelector('.q-options[data-sidx="'+i+'"]'), sq.answer));
          else if (q.subType === 'table') q.blanks.forEach(b => {
            const inp = el.querySelector('input.table-input[data-trow="'+b.row+'"][data-tcol="'+b.col+'"]');
            if (inp) inp.value = mode === 'right' ? b.answer : 'zzz';
          });
        }
        else if (q.type === 'writing') { const ta = el.querySelector('.writing-input'); if (ta) ta.value = 'I like my school very much.'; }
      });
    };
  })()`);
  ev(`__answerAll('${mode}')`);
}

function expected(sectionTypes) {
  return ev(`exam.paper.reduce((n,r)=>n+examSubCount(r.q),0)`);
}

let pass = 0, fail = 0;
const check = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra !== undefined ? ' → ' + extra : '')); }
};

async function run() {
  console.log('# 1. 全题型组卷 + 全对');
  $('bank-exam-start').click();
  check('setup 可见', $('exam-setup').style.display === 'block');
  const secLabels = [...$('exam-setup').querySelectorAll('.exam-sec-list li b')].map(e => e.textContent);
  check('按计划组卷 6 个板块', secLabels.length === 6, secLabels.join(','));
  check('作文被纳入', secLabels.includes('书面表达'));
  $('exam-begin').click();
  check('试卷已渲染', $('exam-paper').style.display === 'block' && ev('exam.paper.length') === 8, ev('exam.paper.length'));
  check('听力状态独立', ev('Object.keys(exam.listenState).length') === ev('exam.paper.filter(r=>r.q.type==="listening").length'));
  const paperQs = JSON.parse(ev('JSON.stringify(exam.paper.map(r=>r.q))'));
  const totalExpected = paperQs.reduce((n, q) => n + subCount(q), 0);
  check('试卷 8 题（完形/听力按计划取用）', ev('exam.paper.length') === 8, ev('exam.paper.length'));
  check('计分小题数 = ' + totalExpected, expected() === totalExpected, expected());

  answerAll('right');
  $('exam-submit').click();
  check('已判分', ev('exam.graded') === true);
  const full = ev('exam.stats.right') + '/' + ev('exam.stats.total');
  check('全对得满分 ' + totalExpected + '/' + totalExpected, full === totalExpected + '/' + totalExpected, ev('JSON.stringify(exam.stats)'));
  check('报告可见', $('exam-report').style.display === 'block');
  check('报告含正确率', /正确率/.test($('exam-report').textContent));
  check('交卷按钮隐藏', $('exam-submit').style.display === 'none');
  check('作文按钮已启用', ev(`exam.paper.find(r=>r.q.type==='writing').el.querySelector('.writing-submit').disabled`) === false);
  check('听力原文已展开', ev(`exam.paper.filter(r=>r.el&&r.el.querySelector('.lp-script')).every(r=>!r.el.querySelector('.lp-script').classList.contains('hidden'))`));
  check('答案已锁定', ev(`[...document.querySelectorAll('#exam-paper .q-option, #exam-paper .blank-opt')].every(o => o.disabled)`));

  console.log('# 2. 再来一份 + 部分答错');
  $('exam-again').click();
  check('回到组卷页', $('exam-setup').style.display === 'block' && $('exam-report').style.display === 'none');
  $('exam-begin').click();
  // 错 5 个小题：choice 全错，其余全对
  answerAll('right');
  ev(`(function(){
    const rec = exam.paper.find(r => r.q.type === 'choice');
    const opts = [...rec.el.querySelectorAll('.q-option')];
    const right = opts.find(o => o.dataset.val === rec.q.answer);
    const wrong = opts.find(o => o.dataset.val !== rec.q.answer);
    right.classList.remove('chosen'); wrong.classList.add('chosen');
  })()`);
  ev(`(function(){
    const rec = exam.paper.find(r => r.q.type === 'reading');
    const grp = rec.el.querySelector('.q-options[data-sidx="0"]');
    const opts = [...grp.querySelectorAll('.q-option')];
    opts.find(o => o.dataset.val === rec.q.questions[0].answer).classList.remove('chosen');
    opts.find(o => o.dataset.val !== rec.q.questions[0].answer).classList.add('chosen');
  })()`);
  $('exam-submit').click();
  check('错 2 小题', (ev('exam.stats.total') - ev('exam.stats.right')) === 2, ev('JSON.stringify(exam.stats)'));
  check('错题已入错题本', ev('wrongBook.length') > 0, ev('wrongBook.length'));
  check('统计已累计', ev('stats.types.choice.total') >= 2, ev('JSON.stringify(stats.types)'));
  check('错误选项标红', ev(`exam.paper.find(r=>r.q.type==='choice').el.querySelector('.q-option.wrong') !== null`));
  check('正确选项标绿', ev(`exam.paper.find(r=>r.q.type==='choice').el.querySelector('.q-option.correct') !== null`));

  console.log('# 3. 听力播放次数上限（2 遍）');
  $('bank-filter-type').value = 'listening';
  $('exam-again').click();
  $('exam-begin').click();
  const player = () => ev(`(function(){const r=exam.paper.find(x=>x.q.subType==='long_dialogue');const b=r.el.querySelector('.lp-play-main');return b?{d:b.disabled,t:b.textContent,plays:exam.listenState[r.id].listenPlayed}:null})()`);
  ev(`(function(){const r=exam.paper.find(x=>x.q.subType==='long_dialogue');r.el.querySelector('.lp-play-main').click();})()`);
  await new Promise(r => setTimeout(r, 900));
  check('第 1 遍播放完成计数=1', player().plays === 1, JSON.stringify(player()));
  ev(`(function(){const r=exam.paper.find(x=>x.q.subType==='long_dialogue');const b=r.el.querySelector('.lp-play-main');if(!b.disabled)b.click();})()`);
  await new Promise(r => setTimeout(r, 900));
  const p3 = player();
  check('第 2 遍后禁用', p3.plays === 2 && p3.d === true, JSON.stringify(p3));
  check('禁用文案提示上限', /无法再听/.test(p3.t), p3.t);
  ev(`(function(){const r=exam.paper.find(x=>x.q.subType==='long_dialogue');r.el.querySelector('.lp-script-toggle').click();})()`);
  check('达上限后原文按钮隐藏', ev(`(function(){const r=exam.paper.find(x=>x.q.subType==='long_dialogue');return r.el.querySelector('.lp-script-toggle').style.display})()`) === 'none');

  console.log('# 4. 退出 / 单题型组卷');
  ev(`closeExam(true)`);
  check('题库列表恢复', $('bank-list-card').style.display === 'block' && $('bank-exam').style.display === 'none');
  $('bank-filter-type').value = 'listening';
  $('bank-exam-start').click();
  const sec2 = [...$('exam-setup').querySelectorAll('.exam-sec-list li b')].map(e => e.textContent);
  check('单题型只出一个板块', sec2.length === 1 && sec2[0] === '听力题', sec2.join(','));
  check('三种听力子题都在卷内', ev('exam.paper.length') === 3, ev('exam.paper.length'));
  $('exam-begin').click();
  answerAll('right');
  $('exam-submit').click();
  check('听力卷满分 4/4', ev('exam.stats.right') + '/' + ev('exam.stats.total') === '4/4', ev('JSON.stringify(exam.stats)'));
  check('填表题已判分', ev(`exam.paper.find(r=>r.q.subType==='table').el.querySelectorAll('input.table-input.correct').length`) === 2);
  $('bank-filter-type').value = 'all';

  console.log('# 5. 未作答交卷');
  $('exam-again').click();
  $('exam-begin').click();
  const t5 = expected();
  $('exam-submit').click();
  const s5 = ev('JSON.stringify({t:exam.stats.total,r:exam.stats.right})');
  check('未作答得 0 分', s5 === JSON.stringify({ t: t5, r: 0 }), s5 + ' 期望 total=' + t5);
  check('报告显示已作答 0 处', /已作答 0\/\d+ 处/.test($('exam-report').textContent), $('exam-report').textContent.replace(/\s+/g, ' ').slice(0, 200));
  check('未作答标记', /⚪ 未作答/.test($('exam-paper').textContent));

  console.log('# 6. 120 分钟时长');
  $('exam-again').click();
  const opts120 = [...$('exam-setup').querySelectorAll('#exam-mins option')].map(o => o.value);
  check('时长含 120 分钟', opts120.includes('120'), opts120.join(','));
  $('exam-mins').value = '120';
  $('exam-begin').click();
  check('总时长 7200 秒', ev('exam.timeLimit') === 120 && ev('exam.remaining') === 7200, ev('exam.remaining'));
  check('计时器显示 02:00:00', $('exam-timer').textContent === '02:00:00', $('exam-timer').textContent);
  check('1 小时以上格式', ev('examTimerText(7200)') === '02:00:00', ev('examTimerText(7200)'));
  check('90 分钟格式', ev('examTimerText(5400)') === '01:30:00', ev('examTimerText(5400)'));
  check('不足 1 小时格式', ev('examTimerText(2999)') === '49:59', ev('examTimerText(2999)'));
  ev('closeExam(true)');

  console.log('# 7. 倒计时归零自动交卷');
  $('bank-exam-start').click();
  $('exam-begin').click();
  ev('exam.remaining = 2');
  await new Promise(r => setTimeout(r, 3200));
  check('时间到自动判分', ev('exam.graded') === true);
  check('计时器显示 00:00', $('exam-timer').textContent === '00:00', $('exam-timer').textContent);
  check('自动交卷报告可见', $('exam-report').style.display === 'block');
  check('计时器标红', $('exam-timer').classList.contains('over'));
  check('交卷按钮隐藏', $('exam-submit').style.display === 'none');
  ev(`closeExam(true)`);

  console.log('# 8. 练习模式未被破坏');
  ev(`startPracticeFrom(bank.filter(q=>q.type==='choice'), 'bank')`);
  check('练习页可见', $('bank-practice').style.display === 'block');
  check('模考页隐藏', $('bank-exam').style.display === 'none');
  ev(`document.querySelectorAll('#bank-question-area .q-option')[0].click()`);
  check('练习模式仍即时判分', $('bank-question-area').querySelector('.q-option.correct, .q-option.wrong') !== null);
  ev(`exitPractice()`);

  console.log('# 9. AI 全新出卷');
  ev(`settings.endpoint = 'https://api.example.com/v1'; settings.key = 'k'; settings.model = 'm';`);
  const bankBefore = ev('bank.length');
  w.__aiCalls = [];
  w.__aiFail = false;
  w.callChat = async function (msgs) {
    const user = msgs.map(m => m.content || '').join('\n');
    if (w.__aiFail) throw new Error('模拟 API 故障');
    w.__aiCalls.push(user);
    const type = (user.match(/题型：([^\n]+)/) || [])[1] || '';
    const sub = (user.match(/听力子题型：(\w+)/) || [])[1] || 'short_dialogue';
    if (type.includes('单项选择')) return JSON.stringify([{ question: 'Which one?', options: ['x', 'y', 'z', 'w'], answer: 'x', explanation: '', difficulty: 3 }]);
    if (type.includes('阅读理解')) return JSON.stringify([{ level: 'A', title: 'T', passage: 'Passage text for testing.', questions: [
      { question: 'Q1?', options: ['p', 'q', 'r', 's'], answer: 'p', explanation: '' },
      { question: 'Q2?', options: ['p', 'q', 'r', 's'], answer: 'q', explanation: '' }], difficulty: 3 }]);
    if (type.includes('综合填空')) return JSON.stringify([{ passage: 'I ___ an apple and he ___ bananas.', blanks: [
      { options: ['eat', 'eats', 'eating', 'ate'], answer: 'eat', pos: '动词', explanation: '' },
      { options: ['eat', 'eats', 'eating', 'ate'], answer: 'eats', pos: '动词', explanation: '' }], difficulty: 3 }]);
    if (type.includes('动词填空')) return JSON.stringify([{ sentences: [
      { text: 'He ___ (go) home.', answer: 'went', hint: 'go', explanation: '' },
      { text: 'They ___ (be) happy.', answer: 'are', hint: 'be', explanation: '' }], difficulty: 3 }]);
    if (type.includes('听力题')) {
      if (sub === 'long_dialogue') return JSON.stringify([{ subType: 'long_dialogue', script: 'W: Hi\nM: Hello', questions: [{ question: 'LQ?', options: ['a', 'b', 'c'], answer: 'a', explanation: '' }], difficulty: 3 }]);
      return JSON.stringify([{ subType: 'short_dialogue', items: [{ script: 'W: Hi', question: 'SQ?', options: ['a', 'b', 'c'], answer: 'a', explanation: '' }], difficulty: 3 }]);
    }
    if (type.includes('作文')) return JSON.stringify([{ prompt: 'Write about your school.', hints: ['60 words'], sample: 'Sample.', difficulty: 3 }]);
    return JSON.stringify([]);
  };
  ev(`window.callChat = window.callChat;`);
  $('bank-exam-start').click();
  const radioAI = w.document.querySelector('input[name="exam-source"][value="ai"]');
  check('来源切换器存在', !!radioAI);
  radioAI.checked = true;
  radioAI.dispatchEvent(new w.Event('change', { bubbles: true }));
  check('切换到 AI 出卷', ev('exam.source') === 'ai');
  check('AI 板块预览', /AI 生成/.test($('exam-setup').textContent), $('exam-setup').textContent.replace(/\s+/g, ' ').slice(0, 160));
  check('AI 选项可见', !!$('exam-ai-diff') && !!$('exam-ai-topic'));
  check('开始按钮可用', $('exam-begin').disabled === false);
  $('exam-begin').click();
  for (let i = 0; i < 300 && !ev('exam.active'); i++) await new Promise(r => setTimeout(r, 10));
  check('AI 卷已开始', ev('exam.active') === true);
  check('AI 调用 7 次（听力 2 组）', w.__aiCalls.length === 7, w.__aiCalls.length);
  check('6 个板块', ev('exam.sections.length') === 6, ev('exam.sections.map(s=>s.label).join(",")'));
  check('生成 7 道题', ev('exam.paper.length') === 7, ev('exam.paper.length'));
  check('AI 题目未入题库', ev('bank.length') === bankBefore, ev('bank.length'));
  const aiQs = JSON.parse(ev('JSON.stringify(exam.paper.map(r=>r.q))'));
  const aiSubs = aiQs.reduce((n, q) => n + subCount(q), 0);
  check('AI 卷计分小题 ' + aiSubs, expected() === aiSubs, expected());
  answerAll('right');
  $('exam-submit').click();
  const aiScore = ev('exam.stats.right') + '/' + ev('exam.stats.total');
  check('AI 卷满分 ' + aiSubs + '/' + aiSubs, aiScore === aiSubs + '/' + aiSubs, ev('JSON.stringify(exam.stats)'));
  check('报告标注 AI 出卷', /AI 全新出卷/.test($('exam-report').textContent));
  check('报告有入库按钮', !!$('exam-save-bank'));
  $('exam-save-bank').click();
  check('入库 +7 题', ev('bank.length') === bankBefore + 7, ev('bank.length'));
  check('入库按钮已禁用', $('exam-save-bank').disabled === true);
  check('题库列表已刷新', $('bank-list').children.length > 0);

  console.log('# 10. AI 出卷失败回退');
  w.__aiFail = true;
  $('bank-exam-start').click();
  $('exam-begin').click();
  for (let i = 0; i < 300 && ev('exam.generating'); i++) await new Promise(r => setTimeout(r, 10));
  check('失败后未进入考试', ev('exam.active') === false);
  check('状态显示失败', /失败/.test($('exam-gen-status').textContent), $('exam-gen-status').textContent);
  check('状态为 err', $('exam-gen-status').classList.contains('err'));
  check('仍停留在组卷页', $('exam-setup').style.display === 'block');
  w.__aiFail = false;
  ev(`closeExam(true)`);

  console.log('# 11. 快速加句（tab 栏按钮 → 背记册）');
  check('触发按钮存在', !!$('mq-trigger') && /快速加句/.test($('mq-trigger').textContent));
  const mb0 = ev('memBook.length');
  $('mq-trigger').click();
  check('面板打开', $('mq-panel').classList.contains('show') === true);
  check('aria-expanded', $('mq-trigger').getAttribute('aria-expanded') === 'true');
  check('计数显示已有 N 句', $('mq-count').textContent === `已有 ${mb0} 句`, $('mq-count').textContent);
  $('qa-trigger').click();
  check('打开加词时加句面板关闭', $('mq-panel').classList.contains('show') === false && $('qa-panel').classList.contains('show') === true);
  $('qa-trigger').click();
  $('mq-trigger').click();
  check('打开加句时加词面板关闭', $('qa-panel').classList.contains('show') === false && $('mq-panel').classList.contains('show') === true);

  $('mq-text').value = [
    'She has been to Beijing twice. | 去过北京两次',
    'It is important to [protect] the environment.',
    '12345'
  ].join('\n');
  $('mq-add').click();
  for (let i = 0; i < 300 && ev('document.getElementById("mq-add").disabled'); i++) await new Promise(r => setTimeout(r, 10));
  check('加入 2 句', ev('memBook.length') === mb0 + 2, ev('memBook.length'));
  check('状态含加入 2 句', /已加入 2 句/.test($('mq-status').textContent), $('mq-status').textContent);
  check('状态提示 1 行无法挖空', /1 行无法挖空/.test($('mq-status').textContent), $('mq-status').textContent);
  check('状态为 ok', $('mq-status').classList.contains('ok'));
  check('输入框已清空', $('mq-text').value === '');
  const ent = JSON.parse(ev('JSON.stringify(memBook.slice(-2).map(e=>({text:e.text,answers:e.answers,note:e.note,src:e.src})))'));
  check('条目含挖空与答案', ent.every(e => /_+/.test(e.text) && e.answers.length === (e.text.match(/_+/g) || []).length), JSON.stringify(ent));
  check('[word] 指定的词入答案', ent.some(e => e.answers.includes('protect')), JSON.stringify(ent));
  check('中文提示保留', ent.some(e => e.note === '去过北京两次'), JSON.stringify(ent));
  check('来源标记', ent.every(e => e.src === '快速加句'), JSON.stringify(ent));
  check('计数已更新', $('mq-count').textContent === `已有 ${mb0 + 2} 句`, $('mq-count').textContent);

  $('mq-text').value = 'She has been to Beijing twice. | 去过北京两次';
  $('mq-add').click();
  for (let i = 0; i < 300 && ev('document.getElementById("mq-add").disabled'); i++) await new Promise(r => setTimeout(r, 10));
  check('重复句不重复入册', ev('memBook.length') === mb0 + 2, ev('memBook.length'));
  check('状态提示已存在', /1 句已存在/.test($('mq-status').textContent), $('mq-status').textContent);

  check('AI 补提示开关存在', !!$('mq-ai'));
  $('mq-ai').checked = true;
  w.callChat = async function (msgs) {
    const user = msgs.filter(m => m.role === 'user').map(m => m.content).join('\n');
    return JSON.stringify([{ text: user.trim(), note: '这本书我读了三遍。' }]);
  };
  $('mq-text').value = 'I have read this book three times.';
  $('mq-add').click();
  for (let i = 0; i < 300 && ev('document.getElementById("mq-add").disabled'); i++) await new Promise(r => setTimeout(r, 10));
  const last = JSON.parse(ev('JSON.stringify(memBook[memBook.length-1])'));
  check('AI 句已入册', ev('memBook.length') === mb0 + 3, ev('memBook.length'));
  check('AI 补的中文提示', /读了三遍/.test(last.note), JSON.stringify(last));

  ev(`renderMemBook()`);
  check('背记册列表计数同步', $('mb-count').textContent === String(ev('memBook.length')), $('mb-count').textContent);
  check('背记册列表含新句', /Beijing/.test($('mb-list').textContent), $('mb-list').textContent.slice(0, 120));
  w.document.body.click();
  check('面板已关闭', $('mq-panel').classList.contains('show') === false);

  console.log(`\n${pass} passed, ${fail} failed`);
  if (errors.length) { console.log('page errors:'); errors.forEach(e => console.log('  ' + e)); }
  process.exit(fail || errors.length ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
