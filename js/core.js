/* =========================================================
   基础工具
   ========================================================= */
const $ = id => document.getElementById(id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rand = n => Math.floor(Math.random() * n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const toBool = v => v === true || v === 'true' || v === 1 || v === '1';

let toastTimer = null;
function toast(msg, type = '') {
  const el = $('toast');
  el.textContent = msg;
  el.className = 'show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 2600);
}

/* =========================================================
   语音合成
   ========================================================= */
const TTS_OK = 'speechSynthesis' in window;
let voices = [];

function speak(text, opts = {}) {
  if (!TTS_OK) { toast('当前浏览器不支持语音合成', 'err'); return null; }
  try { speechSynthesis.cancel(); } catch (e) {}
  const u = new SpeechSynthesisUtterance(text);
  u.lang  = opts.lang  || 'en-US';
  u.rate  = opts.rate  ?? 0.9;
  u.pitch = opts.pitch ?? 1;
  if (opts.voice) u.voice = opts.voice;
  if (opts.onstart) u.onstart = opts.onstart;
  if (opts.onend)   u.onend   = opts.onend;
  if (opts.onerror) u.onerror = opts.onerror;
  speechSynthesis.speak(u);
  return u;
}

function loadVoices() {
  if (!TTS_OK) return;
  const all = speechSynthesis.getVoices();
  if (!all.length) return;
  let en = all.filter(v => /^en/i.test(v.lang));
  if (!en.length) en = all;
  en.sort((a, b) => {
    const score = v => (v.localService ? 0 : 2) + (/^en-US/i.test(v.lang) ? 0 : 1);
    return score(a) - score(b);
  });
  voices = en;
  const sel = $('v-voice');
  if (sel) sel.innerHTML = voices.map((v, i) =>
    `<option value="${i}">${esc(v.name)} — ${esc(v.lang)}${v.localService ? ' · 本地' : ''}</option>`
  ).join('');
}
if (TTS_OK) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
  setTimeout(loadVoices, 300);
  setTimeout(loadVoices, 1000);
}

/* 听力脚本播放：识别 W:/M: 说话人标签，用不同音调区分 */
let listeningToken = 0;
async function playListeningScript(script, onDone) {
  if (!TTS_OK) { toast('当前浏览器不支持语音合成', 'err'); return; }
  const my = ++listeningToken;
  try { speechSynthesis.cancel(); } catch (e) {}
  if (onDone) onDone('start');

  const lines = String(script || '').split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (my !== listeningToken) return;
    const match = line.match(/^([WM])\s*[:：]\s*(.+)$/i);
    let speaker = null, text = line;
    if (match) { speaker = match[1].toUpperCase(); text = match[2]; }
    await new Promise(resolve => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.82;
      u.pitch = speaker === 'W' ? 1.18 : speaker === 'M' ? 0.85 : 1;
      u.onend = resolve;
      u.onerror = resolve;
      try { speechSynthesis.speak(u); } catch (e) { resolve(); }
    });
    await new Promise(r => setTimeout(r, 280));
  }
  if (my === listeningToken && onDone) onDone('end');
}
function stopListening() {
  listeningToken++;
  if (TTS_OK) { try { speechSynthesis.cancel(); } catch (e) {} }
}

/* =========================================================
   设置
   ========================================================= */
const SETTINGS_KEY = 'eng_settings_v3';

