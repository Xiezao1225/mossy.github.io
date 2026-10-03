/* ---- 选择题渲染 ---- */
function renderChoice(q) {
  return `
    <div class="q-card">
      <div class="q-meta"><span class="tag accent">单项选择</span><span class="tag">难度 ${starLabel(q.difficulty)}</span></div>
      <p class="q-text">${esc(q.question)}</p>
      <div class="q-options" data-qtype="choice">
        ${q.options.map((o, i) => `<button class="q-option" data-oi="${i}" data-val="${esc(o)}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join('')}
      </div>
      <div class="q-result-area"></div>
    </div>`;
}

/* ---- 阅读理解 / 阅读表达渲染 ---- */
function renderReading(q) {
  if (q.mode === 'open') return renderReadingOpen(q);
  return `
    <div class="q-card">
      <div class="q-meta">
        <span class="tag accent">阅读理解</span>
        <span class="tag blue">${esc(q.level)} 级</span>
        <span class="tag">难度 ${starLabel(q.difficulty)}</span>
      </div>
      <h3 style="font-family:var(--serif);font-size:17px;margin:0 0 12px;font-weight:600">${esc(q.title)}</h3>
      <div class="passage" data-hl-zone="${esc((q.id || 'q') + ':reading')}">${esc(q.passage)}</div>
      ${q.questions.map((sq, qi) => `
        <div class="sub-q" data-sidx="${qi}">
          <p class="sub-q-text"><span class="sub-q-head">Q${qi+1}.</span>${esc(sq.question)}</p>
          <div class="q-options" data-qtype="reading" data-sidx="${qi}">
            ${sq.options.map((o, i) => `<button class="q-option" data-oi="${i}" data-sidx="${qi}" data-val="${esc(o)}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join('')}
          </div>
          <div class="sub-result" data-sidx="${qi}" style="margin-top:10px"></div>
        </div>`).join('')}
      <div class="q-result-area"></div>
    </div>`;
}

/* ---- 阅读表达（根据文章回答问题）渲染 ---- */
function renderReadingOpen(q) {
  return `
    <div class="q-card">
      <div class="q-meta">
        <span class="tag accent">阅读表达</span>
        <span class="tag blue">回答问题</span>
        <span class="tag">难度 ${starLabel(q.difficulty)}</span>
        <span class="tag">共 ${q.questions.length} 问</span>
      </div>
      <h3 style="font-family:var(--serif);font-size:17px;margin:0 0 12px;font-weight:600">${esc(q.title || '阅读表达')}</h3>
      <div class="passage" data-hl-zone="${esc((q.id || 'q') + ':readanswer')}">${esc(q.passage)}</div>
      ${q.questions.map((sq, qi) => `
        <div class="sub-q" data-sidx="${qi}">
          <p class="sub-q-text"><span class="sub-q-head">Q${qi+1}.</span>${esc(sq.question)}</p>
          <input class="ra-input" type="text" data-sidx="${qi}" placeholder="用英文回答…" autocomplete="off" spellcheck="false">
          <div class="sub-result" data-sidx="${qi}" style="margin-top:10px"></div>
        </div>`).join('')}
      <div class="q-result-area"></div>
    </div>`;
}

/* ---- 综合填空渲染（支持四选一 / 自由填词） ---- */
function renderCloze(q, ctx) {
  ctx = ctx || {};
  const locked = !!ctx.locked;
  const kind = qKind(q);
  const isSeven = kind === 'seven';
  const useOptions = (ctx.useOptions !== undefined ? ctx.useOptions : practice.state.useOptions) !== false;
  const allHaveOptions = q.blanks.every(b => Array.isArray(b.options) && b.options.length >= 2);

  let text = esc(q.passage);
  let idx = 0;
  if (useOptions && allHaveOptions) {
    text = text.replace(/___+/g, () => {
      const n = idx++;
      return `<span class="blank-mark" data-bidx="${n}">[${n+1}]</span>`;
    });
  } else {
    text = text.replace(/___+/g, () => {
      const n = idx++;
      const b = q.blanks[n] || {};
      const pos = normalizePos(b.pos);
      const posTag = pos ? `<span class="pos-hint" title="该空应填${pos}">（${esc(pos)}）</span>` : '';
      const hintTag = b.hint ? `<span class="hint-word" title="提示">${esc(b.hint)}</span>` : '';
      return `${hintTag}<input class="inline-input" type="text" data-cidx="${n}" placeholder="${n+1}" autocomplete="off" spellcheck="false">${posTag}`;
    });
  }

  const toolbar = locked
    ? `<div class="cloze-toolbar"><span class="muted">${allHaveOptions
        ? (isSeven ? '考试模式：每空从 A-G 选项中选择句子' : '考试模式：每空从选项中选择')
        : '考试模式：此篇未提供选项，请自己填写单词'}</span></div>`
    : `
    <div class="cloze-toolbar">
      <label class="switch-inline" style="margin:0;padding:8px 12px">
        <input type="checkbox" id="cloze-use-options"${useOptions && allHaveOptions ? ' checked' : ''}${allHaveOptions ? '' : ' disabled'}>
        <span>${isSeven ? '选择句子模式' : '四选一模式'}</span>
      </label>
      <span class="muted">
        ${allHaveOptions
          ? (useOptions ? (isSeven ? '每个空从 A-G 的句子中选择' : '每个空从选项中选择') : '每个空自己填写单词')
          : '此篇未提供选项，只能自由填词'}
      </span>
    </div>`;

  let rows = '';
  if (useOptions && allHaveOptions) {
    rows = q.blanks.map((b, i) => `
      <div class="blank-row" data-bidx="${i}">
        <div class="blank-no">[${i+1}]</div>
        <div class="blank-opts" data-qtype="cloze" data-bidx="${i}">
          ${b.options.map((o, j) => `<button class="blank-opt" data-oi="${j}" data-bidx="${i}" data-val="${esc(o)}">${String.fromCharCode(65+j)}. ${esc(o)}</button>`).join('')}
        </div>
      </div>`).join('');
  }

  return `
    <div class="q-card">
      <div class="q-meta">
        <span class="tag accent">${esc(kindLabel(q))}</span>
        <span class="tag">难度 ${starLabel(q.difficulty)}</span>
        <span class="tag">共 ${q.blanks.length} 空</span>
      </div>
      ${toolbar}
      <div class="passage" data-hl-zone="${esc((q.id || 'q') + ':cloze')}">${text}</div>
      ${rows ? `<div style="margin-top:14px">${rows}</div>` : ''}
      <div class="q-result-area"></div>
    </div>`;
}

/* ---- 动词填空渲染（支持四选一 / 自由填词） ---- */
function renderVerb(q, ctx) {
  ctx = ctx || {};
  const locked = !!ctx.locked;
  const useOptions = (ctx.useOptionsVerb !== undefined ? ctx.useOptionsVerb : practice.state.useOptionsVerb) !== false;
  const allHaveOptions = q.sentences.every(s => Array.isArray(s.options) && s.options.length >= 2);

  const toolbar = locked
    ? `<div class="cloze-toolbar"><span class="muted">${allHaveOptions ? '考试模式：每空从 ABCD 中选择动词形式' : '考试模式：此篇未提供选项，请自己填写动词形式'}</span></div>`
    : `
    <div class="cloze-toolbar">
      <label class="switch-inline" style="margin:0;padding:8px 12px">
        <input type="checkbox" id="verb-use-options"${useOptions && allHaveOptions ? ' checked' : ''}${allHaveOptions ? '' : ' disabled'}>
        <span>四选一模式</span>
      </label>
      <span class="muted">
        ${allHaveOptions
          ? (useOptions ? '每个空从 ABCD 中选择' : '每个空自己填写动词形式')
          : '此篇未提供选项，只能自由填词'}
      </span>
    </div>`;

  const html = q.sentences.map((s, i) => {
    const parts = s.text.split('___');
    let inner = esc(parts[0] || '');
    for (let k = 1; k < parts.length; k++) {
      if (useOptions && allHaveOptions) {
        // 选项模式
        inner += `<span class="inline-input" data-vidx="${i}" style="border-bottom-color:var(--blue);color:var(--blue)">[${i+1}]</span>`;
      } else {
        const hint = s.hint ? `<span class="hint-word"> (${esc(s.hint)})</span>` : '';
        const posLabel = String(s.pos || VERB_BLANK_HINT).trim();
        const posTag = posLabel ? `<span class="pos-hint" title="该空应填${esc(posLabel)}">（${esc(posLabel)}）</span>` : '';
        inner += hint + `<input class="verb-input" type="text" data-vidx="${i}" placeholder="填动词形式" autocomplete="off" spellcheck="false">` + posTag;
      }
      inner += esc(parts[k] || '');
    }
    // 如果是选项模式，下面附上选项
    const optionsRow = (useOptions && allHaveOptions)
      ? `<div class="blank-opts" data-qtype="verb" data-bidx="${i}" style="margin-top:10px">
          ${s.options.map((o, j) => `<button class="blank-opt" data-oi="${j}" data-bidx="${i}" data-val="${esc(o)}">${String.fromCharCode(65+j)}. ${esc(o)}</button>`).join('')}
        </div>`
      : '';
    return `<div class="verb-sentence" data-vidx="${i}">
      <div class="sent" data-hl-zone="${esc((q.id || 'q') + ':v' + i)}"><span class="label-num">${i+1}.</span>${inner}</div>
      ${optionsRow}
      <div class="result-line"></div>
    </div>`;
  }).join('');

  return `
    <div class="q-card">
      <div class="q-meta">
        <span class="tag accent">动词填空</span>
        <span class="tag">难度 ${starLabel(q.difficulty)}</span>
        <span class="tag">共 ${q.sentences.length} 空</span>
      </div>
      ${toolbar}
      ${html}
      <div class="q-result-area"></div>
    </div>`;
}

/* ---- 听力题渲染 ---- */
function renderListening(q) {
  if (q.subType === 'short_dialogue' || q.subType === 'sentence') {
    return renderListeningShort(q);
  }
  if (q.subType === 'long_dialogue') {
    return renderListeningLong(q);
  }
  if (q.subType === 'table') {
    return renderListeningTable(q);
  }
  return '<div class="ai-error">未知听力题型</div>';
}

function renderListeningShort(q) {
  const isSentence = q.subType === 'sentence';
  const items = q.items.map((it, i) => `
    <div class="listening-item" data-lidx="${i}">
      <div class="listening-item-head">
        <span class="num">${i+1}</span>
        <button class="btn sm" data-lplay="${i}">▶ 播放第 ${i+1} 段</button>
      </div>
      ${isSentence ? '' : `<p class="sub-q-text">${esc(it.question)}</p>`}
      <div class="q-options" data-qtype="listen" data-lidx="${i}">
        ${it.options.map((o, j) => `<button class="q-option" data-oi="${j}" data-lidx="${i}" data-val="${esc(o)}">${String.fromCharCode(65+j)}. ${esc(o)}</button>`).join('')}
      </div>
      <div class="sub-result" data-lidx="${i}" style="margin-top:10px"></div>
    </div>`).join('');

  return `
    <div class="q-card">
      <div class="q-meta">
        <span class="tag accent">听力题</span>
        <span class="tag blue">${isSentence ? '听句子选答语' : '短对话问答'}</span>
        <span class="tag">难度 ${starLabel(q.difficulty)}</span>
      </div>
      <div class="listening-prompt">
        <b>📢 题型说明：</b>${esc(q.instructions)}<br>
        <b>⏱ 建议读题时间：</b>${q.prepTime} 秒 · <b>共 ${q.items.length} 句</b>
      </div>
      ${items}
      <div class="q-result-area"></div>
    </div>`;
}

function renderListeningLong(q) {
  return `
    <div class="q-card">
      <div class="q-meta">
        <span class="tag accent">听力题</span>
        <span class="tag blue">长对话理解</span>
        <span class="tag">难度 ${starLabel(q.difficulty)}</span>
      </div>
      <div class="listening-prompt">
        <b>📢 题型说明：</b>${esc(q.instructions)}<br>
        <b>⏱ 建议读题时间：</b>${q.prepTime} 秒
      </div>
      <div class="listening-player">
        <span class="lp-icon">🎧</span>
        <div class="lp-body">
          <div class="lp-title">长对话录音</div>
          <div class="lp-info lp-info-main">已播放 0 遍（建议听 2 遍）</div>
        </div>
        <div class="lp-controls">
          <button class="lp-play-main">▶ 播放录音</button>
          <button class="lp-script-toggle">👁 显示原文</button>
        </div>
      </div>
      <div class="listening-script hidden lp-script" data-hl-zone="${esc((q.id || 'q') + ':ll')}">${esc(q.script)}</div>
      ${q.questions.map((sq, qi) => `
        <div class="sub-q" data-sidx="${qi}">
          <p class="sub-q-text"><span class="sub-q-head">Q${qi+1}.</span>${esc(sq.question)}</p>
          <div class="q-options" data-qtype="listen" data-sidx="${qi}">
            ${sq.options.map((o, i) => `<button class="q-option" data-oi="${i}" data-sidx="${qi}" data-val="${esc(o)}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join('')}
          </div>
          <div class="sub-result" data-sidx="${qi}" style="margin-top:10px"></div>
        </div>`).join('')}
      <div class="q-result-area"></div>
    </div>`;
}

function renderListeningTable(q) {
  const headerHtml = q.columns.map(c => `<th>${esc(c)}</th>`).join('');
  const rowsHtml = q.rows.map((row, ri) => {
    const cells = q.columns.map((_, ci) => {
      const blank = q.blanks.find(b => b.row === ri && b.col === ci);
      if (blank) {
        return `<td><input class="table-input" type="text" data-trow="${ri}" data-tcol="${ci}" placeholder="填空" autocomplete="off" spellcheck="false"></td>`;
      }
      return `<td>${esc(row[ci] || '')}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
    <div class="q-card">
      <div class="q-meta">
        <span class="tag accent">听力题</span>
        <span class="tag blue">听力填表</span>
        <span class="tag">难度 ${starLabel(q.difficulty)}</span>
      </div>
      <div class="listening-prompt">
        <b>📢 题型说明：</b>${esc(q.instructions)}<br>
        <b>⏱ 建议读题时间：</b>${q.prepTime} 秒 · <b>共 ${q.blanks.length} 空</b>
      </div>
      <div class="listening-player">
        <span class="lp-icon">🎧</span>
        <div class="lp-body">
          <div class="lp-title">${esc(q.title || '听力材料')}</div>
          <div class="lp-info lp-info-main">已播放 0 遍（建议听 2 遍）</div>
        </div>
        <div class="lp-controls">
          <button class="lp-play-main">▶ 播放录音</button>
          <button class="lp-script-toggle">👁 显示原文</button>
        </div>
      </div>
      <div class="listening-script hidden lp-script" data-hl-zone="${esc((q.id || 'q') + ':lt')}">${esc(q.script)}</div>
      <table class="listening-table">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="q-result-area"></div>
    </div>`;
}

/* ---- 作文渲染 ---- */
function renderWriting(q) {
  return `
    <div class="q-card">
      <div class="q-meta"><span class="tag accent">作文</span><span class="tag">难度 ${starLabel(q.difficulty)}</span></div>
      <p class="writing-prompt" data-hl-zone="${esc((q.id || 'q') + ':w')}">${esc(q.prompt)}</p>
      ${q.hints.length ? `<ul class="writing-hints">${q.hints.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
      <textarea class="writing-input writing-area" placeholder="在此处用英文写作…"></textarea>
      <div class="row" style="margin-top:12px">
        <button class="btn primary writing-submit">提交给 AI 批改</button>
        <span class="muted small writing-status"></span>
      </div>
      <div class="writing-appreciation"></div>
    </div>`;
}

/* ---- 听力 UI 绑定（作用域可传入，供练习与整卷复用） ---- */
function setupListeningUI(q, opts) {
  opts = opts || {};
  const root = opts.root || $('bank-question-area');
  const state = opts.state || practice.state;
  const maxPlays = opts.maxPlays || 0;          // >0 时强制只可播放 N 遍
  const gradeOnBlur = opts.gradeOnBlur !== false;
  const plays = () => state.listenPlayed || 0;
  const bumpPlay = () => { state.listenPlayed = plays() + 1; return state.listenPlayed; };
  const atLimit = () => maxPlays > 0 && plays() >= maxPlays;

  const bindPlayer = (btn, info, toggle, script) => {
    const applyLimit = () => {
      if (!atLimit()) return;
      if (btn) { btn.disabled = true; btn.textContent = '🚫 听力已播放 ' + maxPlays + ' 遍，无法再听'; }
      if (toggle) toggle.style.display = 'none';
      if (script) script.classList.add('hidden');
      if (info) info.textContent = '已播放 ' + plays() + ' 遍（本场考试上限 ' + maxPlays + ' 遍）';
    };
    if (btn) {
      btn.addEventListener('click', async () => {
        if (atLimit()) { toast('本场考试听力只可播放 ' + maxPlays + ' 遍', 'err'); return; }
        btn.disabled = true;
        btn.classList.add('playing');
        btn.textContent = '⏸ 播放中…';
        await playListeningScript(q.script, (phase) => {
          if (phase === 'end') {
            const n = bumpPlay();
            if (info) info.textContent = maxPlays
              ? `已播放 ${n} 遍（本场考试上限 ${maxPlays} 遍）`
              : `已播放 ${n} 遍（建议听 2 遍）`;
            btn.classList.remove('playing');
            if (atLimit()) applyLimit();
            else { btn.disabled = false; btn.textContent = '▶ 再听一遍'; }
          }
        });
      });
    }
    if (toggle && script) {
      toggle.addEventListener('click', () => {
        script.classList.toggle('hidden');
        toggle.textContent = script.classList.contains('hidden') ? '👁 显示原文' : '🙈 隐藏原文';
      });
    }
    applyLimit();
  };

  if (q.subType === 'short_dialogue' || q.subType === 'sentence') {
    root.querySelectorAll('button[data-lplay]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.lplay);
        const key = 'i' + idx;
        const it = q.items[idx];
        if (!it || !it.script) { toast('该段无录音文本', 'err'); return; }
        state.listenItemPlayed = state.listenItemPlayed || {};
        if (maxPlays > 0 && (state.listenItemPlayed[key] || 0) >= maxPlays) {
          toast('本场考试听力只可播放 ' + maxPlays + ' 遍', 'err'); return;
        }
        btn.classList.add('playing');
        btn.disabled = true;
        await playListeningScript(it.script, () => {
          state.listenItemPlayed[key] = (state.listenItemPlayed[key] || 0) + 1;
          const n = state.listenItemPlayed[key];
          if (maxPlays > 0 && n >= maxPlays) { btn.disabled = true; btn.classList.remove('playing'); btn.textContent = '🚫 已听 ' + maxPlays + ' 遍'; }
          else { btn.classList.remove('playing'); btn.disabled = false; btn.textContent = '▶ 再听第 ' + (idx + 1) + ' 段'; }
        });
      });
    });
    return;
  }

  if (q.subType === 'long_dialogue' || q.subType === 'table') {
    bindPlayer(
      root.querySelector('.lp-play-main'),
      root.querySelector('.lp-info-main'),
      root.querySelector('.lp-script-toggle'),
      root.querySelector('.lp-script')
    );
  }

  if (q.subType === 'table' && gradeOnBlur) {
    root.querySelectorAll('input.table-input').forEach(inp => {
      inp.addEventListener('blur', () => checkListeningTable(q));
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); checkListeningTable(q); }
      });
    });
  }
}

