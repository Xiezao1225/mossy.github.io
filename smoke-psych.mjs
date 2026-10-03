/* 彩蛋流程冒烟测试：用最小 DOM/定时器仿真跑通 psych.html 的整条彩蛋流程 */
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PSYCH_HTML = join(dirname(fileURLToPath(import.meta.url)), 'psych.html');
const HTML = fs.readFileSync(PSYCH_HTML, 'utf8');
const CODE = HTML.match(/<script>([\s\S]*?)<\/script>/)[1];

/* ---------------- 虚拟时钟 ---------------- */
let vnow = 0, seq = 0;
const queue = [];
const timerErrors = [];
function schedule(fn, ms, interval) {
  const id = ++seq;
  queue.push({ id, t: vnow + Math.max(0, ms || 0), fn, interval: interval || 0 });
  return id;
}
function unschedule(id) { const i = queue.findIndex(j => j.id === id); if (i >= 0) queue.splice(i, 1); }
globalThis.setTimeout = (fn, ms) => schedule(fn, ms, 0);
globalThis.clearTimeout = unschedule;
globalThis.setInterval = (fn, ms) => schedule(fn, ms, Math.max(1, ms || 1));
globalThis.clearInterval = unschedule;
function tick(ms) {
  const end = vnow + ms;
  for (;;) {
    let best = null;
    for (const j of queue) {
      if (j.t <= end && (!best || j.t < best.t || (j.t === best.t && j.id < best.id))) best = j;
    }
    if (!best) break;
    queue.splice(queue.indexOf(best), 1);
    vnow = best.t;
    if (best.interval) queue.push({ id: best.id, t: vnow + best.interval, fn: best.fn, interval: best.interval });
    try { best.fn(); } catch (e) { timerErrors.push(String((e && e.stack) || e)); }
  }
  vnow = end;
}

/* ---------------- 最小 DOM ---------------- */
function matches(el, sel) {
  if (!el || !el._cls) return false;
  if (sel.charAt(0) === '.') {
    return sel.split('.').filter(Boolean).every(c => el._cls.has(c));
  }
  return el.tagName === sel.toUpperCase();
}
function allDesc(el, out) {
  out = out || [];
  for (const c of el.children) { out.push(c); allDesc(c, out); }
  return out;
}
class El {
  constructor(tag) {
    this.tagName = String(tag || 'div').toUpperCase();
    this.children = []; this.childNodes = [];
    this.style = {}; this._cls = new Set(); this._listeners = {};
    this.parentNode = null; this.disabled = false; this._attrs = {}; this._text = '';
  }
  get classList() {
    const s = this._cls;
    return {
      add: (...c) => c.forEach(x => s.add(x)),
      remove: (...c) => c.forEach(x => s.delete(x)),
      contains: c => s.has(c),
      toggle: c => (s.has(c) ? s.delete(c) : s.add(c))
    };
  }
  get className() { return [...this._cls].join(' '); }
  set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get firstChild() { return this.children[0] || null; }
  get textContent() {
    if (this.children.length) return this.children.map(c => c.textContent).join('');
    return this._text;
  }
  set textContent(v) { this._text = String(v); this.children = []; this.childNodes = []; }
  get innerHTML() { return this._text; }
  set innerHTML(v) { this._text = String(v); this.children = []; this.childNodes = []; }
  appendChild(c) { c.parentNode = this; this.children.push(c); this.childNodes.push(c); return c; }
  removeChild(c) {
    let i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1);
    i = this.childNodes.indexOf(c); if (i >= 0) this.childNodes.splice(i, 1);
    return c;
  }
  insertBefore(n, ref) {
    if (!ref || this.children.indexOf(ref) < 0) return this.appendChild(n);
    const i = this.children.indexOf(ref);
    n.parentNode = this; this.children.splice(i, 0, n); this.childNodes.splice(i, 0, n);
    return n;
  }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  querySelector(sel) { return allDesc(this).find(e => matches(e, sel)) || null; }
  querySelectorAll(sel) { return allDesc(this).filter(e => matches(e, sel)); }
  addEventListener(t, f) { (this._listeners[t] = this._listeners[t] || []).push(f); }
  removeEventListener(t, f) {
    const a = this._listeners[t]; if (!a) return;
    const i = a.indexOf(f); if (i >= 0) a.splice(i, 1);
  }
  dispatch(t, ev) { (this._listeners[t] || []).forEach(f => f(ev || {})); }
  setAttribute(k, v) { this._attrs[k] = v; }
  getAttribute(k) { return this._attrs[k]; }
  focus() {} blur() {} click() { this.dispatch('click', { target: this, preventDefault() {} }); }
  get offsetWidth() { return 100; }
}

