/* =========================================================
   标签页
   ========================================================= */
$('tabs').addEventListener('click', e => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === btn));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + btn.dataset.tab));
  try { speechSynthesis.cancel(); } catch (err) {}
  stopListening(); stopLoop();
  const tab = btn.dataset.tab;
  if (tab === 'listen' && !listen.current) lNext();
  if (tab === 'dictation' && !dict.current) dNext();
  if (tab === 'stats') renderStats();
  if (tab === 'wrongbook') { renderWrongBook(); renderMemBook(); }
});

/* =========================================================
   快速加词小菜单（tab 栏呼出）
   ========================================================= */
function qaRenderLibs() {
  const sel = $('qa-lib');
  const cur = sel.value;
  sel.innerHTML = libraries.map(l =>
    `<option value="${l.id}">${esc(l.name)} · ${l.words.length} 词</option>`).join('');
  if (cur && libraries.some(l => l.id === cur)) sel.value = cur;
  else if (activeLibId) sel.value = activeLibId;
  const lib = libraries.find(l => l.id === sel.value);
  $('qa-lib-hint').textContent = lib ? `→ ${lib.name}` : '';
}
$('qa-lib').addEventListener('change', () => {
  const lib = libraries.find(l => l.id === $('qa-lib').value);
  $('qa-lib-hint').textContent = lib ? `→ ${lib.name}` : '';
});

function qaToggle(show) {
  const panel = $('qa-panel');
  const next = show == null ? !panel.classList.contains('show') : !!show;
  if (next) { mqToggle(false); qaRenderLibs(); }
  panel.classList.toggle('show', next);
  $('qa-trigger').setAttribute('aria-expanded', String(next));
  if (next) setTimeout(() => $('qa-text').focus(), 30);
}
$('qa-trigger').addEventListener('click', e => { e.stopPropagation(); qaToggle(); });
$('qa-close').addEventListener('click', () => qaToggle(false));
document.addEventListener('click', e => {
  if (e.target.closest('.qa-wrap')) return;
  if ($('qa-panel').classList.contains('show')) qaToggle(false);
  if ($('mq-panel').classList.contains('show')) mqToggle(false);
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if ($('qa-panel').classList.contains('show')) qaToggle(false);
  if ($('mq-panel').classList.contains('show')) mqToggle(false);
});

function qaParseLines(text) {
  const out = [];
  String(text || '').split(/\n+/).forEach(raw => {
    let line = raw.trim().replace(/^\d+[.、)\]]\s*/, '');
    if (!line) return;
    let word = '', meaning = '';
    const m = line.match(/^(.+?)[\t,，;；]\s*(.*)$/);
    if (m && m[2].trim()) { word = m[1].trim(); meaning = m[2].trim(); }
    else {
      const idx = line.search(/[\u4e00-\u9fa5]/);
      if (idx > 0) { word = line.slice(0, idx).trim(); meaning = line.slice(idx).trim(); }
      else word = line;
    }
    if (word) out.push({ word, meaning });
  });
  return out;
}

async function qaAIFill(entries) {
  const need = entries.filter(e => !e.meaning);
  if (!need.length) return entries;
  const sys = '你是英语词汇助手。为给定的英文单词补全简明中文释义、IPA 音标和一个简单英文例句。' +
    '只返回 JSON 数组，不要任何解释。格式：[{"word":"apple","meaning":"苹果","phonetic":"/ˈæpl/","example":"I eat an apple."}]';
  const user = '单词列表：\n' + need.map(e => e.word).join('\n');
  const text = await callChat([
    { role: 'system', content: sys },
    { role: 'user', content: user }
  ], { temperature: 0.3 });
  const arr = extractJSON(text);
  const map = new Map();
  (Array.isArray(arr) ? arr : []).forEach(o => {
    if (o && o.word) map.set(String(o.word).trim().toLowerCase(), o);
  });
  return entries.map(e => {
    if (e.meaning) return e;
    const hit = map.get(e.word.trim().toLowerCase());
    return hit ? {
      word: e.word,
      meaning: String(hit.meaning || '').trim(),
      phonetic: String(hit.phonetic || '').trim(),
      example: String(hit.example || '').trim()
    } : e;
  });
}

$('qa-add').addEventListener('click', async () => {
  const entries0 = qaParseLines($('qa-text').value);
  if (!entries0.length) { $('qa-status').textContent = '请输入至少一个单词'; return; }
  let entries = entries0;
  const libId = $('qa-lib').value;
  const lib = libraries.find(l => l.id === libId);
  if (!lib) { $('qa-status').textContent = '请选择目标词库'; return; }
  const btn = $('qa-add'), status = $('qa-status');
  btn.disabled = true;
  status.className = 'ai-status';
  try {
    if ($('qa-ai').checked && entries.some(e => !e.meaning)) {
      status.textContent = 'AI 补全中…';
      entries = await qaAIFill(entries);
    }
    const have = new Set(lib.words.map(w => w.word.trim().toLowerCase()));
    let added = 0, skipped = 0, noMeaning = 0;
    entries.forEach(e => {
      const word = String(e.word || '').trim();
      const meaning = String(e.meaning || '').trim();
      if (!word) return;
      if (have.has(word.toLowerCase())) { skipped++; return; }
      if (!meaning) { noMeaning++; return; }
      lib.words.push({
        id: uid(), word, meaning,
        phonetic: String(e.phonetic || '').trim(),
        example: String(e.example || '').trim(),
        isKey: false
      });
      have.add(word.toLowerCase());
      added++;
    });
    saveLibraries();
    renderLibSelect(); syncLibSelectors(); renderLibPickers();
    if (lib.id === activeLibId) renderWords();
    const parts = [`已加入 ${added} 个`];
    if (skipped) parts.push(`跳过重复 ${skipped} 个`);
    if (noMeaning) parts.push(`${noMeaning} 个缺释义未加入`);
    status.textContent = parts.join(' · ');
    status.className = 'ai-status ' + (added ? 'ok' : 'err');
    toast(added ? `已向「${lib.name}」加入 ${added} 个单词` : '没有新词加入', added ? 'ok' : 'err');
    if (added) $('qa-text').value = '';
  } catch (err) {
    status.textContent = '失败：' + err.message;
    status.className = 'ai-status err';
  } finally {
    btn.disabled = false;
  }
});