/* ---- 综合填空自由填词判定 ---- */
function checkClozeInput(q) {
  const inputs = $('bank-question-area').querySelectorAll('input[data-cidx]');
  let allDone = true;
  inputs.forEach(inp => {
    const idx = parseInt(inp.dataset.cidx);
    if (practice.state.blankAnswered.has(idx)) return;
    const val = inp.value.trim().toLowerCase();
    if (!val) { allDone = false; return; }
    const b = q.blanks[idx];
    const correct = val === b.answer.toLowerCase();
    recordItem(q, correct, b.point || q.point);
    practice.state.blankAnswered.add(idx);
    inp.classList.add(correct ? 'correct' : 'wrong');
    inp.disabled = true;
    if (correct) practice.right++;
    $('bank-right').textContent = practice.right;
  });
  if (practice.state.blankAnswered.size === q.blanks.length) practice.answered = true;
}

/* ---- 动词填空判定 ---- */
function checkVerb(q) {
  const area = $('bank-question-area');
  const useOptions = practice.state.useOptionsVerb !== false;
  const allHaveOptions = q.sentences.every(s => Array.isArray(s.options) && s.options.length >= 2);

  if (useOptions && allHaveOptions) return; // 选项模式用点击处理

  const inputs = area.querySelectorAll('input[data-vidx]');
  inputs.forEach(inp => {
    const idx = parseInt(inp.dataset.vidx);
    if (practice.state.verbAnswered.has(idx)) return;
    const s = q.sentences[idx];
    const val = inp.value.trim().toLowerCase();
    if (!val) return;
    const correct = val === s.answer.toLowerCase();
    recordItem(q, correct, s.point || q.point);
    practice.state.verbAnswered.add(idx);
    inp.classList.add(correct ? 'correct' : 'wrong');
    inp.disabled = true;
    if (correct) practice.right++;
    $('bank-right').textContent = practice.right;
    const line = inp.closest('.verb-sentence').querySelector('.result-line');
    line.innerHTML = `<span style="color:${correct?'var(--olive)':'var(--accent)'}">${correct?'✅ 正确':'❌ 错误'}</span>
      ${correct?'':`　正确答案：<b>${esc(s.answer)}</b>`}
      ${s.explanation ? '　' + esc(s.explanation) : ''}`;
  });
  if (practice.state.verbAnswered.size === q.sentences.length) practice.answered = true;
}

