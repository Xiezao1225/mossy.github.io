/* =========================================================
   AI 出题
   ========================================================= */
let aiGenerated = [];
let aiShowAnswers = false;

$('ai-type').addEventListener('change', e => {
  const t = e.target.value;
  $('ai-reading-level-wrap').style.display = t === 'reading' ? 'block' : 'none';
  $('ai-listening-sub-wrap').style.display = t === 'listening' ? 'block' : 'none';
});

/* ---- 出题：所选词库（可多选）词汇收集 ---- */
const AI_VOCAB_LIMIT = 200;

function getAIVocabSelection(prefix) {
  prefix = prefix || 'ai';
  const keyOnly = pickerKeyOnly(prefix);
  const words = [];
  const libNames = [];
  const selSet = pickerSelSet(prefix);
  libraries.forEach(lib => {
    if (!selSet.has(lib.id)) return;
    libNames.push(lib.name);
    lib.words.forEach(w => {
      if (keyOnly && !w.isKey && !lib.isKey) return;
      words.push(w);
    });
  });
  const onlyBox = $(prefix + '-lib-only');
  return { words, libNames, strict: !!(onlyBox && onlyBox.checked) };
}

function buildVocabBlock(prefix) {
  const { words, libNames, strict } = getAIVocabSelection(prefix);
  if (!words.length) return '';
  const shown = words.slice(0, AI_VOCAB_LIMIT);
  const list = shown.map(w => `${w.word}${w.meaning ? `（${w.meaning}）` : ''}`).join('；');
  let block = `- 词汇来源：已选 ${libNames.length} 个词库（${libNames.join('、')}），共 ${words.length} 个单词\n`;
  block += `- 必须使用的词汇范围${words.length > shown.length ? `（下列为前 ${shown.length} 个）` : ''}：${list}\n`;
  block += strict
    ? '- 严格限定：题干、选项与答案只能使用上面列出的单词（必要的功能词如冠词、介词、代词、连词、助动词可例外），不要出现范围之外的实词。\n'
    : '- 请尽量围绕上述单词命题，优先考查这些词；必要时可少量补充其他基础词。\n';
  return block;
}

/* 各题型必须落到 JSON 里的字段要求（写进用户消息，不受已保存的自定义提示词影响） */
function buildFieldRules(type) {
  let out = '';
  if (['choice', 'reading', 'cloze', 'verb', 'listening', 'seven', 'fillgap', 'readanswer'].includes(type)) {
    out += `- 每道小题（或每道题）必须提供 point 字段：该题考查的语法/知识点，简短中文，如「一般过去时」「宾语从句」「固定搭配」「词义辨析」；若无明显考点写「综合」。\n`;
  }
  if (['choice', 'reading', 'cloze', 'listening'].includes(type)) {
    out += `- 正确答案的选项位置（A/B/C/D）请尽量均匀分散，避免连续多题正确答案落在同一字母。\n`;
  }
  if (type === 'seven') {
    out += `- passage 中 ___ 的数量必须等于 blanks 数量（5 个）。
- 每个空必须有 7 个选项（A-G：5 个入文 + 2 个干扰），同一题内所有 blank 的 options 内容与顺序完全一致。
- answer 必须与该空 options 中的某一项完全一致；正确答案尽量分散在 A-G 中，不要总落在靠前的字母。
`;
  }
  if (type === 'fillgap') {
    out += `- passage 中 ___ 的数量必须等于 blanks 数量（建议 10 个）。
- 不要给出 options；每个空必须有 answer（单词）、hint（answer 的首字母，小写）与 pos。
- 学生会看到首字母提示后自己填写，answer 在语境中应唯一。
`;
  }
  if (type === 'readanswer') {
    out += `- questions 中不要给 options；每题必须有 question（英文提问）、answer（英文参考答案，可用字符串数组给出多种可接受写法）与 explanation（中文）。
- 答案应简明，避免整段照抄原文。
`;
  }
  if (type === 'cloze' || type === 'fillgap') {
    out += `- 每个空必须给出 pos 字段：该空答案的词性，取值只能是 名词 / 动词 / 形容词 / 副词 / 数词 / 冠词 / 代词 / 介词 / 连词。
- 如果该空答案是代词、介词或连词，pos 必须为空字符串 ""（这三类不做提示）。
- pos 会在学生自由填词（非四选一）时显示成「（名词）」这样的提示，请务必判断准确，避免同一个空出现多种可接受答案。
- 无论是否给出选项，每个空都必须有 answer 与 pos。
`;
  }
  return out;
}

