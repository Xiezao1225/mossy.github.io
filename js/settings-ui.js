/* =========================================================
   设置页
   ========================================================= */
function fillSettingsUI() {
  $('set-endpoint').value = settings.endpoint || '';
  $('set-key').value = settings.key || '';
  $('set-model').value = settings.model || '';
  $('set-temp').value = settings.temperature;
  $('set-temp-val').textContent = (+settings.temperature).toFixed(2);
  $('set-grad').value = settings.wrongGraduation || 'never';
  $('set-autowrong').checked = settings.autoWrong !== false;
  renderPromptEditor('choice');
}

let currentPromptTab = 'choice';
function renderPromptEditor(tab) {
  currentPromptTab = tab;
  $('prompt-editor').value = settings.prompts[tab] || '';
  document.querySelectorAll('.prompt-tab').forEach(b => b.classList.toggle('on', b.dataset.p === tab));
}
$('prompt-tabs').addEventListener('click', e => {
  const b = e.target.closest('.prompt-tab');
  if (!b) return;
  renderPromptEditor(b.dataset.p);
});
$('set-save').addEventListener('click', () => {
  settings.endpoint = $('set-endpoint').value.trim();
  settings.key = $('set-key').value.trim();
  settings.model = $('set-model').value.trim();
  settings.temperature = +$('set-temp').value;
  settings.wrongGraduation = $('set-grad').value;
  settings.autoWrong = $('set-autowrong').checked;
  saveSettings();
  $('set-status').textContent = '配置已保存';
  $('set-status').className = 'ai-status ok';
  toast('配置已保存', 'ok');
});
$('set-temp').addEventListener('input', e => $('set-temp-val').textContent = (+e.target.value).toFixed(2));

$('set-test').addEventListener('click', async () => {
  const btn = $('set-test');
  const oldEndpoint = settings.endpoint, oldKey = settings.key, oldModel = settings.model;
  settings.endpoint = $('set-endpoint').value.trim();
  settings.key = $('set-key').value.trim();
  settings.model = $('set-model').value.trim();
  if (!settings.endpoint || !settings.key || !settings.model) {
    toast('请先填写端点、密钥和模型', 'err');
    settings.endpoint = oldEndpoint; settings.key = oldKey; settings.model = oldModel;
    return;
  }
  btn.disabled = true;
  $('set-status').textContent = '测试中…';
  $('set-status').className = 'ai-status';
  try {
    const text = await callChat([{ role: 'user', content: 'Reply with the single word: ok' }], { temperature: 0 });
    $('set-status').textContent = '连接成功 · 模型回复：' + text.slice(0, 40);
    $('set-status').className = 'ai-status ok';
    toast('连接成功', 'ok');
  } catch (err) {
    $('set-status').textContent = '连接失败：' + err.message;
    $('set-status').className = 'ai-status err';
    toast('连接失败', 'err');
  } finally {
    btn.disabled = false;
    settings.endpoint = oldEndpoint; settings.key = oldKey; settings.model = oldModel;
  }
});

$('prompt-save').addEventListener('click', () => {
  settings.prompts[currentPromptTab] = $('prompt-editor').value;
  saveSettings();
  toast('提示词已保存', 'ok');
});
$('prompt-default').addEventListener('click', () => {
  $('prompt-editor').value = DEFAULT_PROMPTS[currentPromptTab];
  toast('已恢复默认，记得保存');
});
$('prompt-reset-all').addEventListener('click', () => {
  if (!confirm('确定将所有提示词恢复默认？')) return;
  settings.prompts = { ...DEFAULT_PROMPTS };
  saveSettings();
  renderPromptEditor(currentPromptTab);
  toast('已全部恢复默认', 'ok');
});

/* 数据管理 */
$('data-export').addEventListener('click', () => {
  const dump = {
    version: 4,
    libraries: libraries.map(lib => ({
      name: lib.name, grade: lib.grade, unit: lib.unit, isKey: lib.isKey,
      words: lib.words.map(({ id, ...rest }) => rest)
    })),
    activeLibId,
    bank: bank.map(({ id, ...rest }) => rest),
    wrongBook,
    memBook,
    stats,
    marks,
    settings
  };
  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `eng_learn_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(url);
  toast('已导出', 'ok');
});

$('data-import').addEventListener('click', () => $('data-file').click());
$('data-file').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const d = JSON.parse(ev.target.result);
      if (Array.isArray(d.libraries) && d.libraries.length) {
        libraries = d.libraries.map(normalizeLibrary).filter(Boolean);
        activeLibId = libraries.some(l => l.id === d.activeLibId) ? d.activeLibId : libraries[0].id;
        saveLibraries(); renderWords();
      } else if (Array.isArray(d.words)) {
        const lib = activeLib();
        ensureIds(d.words).forEach(w => {
          if (!lib.words.some(x => x.word.toLowerCase() === w.word.toLowerCase())) {
            lib.words.push({
              id: uid(),
              word: w.word, meaning: w.meaning,
              phonetic: w.phonetic || '', example: w.example || '',
              isKey: toBool(w.isKey)
            });
          }
        });
        saveLibraries(); renderWords();
      }
      if (Array.isArray(d.bank)) {
        bank = ensureQIds(d.bank);
        saveBank(); renderBankList();
      }
      if (Array.isArray(d.wrongBook)) { wrongBook = d.wrongBook.filter(e => e && e.qid); saveWrongBook(); renderWrongBook(); }
      if (Array.isArray(d.memBook)) { memBook = d.memBook.filter(e => e && e.text); saveMemBook(); renderMemBook(); }
      if (d.stats && typeof d.stats === 'object') { stats = normalizeStats(d.stats); saveStats(); }
      if (d.marks && typeof d.marks === 'object') { marks = d.marks; saveMarks(); }
      if (d.settings) {
        settings = { ...defaultSettings(), ...d.settings, prompts: { ...DEFAULT_PROMPTS, ...(d.settings.prompts || {}) } };
        saveSettings(); fillSettingsUI();
      }
      toast('数据已导入', 'ok');
    } catch (err) {
      toast('导入失败：' + err.message, 'err');
    }
  };
  r.readAsText(f, 'utf-8');
  e.target.value = '';
});

$('data-reset').addEventListener('click', () => {
  if (!confirm('确定重置所有数据（所有词库、题库、设置）？此操作不可恢复。')) return;
  try {
    localStorage.removeItem(LIBS_KEY);
    localStorage.removeItem(LEGACY_V3_KEY);
    localStorage.removeItem(LEGACY_V2_KEY);
    localStorage.removeItem(BANK_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(LEGACY_WORDS_KEY);
    localStorage.removeItem(WRONG_KEY);
    localStorage.removeItem(MEM_KEY);
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(MARKS_KEY);
  } catch (e) {}
  location.reload();
});

function syncLibSelectors() {
  ['v-lib', 'ai-target-lib'].forEach(id => {
    const el = $(id);
    if (!el) return;
    const cur = el.value;
    el.innerHTML = libraries.map(l =>
      `<option value="${l.id}"${l.id === activeLibId ? ' selected' : ''}>${esc(l.name)} · ${l.words.length} 词</option>`
    ).join('');
    if (cur && libraries.some(l => l.id === cur)) el.value = cur;
  });
}