/* ---- 听力填表判定 ---- */
function checkListeningTable(q) {
  const area = $('bank-question-area');
  const inputs = area.querySelectorAll('input.table-input');
  inputs.forEach(inp => {
    const row = parseInt(inp.dataset.trow);
    const col = parseInt(inp.dataset.tcol);
    const key = row + ',' + col;
    if (practice.state.blankAnswered.has(key)) return;
    const val = inp.value.trim();
    if (!val) return;
    const blank = q.blanks.find(b => b.row === row && b.col === col);
    if (!blank) return;
    const correct = val.toLowerCase() === blank.answer.toLowerCase();
    recordItem(q, correct, blank.point || q.point);
    practice.state.blankAnswered.add(key);
    inp.classList.add(correct ? 'correct' : 'wrong');
    inp.disabled = true;
    if (correct) practice.right++;
    $('bank-right').textContent = practice.right;
    // 在结果区显示答案
    let resArea = area.querySelector('.q-result-area');
    if (!resArea.dataset.init) { resArea.dataset.init = '1'; resArea.innerHTML = ''; }
    const div = document.createElement('div');
    div.className = 'explain-box' + (correct ? '' : ' ai');
    div.innerHTML = `<div class="head">[${row+1},${col+1}] ${correct?'✅ 正确':'❌ 错误'}</div>正确答案：<b>${esc(blank.answer)}</b>${blank.explanation?' · '+esc(blank.explanation):''}`;
    resArea.appendChild(div);
  });
  if (practice.state.blankAnswered.size === q.blanks.length) practice.answered = true;
}