function buildPromptForType(type, topic, difficulty, count, level, listeningSub, vocabPrefix) {
  const sys = settings.prompts[type];
  const typeMap = {
    choice:'单项选择', reading:'阅读理解', cloze:'完形填空', verb:'动词填空', listening:'听力题', writing:'作文',
    seven:'阅读七选五（七选五 / 六选五）', fillgap:'短文填空（首字母 / 语境填词）', readanswer:'阅读表达（根据文章回答问题）'
  };
  const diffDesc = { 1:'入门（小学）', 2:'简单（初中）', 3:'中等（高中）', 4:'较难（四级）', 5:'困难（六级/雅思）' }[difficulty] || '中等';
  const unit = { reading:'篇', seven:'篇', cloze:'篇', fillgap:'篇', readanswer:'篇', writing:'篇', verb:'篇' }[type] || '道';
  let extra = '';
  if (type === 'reading') extra = `- 阅读级别：${level || 'A'} 级\n`;
  if (type === 'seven') extra = `- 每篇含 5 个空、7 个备选句子（A-G）\n`;
  if (type === 'fillgap') extra = `- 每篇含 10 个空，只给首字母提示，不给选项\n`;
  if (type === 'readanswer') extra = `- 每篇含 3-4 个问题\n`;
  if (type === 'listening') {
    const subMap = {
      sentence:'sentence（听句子选答语，5个独立句子各配1道ABC应答选择）',
      short_dialogue:'short_dialogue（短对话问答，5组）',
      long_dialogue:'long_dialogue（长对话理解，3-5小题）',
      table:'table（听力填表）'
    };
    extra = `- 听力子题型：${subMap[listeningSub] || 'short_dialogue'}\n`;
    if (listeningSub === 'sentence') {
      extra += `- 子题型格式：返回 1 道题，subType 必须为 "sentence"，含 items 数组；每项含 script（听到的句子原文）、question（写「听句子，选出正确的应答语。」）、options（3 个应答语）、answer（正确应答）、explanation（中文）。题目结构与 short_dialogue 相同，只是 script 为独立句子而非对话。\n`;
    }
  }
  const vocab = buildVocabBlock(vocabPrefix);
  const rules = buildFieldRules(type);
  const user = `要求：
- 题型：${typeMap[type] || type}
- 主题：${topic || '日常通用'}
- 难度：${diffDesc}（${difficulty} 星）
- 数量：${count} ${unit}
${extra}${vocab}${rules}
请严格按系统消息中的 JSON 格式返回，不要包含任何 Markdown 代码块或额外解释。`;
  return { sys, user };
}

/* 生成一类题目：返回规范化后的题目数组（AI 出题页与整卷模考共用） */
async function generateQuestions(type, opts) {
  opts = opts || {};
  const difficulty = clamp(parseInt(opts.difficulty) || 3, 1, 5);
  const count = clamp(parseInt(opts.count) || 3, 1, 15);
  const { sys, user: baseUser } = buildPromptForType(type, opts.topic, difficulty, count, opts.level, opts.listeningSub, opts.vocabPrefix);
  const user = baseUser + (opts.extra ? String(opts.extra) : '');
  const text = await callChat([{ role: 'system', content: sys }, { role: 'user', content: user }], { temperature: settings.temperature });
  let parsed = extractJSON(text);
  if (!Array.isArray(parsed)) {
    if (parsed && Array.isArray(parsed.questions)) parsed = parsed.questions;
    else if (parsed && typeof parsed === 'object') parsed = [parsed];
  }
  if (!Array.isArray(parsed)) throw new Error('返回不是数组');
  const DATA_KIND = { seven: 'cloze', fillgap: 'cloze', readanswer: 'reading' };
  const list = parsed.map(item => {
    if (item) {
      item.type = DATA_KIND[type] || item.type || type;
      if (type === 'seven') item.seven = true;
      if (type === 'fillgap') item.noOptions = true;
      if (type === 'readanswer') item.mode = 'open';
      if (item.difficulty == null) item.difficulty = difficulty;
      if (type === 'listening' && !item.subType) item.subType = opts.listeningSub;
    }
    return normalizeQuestion(item);
  }).filter(Boolean);
  if (!list.length) throw new Error('AI 返回的题目无法解析，请检查提示词或换模型重试');
  if (type !== 'seven') spreadAnswerLetters(list);
  return list;
}