const byId = new Map();
function el(id) {
  if (!byId.has(id)) byId.set(id, new El('div'));
  return byId.get(id);
}
function seedDom() {
  const img = new El('img');
  img.setAttribute('src', 'resource/eye.webp');
  el('watchLayer').appendChild(img);
}
function watchSrc() {
  const img = el('watchLayer').querySelector('img');
  return img ? img.getAttribute('src') : '(none)';
}
const docListeners = {};
const doc = {
  title: '',
  body: new El('body'),
  documentElement: new El('html'),
  visibilityState: 'visible',
  getElementById: el,
  createElement: t => new El(t),
  createElementNS: (ns, t) => new El(t),
  createTextNode: t => ({ __text: true, nodeValue: String(t), textContent: String(t), parentNode: null, _cls: null }),
  addEventListener: (t, f) => { (docListeners[t] = docListeners[t] || []).push(f); },
  removeEventListener: () => {},
  querySelector: sel => allDesc(doc.body).find(e => matches(e, sel)) || null,
  querySelectorAll: sel => allDesc(doc.body).filter(e => matches(e, sel))
};
function dispatchDoc(t, ev) { (docListeners[t] || []).forEach(f => f(ev || {})); }

const store = new Map();
const localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k)
};
class FakeAudio {
  constructor(src) { this.src = src; this.currentTime = 0; this.volume = 1; this.playbackRate = 1; audioLog.push(String(src)); }
  play() { return Promise.resolve(); }
}
const audioLog = [];
const winListeners = {};
const windowObj = {
  addEventListener: (t, f) => { (winListeners[t] = winListeners[t] || []).push(f); },
  removeEventListener: () => {},
  close: () => {}
};
globalThis.window = windowObj;
globalThis.document = doc;
globalThis.localStorage = localStorage;
globalThis.location = { hash: '' };
globalThis.Audio = FakeAudio;
globalThis.addEventListener = windowObj.addEventListener;

/* ---------------- 载入脚本 ---------------- */
let bootError = null;
try { eval(CODE); } catch (e) { bootError = String((e && e.stack) || e); }

const errs = [];
function check(name, cond, extra) {
  if (!cond) errs.push('FAIL ' + name + (extra ? ' :: ' + extra : ''));
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  [' + extra + ']' : ''));
}
function click(target) {
  if (!target) return;
  target.dispatch('click', { target, preventDefault() {} });
  if (typeof target.onclick === 'function') target.onclick({ target, preventDefault() {} });
}
function key(k) { dispatchDoc('keydown', { key: k, target: doc.body, preventDefault() {} }); }