/* ---- 统一事件处理 ---- */
$('bank-question-area').addEventListener('click', e => {
  const q = practice.list[practice.pos];
  if (!q) return;

  const speakBtn = e.target.closest('button[data-bank-speak]');
  if (speakBtn) { speak(speakBtn.dataset.bankSpeak, { rate: 0.9 }); return; }

  // 单项选择
  if (q.type === 'choice') {
    const opt = e.target.closest('.q-option');
    if (!opt || practice.answered) return;
    const val = opt.dataset.val;
    const correct = val === q.answer;
    recordItem(q, correct);
    practice.answered = true;
    if (correct) { practice.right++; $('bank-right').textContent = practice.right; }
    [...opt.parentElement.querySelectorAll('.q-option')].forEach(b => {
      b.disabled = true;
      if (b.dataset.val === q.answer) b.classList.add('correct');
      else if (b === opt) b.classList.add('wrong');
    });
    const area = opt.closest('.q-card').querySelector('.q-result-area');
    area.innerHTML = buildResultBox(q, val, correct);
    return;
  }

  // 阅读理解
  if (q.type === 'reading') {
    const opt = e.target.closest('.q-option');
    if (!opt) return;
    const sidx = parseInt(opt.dataset.sidx);
    if (practice.state.subAnswered.has(sidx)) return;
    practice.state.subAnswered.add(sidx);
    const sq = q.questions[sidx];
    const val = opt.dataset.val;
    const correct = val === sq.answer;
    recordItem(q, correct, sq.point || q.point);
    if (correct) practice.right++;
    $('bank-right').textContent = practice.right;
    [...opt.parentElement.querySelectorAll('.q-option')].forEach(b => {
      b.disabled = true;
      if (b.dataset.val === sq.answer) b.classList.add('correct');
      else if (b === opt) b.classList.add('wrong');
    });
    const resBox = opt.closest('.sub-q').querySelector('.sub-result');
    resBox.innerHTML = `<div class="explain-box${correct?'':' ai'}">
      <div class="head">${correct?'✅ 正确':'❌ 错误'}</div>
      ${sq.explanation ? esc(sq.explanation) : '（无解析）'}
    </div>`;
    if (practice.state.subAnswered.size === q.questions.length) practice.answered = true;
    return;
  }

  // 综合填空 - 选项模式
  if (q.type === 'cloze') {
    const opt = e.target.closest('.blank-opt');
    if (!opt) return;
    const bidx = parseInt(opt.dataset.bidx);
    if (practice.state.blankAnswered.has(bidx)) return;
    practice.state.blankAnswered.add(bidx);
    const b = q.blanks[bidx];
    const val = opt.dataset.val;
    const correct = val === b.answer;
    recordItem(q, correct, b.point || q.point);
    if (correct) practice.right++;
    $('bank-right').textContent = practice.right;
    [...opt.parentElement.querySelectorAll('.blank-opt')].forEach(x => {
      x.disabled = true;
      if (x.dataset.val === b.answer) x.classList.add('correct');
      else if (x === opt) x.classList.add('wrong');
    });
    const mark = $('bank-question-area').querySelector(`.blank-mark[data-bidx="${bidx}"]`);
    if (mark) mark.textContent = '[' + (bidx+1) + '] ' + val;
    const card = opt.closest('.q-card');
    let resArea = card.querySelector('.q-result-area');
    if (!resArea.dataset.init) { resArea.dataset.init = '1'; resArea.innerHTML = ''; }
    const old = resArea.querySelector(`[data-br="${bidx}"]`);
    if (old) old.remove();
    const div = document.createElement('div');
    div.dataset.br = bidx;
    div.className = 'explain-box' + (correct ? '' : ' ai');
    div.innerHTML = `<div class="head">[${bidx+1}] ${correct?'✅ 正确':'❌ 错误'}</div>${b.explanation ? esc(b.explanation) : '（无解析）'}`;
    resArea.appendChild(div);
    if (practice.state.blankAnswered.size === q.blanks.length) practice.answered = true;
    return;
  }

  // 动词填空 - 选项模式
  if (q.type === 'verb') {
    const opt = e.target.closest('.blank-opt');
    if (!opt) return;
    const bidx = parseInt(opt.dataset.bidx);
    if (practice.state.verbAnswered.has(bidx)) return;
    practice.state.verbAnswered.add(bidx);
    const s = q.sentences[bidx];
    const val = opt.dataset.val;
    const correct = val === s.answer;
    recordItem(q, correct, s.point || q.point);
    if (correct) practice.right++;
    $('bank-right').textContent = practice.right;
    [...opt.parentElement.querySelectorAll('.blank-opt')].forEach(x => {
      x.disabled = true;
      if (x.dataset.val === s.answer) x.classList.add('correct');
      else if (x === opt) x.classList.add('wrong');
    });
    // 高亮题干中的空位
    const mark = $('bank-question-area').querySelector(`.inline-input[data-vidx="${bidx}"]`);
    if (mark) {
      mark.textContent = val;
      mark.style.color = correct ? 'var(--olive)' : 'var(--accent)';
      mark.style.borderBottomColor = correct ? 'var(--olive)' : 'var(--accent)';
    }
    const line = opt.closest('.verb-sentence').querySelector('.result-line');
    line.innerHTML = `<span style="color:${correct?'var(--olive)':'var(--accent)'}">${correct?'✅ 正确':'❌ 错误'}</span>
      ${correct?'':`　正确答案：<b>${esc(s.answer)}</b>`}
      ${s.explanation ? '　' + esc(s.explanation) : ''}`;
    if (practice.state.verbAnswered.size === q.sentences.length) practice.answered = true;
    return;
  }

  // 听力题 - 短对话与长对话的选择题
  if (q.type === 'listening') {
    const opt = e.target.closest('.q-option');
    if (!opt) return;
    if (q.subType === 'short_dialogue' || q.subType === 'sentence') {
      const lidx = parseInt(opt.dataset.lidx);
      if (practice.state.subAnswered.has('l' + lidx)) return;
      practice.state.subAnswered.add('l' + lidx);
      const item = q.items[lidx];
      const val = opt.dataset.val;
      const correct = val === item.answer;
      recordItem(q, correct, item.point || q.point);
      if (correct) practice.right++;
      $('bank-right').textContent = practice.right;
      [...opt.parentElement.querySelectorAll('.q-option')].forEach(b => {
        b.disabled = true;
        if (b.dataset.val === item.answer) b.classList.add('correct');
        else if (b === opt) b.classList.add('wrong');
      });
      const resBox = opt.closest('.listening-item').querySelector('.sub-result');
      resBox.innerHTML = `<div class="explain-box${correct?'':' ai'}">
        <div class="head">${correct?'✅ 正确':'❌ 错误'}</div>
        ${item.explanation ? esc(item.explanation) : '（无解析）'}
        <div style="margin-top:8px;font-size:12.5px;color:var(--ink-3)">原文：${esc(item.script).replace(/\n/g,' / ')}</div>
      </div>`;
      if (practice.state.subAnswered.size === q.items.length) practice.answered = true;
      return;
    }
    if (q.subType === 'long_dialogue') {
      const sidx = parseInt(opt.dataset.sidx);
      if (practice.state.subAnswered.has(sidx)) return;
      practice.state.subAnswered.add(sidx);
      const sq = q.questions[sidx];
      const val = opt.dataset.val;
      const correct = val === sq.answer;
      recordItem(q, correct, sq.point || q.point);
      if (correct) practice.right++;
      $('bank-right').textContent = practice.right;
      [...opt.parentElement.querySelectorAll('.q-option')].forEach(b => {
        b.disabled = true;
        if (b.dataset.val === sq.answer) b.classList.add('correct');
        else if (b === opt) b.classList.add('wrong');
      });
      const resBox = opt.closest('.sub-q').querySelector('.sub-result');
      resBox.innerHTML = `<div class="explain-box${correct?'':' ai'}">
        <div class="head">${correct?'✅ 正确':'❌ 错误'}</div>
        ${sq.explanation ? esc(sq.explanation) : '（无解析）'}
      </div>`;
      if (practice.state.subAnswered.size === q.questions.length) practice.answered = true;
      return;
    }
  }

  // 作文提交
  if (q.type === 'writing') {
    if (e.target.closest('.writing-submit')) handleWritingSubmit(q, { root: $('bank-question-area') });
    return;
  }
});