$('ai-gen').addEventListener('click', async () => {
  const type = $('ai-type').value;
  const topic = $('ai-topic').value.trim();
  const difficulty = clamp(parseInt($('ai-diff').value) || 3, 1, 5);
  const count = clamp(parseInt($('ai-count').value) || 3, 1, 10);
  const level = $('ai-reading-level').value;
  const listeningSub = $('ai-listening-sub').value;

  if (!settings.endpoint || !settings.key || !settings.model) {
    toast('请先在「设置」中配置 API', 'err');
    $('tabs').querySelector('[data-tab="settings"]').click();
    return;
  }

  const btn = $('ai-gen');
  btn.disabled = true; btn.textContent = '生成中…';
  $('ai-status').textContent = '';
  $('ai-status').className = 'ai-status';
  $('ai-result-card').style.display = 'block';
  $('ai-questions').innerHTML = '<div class="ai-loading">AI 出题中<span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
  aiGenerated = [];
  aiShowAnswers = false;

  try {
    const list = await generateQuestions(type, { topic, difficulty, count, level, listeningSub });

    aiGenerated = list;
    renderAIQuestions(list);
    $('ai-status').textContent = `已生成 ${list.length} 道题（答案已遮盖）`;
    $('ai-status').className = 'ai-status ok';
    toast(`已生成 ${list.length} 道题`, 'ok');
  } catch (err) {
    $('ai-questions').innerHTML = `<div class="ai-error"><b>生成失败：</b><br>${esc(err.message)}</div>`;
    $('ai-status').textContent = '生成失败';
    $('ai-status').className = 'ai-status err';
  } finally {
    btn.disabled = false; btn.textContent = '生成题目';
  }
});

function maskAnswer(text) {
  return `<span class="answer-mask" title="点击显示">${esc(text)}</span>`;
}

