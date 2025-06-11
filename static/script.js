let repeatMode = null;
let isSpeaking = false; // 👈 旗標避免重疊播放

/**
 * 播放文字語音
 * @param {string} text - 要朗讀的文字
 * @param {function|null} onend - 播放結束後要執行的動作
 * @param {string} lang - 語言代碼，如 en-US, zh-TW, ja-JP
 */
function speak(text, onend = null, lang = 'en-US') {
  if (!text || isSpeaking) {
    return;
  }

  isSpeaking = true; // 👈 正在播放
  speechSynthesis.cancel(); // 取消現有播放

  // 從 input 讀取使用者設定的延遲時間（預設為 3000 毫秒）
  const delayInput = document.getElementById('delay');
  const delay = parseInt(delayInput?.value || '3000');

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;

  let ended = false;

  // 播完後執行 callback
  utterance.onend = () => {
    ended = true;
    isSpeaking = false; // ✅ 結束播放
    if (onend) {
      setTimeout(onend, delay);
    }
  };

  speechSynthesis.speak(utterance);

  // 安全機制：如果 onend 沒被觸發，delay 毫秒後強制執行
  setTimeout(() => {
    if (!ended && onend) {
      isSpeaking = false; // ✅ 重設旗標
      setTimeout(onend, delay);
    }
  }, delay);
}

/**
 * 啟動重複播放模式
 * @param {string} mode - EN / CH / JP / all
 */
function startRepeat(mode) {
  stopRepeat();
  repeatMode = mode;

  if (mode === 'EN') {
    const repeat = () => {
      if (repeatMode !== 'EN') return;
      const text = document.getElementById('EN').value.trim();
      speak(text, repeat, 'en-US');
    };
    repeat();

  } else if (mode === 'CH') {
    const repeat = () => {
      if (repeatMode !== 'CH') return;
      const text = document.getElementById('CH').value.trim();
      speak(text, repeat, 'zh-TW');
    };
    repeat();

  } else if (mode === 'JP') {
    const repeat = () => {
      if (repeatMode !== 'JP') return;
      const text = document.getElementById('JP').value.trim();
      speak(text, repeat, 'ja-JP');
    };
    repeat();

  } else if (mode === 'all') {
    const playSequence = () => {
      if (repeatMode !== 'all') return;

      const steps = [
        { text: document.getElementById('EN').value.trim(), lang: 'en-US' },
        { text: document.getElementById('CH').value.trim(), lang: 'zh-TW' },
        { text: document.getElementById('JP').value.trim(), lang: 'ja-JP' },
      ];

      let index = 0;

      const playNext = () => {
        if (repeatMode !== 'all') return;

        if (index >= steps.length) {
          setTimeout(playSequence, 1000); // 播完一輪後等 1 秒再重播
          return;
        }

        const { text, lang } = steps[index++];
        if (text) {
          speak(text, playNext, lang);
        } else {
          playNext(); // 若空字串則跳過
        }
      };

      playNext();
    };

    playSequence();
  }
}

/**
 * 停止播放
 */
function stopRepeat() {
  repeatMode = null;
  speechSynthesis.cancel();
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

  // 記錄進 dataset
  const date = entry.date || new Date().toISOString().slice(0, 10);
  const time = entry.time || new Date().toTimeString().slice(0, 8);
  block.dataset.date = date;
  block.dataset.time = time;

  block.innerHTML = `
    <div style="font-size: 11px; color: gray;">🆔 ${key || '(未指定)'}</div>
    <div data-field="EN"><strong>ENGLISH:</strong> ${entry.EN}</div>
    <div data-field="CH"><strong>中文:</strong> ${entry.CH}</div>
    <div data-field="JP"><strong>日文:</strong> ${entry.JP}</div>
    <div style="font-size: 12px; color: gray;">🕒 ${date} ${time}</div>
    ${key !== null ? `<button onclick="deleteEntry('${key}', this)">DELETE</button>` : ''}
  `;

  block.ondblclick = () => {
    document.getElementById('EN').value = entry.EN;
    document.getElementById('CH').value = entry.CH;
    document.getElementById('JP').value = entry.JP;
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
  const EN = document.getElementById('EN').value;
  const CH = document.getElementById('CH').value;
  const JP = document.getElementById('JP').value;

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
    body: JSON.stringify({ EN, CH, JP, email })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadSavedEntries(); // 重新排序顯示區塊
    });
}

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
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

function downloadJSON() {
  const blocks = document.querySelectorAll('.entry-block');
  const data = [];

  blocks.forEach(block => {
    const EN = block.querySelector('[data-field="EN"]')?.textContent.replace('ENGLISH:', '').trim() || '';
    const CH = block.querySelector('[data-field="CH"]')?.textContent.replace('中文:', '').trim() || '';
    const JP = block.querySelector('[data-field="JP"]')?.textContent.replace('日文:', '').trim() || '';

    const date = block.dataset.date || new Date().toISOString().slice(0, 10);
    const time = block.dataset.time || new Date().toTimeString().slice(0, 8);

    data.push({ EN, CH, JP, date, time });
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'my_vocabulary.json';
  a.click();

  URL.revokeObjectURL(url);
}

function uploadJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error("不是合法的 JSON 陣列");

      const email = window.loggedInEmail;
      if (!email) {
        alert("請先登入再上傳！");
        return;
      }

      const uploadPromises = [];

      for (const entry of data) {
        const { EN, CH, JP, date, time } = entry;
        if (!EN && !CH && !JP) continue;

        const payload = { EN, CH, JP, date, time, email };

        uploadPromises.push(
          fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).then(res => res.json())
        );
      }

      // 等所有上傳完成後再顯示
      Promise.all(uploadPromises).then(results => {
        loadSavedEntries(); // ✅ 一次性刷新畫面
        alert(`成功匯入 ${results.length} 筆資料`);
      });

    } catch (err) {
      alert('上傳的 JSON 格式錯誤！');
      console.error(err);
    }
  };

  reader.readAsText(file);
}





// 接收 Google 登入後的使用者資訊
window.handleCredentialResponse = function (response) {
  const decoded = parseJwt(response.credential);
  const email = decoded.email;

  // ✅ 顯示登入狀態
  const infoDiv = document.createElement('div');
  infoDiv.textContent = `已登入帳號：${email}`;
  document.body.insertBefore(infoDiv, document.body.firstChild);

  // ✅ 隱藏登入按鈕
  const signinBtn = document.getElementById("g-signin-btn");
  if (signinBtn) signinBtn.style.display = "none";

  // ✅ 儲存登入狀態
  window.loggedInEmail = email;
  localStorage.setItem("user_email", email);

  loadSavedEntries();
};

// ✅ 頁面載入時自動讀取登入資訊
window.onload = function () {

  // 清除任何殘留的語音播放狀態
  speechSynthesis.cancel();

  // 也可選：播放一個靜音語音來初始化（避免第一次播放被瀏覽器丟掉）
  const dummy = new SpeechSynthesisUtterance('');
  dummy.volume = 0;
  speechSynthesis.speak(dummy);

  const savedEmail = localStorage.getItem("user_email");
  if (savedEmail) {
    window.loggedInEmail = savedEmail;

    // 顯示帳號
    const infoDiv = document.createElement('div');
    infoDiv.textContent = `已登入帳號：${savedEmail}`;
    document.body.insertBefore(infoDiv, document.body.firstChild);

    // 隱藏登入按鈕
    const signinBtn = document.querySelector(".g_id_signin");
    if (signinBtn) signinBtn.style.display = "none";

    loadSavedEntries();
  }
};