/* ---- 结果盒子 ---- */
function buildResultBox(q, userVal, correct) {
  let html = `<div class="explain-box${correct ? '' : ' ai'}">
    <div class="head">${correct ? '✅ 正确' : '❌ 错误'}</div>`;
  if (!correct) html += `<div style="margin-bottom:6px">你的答案：<b>${esc(userVal)}</b> ｜ 正确答案：<b>${esc(q.answer)}</b></div>`;
  if (q.explanation) html += `<div>${esc(q.explanation)}</div>`;
  if (q.word) html += `<div style="margin-top:8px"><b style="font-family:var(--serif)">${esc(q.word)}</b> ${esc(q.phonetic || '')} —— ${esc(q.meaning || '')}
    <button class="btn sm" data-bank-speak="${esc(q.word)}" style="margin-left:8px">🔊 发音</button></div>`;
  if (q.example) html += `<div style="margin-top:6px;font-style:italic;color:var(--ink-3)">${esc(q.example)}</div>`;
  html += `</div>`;
  return html;
}

/* 动词填空失焦判定（自由填词模式） */
$('bank-question-area').addEventListener('blur', e => {
  const inp = e.target.closest('input[data-vidx]');
  if (!inp) return;
  const q = practice.list[practice.pos];
  if (!q || q.type !== 'verb') return;
  const useOptions = practice.state.useOptionsVerb !== false;
  const allHaveOptions = q.sentences.every(s => Array.isArray(s.options) && s.options.length >= 2);
  if (useOptions && allHaveOptions) return;
  const idx = parseInt(inp.dataset.vidx);
  if (practice.state.verbAnswered.has(idx)) return;
  if (!inp.value.trim()) return;
  checkVerb(q);
}, true);