function runFlow(useEgg, opts) {
  opts = opts || {};
  const trace = [];
  const stats = { qtexts: [], leftAsks: 0, morphSeen: false, leftOptions: [], scareText: '', climaxText: '',
    finalSeqSeen: false, bwSeen: false, waveSeen: false, waveLines: 0, waveText: '', snowSeen: false,
    slowText: '', flashTexts: [], lockedSeen: false, order: [] };
  if (useEgg) {
    for (const k of 'd3rlord3') key(k);
    check('阶段1 触发后未直接进入信', !el('egg')._cls.has('on'));
    check('阶段1 主界面黑屏闪烁', el('blackFlash')._cls.has('on'));
    tick(1000);
    check('阶段1 黑屏已恢复', !el('blackFlash')._cls.has('on'));
  }
  click(el('startBtn'));
  tick(200);
  for (let g = 0; g < 600; g++) {
    stats.iters = g;
    tick(400);
    if (el('egg')._cls.has('on')) break;
    const qtext = el('qtext').textContent;
    const optBtns = allDesc(el('options')).filter(e => e._cls.has('opt'));
    if (!el('scare')._cls.has('hidden')) stats.scareText += el('scare').textContent;
    if (!el('climax')._cls.has('hidden')) stats.climaxText += el('climax').textContent;
    if (el('finalSeq')._cls.has('on')) {
      stats.finalSeqSeen = true;
      stats.slowText += el('fsSlow').textContent + '|';
      if (doc.body._cls.has('bw')) stats.bwSeen = true;
      if (el('next').disabled === true) stats.lockedSeen = true;
    }
    if (el('fsFlash')._cls.has('on')) {
      const tx = el('fsFlash').textContent;
      if (stats.flashTexts[stats.flashTexts.length - 1] !== tx) stats.flashTexts.push(tx);
    }
    if (el('fsSnow')._cls.has('on')) stats.snowSeen = true;
    let stage = '';
    if (el('fsSnow')._cls.has('on')) stage = 'snow';
    else if (el('fsFlash')._cls.has('on')) stage = 'flash';
    else if (el('finalWaves')._cls.has('on')) stage = 'word';
    else if (el('fsSlow')._cls.has('on')) stage = 'slow';
    else if (el('finalSeq')._cls.has('on')) stage = 'lock';
    if (stage && stats.order[stats.order.length - 1] !== stage) stats.order.push(stage);
    if (el('finalWaves')._cls.has('on')) {
      stats.waveSeen = true;
      if (el('finalWaves').children.length > stats.waveLines) {
        stats.waveLines = el('finalWaves').children.length;
        stats.waveText = el('finalWaves').children[0] ? el('finalWaves').children[0].textContent : '';
      }
    }
    if (qtext.indexOf('你左转了吗') === 0) {
      if (optBtns.map(o => o.textContent).join('/') === '没有/不记得/我不确定/……') stats.leftAsks++;
      if (optBtns.some(o => o.textContent === '有')) stats.morphSeen = true;
    } else if (qtext) {
      stats.qtexts.push(qtext);
    }
    const nx = el('next');
    const quizVisible = !el('quiz')._cls.has('hidden');
    if (opts.stopAtFinal && el('finalSeq')._cls.has('on')) break;
    if (!quizVisible) continue;
    if (nx.disabled !== false) {
      if (optBtns.length) { click(optBtns[0]); }
      continue;
    }
    if (typeof nx.onclick === 'function') { click(nx); continue; }
  }
  stats.trace = trace;
  return stats;
}

/* ================= 1) 普通流程回归 ================= */
if (bootError) { console.log('BOOT ERROR:\n' + bootError); process.exit(1); }
seedDom();
const normalStats = runFlow(false);
const nextEl = el('next');
check('普通流程 收尾为「关闭」按钮', nextEl.textContent === '关闭', 'got=' + nextEl.textContent);
check('普通流程 生成了报告', el('qtext').textContent.indexOf('你改动了') >= 0 || el('qtext').textContent.length > 0);
check('普通流程 未出现碎裂层', !el('crack')._cls.has('on'));
check('普通流程 题面保持原样', normalStats.qtexts.indexOf('上帝是否存在？') >= 0 && normalStats.qtexts.every(t => t.indexOf('黄衣') < 0),
  'samples=' + normalStats.qtexts.length);
check('普通流程 惊吓文字为原版', normalStats.scareText.indexOf('冤冤冤') >= 0 && normalStats.scareText.indexOf('黄衣之王') < 0);
check('普通流程 WAVES 为原版', normalStats.climaxText.indexOf('我不想在这了') >= 0 && normalStats.climaxText.indexOf('不要左转') < 0);
check('普通流程 跳脸图片仍为 eye.webp', watchSrc() === 'resource/eye.webp', watchSrc());
check('普通流程 高潮语音仍为“我不想在这了”', audioLog.indexOf('resource/voice/buxiang.mp3') >= 0);

