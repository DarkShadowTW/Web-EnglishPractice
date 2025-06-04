/**
 * 目的 : 儲存重複播放的 interval ID 和模式
 * 給誰呼叫 : 全域變數初始化
 */
let repeatIntervalId = null;
let repeatMode = null;

/**
 * 目的 : 使用語音 API 播放指定文字
 * 給誰呼叫 : playAllOnce、startRepeat 內部呼叫
 */
function speak(text, onend) {
  if (!text) return;
  speechSynthesis.cancel();  // ← 這行是重點
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.onend = onend;
  speechSynthesis.speak(utterance);
}



/**
 * 目的 : 啟動重複播放模式（單字、句子、單字+句子、單字+句子+中文）
 * 給誰呼叫 : 按鈕點擊事件，如 startRepeat('word')、startRepeat('sentence') 等
 */
function startRepeat(mode) {
  stopRepeat();           // 停止任何現有的語音播放循環
  repeatMode = mode;      // 記錄當前模式

  if (mode === 'word') {
    // 每 2 秒重複播放單字
    repeatIntervalId = setInterval(() => {
      const word = document.getElementById('word').value.trim();
      speak(word);
    }, 2000);

  } else if (mode === 'sentence') {
    // 每 4 秒重複播放句子
    repeatIntervalId = setInterval(() => {
      const sentence = document.getElementById('sentence').value.trim();
      speak(sentence);
    }, 4000);

  } else if (mode === 'both') {
    // 單字與句子交替播放，每 3 秒切換一次
    let playWord = true;
    repeatIntervalId = setInterval(() => {
      if (playWord) {
        const word = document.getElementById('word').value.trim();
        speak(word);
      } else {
        const sentence = document.getElementById('sentence').value.trim();
        speak(sentence);
      }
      playWord = !playWord;
    }, 3000);

  } else if (mode === 'all') {
    // 啟動完整播放序列：單字 → 句子 → 中文（自動循環）

    const playSequence = () => {
      const word = document.getElementById("word").value.trim();
      const sentence = document.getElementById("sentence").value.trim();
      const chinese = document.getElementById("chinese").value.trim();

      speakText(word, 'en-US', function () {
        speakText(sentence, 'en-US', function () {
          speakText(chinese, 'zh-TW', function () {
            if (repeatMode === 'all') {
              setTimeout(playSequence, 1000); // 1 秒後繼續循環
            }
          });
        });
      });
    };

    playSequence(); // 第一次呼叫開始循環
  }
}


/**
 * 目的 : 停止所有語音重複播放
 * 給誰呼叫 : startRepeat, playAllOnce
 */
function playAll() {
  stopRepeat(); // 停止先前的重複播放（如果有）

  repeatMode = 'all'; // 設定模式

  const playSequence = () => {
    const word = document.getElementById("word").value;
    const sentence = document.getElementById("sentence").value;
    const chinese = document.getElementById("chinese").value;

    speakText(word, 'en-US', function () {
      speakText(sentence, 'en-US', function () {
        speakText(chinese, 'zh-TW', function () {
          // 完成一次播放後等待 1 秒再重播
          if (repeatMode === 'all') {
            setTimeout(playSequence, 1000);
          }
        });
      });
    });
  };

  playSequence(); // 啟動首次播放
}


/**
 * 目的 : 播放一次 Word ➜ Sentence
 * 給誰呼叫 : 按鈕點擊事件
 */
function playAllOnce() {
  stopRepeat();

  const word = document.getElementById('word').value.trim();
  const sentence = document.getElementById('sentence').value.trim();

  speak(word, () => {
    speak(sentence);
  });
}

/**
 * 目的 : 播放 Word ➜ Sentence ➜ 中文，支援語系切換
 * 給誰呼叫 : playAll 按鈕點擊事件
 */
function speakText(text, lang = 'en-US', onend = null) {
  if (!text) return;
  speechSynthesis.cancel();  // ← 同樣要加這行
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  if (onend) utterance.onend = onend;
  speechSynthesis.speak(utterance);
}

/**
 * 目的 : 依序播放 Word ➜ Sentence ➜ 中文發音
 * 給誰呼叫 : 按鈕點擊事件
 */
function playAll() {
  startRepeat('all');
}

/**
 * 目的 : 將一筆儲存項目插入畫面中（最上方）
 * 給誰呼叫 : loadSavedEntries、saveEntry 呼叫
 */