/* 综合填空自由填词失焦判定 */
$('bank-question-area').addEventListener('blur', e => {
  const inp = e.target.closest('input[data-cidx]');
  if (!inp) return;
  const q = practice.list[practice.pos];
  if (!q || q.type !== 'cloze') return;
  if (practice.state.useOptions !== false) return;
  if (!inp.value.trim()) return;
  checkClozeInput(q);
}, true);

/* 阅读表达失焦 / 回车判定（练习模式） */
$('bank-question-area').addEventListener('blur', e => {
  const inp = e.target.closest('input.ra-input');
  if (!inp) return;
  const q = practice.list[practice.pos];
  if (!q || q.type !== 'reading' || q.mode !== 'open') return;
  if (!inp.value.trim()) return;
  checkReadingOpen(q);
}, true);
$('bank-question-area').addEventListener('keydown', e => {
  const inp = e.target.closest('input.ra-input');
  if (!inp || e.key !== 'Enter') return;
  e.preventDefault();
  const q = practice.list[practice.pos];
  if (q && q.type === 'reading' && q.mode === 'open') checkReadingOpen(q);
});

function checkReadingOpen(q) {
  const area = $('bank-question-area');
  q.questions.forEach((sq, i) => {
    if (practice.state.subAnswered.has(i)) return;
    const inp = area.querySelector(`input.ra-input[data-sidx="${i}"]`);
    if (!inp || !inp.value.trim()) return;
    const val = inp.value.trim();
    const ok = matchOpenAnswer(val, sq.answer);
    practice.state.subAnswered.add(i);
    recordItem(q, ok, sq.point || q.point);
    if (ok) practice.right++;
    $('bank-right').textContent = practice.right;
    inp.disabled = true;
    inp.classList.add(ok ? 'correct' : 'wrong');
    const res = area.querySelector(`.sub-q[data-sidx="${i}"] .sub-result`);
    if (res) res.innerHTML = `<div class="explain-box${ok ? '' : ' ai'}">
      <div class="head">${ok ? '✅ 正确' : '❌ 错误'}</div>
      <div style="margin-bottom:4px">你的答案：<b>${esc(val)}</b> ｜ 参考答案：<b>${esc(answerTextOf(sq.answer))}</b></div>
      ${sq.explanation ? esc(sq.explanation) : '（无解析）'}
    </div>`;
  });
  if (practice.state.subAnswered.size === q.questions.length) practice.answered = true;
}

/* ---- 作文提交 ---- */
async function handleWritingSubmit(q, opts) {
  opts = opts || {};
  const root = opts.root || $('bank-question-area');
  const essayMax = clamp(parseInt(opts.essayMax, 10) || 20, 1, 100);
  const ta = root.querySelector('.writing-input');
  const essay = ta ? ta.value.trim() : '';
  if (!essay) { toast('请先写作文', 'err'); return; }
  const status = root.querySelector('.writing-status');
  const out = root.querySelector('.writing-appreciation');
  status.textContent = 'AI 批改中…';
  out.innerHTML = '<div class="ai-loading">正在批改作文<span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
  try {
    const sys = settings.prompts.appreciation;
    const user = `作文题目与要求：\n${q.prompt}\n\n学生的作文：\n${essay}\n\n本次作文满分 ${essayMax} 分，请严格按【总分】X / ${essayMax} 的格式给分。`;
    const text = await callChat([{ role: 'system', content: sys }, { role: 'user', content: user }], { temperature: 0.5 });
    out.innerHTML = `<div class="explain-box ai"><div class="head">🤖 AI 批改</div>${esc(text).replace(/\n/g,'<br>')}</div>`;
    status.textContent = '';
    applyEssayScoreToReport();
  } catch (err) {
    out.innerHTML = `<div class="ai-error">批改失败：${esc(err.message)}</div>`;
    status.textContent = '';
  }
}

/* ---- 上一题 / 下一题 / 显示答案 ---- */
$('bank-prev').addEventListener('click', () => { if (practice.pos > 0) { practice.pos--; renderPractice(); } else toast('已经是第一题'); });
$('bank-next-q').addEventListener('click', () => {
  if (practice.pos < practice.list.length - 1) { practice.pos++; renderPractice(); }
  else toast('已经是最后一题');
});