function renderAIQuestions(list) {
  const box = $('ai-questions');
  box.innerHTML = list.map((q) => {
    let inner = '';
    if (q.type === 'choice') {
      inner = `<p class="q-text">${esc(q.question)}</p>
        <div class="q-options">${q.options.map((o,j)=>`<button class="q-option" disabled>${String.fromCharCode(65+j)}. ${esc(o)}</button>`).join('')}</div>
        <div class="explain-box" style="margin-top:12px"><div class="head">答案</div>${maskAnswer(q.answer)}${q.explanation ? '<div style="margin-top:8px">' + maskAnswer(q.explanation) + '</div>' : ''}
        ${q.word ? `<div style="margin-top:8px"><b style="font-family:var(--serif)">${esc(q.word)}</b> ${esc(q.phonetic||'')} —— ${esc(q.meaning||'')}</div>` : ''}</div>`;
    } else if (q.type === 'reading') {
      inner = `<h3 style="font-family:var(--serif);margin:0 0 10px">${esc(q.title)}</h3>
        <div class="passage">${esc(q.passage)}</div>
        ${q.questions.map((sq,si)=>`<div class="sub-q"><p class="sub-q-text"><span class="sub-q-head">Q${si+1}.</span>${esc(sq.question)}</p>
          ${q.mode === 'open'
            ? `<div class="explain-box" style="margin-top:10px">参考答案：${maskAnswer(answerTextOf(sq.answer))}${sq.explanation?' · '+maskAnswer(sq.explanation):''}</div>`
            : `<div class="q-options">${(sq.options||[]).map((o,j)=>`<button class="q-option" disabled>${String.fromCharCode(65+j)}. ${esc(o)}</button>`).join('')}</div>
          <div class="explain-box" style="margin-top:10px">答案：${maskAnswer(sq.answer)}${sq.explanation?' · '+maskAnswer(sq.explanation):''}</div>`}
        </div>`).join('')}`;
    } else if (q.type === 'cloze') {
      let t = esc(q.passage); let k = 0;
      t = t.replace(/___+/g, () => `<span class="blank-mark">[${++k}]</span>`);
      inner = `<div class="passage">${t}</div>
        ${q.blanks.map((b,bi)=>`<div class="blank-row"><div class="blank-no">[${bi+1}]</div>
          ${Array.isArray(b.options) && b.options.length >= 2
            ? `<div class="blank-opts">${b.options.map((o,j)=>`<button class="blank-opt" disabled>${String.fromCharCode(65+j)}. ${esc(o)}</button>`).join('')}</div>`
            : `<div class="muted small">${b.pos ? `<span class="pos-hint">（${esc(b.pos)}）</span>` : ''}答案：${maskAnswer(b.answer)}</div>`
          }
        </div>`).join('')}
        <div class="explain-box" style="margin-top:12px"><div class="head">答案</div>${q.blanks.map((b,i)=>`[${i+1}] ${maskAnswer(b.answer)}`).join('　')}</div>`;
    } else if (q.type === 'verb') {
      inner = q.sentences.map((s,i)=>`<div class="verb-sentence">
        <div class="sent"><span class="label-num">${i+1}.</span>${esc(s.text)}</div>
        <div class="result-line">答案：${maskAnswer(s.answer)}${s.explanation?'　'+maskAnswer(s.explanation):''}</div>
      </div>`).join('');
    } else if (q.type === 'listening') {
      inner = `<div class="listening-prompt"><b>📢 说明：</b>${esc(q.instructions || '')}${q.prepTime?` · 建议读题时间 ${q.prepTime}s`:''}</div>`;
      if (q.subType === 'short_dialogue' || q.subType === 'sentence') {
        inner += q.items.map((it, i) => `
          <div class="listening-item">
            <div class="listening-item-head"><span class="num">${i+1}</span><span>${q.subType === 'sentence' ? '句子' : '短对话'}</span></div>
            ${q.subType === 'sentence' ? '' : `<p class="sub-q-text">${esc(it.question)}</p>`}
            <div class="q-options">${it.options.map((o,j)=>`<button class="q-option" disabled>${String.fromCharCode(65+j)}. ${esc(o)}</button>`).join('')}</div>
            <div class="explain-box" style="margin-top:10px">答案：${maskAnswer(it.answer)}${it.explanation?' · '+maskAnswer(it.explanation):''}</div>
          </div>`).join('');
      } else if (q.subType === 'long_dialogue') {
        inner += `<div class="listening-script">${esc(q.script)}</div>`;
        inner += q.questions.map((sq, i) => `
          <div class="sub-q">
            <p class="sub-q-text"><span class="sub-q-head">Q${i+1}.</span>${esc(sq.question)}</p>
            <div class="q-options">${sq.options.map((o,j)=>`<button class="q-option" disabled>${String.fromCharCode(65+j)}. ${esc(o)}</button>`).join('')}</div>
            <div class="explain-box" style="margin-top:10px">答案：${maskAnswer(sq.answer)}${sq.explanation?' · '+maskAnswer(sq.explanation):''}</div>
          </div>`).join('');
      } else if (q.subType === 'table') {
        inner += `<div class="listening-script">${esc(q.script)}</div>`;
        inner += `<table class="listening-table"><thead><tr>${q.columns.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead>
          <tbody>${q.rows.map((row,ri)=>`<tr>${q.columns.map((_,ci)=>{
            const blank = q.blanks.find(b=>b.row===ri&&b.col===ci);
            return blank ? `<td>${maskAnswer(blank.answer)}</td>` : `<td>${esc(row[ci]||'')}</td>`;
          }).join('')}</tr>`).join('')}</tbody></table>`;
      }
    } else if (q.type === 'writing') {
      inner = `<p class="writing-prompt">${esc(q.prompt)}</p>
        ${q.hints.length?`<ul class="writing-hints">${q.hints.map(h=>`<li>${esc(h)}</li>`).join('')}</ul>`:''}
        ${q.sample?`<div class="explain-box" style="margin-top:12px"><div class="head">参考范文</div>${maskAnswer(q.sample)}</div>`:''}`;
    }
    return `<div class="q-card" style="margin-bottom:14px">
      <div class="q-meta">
        <span class="tag accent">${esc(kindLabel(q))}</span>
        ${q.subType ? `<span class="tag blue">${listeningSubLabel(q.subType)}</span>` : ''}
        <span class="tag">${starLabel(q.difficulty)}</span>
        <button class="reveal-all-btn" data-reveal-q="${q.id}">👁 显示答案</button>
      </div>
      ${inner}
    </div>`;
  }).join('');

  // 绑定答案点击显示
  box.querySelectorAll('.answer-mask').forEach(el => {
    el.addEventListener('click', () => {
      el.classList.toggle('revealed');
    });
  });

  // 绑定"显示全部答案"按钮
  box.querySelectorAll('button[data-reveal-q]').forEach(btn => {
    btn.addEventListener('click', () => {
      const qid = btn.dataset.revealQ;
      const card = btn.closest('.q-card');
      if (!card) return;
      const masks = card.querySelectorAll('.answer-mask');
      const anyHidden = [...masks].some(m => !m.classList.contains('revealed'));
      masks.forEach(m => m.classList.toggle('revealed', anyHidden));
      btn.textContent = anyHidden ? '🙈 隐藏答案' : '👁 显示答案';
    });
  });
}