const DEFAULT_PROMPTS = {
  choice: `你是一位英语教师。根据用户要求生成单项选择题目。
只返回 JSON 数组，不含 Markdown 代码块，不含解释文字。

格式：
[
  {
    "question": "英文题干",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": "正确选项（与某个选项完全一致）",
    "explanation": "中文解析",
    "word": "核心词汇",
    "meaning": "单词释义",
    "phonetic": "/音标/",
    "example": "例句",
    "difficulty": 3
  }
]

difficulty 为 1-5 整数。题干用英文，解析用中文。`,

  reading: `你是一位英语教师。生成阅读理解题，每篇需要 3-5 个小题。
只返回 JSON 数组，不含 Markdown 代码块。

格式：
[
  {
    "level": "A",
    "title": "文章标题",
    "passage": "英文文章（A级约150词，B级200词，C级260词，D级320词左右）",
    "questions": [
      {
        "question": "英文题目",
        "options": ["A选项", "B选项", "C选项", "D选项"],
        "answer": "正确选项",
        "explanation": "中文解析"
      }
    ],
    "difficulty": 3
  }
]

level 取 A/B/C/D，难度依次递增，词汇与句式相应变难。`,

  cloze: `你是一位英语教师。生成综合填空题（一篇小短文 + 10个空格）。
只返回 JSON 数组，不含 Markdown 代码块。

格式：
[
  {
    "passage": "英文短文，用 ___ 表示每个空格（按顺序与 blanks 一一对应）。短文长度约 150-220 词，综合考察词汇、语法、搭配、上下文逻辑。",
    "blanks": [
      {
        "options": ["选项A", "选项B", "选项C", "选项D"],
        "answer": "正确选项（必须与某个选项完全一致）",
        "pos": "该空答案的词性：名词/动词/形容词/副词/数词等；若答案是代词、介词或连词则填 \"\"",
        "explanation": "中文解析（说明考点）"
      }
    ],
    "difficulty": 3
  }
]

要求：
1. passage 中的 ___ 数量必须与 blanks 数组长度一致（建议 10 个空）。
2. 每个空必须有 4 个选项（ABCD），option 与 answer 完全一致。
3. 综合考察：词义辨析、固定搭配、语法结构、上下文逻辑等。
4. 短文题材与用户给定主题一致。
5. 每个空必须给出 pos 字段（该空答案的词性），取值只能是：名词 / 动词 / 形容词 / 副词 / 数词 / 冠词 / 代词 / 介词 / 连词。当该空答案是代词、介词或连词时，pos 必须为空字符串 ""。
6. pos 用于学生自由填词（非四选一）时的提示，会显示成「（名词）」这样的标签，请务必判断准确，避免同一个空出现多种可接受答案。`,

  verb: `你是一位英语教师。生成动词填空题（一篇小短文 + 10个空格）。
只返回 JSON 数组，不含 Markdown 代码块。

格式：
[
  {
    "sentences": [
      {
        "text": "He ___ (go) to school yesterday.",
        "answer": "went",
        "hint": "go",
        "explanation": "一般过去时，go 的过去式是 went"
      }
    ],
    "difficulty": 3
  }
]

要求：
1. 每个句子中用 ___ 表示填空位置，括号内为动词原形（hint 字段）。
2. 建议一次生成 10 个句子，围绕一个主题，形成连贯的短文。
3. answer 必须是动词的正确形式（如 went / has gone / to go 等）。
4. 考点涵盖时态、语态、非谓语、情态动词等。`,

  listening: `你是一位英语教师。根据用户要求生成中考听力题。
只返回 JSON 数组，不含 Markdown 代码块。

根据 listeningSubType 生成以下四类之一：

【1】short_dialogue（短对话问答）——5组对话，每组一段短对话配1道ABC选择题
格式：
[
  {
    "type": "listening",
    "subType": "short_dialogue",
    "instructions": "听录音两遍，从ABC三个选项中选出能回答所给句子的正确答案。",
    "prepTime": 30,
    "items": [
      {
        "script": "W: How are you doing today?\\nM: I'm fine, thank you. And you?",
        "question": "What does the man mean?",
        "options": ["A. He is fine.", "B. He is busy.", "C. He is tired."],
        "answer": "A",
        "explanation": "男士回答 fine，故选 A。"
      }
    ],
    "difficulty": 3
  }
]

【2】long_dialogue（长对话理解）——1段较长对话配 3-5 道 ABC 选择题
格式：
[
  {
    "type": "listening",
    "subType": "long_dialogue",
    "instructions": "听录音两遍，从ABC三个选项中选出正确答案。",
    "prepTime": 30,
    "script": "W: Hello Tom, how was your weekend?\\nM: It was great! I went hiking...",
    "questions": [
      {"question": "What did Tom do on the weekend?", "options": ["A. He went hiking.", "B. He watched a movie.", "C. He stayed at home."], "answer": "A", "explanation": "Tom 说 I went hiking，故选 A。"}
    ],
    "difficulty": 3
  }
]

【3】table（听力填表）——1段独白配表格填空
格式：
[
  {
    "type": "listening",
    "subType": "table",
    "instructions": "听录音两遍，完成下面的表格。",
    "prepTime": 30,
    "script": "Hello, everyone. Here is the plan for our school trip...",
    "title": "A School Trip Plan",
    "columns": ["Time", "Activity", "Place"],
    "rows": [
      ["8:00 AM", "meet at school gate", "school gate"],
      ["9:00 AM", "___", "science museum"]
    ],
    "blanks": [
      {"row": 1, "col": 1, "answer": "visit the science museum", "explanation": "9点到科学博物馆参观"}
    ],
    "difficulty": 3
  }
]

【4】sentence（听句子选答语）——5 个独立句子，每句配 1 道 ABC 应答选择题（听到句子后选出正确应答）
格式：
[
  {
    "type": "listening",
    "subType": "sentence",
    "instructions": "听下面 5 个句子，从ABC三个选项中选出正确的应答语。",
    "prepTime": 30,
    "items": [
      {
        "script": "Thank you very much.",
        "question": "听句子，选出正确的应答语。",
        "options": ["A. You're welcome.", "B. Not at all.", "C. I'm sorry."],
        "answer": "A",
        "explanation": "对方致谢，应答 You're welcome。"
      }
    ],
    "difficulty": 3
  }
]

注意事项：
- script 中用 W:/M: 区分说话人（W 为女声，M 为男声），用 \\n 换行。
- short_dialogue 的 items 数量必须为 5。
- sentence 的 items 数量必须为 5，script 为听到的句子原文，options 为 3 个应答语。
- long_dialogue 的 questions 数量 3-5。
- table 模式：rows 是二维数组；blanks 里的 row/col 为 0 起始索引，用 ___ 表示要填的空。
- answer 可以是选项字母（如 "A"）或选项文本。`,

  writing: `你是一位英语教师。生成作文题。
只返回 JSON 数组，不含 Markdown 代码块。

格式：
[
  {
    "prompt": "作文题目与要求（中文描述，含字数要求）",
    "hints": ["写作提示1", "写作提示2"],
    "sample": "参考范文（英文，可选）",
    "difficulty": 3
  }
]`,

  seven: `你是一位英语教师。生成阅读七选五（六选五）题目。
只返回 JSON 数组，不含 Markdown 代码块，不含解释文字。

格式：
[
  {
    "title": "短文标题",
    "passage": "一篇短文，含 5 个空，用 ___ 表示（共 5 个）",
    "blanks": [
      {
        "options": ["A 句", "B 句", "C 句", "D 句", "E 句", "F 句", "G 句"],
        "answer": "该空的正确句子（必须与 options 中某一项完全一致）",
        "explanation": "中文解析"
      }
    ],
    "difficulty": 3
  }
]

要求：
1. 先给出 7 个备选句子 A-G（5 个入文、2 个干扰），再把它们填入短文的 5 个空。
2. passage 中 ___ 的数量必须等于 blanks 数量（5 个）。
3. 每个 blank 的 options 必须是同一组 7 个句子（按 A 到 G 顺序），answer 为该空应填的句子原文。
4. 选项通常是完整句子或小标题，长度相近、与上下文衔接自然。
5. 短文题材与用户给定主题一致。`,

  fillgap: `你是一位英语教师。生成短文填空题（首字母 / 语境填词）。
只返回 JSON 数组，不含 Markdown 代码块，不含解释文字。

格式：
[
  {
    "passage": "一篇短文，含 10 个空，用 ___ 表示（共 10 个）",
    "blanks": [
      {
        "answer": "该空的单词（原文形式）",
        "hint": "答案的首字母，小写，如 w",
        "pos": "词性：名词/动词/形容词/副词/数词等；代词、介词、连词填 \"\"",
        "explanation": "中文解析"
      }
    ],
    "difficulty": 3
  }
]

要求：
1. passage 中 ___ 的数量必须等于 blanks 数量（建议 10 个）。
2. 不要提供 options 字段，学生要根据语境与首字母自己填写单词。
3. hint 必须是 answer 的首字母（小写）。
4. 考查词汇与固定搭配，答案为单个单词，且在语境中唯一。`,

  readanswer: `你是一位英语教师。生成阅读表达题（根据文章回答问题）。
只返回 JSON 数组，不含 Markdown 代码块，不含解释文字。

格式：
[
  {
    "title": "短文标题",
    "passage": "一篇 200-260 词的短文",
    "questions": [
      {
        "question": "英文问题",
        "answer": "参考答案（英文完整句或短语；也可用数组给出多种可接受答案）",
        "explanation": "中文解析 / 定位原文的依据"
      }
    ],
    "difficulty": 3
  }
]

要求：
1. 短文中必须能找到答案依据，问题顺序与文章信息顺序一致。
2. 生成 3-4 个问题；问题用英文，参考答案用英文，答案要简明，不要整段抄原文。
3. answer 可以是字符串或字符串数组（数组表示多种可接受答案）。
4. 短文题材与用户给定主题一致。`,

  analysis: `你是一位耐心的英语老师。学生做错了一道题，请给出详细解析。

要求：
1. 先指出正确答案和学生的错误
2. 解释为什么正确答案是对的，学生答案错在哪里
3. 补充相关知识点、易混词或语法点
4. 用中文，语气鼓励，300 字以内

请直接输出解析内容，不要使用 Markdown 大标题，可用短句和换行。`,

  appreciation: `你是一位资深英语写作教师。请批改学生的英语作文。

请按以下结构输出（用中文）：

【总分】X / 20
【内容】对内容完成度、切题程度的评价
【结构】对文章组织和逻辑的评价
【语言】对语法、词汇、句式的评价，指出具体错误
【亮点】1-2 个写得好的地方
【改进】1-2 条具体建议
【范文】给出一个更地道的参考版本

请直接输出，不要 Markdown 大标题。`
};

