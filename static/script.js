let repeatIntervalId = null;
let repeatMode = null;

function speak(text, onend) {
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.onend = onend;
  speechSynthesis.speak(utterance);
}

function startRepeat(mode) {
  stopRepeat(); // 先停止任何現有重複
  repeatMode = mode;

  if (mode === 'word') {
    repeatIntervalId = setInterval(() => {
      const word = document.getElementById('word').value.trim();
      speak(word);
    }, 2000); // 每2秒重複播放
  } else if (mode === 'sentence') {
    repeatIntervalId = setInterval(() => {
      const sentence = document.getElementById('sentence').value.trim();
      speak(sentence);
    }, 4000); // 每4秒重複播放
  } else if (mode === 'both') {
    // 先播 word 再播 sentence，一次約6秒循環
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
    }, 3000); // 每3秒切換播放單字或句子
  }
}

function stopRepeat() {
  if (repeatIntervalId) {
    clearInterval(repeatIntervalId);
    repeatIntervalId = null;
    repeatMode = null;
    speechSynthesis.cancel(); // 停止目前語音播放
  }
}

function playAllOnce() {
  stopRepeat();

  const word = document.getElementById('word').value.trim();
  const sentence = document.getElementById('sentence').value.trim();

  speak(word, () => {
    speak(sentence);
  });
}
