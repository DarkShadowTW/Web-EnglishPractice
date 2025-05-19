// 讓文字雙擊可編輯，按 Enter 儲存
function editText(element) {
  const originalText = element.textContent;
  element.contentEditable = true;
  element.focus();

  function saveEdit(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      element.contentEditable = false;
      element.removeEventListener('keydown', saveEdit);
      alert(`已儲存: ${element.textContent}`);
    }
    if (event.key === "Escape") {
      element.textContent = originalText;
      element.contentEditable = false;
      element.removeEventListener('keydown', saveEdit);
    }
  }

  element.addEventListener('keydown', saveEdit);
}

// 用 SpeechSynthesis 朗讀字串陣列，並依序播放
function playAll() {
  const texts = [];

  // 取得所有 class 是 word 或 sentence 的元素文字
  document.querySelectorAll('.word, .sentence').forEach(el => {
    const text = el.textContent.trim();
    if (text) texts.push(text);
  });

  if (texts.length === 0) {
    alert("沒有文字可播放！");
    return;
  }

  let i = 0;

  function speakNext() {
    if (i >= texts.length) {
      console.log("全部播放完成！");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(texts[i]);
    utterance.onend = () => {
      i++;
      speakNext();
    };
    utterance.onerror = (e) => {
      console.error("播放錯誤:", e);
      i++;
      speakNext();
    };

    speechSynthesis.speak(utterance);
  }

  speakNext();
}