let settings = null;
function defaultSettings() {
  return { endpoint: '', key: '', model: '', temperature: 0.7, wrongGraduation: 'never', autoWrong: true, prompts: { ...DEFAULT_PROMPTS } };
}
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        endpoint: s.endpoint || '', key: s.key || '', model: s.model || '',
        temperature: typeof s.temperature === 'number' ? s.temperature : 0.7,
        wrongGraduation: ['never','once','twice'].includes(s.wrongGraduation) ? s.wrongGraduation : 'never',
        autoWrong: s.autoWrong !== false,
        prompts: { ...DEFAULT_PROMPTS, ...(s.prompts || {}) }
      };
    }
  } catch (e) {}
  return defaultSettings();
}
function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
}
function buildChatURL(endpoint) {
  let url = String(endpoint || '').trim().replace(/\/+$/, '');
  if (!url) return '';
  if (/\/chat\/completions$/i.test(url)) return url;
  if (/\/v\d+$/i.test(url)) return url + '/chat/completions';
  return url + '/v1/chat/completions';
}
async function callChat(messages, opts = {}) {
  if (!settings.endpoint) throw new Error('请先在「设置」中配置 API 端点');
  if (!settings.key)      throw new Error('请先在「设置」中配置 API Key');
  if (!settings.model)    throw new Error('请先在「设置」中配置模型');
  const url = buildChatURL(settings.endpoint);
  const body = {
    model: settings.model, messages,
    temperature: opts.temperature ?? settings.temperature ?? 0.7,
    stream: false
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.key}` },
    body: JSON.stringify(body), signal: opts.signal
  });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.text()).slice(0, 400); } catch (e) {}
    throw new Error(`HTTP ${res.status} ${res.statusText}${detail ? ' · ' + detail : ''}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('响应中没有 message.content');
  return String(content);
}
function extractJSON(text) {
  let s = String(text || '').trim();
  if (!s) throw new Error('AI 返回内容为空');
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  try { return JSON.parse(s); } catch (e) {}
  const start = s.indexOf('{'); const end = s.lastIndexOf('}');
  if (start !== -1 && end > start) { try { return JSON.parse(s.slice(start, end + 1)); } catch (e) {} }
  const aStart = s.indexOf('['); const aEnd = s.lastIndexOf(']');
  if (aStart !== -1 && aEnd > aStart) { try { return JSON.parse(s.slice(aStart, aEnd + 1)); } catch (e) {} }
  throw new Error('无法解析 AI 返回的 JSON，请检查模型是否支持指令跟随');
}