$('bank-reveal').addEventListener('click', () => {
  const q = practice.list[practice.pos];
  if (!q) return;
  const area = $('bank-question-area');

  if (q.type === 'choice') {
    [...area.querySelectorAll('.q-option')].forEach(b => {
      b.disabled = true;
      if (b.dataset.val === q.answer) b.classList.add('correct');
    });
    if (!practice.answered) recordItem(q, false);
    practice.answered = true;
  } else if (q.type === 'reading') {
    q.questions.forEach((sq, i) => {
      const el = area.querySelector(`.sub-q[data-sidx="${i}"]`);
      if (!el) return;
      if (!practice.state.subAnswered.has(i)) recordItem(q, false, sq.point || q.point);
      practice.state.subAnswered.add(i);
      if (q.mode === 'open') {
        const inp = el.querySelector('input.ra-input');
        const ans = answerTextOf(sq.answer);
        if (inp) { inp.value = ans; inp.disabled = true; inp.classList.add('correct'); }
        el.querySelector('.sub-result').innerHTML = `<div class="explain-box"><div class="head">参考答案</div>${esc(ans)}${sq.explanation ? ' · ' + esc(sq.explanation) : ''}</div>`;
        return;
      }
      [...el.querySelectorAll('.q-option')].forEach(b => {
        b.disabled = true;
        if (b.dataset.val === sq.answer) b.classList.add('correct');
      });
      el.querySelector('.sub-result').innerHTML = `<div class="explain-box"><div class="head">答案</div>${esc(sq.answer)}${sq.explanation ? ' · ' + esc(sq.explanation) : ''}</div>`;
    });
    practice.answered = true;
  } else if (q.type === 'cloze') {
    const useOptions = practice.state.useOptions !== false;
    const allHaveOptions = q.blanks.every(b => Array.isArray(b.options) && b.options.length >= 2);
    if (useOptions && allHaveOptions) {
      q.blanks.forEach((b, i) => {
        const row = area.querySelector(`.blank-row[data-bidx="${i}"]`);
        if (!row) return;
        if (!practice.state.blankAnswered.has(i)) recordItem(q, false, b.point || q.point);
        [...row.querySelectorAll('.blank-opt')].forEach(x => {
          x.disabled = true;
          if (x.dataset.val === b.answer) x.classList.add('correct');
        });
        practice.state.blankAnswered.add(i);
      });
    } else {
      const inputs = area.querySelectorAll('input[data-cidx]');
      inputs.forEach(inp => {
        const i = parseInt(inp.dataset.cidx);
        const b = q.blanks[i];
        if (!practice.state.blankAnswered.has(i)) recordItem(q, false, b.point || q.point);
        inp.value = b.answer;
        inp.disabled = true;
        inp.classList.add('correct');
        practice.state.blankAnswered.add(i);
      });
    }
    practice.answered = true;
  } else if (q.type === 'verb') {
    const useOptions = practice.state.useOptionsVerb !== false;
    const allHaveOptions = q.sentences.every(s => Array.isArray(s.options) && s.options.length >= 2);
    if (useOptions && allHaveOptions) {
      q.sentences.forEach((s, i) => {
        const optsBox = area.querySelector(`.blank-opts[data-bidx="${i}"]`);
        if (!optsBox) return;
        if (!practice.state.verbAnswered.has(i)) recordItem(q, false, s.point || q.point);
        [...optsBox.querySelectorAll('.blank-opt')].forEach(x => {
          x.disabled = true;
          if (x.dataset.val === s.answer) x.classList.add('correct');
        });
        const mark = area.querySelector(`.inline-input[data-vidx="${i}"]`);
        if (mark) { mark.textContent = s.answer; mark.style.color = 'var(--olive)'; mark.style.borderBottomColor = 'var(--olive)'; }
        practice.state.verbAnswered.add(i);
      });
    } else {
      const inputs = area.querySelectorAll('input.verb-input[data-vidx]');
      inputs.forEach(inp => {
        const i = parseInt(inp.dataset.vidx);
        const s = q.sentences[i];
        if (!practice.state.verbAnswered.has(i)) recordItem(q, false, s.point || q.point);
        inp.value = s.answer;
        inp.disabled = true;
        inp.classList.add('correct');
        practice.state.verbAnswered.add(i);
        const line = inp.closest('.verb-sentence').querySelector('.result-line');
        line.innerHTML = `<span style="color:var(--olive)">答案：<b>${esc(s.answer)}</b></span>${s.explanation ? '　' + esc(s.explanation) : ''}`;
      });
    }
    practice.answered = true;
  } else if (q.type === 'listening') {
    if (q.subType === 'short_dialogue' || q.subType === 'sentence') {
      q.items.forEach((it, i) => {
        const el = area.querySelector(`.listening-item[data-lidx="${i}"]`);
        if (!el) return;
        if (!practice.state.subAnswered.has('l' + i)) recordItem(q, false, it.point || q.point);
        [...el.querySelectorAll('.q-option')].forEach(b => {
          b.disabled = true;
          if (b.dataset.val === it.answer) b.classList.add('correct');
        });
        el.querySelector('.sub-result').innerHTML = `<div class="explain-box"><div class="head">答案</div>${esc(it.answer)}${it.explanation ? ' · ' + esc(it.explanation) : ''}</div>`;
        practice.state.subAnswered.add('l' + i);
      });
      practice.answered = true;
    } else if (q.subType === 'long_dialogue') {
      q.questions.forEach((sq, i) => {
        const el = area.querySelector(`.sub-q[data-sidx="${i}"]`);
        if (!el) return;
        if (!practice.state.subAnswered.has(i)) recordItem(q, false, sq.point || q.point);
        [...el.querySelectorAll('.q-option')].forEach(b => {
          b.disabled = true;
          if (b.dataset.val === sq.answer) b.classList.add('correct');
        });
        el.querySelector('.sub-result').innerHTML = `<div class="explain-box"><div class="head">答案</div>${esc(sq.answer)}${sq.explanation ? ' · ' + esc(sq.explanation) : ''}</div>`;
        practice.state.subAnswered.add(i);
      });
      // 显示原文
      const scr = area.querySelector('.lp-script');
      if (scr) scr.classList.remove('hidden');
      practice.answered = true;
    } else if (q.subType === 'table') {
      q.blanks.forEach(b => {
        const inp = area.querySelector(`input[data-trow="${b.row}"][data-tcol="${b.col}"]`);
        if (!inp) return;
        const key = b.row + ',' + b.col;
        if (!practice.state.blankAnswered.has(key)) recordItem(q, false, q.point);
        inp.value = b.answer;
        inp.disabled = true;
        inp.classList.add('correct');
        practice.state.blankAnswered.add(key);
      });
      const scr = area.querySelector('.lp-script');
      if (scr) scr.classList.remove('hidden');
      practice.answered = true;
    }
  } else if (q.type === 'writing') {
    const out = area.querySelector('.writing-appreciation');
    if (q.sample) out.innerHTML = `<div class="explain-box"><div class="head">参考范文</div>${esc(q.sample)}</div>`;
    else toast('该题未附带范文，可使用「AI 解析」生成赏析');
  }
});

