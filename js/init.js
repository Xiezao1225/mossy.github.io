/* =========================================================
   初始化
   ========================================================= */
(function init() {
  settings = loadSettings();
  fillSettingsUI();

  loadLibraries();
  listenSel = new Set([activeLibId]);
  dictSel = new Set([activeLibId]);
  aiSel = new Set([activeLibId]);

  loadWrongBook();
  loadMemBook();
  loadStats();
  loadMarks();
  renderWrongBook();
  renderMemBook();

  renderWords();
  bank = loadBank();
  renderBankList();

  document.querySelectorAll('#d-feedback').forEach(el => el.style.color = '');
  $('add-isk-label').classList.toggle('on', $('add-isk').checked);

  // AI 出题页初始化显隐
  $('ai-reading-level-wrap').style.display = 'none';
  $('ai-listening-sub-wrap').style.display = 'none';

  if (!TTS_OK) toast('当前浏览器不支持语音合成', 'err');
})();
