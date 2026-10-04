/* =========================================================
   单词听力（词级）
   ========================================================= */
const listen = { current: null, answered: false, index: 0, score: 0 };

function playListenWord() {
  if (!listen.current) return;
  const btn = $('l-play');
  speak(listen.current.word.word, {
    rate: 0.85,
    onstart: () => btn.classList.add('playing'),
    onend:   () => btn.classList.remove('playing'),
    onerror: () => btn.classList.remove('playing')
  });
}
function lNext() {
  const pool = getPool('l');
  if (pool.length < 2) {
    $('l-options').innerHTML = '';
    $('l-feedback').textContent = '';
    if (!listenSel.size) $('l-tip').textContent = '请先在上方勾选至少一个词库';
    else if (pool.length === 0) $('l-tip').textContent = '当前筛选下没有可用的单词（试试取消「只练重点词汇」）';
    else $('l-tip').textContent = '至少需要 2 个单词才能开始听力练习';
    listen.current = null;
    return;
  }
  try { speechSynthesis.cancel(); } catch (e) {}
  $('l-play').classList.remove('playing');
  const answer = pool[rand(pool.length)];
  const others = [...new Set(pool.filter(p => p.word.meaning && p.word.meaning !== answer.word.meaning).map(p => p.word.meaning))];
  shuffle(others);
  const options = shuffle([answer.word.meaning, ...others.slice(0, 3)]);
  listen.current = { word: answer.word, lib: answer.lib, options };
  listen.answered = false;
  listen.index++;
  $('l-index').textContent = listen.index;
  $('l-feedback').textContent = '';
  $('l-feedback').className = 'feedback';
  $('l-tip').textContent = '点击喇叭听发音，然后选出正确的中文释义';
  $('l-options').innerHTML = options.map(o => `<button class="option" data-val="${esc(o)}">${esc(o)}</button>`).join('');
  if ($('l-auto').checked) setTimeout(playListenWord, 260);
}
$('l-play').addEventListener('click', playListenWord);
$('l-replay').addEventListener('click', playListenWord);
$('l-next').addEventListener('click', lNext);
$('l-options').addEventListener('click', e => {
  const btn = e.target.closest('.option');
  if (!btn || listen.answered || !listen.current) return;
  listen.answered = true;
  const q = listen.current;
  const correct = btn.dataset.val === q.word.meaning;
  statListen(correct);
  [...$('l-options').children].forEach(b => {
    b.disabled = true;
    if (b.dataset.val === q.word.meaning) b.classList.add('correct');
    else if (b === btn) b.classList.add('wrong');
  });
  if (correct) {
    listen.score++;
    $('l-score').textContent = listen.score;
    $('l-feedback').className = 'feedback ok';
    $('l-feedback').textContent = `正确 · ${q.word.word} —— ${q.word.meaning}`;
    const myIndex = listen.index;
    setTimeout(() => { if (listen.index === myIndex && listen.answered) lNext(); }, 1100);
  } else {
    $('l-feedback').className = 'feedback err';
    $('l-feedback').innerHTML = `答错了，正确答案是 <b>${esc(q.word.meaning)}</b>（${esc(q.word.word)}）`;
  }
});

/* =========================================================
   语音生成
   ========================================================= */
let vToken = 0, vLooping = false;
function vPlay() {
  if (!TTS_OK) { toast('不支持语音合成', 'err'); return; }
  const text = $('v-text').value.trim();
  if (!text) { toast('请输入内容', 'err'); return; }
  const my = ++vToken;
  try { speechSynthesis.cancel(); } catch (e) {}
  const u = new SpeechSynthesisUtterance(text);
  const voice = voices[+$('v-voice').value];
  if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-US'; }
  u.rate = +$('v-rate').value;
  u.pitch = +$('v-pitch').value;
  u.onstart = () => { if (my === vToken) $('v-status').textContent = '正在播放…'; };
  u.onend = () => {
    if (my !== vToken) return;
    $('v-status').textContent = vLooping ? '循环播放中…' : '播放完成';
    if (vLooping) setTimeout(() => { if (my === vToken && vLooping) vPlay(); }, 450);
  };
  u.onerror = () => { if (my === vToken) $('v-status').textContent = '播放被中断'; };
  speechSynthesis.speak(u);
}
function stopLoop() {
  vLooping = false; vToken++;
  if (TTS_OK) { try { speechSynthesis.cancel(); } catch (e) {} }
  const btn = $('v-loop'); if (btn) btn.classList.remove('on');
}
$('v-play').addEventListener('click', () => { vLooping = false; $('v-loop').classList.remove('on'); vPlay(); });
$('v-stop').addEventListener('click', () => { stopLoop(); $('v-status').textContent = '已停止'; });
$('v-loop').addEventListener('click', () => {
  vLooping = !vLooping;
  $('v-loop').classList.toggle('on', vLooping);
  if (vLooping) vPlay(); else stopLoop();
});
$('v-reset').addEventListener('click', () => {
  $('v-rate').value = 0.9; $('v-rate-val').textContent = '0.90';
  $('v-pitch').value = 1; $('v-pitch-val').textContent = '1.00';
  $('v-voice').selectedIndex = 0;
  toast('参数已重置');
});
$('v-rate').addEventListener('input', e => $('v-rate-val').textContent = (+e.target.value).toFixed(2));
$('v-pitch').addEventListener('input', e => $('v-pitch-val').textContent = (+e.target.value).toFixed(2));

