const vocab = [
  { word: "apple", sentence: "I eat an apple every day." },
  { word: "run", sentence: "She likes to run in the morning." },
];

function createVocabUI() {
  const list = document.getElementById("vocab-list");
  vocab.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "word-block";
    div.innerHTML = `
      <strong>${item.word}</strong><br>
      ${item.sentence}<br>
      <button onclick="speak('${item.word}')">🔊 Word</button>
      <button onclick="speak('${item.sentence}')">🔊 Sentence</button>
    `;
    list.appendChild(div);
  });
}

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  speechSynthesis.speak(utter);
}

function playAll() {
  vocab.forEach((item, i) => {
    const delay = i * 3000; // 3秒間隔
    setTimeout(() => {
      speak(item.word);
      setTimeout(() => speak(item.sentence), 1500);
    }, delay);
  });
}

createVocabUI();