/* =========================================================
   快速加句小菜单（tab 栏呼出，直接添加句子到背记册）
   ========================================================= */
function mqRenderCount() {
  const el = $('mq-count');
  if (el) el.textContent = `已有 ${memBook.length} 句`;
}

function mqToggle(show) {
  const panel = $('mq-panel');
  const next = show == null ? !panel.classList.contains('show') : !!show;
  if (next) { qaToggle(false); mqRenderCount(); }
  panel.classList.toggle('show', next);
  $('mq-trigger').setAttribute('aria-expanded', String(next));
  if (next) setTimeout(() => $('mq-text').focus(), 30);
}
$('mq-trigger').addEventListener('click', e => { e.stopPropagation(); mqToggle(); });
$('mq-close').addEventListener('click', () => mqToggle(false));

/* 行格式：句子 [| 中文提示]，挖空用 [单词] 括起来，否则自动挖一个词 */
function mqParseLines(text) {
  const out = [];
  String(text || '').split(/\n+/).forEach(raw => {
    let line = raw.trim().replace(/^\d+[.、)\]]\s*/, '');
    if (!line) return;
    const parts = line.split(/\s*[|｜]\s*/);
    const body = parts.shift().trim();
    const note = parts.join(' · ').trim();
    if (body) out.push({ raw: body, note });
  });
  return out;
}

function mqBuildEntry(item) {
  let text = String(item.raw || '').trim();
  if (!text) return null;
  const answers = [];
  if (/\[[^\]]+\]/.test(text)) {
    text = text.replace(/\[([^\]]+)\]/g, (m, w) => { const a = String(w).trim(); if (a) answers.push(a); return '___'; });
  } else if (!/_+/.test(text)) {
    const a = autoMask(text, libWordSet());
    if (a) { text = a.text; answers.push(...a.answers); }
  }
  const blanks = (text.match(/_+/g) || []).length;
  if (!blanks || blanks !== answers.length) return null;
  return {
    text: text.replace(/\s+/g, ' ').trim(),
    answers: answers.map(String),
    note: String(item.note || '').trim(),
    src: '快速加句'
  };
}

function mqSolvedText(e) {
  let i = 0;
  return e.text.replace(/_+/g, () => (e.answers || [])[i++] ?? '___');
}

async function mqAIFill(entries) {
  const need = entries.filter(e => !e.note);
  if (!need.length) return entries;
  const sys = '你是英语学习助手。为下列英文句子补一句简明中文提示（翻译或考点、搭配说明）。' +
    '只返回 JSON 数组，不含任何解释。格式：[{"text":"原句","note":"中文提示"}]';
  const user = need.map(mqSolvedText).join('\n');
  const text = await callChat([
    { role: 'system', content: sys },
    { role: 'user', content: user }
  ], { temperature: 0.4 });
  const arr = extractJSON(text);
  const map = new Map();
  (Array.isArray(arr) ? arr : []).forEach(o => {
    if (o && o.text) map.set(String(o.text).trim().toLowerCase(), String(o.note || '').trim());
  });
  return entries.map(e => e.note ? e : Object.assign({}, e, { note: map.get(mqSolvedText(e).toLowerCase()) || '' }));
}

$('mq-add').addEventListener('click', async () => {
  const items = mqParseLines($('mq-text').value);
  const btn = $('mq-add'), status = $('mq-status');
  if (!items.length) { status.textContent = '请输入至少一个句子'; status.className = 'ai-status err'; return; }
  btn.disabled = true;
  status.className = 'ai-status';
  let built = [];
  let bad = 0;
  items.forEach(it => { const e = mqBuildEntry(it); if (e) built.push(e); else bad++; });
  if (!built.length) {
    status.textContent = '没有可挖空的句子 —— 想指定挖哪个词，用 [单词] 括起来';
    status.className = 'ai-status err';
    btn.disabled = false;
    return;
  }
  try {
    if ($('mq-ai').checked && built.some(e => !e.note)) {
      status.textContent = 'AI 生成中文提示中…';
      built = await mqAIFill(built);
    }
    const added = addMemEntries(built, true);
    const dup = built.length - added;
    const parts = [`已加入 ${added} 句`];
    if (bad) parts.push(`${bad} 行无法挖空已跳过`);
    if (dup) parts.push(`${dup} 句已存在`);
    status.textContent = parts.join(' · ');
    status.className = 'ai-status ' + (added ? 'ok' : 'err');
    toast(added ? `已加入背记册 ${added} 句` : (dup ? '这些句子都已在背记册中' : '没有新句子加入'), added ? 'ok' : (dup ? '' : 'err'));
    if (added) { $('mq-text').value = ''; mqRenderCount(); }
  } catch (err) {
    status.textContent = '失败：' + err.message;
    status.className = 'ai-status err';
  } finally {
    btn.disabled = false;
  }
});