$('ai-clear').addEventListener('click', () => {
  aiGenerated = [];
  $('ai-result-card').style.display = 'none';
  $('ai-questions').innerHTML = '';
  $('ai-status').textContent = '';
});

$('ai-add-to-bank').addEventListener('click', () => {
  if (!aiGenerated.length) { toast('还没有生成题目', 'err'); return; }
  const existCount = bank.length;
  aiGenerated.forEach(q => {
    const sig = signature(q);
    if (bank.some(b => signature(b) === sig)) return;
    bank.push(q);
  });
  const added = bank.length - existCount;
  saveBank(); renderBankList();
  toast(`已加入题库：${added} 道新题`, added ? 'ok' : 'err');
});

$('ai-practice-now').addEventListener('click', () => {
  if (!aiGenerated.length) { toast('还没有生成题目', 'err'); return; }
  practice.list = aiGenerated.slice();
  practice.pos = 0;
  practice.right = 0;
  practice.state = {};
  $('tabs').querySelector('[data-tab="bank"]').click();
  $('bank-exam').style.display = 'none';
  $('bank-practice').style.display = 'block';
  $('bank-list-card').style.display = 'none';
  renderPractice();
});

$('ai-extract-words').addEventListener('click', () => {
  if (!aiGenerated.length) { toast('还没有生成题目', 'err'); return; }
  const targetLibId = $('ai-target-lib').value;
  const target = libraries.find(l => l.id === targetLibId);
  if (!target) { toast('目标词库不存在', 'err'); return; }

  const markKey = $('ai-mark-key').checked;
  const candidates = [];
  const seen = new Set();
  aiGenerated.forEach(q => {
    if (q.word && q.meaning) {
      const key = q.word.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push({ word: q.word, meaning: q.meaning, phonetic: q.phonetic || '', example: q.example || '' });
    }
  });

  if (!candidates.length) {
    toast('生成的题目中没有可提取的单词（需带 word 和 meaning 字段）', 'err');
    return;
  }

  let added = 0, skipped = 0;
  candidates.forEach(c => {
    const w = String(c.word).trim();
    const m = String(c.meaning).trim();
    if (!w || !m) { skipped++; return; }
    if (target.words.some(x => x.word.toLowerCase() === w.toLowerCase())) { skipped++; return; }
    target.words.push({
      id: uid(), word: w, meaning: m,
      phonetic: String(c.phonetic||'').trim(),
      example: String(c.example||'').trim(),
      isKey: markKey
    });
    added++;
  });

  saveLibraries();
  if (target.id === activeLibId) renderWords();
  else { renderLibSelect(); syncLibSelectors(); renderLibPickers(); }
  toast(`提取到「${target.name}」：新增 ${added} 个${skipped ? `，跳过 ${skipped} 个` : ''}`, added ? 'ok' : 'err');
});

function signature(q) {
  if (q.type === 'choice') return 'c:' + (q.question || '').slice(0, 60);
  if (q.type === 'reading') return 'r:' + (q.title || '').slice(0, 60);
  if (q.type === 'cloze') return 'z:' + (q.passage || '').slice(0, 60);
  if (q.type === 'verb') return 'v:' + (q.sentences?.[0]?.text || '').slice(0, 60);
  if (q.type === 'listening') return 'l:' + q.subType + ':' + (q.script || q.items?.[0]?.script || q.title || '').slice(0, 50);
  if (q.type === 'writing') return 'w:' + (q.prompt || '').slice(0, 60);
  return 'x:' + JSON.stringify(q).slice(0, 60);
}