/* ================= 2) 彩蛋流程（重载一份干净状态） ================= */
for (const k of Object.keys(docListeners)) delete docListeners[k];
for (const k of Object.keys(winListeners)) delete winListeners[k];
byId.clear(); store.clear(); queue.length = 0; vnow = 0; seq = 0;
timerErrors.length = 0;
audioLog.length = 0;
doc.body = new El('body');
seedDom();
let bootError2 = null;
try { eval(CODE); } catch (e) { bootError2 = String((e && e.stack) || e); }
check('第二次装载脚本无异常', !bootError2, bootError2 || '');

const eggStats = runFlow(true);

check('阶段2 异常题面已替换为黄衣之主', eggStats.qtexts.some(t => t.indexOf('黄衣之王是否存在') >= 0) && eggStats.qtexts.every(t => t.indexOf('上帝是否存在') < 0),
  'samples=' + eggStats.qtexts.length);
check('高潮语音已改为 dtl（不再念“我不想在这了”）', audioLog.indexOf('resource/voice/buxiang.mp3') < 0,
  'audio=' + JSON.stringify(audioLog.slice(0, 4)));
check('dtl 使用专属语音文件', audioLog.indexOf('resource/voice/dtl.mp3') >= 0, 'audio=' + JSON.stringify(audioLog.slice(0, 4)));
check('WAVES 文字替换为黄衣主题', eggStats.climaxText.indexOf('不要左转') >= 0 && eggStats.climaxText.indexOf('我不想在这了') < 0,
  'climax=' + eggStats.climaxText.slice(0, 30));
check('跳脸图片已替换为 help.jpg', watchSrc() === 'resource/help.jpg', watchSrc());
check('跳脸使用整屏 help.jpg 变体', el('watchLayer')._cls.has('egg'));

/* ---- 终章 ---- */
const FS_JUMP = [
  '我不知道这个d3rlord3是谁',
  '我觉得至少该弄清楚到底发生了什么，才对的起它',
  '我来了，d3rlord3。',
  '如果我不上，还能是谁呢？……'
];
check('终章 黑白锁屏出现且无法操作', eggStats.finalSeqSeen && eggStats.bwSeen && eggStats.lockedSeen,
  'seq=' + eggStats.finalSeqSeen + ' bw=' + eggStats.bwSeen + ' locked=' + eggStats.lockedSeen);
check('终章 缓慢显示左右两行', eggStats.slowText.indexOf('你真切地存在着') >= 0 &&
  eggStats.slowText.indexOf('你生而独特') >= 0 && eggStats.slowText.indexOf('请莫忘本心') >= 0);
check('终章 四条文字跳脸依次出现', FS_JUMP.every(t => eggStats.flashTexts.indexOf(t) >= 0),
  JSON.stringify(eggStats.flashTexts));
check('终章 出现雪花屏', eggStats.snowSeen);
check('终章 阶段顺序 = 黑白锁屏>雪花屏>黑屏两行>跳脸>最后一词>雪花屏',
  eggStats.order.join('>') === 'lock>snow>slow>flash>word>snow', 'order=' + eggStats.order.join('>'));
check('终章 最后一词直接显示（单行，不再连打）', eggStats.waveSeen && eggStats.waveText === '我知道一切。' && eggStats.waveLines === 1,
  'lines=' + eggStats.waveLines + ' word=' + eggStats.waveText);
check('终章结束后仍进入信界面', el('egg')._cls.has('on') && !el('finalSeq')._cls.has('on') && !doc.body._cls.has('bw'));
check('staticThenScare 文字替换为黄衣主题', eggStats.scareText.indexOf('黄衣之王') >= 0 && eggStats.scareText.indexOf('冤冤冤') < 0,
  'scare=' + eggStats.scareText.slice(0, 40));
