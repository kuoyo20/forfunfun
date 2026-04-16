/**
 * Real-time Speech Translation System
 * Uses Web Speech API for STT/TTS and WebSocket for translation.
 */
(function () {
  "use strict";

  // ── Elements ──
  const micBtn = document.getElementById("mic-btn");
  const micIcon = document.getElementById("mic-icon");
  const micOffIcon = document.getElementById("mic-off-icon");
  const micStatusText = document.getElementById("mic-status-text");
  const visualizer = document.getElementById("audio-visualizer");
  const originalText = document.getElementById("original-text");
  const interimText = document.getElementById("interim-text");
  const translatedText = document.getElementById("translated-text");
  const sourceLangSelect = document.getElementById("source-lang");
  const targetLangSelect = document.getElementById("target-lang");
  const swapBtn = document.getElementById("swap-langs");
  const autoSpeakCheckbox = document.getElementById("auto-speak");
  const continuousCheckbox = document.getElementById("continuous-mode");
  const speechRateSlider = document.getElementById("speech-rate");
  const speechRateValue = document.getElementById("speech-rate-value");
  const clearOriginalBtn = document.getElementById("clear-original");
  const clearTranslatedBtn = document.getElementById("clear-translated");
  const manualTextInput = document.getElementById("manual-text");
  const manualTranslateBtn = document.getElementById("manual-translate-btn");
  const manualSpeakBtn = document.getElementById("manual-speak-btn");
  const historyList = document.getElementById("history-list");
  const clearHistoryBtn = document.getElementById("clear-history");
  const exportHistoryBtn = document.getElementById("export-history");
  const originalLangLabel = document.getElementById("original-lang-label");
  const translatedLangLabel = document.getElementById("translated-lang-label");
  const browserWarning = document.getElementById("browser-warning");

  // ── State ──
  let isRecording = false;
  let recognition = null;
  let ws = null;
  let history = [];
  let lastTranslatedText = "";

  // ── Browser check ──
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    browserWarning.style.display = "block";
    micBtn.disabled = true;
    micStatusText.textContent = "您的瀏覽器不支援語音辨識，請使用 Chrome";
  }

  // ── WebSocket ──
  function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${protocol}//${location.host}/ws/translate`);

    ws.onopen = function () {
      console.log("WebSocket connected");
    };

    ws.onmessage = function (event) {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error("Translation error:", data.error);
        return;
      }
      displayTranslation(data);
    };

    ws.onclose = function () {
      console.log("WebSocket disconnected, reconnecting in 2s...");
      setTimeout(connectWebSocket, 2000);
    };

    ws.onerror = function (err) {
      console.error("WebSocket error:", err);
    };
  }

  function sendForTranslation(text, isFinal) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      connectWebSocket();
      setTimeout(() => sendForTranslation(text, isFinal), 500);
      return;
    }
    ws.send(
      JSON.stringify({
        text: text,
        source: sourceLangSelect.value,
        target: targetLangSelect.value,
        is_final: isFinal,
      })
    );
  }

  // ── Display ──
  function displayTranslation(data) {
    if (data.is_final) {
      // Append to original text
      appendToDisplay(originalText, data.original, "original-entry");
      appendToDisplay(translatedText, data.translated, "translated-entry");
      interimText.textContent = "";

      // Add to history
      addToHistory(data.original, data.translated, data.source_lang, data.target_lang);

      // Auto-speak
      lastTranslatedText = data.translated;
      if (autoSpeakCheckbox.checked && data.translated) {
        speakText(data.translated, data.target_lang);
      }
    } else {
      // Show interim translation
      interimText.innerHTML =
        '<span class="interim-label">辨識中：</span>' +
        escapeHtml(data.original) +
        '<br><span class="interim-label">翻譯中：</span>' +
        escapeHtml(data.translated);
    }
  }

  function appendToDisplay(container, text, className) {
    // Remove placeholder
    const placeholder = container.querySelector(".placeholder");
    if (placeholder) placeholder.remove();

    const entry = document.createElement("div");
    entry.className = className;
    entry.textContent = text;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Speech Recognition ──
  function startRecognition() {
    if (!SpeechRecognition) return;

    recognition = new SpeechRecognition();
    const selectedOption =
      sourceLangSelect.options[sourceLangSelect.selectedIndex];
    recognition.lang = selectedOption.dataset.speechCode;
    recognition.continuous = continuousCheckbox.checked;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = function () {
      isRecording = true;
      micBtn.classList.add("recording");
      micIcon.style.display = "none";
      micOffIcon.style.display = "block";
      micStatusText.textContent = "錄音中... 點擊停止";
      visualizer.style.display = "flex";
    };

    recognition.onresult = function (event) {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        sendForTranslation(finalTranscript, true);
      }
      if (interimTranscript) {
        interimText.innerHTML =
          '<span class="interim-label">辨識中：</span>' +
          escapeHtml(interimTranscript);
        sendForTranslation(interimTranscript, false);
      }
    };

    recognition.onerror = function (event) {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        micStatusText.textContent = "麥克風權限被拒絕，請允許麥克風存取";
      } else if (event.error === "no-speech") {
        micStatusText.textContent = "未偵測到語音，請再試一次";
        if (isRecording && continuousCheckbox.checked) {
          // Restart in continuous mode
          setTimeout(() => {
            if (isRecording) recognition.start();
          }, 100);
        }
      } else {
        micStatusText.textContent = `辨識錯誤: ${event.error}`;
      }
    };

    recognition.onend = function () {
      if (isRecording && continuousCheckbox.checked) {
        // Restart for continuous mode
        try {
          recognition.start();
        } catch (e) {
          setTimeout(() => {
            if (isRecording) {
              try {
                recognition.start();
              } catch (e2) {
                stopRecognition();
              }
            }
          }, 200);
        }
      } else {
        stopRecognition();
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      micStatusText.textContent = "無法啟動語音辨識";
    }
  }

  function stopRecognition() {
    isRecording = false;
    if (recognition) {
      try {
        recognition.abort();
      } catch (e) {
        // ignore
      }
    }
    micBtn.classList.remove("recording");
    micIcon.style.display = "block";
    micOffIcon.style.display = "none";
    micStatusText.textContent = "點擊麥克風開始錄音";
    visualizer.style.display = "none";
    interimText.textContent = "";
  }

  // ── Text-to-Speech ──
  function speakText(text, langCode) {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedOption =
      targetLangSelect.options[targetLangSelect.selectedIndex];
    utterance.lang = selectedOption.dataset.speechCode || langCode;
    utterance.rate = parseFloat(speechRateSlider.value);
    utterance.volume = 1;

    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(langCode));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  // ── History ──
  function addToHistory(original, translated, sourceLang, targetLang) {
    const entry = {
      original,
      translated,
      sourceLang,
      targetLang,
      timestamp: new Date().toLocaleString("zh-TW"),
    };
    history.push(entry);
    renderHistory();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML = '<p class="placeholder">尚無翻譯紀錄</p>';
      return;
    }

    historyList.innerHTML = "";
    // Show latest first
    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i];
      const sourceName =
        sourceLangSelect.querySelector(`option[value="${entry.sourceLang}"]`)
          ?.textContent || entry.sourceLang;
      const targetName =
        targetLangSelect.querySelector(`option[value="${entry.targetLang}"]`)
          ?.textContent || entry.targetLang;

      const div = document.createElement("div");
      div.className = "history-entry";
      div.innerHTML =
        '<div class="history-meta">' +
        escapeHtml(entry.timestamp) +
        " | " +
        escapeHtml(sourceName) +
        " → " +
        escapeHtml(targetName) +
        "</div>" +
        '<div class="history-original">' +
        escapeHtml(entry.original) +
        "</div>" +
        '<div class="history-translated">' +
        escapeHtml(entry.translated) +
        "</div>";
      historyList.appendChild(div);
    }
  }

  function exportHistory() {
    if (history.length === 0) return;

    let csv = "\uFEFF時間,來源語言,目標語言,原文,譯文\n";
    history.forEach((entry) => {
      csv +=
        '"' +
        entry.timestamp +
        '","' +
        entry.sourceLang +
        '","' +
        entry.targetLang +
        '","' +
        entry.original.replace(/"/g, '""') +
        '","' +
        entry.translated.replace(/"/g, '""') +
        '"\n';
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download =
      "translation_history_" +
      new Date().toISOString().slice(0, 10) +
      ".csv";
    link.click();
  }

  // ── Update Labels ──
  function updateLabels() {
    const srcOption = sourceLangSelect.options[sourceLangSelect.selectedIndex];
    const tgtOption = targetLangSelect.options[targetLangSelect.selectedIndex];
    originalLangLabel.textContent = "原文 (" + srcOption.textContent.trim() + ")";
    translatedLangLabel.textContent =
      "譯文 (" + tgtOption.textContent.trim() + ")";

    // Update recognition language if currently recording
    if (isRecording && recognition) {
      stopRecognition();
      setTimeout(startRecognition, 300);
    }
  }

  // ── Event Listeners ──
  micBtn.addEventListener("click", function () {
    if (isRecording) {
      stopRecognition();
    } else {
      connectWebSocket();
      startRecognition();
    }
  });

  swapBtn.addEventListener("click", function () {
    const srcVal = sourceLangSelect.value;
    const tgtVal = targetLangSelect.value;
    sourceLangSelect.value = tgtVal;
    targetLangSelect.value = srcVal;
    updateLabels();
  });

  sourceLangSelect.addEventListener("change", updateLabels);
  targetLangSelect.addEventListener("change", updateLabels);

  speechRateSlider.addEventListener("input", function () {
    speechRateValue.textContent = parseFloat(this.value).toFixed(1) + "x";
  });

  clearOriginalBtn.addEventListener("click", function () {
    originalText.innerHTML = '<p class="placeholder">等待語音輸入...</p>';
    interimText.textContent = "";
  });

  clearTranslatedBtn.addEventListener("click", function () {
    translatedText.innerHTML = '<p class="placeholder">等待翻譯結果...</p>';
  });

  clearHistoryBtn.addEventListener("click", function () {
    history = [];
    renderHistory();
  });

  exportHistoryBtn.addEventListener("click", exportHistory);

  // Manual input
  manualTranslateBtn.addEventListener("click", function () {
    const text = manualTextInput.value.trim();
    if (!text) return;
    connectWebSocket();
    sendForTranslation(text, true);
    manualTextInput.value = "";
  });

  manualTextInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      manualTranslateBtn.click();
    }
  });

  manualSpeakBtn.addEventListener("click", function () {
    if (lastTranslatedText) {
      speakText(lastTranslatedText, targetLangSelect.value);
    }
  });

  // Keyboard shortcut: Space to toggle recording (when not in text input)
  document.addEventListener("keydown", function (e) {
    if (
      e.code === "Space" &&
      e.target.tagName !== "INPUT" &&
      e.target.tagName !== "TEXTAREA" &&
      e.target.tagName !== "SELECT"
    ) {
      e.preventDefault();
      micBtn.click();
    }
  });

  // Load voices
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = function () {
      window.speechSynthesis.getVoices();
    };
  }

  // Init labels
  updateLabels();

  // Auto-connect WebSocket
  connectWebSocket();
})();