function insertEntryBlock(entry, key = null) {
  const container = document.getElementById('saved-entries');
  const block = document.createElement('div');
  block.className = 'entry-block';
  block.style.border = '1px solid gray';
  block.style.padding = '10px';
  block.style.marginBottom = '10px';
  block.style.cursor = 'pointer';

  block.innerHTML = `
    <div><strong>Word:</strong> ${entry.word}</div>
    <div><strong>Sentence:</strong> ${entry.sentence}</div>
    <div><strong>中文:</strong> ${entry.chinese}</div>
    ${key !== null ? `<button onclick="deleteEntry('${key}', this)">DELETE</button>` : ''}
  `;

  block.ondblclick = () => {
    document.getElementById('word').value = entry.word;
    document.getElementById('sentence').value = entry.sentence;
    document.getElementById('chinese').value = entry.chinese;
  };

  container.insertBefore(block, container.firstChild);
}

/**
 * 目的 : 載入所有儲存資料並顯示於畫面下方（依 ID 降冪排序）
 * 給誰呼叫 : 頁面載入時或手動呼叫
 */
function loadSavedEntries() {
  const email = window.loggedInEmail;
  if (!email) return;

  fetch('/load', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('saved-entries');
      container.innerHTML = '';

      const entries = Object.entries(data).sort((a, b) => {
        const dateA = new Date(`${a[1].date}T${a[1].time}`);
        const dateB = new Date(`${b[1].date}T${b[1].time}`);
        return dateB - dateA;
      });

      for (const [key, entry] of entries) {
        insertEntryBlock(entry, key);
      }
    });
}


/**
 * 目的 : 刪除指定儲存資料並從畫面移除
 * 給誰呼叫 : 由 DELETE 按鈕觸發
 */
function deleteEntry(key, btn) {
  const email = window.loggedInEmail;
  if (!email) {
    alert("請先登入後再刪除！");
    return;
  }

  fetch(`/delete/${key}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      const block = btn.parentElement;
      block.remove();
    });
}


/**
 * 目的 : 儲存使用者輸入的 word/sentence/chinese 到伺服器，並附加登入 email
 * 給誰呼叫 : 按鈕 onclick="saveEntry()"
 */
function saveEntry() {
  const word = document.getElementById('word').value;
  const sentence = document.getElementById('sentence').value;
  const chinese = document.getElementById('chinese').value;

  // 取得登入的使用者 email
  const email = window.loggedInEmail;
  if (!email) {
    alert("請先使用 Google 帳號登入後再儲存！");
    return;
  }

  // 傳送到後端
  fetch('/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ word, sentence, chinese, email })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadSavedEntries(); // 重新排序顯示區塊
    });
}


// 接收 Google 登入後的使用者資訊
function onGoogleSignIn(response) {
  const credential = response.credential;

  // 將 JWT 解析為 JSON（只要 email）
  const payload = JSON.parse(atob(credential.split('.')[1]));
  const email = payload.email;

  // 顯示登入狀態
  const infoDiv = document.createElement('div');
  infoDiv.textContent = `已登入帳號：${email}`;
  document.body.insertBefore(infoDiv, document.body.firstChild);

  // 記住 email（後續送到後端）
  window.loggedInEmail = email;
}

function logout() {
  // 清除登入資訊
  localStorage.removeItem("user_email");
  window.loggedInEmail = null;

  // 移除顯示帳號的區塊（假設只有一個帳號資訊在最上方）
  const infoDiv = document.querySelector('body > div');
  if (infoDiv) infoDiv.remove();

  // 顯示登入按鈕
  const signinBtn = document.getElementById("g-signin-btn");
  if (signinBtn) signinBtn.style.display = "block";

  // 清空已儲存項目顯示
  document.getElementById("saved-entries").innerHTML = "";
}


function handleCredentialResponse(response) {
  const decoded = parseJwt(response.credential);
  console.log("登入成功：", decoded);
  window.loggedInEmail = decoded.email;
  document.getElementById("g-signin-btn").style.display = "none";

  // ✅ 儲存 email 到 localStorage
  localStorage.setItem("user_email", decoded.email);

  // ✅ 顯示登入狀態
  const infoDiv = document.createElement('div');
  infoDiv.textContent = `已登入帳號：${decoded.email}`;
  document.body.insertBefore(infoDiv, document.body.firstChild);

  // 載入該使用者的資料
  loadSavedEntries();
}


// ✅ 頁面載入時自動執行載入資料
window.onload = function () {
  const savedEmail = localStorage.getItem("user_email");
  if (savedEmail) {
    window.loggedInEmail = savedEmail;

    const signinBtn = document.getElementById("g-signin-btn");
    if (signinBtn) signinBtn.style.display = "none";

    const infoDiv = document.createElement('div');
    infoDiv.textContent = `已登入帳號：${savedEmail}`;
    document.body.insertBefore(infoDiv, document.body.firstChild);

    loadSavedEntries();
  }
};

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

function stopRepeat() {
  if (repeatIntervalId) {
    clearInterval(repeatIntervalId);
    repeatIntervalId = null;
  }
  repeatMode = null;
  speechSynthesis.cancel();  // 停止任何播放中語音
}