check('阶段3 问了三次「你左转了吗」', eggStats.leftAsks === 3, 'asks=' + eggStats.leftAsks);
check('阶段3 悬浮选项变为「有」', eggStats.morphSeen);
check('阶段3 色调切换 class 生效', doc.body._cls.has('kiy-final'));
check('阶段3 碎裂层已开启', el('crack')._cls.has('on'));
const crackCount = el('crackSvg').children.length;
check('阶段3 生成了裂缝路径', crackCount > 10, 'paths=' + crackCount);
const shownCracks = allDesc(el('crackSvg')).filter(p => p._cls.has('on')).length;
check('阶段3 碎裂已完全展开', shownCracks > 0 && shownCracks >= crackCount - 1, 'shown=' + shownCracks + '/' + crackCount);
check('阶段4 进入信界面', el('egg')._cls.has('on'));

tick(40000);
const letterText = el('eggText').textContent;
check('阶段4 信件已打出', letterText.indexOf('如果你读到这封信') >= 0, letterText.slice(0, 40));
check('阶段4 信件含继续往前走段', letterText.indexOf('岔路口') >= 0);

/* 反复横跳检测 */
const seenFwd = new Set();
const seenCns = new Set();
for (let i = 0; i < 30; i++) {
  tick(300);
  const t = el('eggText').textContent;
  if (t.indexOf('继续往前走') >= 0) seenFwd.add('cn-fwd');
  if (t.indexOf('不要左转') >= 0) seenCns.add('cn-alt');
  if (t.indexOf('Keep going forward.') >= 0) seenFwd.add('en-fwd');
  if (t.indexOf("Don't turn left.") >= 0) seenCns.add('en-alt');
}
check('阶段4 中文行横跳（继续往前走）', seenFwd.has('cn-fwd'));
check('阶段4 中文行横跳（不要左转）', seenCns.has('cn-alt'));
check('阶段4 英文行横跳（Keep going forward.）', seenFwd.has('en-fwd'));
check('阶段4 英文行横跳（Don\'t turn left.）', seenCns.has('en-alt'));

/* Esc 关闭 → 回到标题 */
key('Escape');
check('关闭彩蛋后回到标题界面', !el('egg')._cls.has('on') && !el('consent')._cls.has('hidden'));
check('关闭后色调还原', !doc.body._cls.has('kiy-final'));
check('关闭后碎裂层隐藏', !el('crack')._cls.has('on'));
check('关闭后可再次触发（hasInteracted 复位）', !el('startBtn').disabled);

/* ================= 3) 终章期间 Esc 可退出 ================= */
for (const k of Object.keys(docListeners)) delete docListeners[k];
for (const k of Object.keys(winListeners)) delete winListeners[k];
byId.clear(); store.clear(); queue.length = 0; vnow = 0; seq = 0;
timerErrors.length = 0; audioLog.length = 0;
doc.body = new El('body');
seedDom();
let bootError3 = null;
try { eval(CODE); } catch (e) { bootError3 = String((e && e.stack) || e); }
check('第三次装载脚本无异常', !bootError3, bootError3 || '');
const s3 = runFlow(true, { stopAtFinal: true });
check('第三次 已进入终章', s3.finalSeqSeen && el('finalSeq')._cls.has('on'),
  'seq=' + s3.finalSeqSeen + ' iters=' + s3.iters + ' left=' + s3.leftAsks + ' q=' + s3.qtexts.length +
  ' eggOn=' + el('egg')._cls.has('on') + ' crack=' + el('crack')._cls.has('on') +
  ' kiyRun=' + (doc.body._cls.has('kiy-final')) + ' next=' + el('next').textContent);
key('Escape');
check('终章期间 Esc 可退回标题', !el('finalSeq')._cls.has('on') && !doc.body._cls.has('bw') &&
  !el('egg')._cls.has('on') && !el('consent')._cls.has('hidden'));

/* ================= 结论 ================= */
console.log('\n--- timer errors (' + timerErrors.length + ') ---');
timerErrors.slice(0, 8).forEach(e => console.log(e.split('\n').slice(0, 3).join(' | ')));
console.log('\n--- assertions failed: ' + errs.length + ' ---');
errs.forEach(e => console.log(e));
process.exit(errs.length || timerErrors.length ? 1 : 0);