/* ---- AI 解析 ---- */
$('bank-ai-explain').addEventListener('click', async () => {
  const q = practice.list[practice.pos];
  if (!q) return;
  const area = $('bank-question-area');
  const btn = $('bank-ai-explain');
  btn.disabled = true; btn.textContent = '解析中…';

  let userInfo = '';
  if (q.type === 'choice') {
    const wrong = area.querySelector('.q-option.wrong');
    userInfo = wrong ? `学生的选择：${wrong.dataset.val}` : '学生尚未作答或已正确';
  } else if (q.type === 'reading') {
    if (q.mode === 'open') {
      userInfo = q.questions.map((sq, i) => {
        const sub = area.querySelector(`.sub-q[data-sidx="${i}"]`);
        const inp = sub?.querySelector('input.ra-input');
        return `Q${i+1} 学生回答：${inp?.value || '(空)'} ｜ 参考答案：${answerTextOf(sq.answer)}`;
      }).join('\n');
    } else {
      userInfo = q.questions.map((sq, i) => {
        const sub = area.querySelector(`.sub-q[data-sidx="${i}"]`);
        const wrong = sub?.querySelector('.q-option.wrong');
        return `Q${i+1} 学生选择：${wrong ? wrong.dataset.val : '(正确/未答)'}`;
      }).join('\n');
    }
  } else if (q.type === 'cloze') {
    userInfo = q.blanks.map((b, i) => {
      const inp = area.querySelector(`input[data-cidx="${i}"]`);
      if (inp) return `[${i+1}] 学生填写：${inp.value || '(空)'}`;
      const row = area.querySelector(`.blank-row[data-bidx="${i}"]`);
      const wrong = row?.querySelector('.blank-opt.wrong');
      return `[${i+1}] 学生选择：${wrong ? wrong.dataset.val : '(正确/未答)'}`;
    }).join('\n');
  } else if (q.type === 'verb') {
    userInfo = q.sentences.map((s, i) => {
      const inp = area.querySelector(`input.verb-input[data-vidx="${i}"]`);
      if (inp) return `${i+1}. 学生填写：${inp.value || '(空)'}`;
      const optsBox = area.querySelector(`.blank-opts[data-bidx="${i}"]`);
      const wrong = optsBox?.querySelector('.blank-opt.wrong');
      return `${i+1}. 学生选择：${wrong ? wrong.dataset.val : '(正确/未答)'}`;
    }).join('\n');
  } else if (q.type === 'listening') {
    if (q.subType === 'short_dialogue' || q.subType === 'sentence') {
      userInfo = q.items.map((it, i) => {
        const el = area.querySelector(`.listening-item[data-lidx="${i}"]`);
        const wrong = el?.querySelector('.q-option.wrong');
        return `第${i+1}组 学生选择：${wrong ? wrong.dataset.val : '(正确/未答)'}`;
      }).join('\n');
    } else if (q.subType === 'long_dialogue') {
      userInfo = q.questions.map((sq, i) => {
        const el = area.querySelector(`.sub-q[data-sidx="${i}"]`);
        const wrong = el?.querySelector('.q-option.wrong');
        return `Q${i+1} 学生选择：${wrong ? wrong.dataset.val : '(正确/未答)'}`;
      }).join('\n');
    } else if (q.subType === 'table') {
      userInfo = q.blanks.map((b, i) => {
        const inp = area.querySelector(`input[data-trow="${b.row}"][data-tcol="${b.col}"]`);
        return `[${i+1}] 学生填写：${inp?.value || '(空)'}`;
      }).join('\n');
    }
  } else if (q.type === 'writing') {
    const ta = area.querySelector('.writing-input');
    userInfo = ta?.value || '(无内容)';
  }

  const qDesc = describeQuestionForAI(q);
  const sys = settings.prompts.analysis;
  const user = `题目信息：\n${qDesc}\n\n学生作答情况：\n${userInfo}\n\n请给出解析。`;

  let box = area.querySelector('#ai-explain-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'ai-explain-box';
    box.style.marginTop = '14px';
    area.appendChild(box);
  }
  box.innerHTML = '<div class="ai-loading">正在生成解析<span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
  try {
    const text = await callChat([{ role: 'system', content: sys }, { role: 'user', content: user }], { temperature: 0.5 });
    box.innerHTML = `<div class="explain-box ai"><div class="head">🤖 AI 解析</div>${esc(text).replace(/\n/g,'<br>')}</div>`;
  } catch (err) {
    box.innerHTML = `<div class="ai-error">AI 解析失败：${esc(err.message)}</div>`;
  } finally {
    btn.disabled = false; btn.textContent = '🤖 AI 解析';
  }
});

function describeQuestionForAI(q) {
  if (q.type === 'choice') {
    return `题型：单项选择\n题干：${q.question}\n选项：${q.options.map((o,i)=>String.fromCharCode(65+i)+'. '+o).join('；')}\n正确答案：${q.answer}`;
  }
  if (q.type === 'reading') {
    if (q.mode === 'open') {
      return `题型：阅读表达（根据文章回答问题）\n标题：${q.title}\n文章：${q.passage}\n问题与参考答案：\n${q.questions.map((sq,i)=>`Q${i+1}: ${sq.question}\n  参考答案：${answerTextOf(sq.answer)}`).join('\n')}`;
    }
    return `题型：阅读理解（${q.level}级）\n标题：${q.title}\n文章：${q.passage}\n题目与答案：\n${q.questions.map((sq,i)=>`Q${i+1}: ${sq.question}\n  选项：${(sq.options||[]).map((o,j)=>String.fromCharCode(65+j)+'. '+o).join('；')}\n  正确答案：${sq.answer}`).join('\n')}`;
  }
  if (q.type === 'cloze') {
    return `题型：${kindLabel(q)}\n文章：${q.passage}\n空格答案：${q.blanks.map((b,i)=>`[${i+1}] ${b.answer}${b.hint ? `（首字母 ${b.hint}）` : ''}${b.pos ? `（${b.pos}）` : ''}`).join('；')}`;
  }
  if (q.type === 'verb') {
    return `题型：动词填空\n${q.sentences.map((s,i)=>`${i+1}. ${s.text}\n   答案：${s.answer}`).join('\n')}`;
  }
  if (q.type === 'listening') {
    if (q.subType === 'short_dialogue' || q.subType === 'sentence') {
      const t = q.subType === 'sentence' ? '听力-听句子选答语' : '听力-短对话问答';
      return `题型：${t}\n${q.items.map((it,i)=>`第${i+1}句\n录音：${it.script}\n${it.question ? '问题：' + it.question + '\n' : ''}选项：${it.options.join('；')}\n答案：${it.answer}`).join('\n')}`;
    }
    if (q.subType === 'long_dialogue') {
      return `题型：听力-长对话理解\n录音：${q.script}\n${q.questions.map((sq,i)=>`Q${i+1}: ${sq.question}\n  选项：${sq.options.join('；')}\n  答案：${sq.answer}`).join('\n')}`;
    }
    if (q.subType === 'table') {
      return `题型：听力-填表\n录音：${q.script}\n表格：${q.columns.join(' | ')}\n${q.rows.map(r=>r.join(' | ')).join('\n')}\n答案：${q.blanks.map((b,i)=>`[${i+1}] ${b.answer}`).join('；')}`;
    }
  }
  if (q.type === 'writing') {
    return `题型：作文\n题目与要求：${q.prompt}\n提示：${(q.hints||[]).join('；')}`;
  }
  return '';
}