function renderVoiceChips() {
  const box = $('v-wordlist'); if (!box) return;
  const pool = words;
  if (!pool.length) { box.innerHTML = '<span class="hint" style="margin:0">当前词库为空</span>'; return; }
  box.innerHTML = pool.slice(0, 120).map(w =>
    `<button class="chip" data-word="${esc(w.word)}" title="${esc(w.meaning)}" style="${w.isKey ? 'border-color:var(--gold)' : ''}">${w.isKey ? '★ ' : ''}${esc(w.word)}</button>`
  ).join('');
}
$('v-wordlist').addEventListener('click', e => {
  const chip = e.target.closest('.chip'); if (!chip) return;
  $('v-text').value = chip.dataset.word;
  vLooping = false; $('v-loop').classList.remove('on');
  vPlay();
});
$('v-lib').addEventListener('change', e => {
  activeLibId = e.target.value;
  saveLibraries();
  renderWords();
});
$('v-playall').addEventListener('click', () => {
  const pool = words;
  if (!pool.length) { toast('当前词库为空', 'err'); return; }
  if (!TTS_OK) { toast('不支持语音合成', 'err'); return; }
  stopLoop();
  const queue = pool.slice(0, 60);
  let i = 0; const my = ++vToken;
  const next = () => {
    if (my !== vToken) return;
    if (i >= queue.length) { $('v-status').textContent = '全部朗读完成'; return; }
    const w = queue[i++];
    $('v-status').textContent = `正在朗读 ${i}/${queue.length}：${w.word}`;
    const u = new SpeechSynthesisUtterance(w.word);
    const voice = voices[+$('v-voice').value];
    if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-US'; }
    u.rate = +$('v-rate').value;
    u.pitch = +$('v-pitch').value;
    u.onend = () => setTimeout(next, 320);
    u.onerror = () => setTimeout(next, 320);
    speechSynthesis.speak(u);
  };
  next();
});

/* =========================================================
   单词默写（词级）
   ========================================================= */
const dict = { current: null, src: null, answered: false, index: 0, right: 0, total: 0 };

function dNext() {
  const pool = getPool('d');
  if (!pool.length) {
    $('d-meaning').textContent = '—';
    $('d-phonetic').textContent = '';
    $('d-input').value = '';
    if (!dictSel.size) $('d-feedback').textContent = '请先在上方勾选至少一个词库';
    else $('d-feedback').textContent = '当前筛选下没有可用的单词（试试取消「只练重点词汇」）';
    $('d-input').placeholder = '暂无可练习的单词';
    $('d-input').disabled = true;
    dict.current = null; return;
  }
  try { speechSynthesis.cancel(); } catch (e) {}
  dict.src = pool[rand(pool.length)];
  dict.current = dict.src.word;
  dict.answered = false;
  dict.index++;
  $('d-index').textContent = dict.index;
  $('d-meaning').textContent = dict.current.meaning;
  $('d-phonetic').textContent = dict.current.phonetic || '';
  $('d-input').disabled = false;
  $('d-input').value = '';
  $('d-input').placeholder = `请输入 ${dict.current.word.length} 个字母的英文单词`;
  $('d-feedback').textContent = '';
  $('d-feedback').className = 'feedback';
  $('d-input').focus();
}
function dSubmit() {
  if (!dict.current || dict.answered) return;
  const input = $('d-input');
  const val = input.value.trim().toLowerCase();
  if (!val) { input.focus(); toast('请输入答案', 'err'); return; }
  dict.answered = true;
  dict.total++;
  $('d-total').textContent = dict.total;
  const answer = dict.current.word;
  const isRight = val === answer.toLowerCase();
  statDict(dict.src && dict.src.lib ? dict.src.lib.name : '未命名词库', isRight);
  if (isRight) {
    dict.right++;
    $('d-right').textContent = dict.right;
    $('d-feedback').className = 'feedback ok';
    $('d-feedback').textContent = `拼写正确：${answer}`;
    input.disabled = true;
    speak(answer, { rate: 0.9 });
    const myIndex = dict.index;
    setTimeout(() => { if (dict.index === myIndex && dict.answered) dNext(); }, 1100);
  } else {
    $('d-feedback').className = 'feedback err';
    $('d-feedback').innerHTML = `拼写错误，正确答案是 <b>${esc(answer)}</b>`;
    input.disabled = true;
    speak(answer, { rate: 0.85 });
  }
}
$('d-submit').addEventListener('click', dSubmit);
$('d-next').addEventListener('click', dNext);
$('d-input').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  if (dict.answered) dNext(); else dSubmit();
});
$('d-hint').addEventListener('click', () => {
  if (!dict.current) return;
  const w = dict.current.word; const input = $('d-input');
  input.disabled = false; input.value = w[0]; input.focus();
  input.setSelectionRange(1, 1);
  $('d-feedback').className = 'feedback';
  $('d-feedback').style.color = 'var(--accent)';
  $('d-feedback').textContent = `提示：${w[0]}${' _'.repeat(Math.max(0, w.length - 1))}（共 ${w.length} 个字母）`;
});
$('d-speak').addEventListener('click', () => {
  if (!dict.current) return;
  speak(dict.current.word, { rate: 0.8 });
  $('d-feedback').className = 'feedback';
  $('d-feedback').style.color = 'var(--ink-3)';
  $('d-feedback').textContent = '已播放发音（可作为提示）';
});
