document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("waveform");
  const ctx = canvas.getContext("2d");

  canvas.width = 1450;
  canvas.height = 600;

  const audio = document.getElementById("audio");
  const playbtn = document.getElementById("playbtn");
  const pausebtn = document.getElementById("pausebtn");
  const micbtn = document.getElementById("startmic");
  const fileInput = document.getElementById("fileInput");

  // CONTROLS
  const modeToggle = document.getElementById("modeToggle");      // smooth / raw
  const colorPicker = document.getElementById("colorPicker");    // color
  const glowSlider = document.getElementById("glowSlider");      // glow
  const autoColorToggle = document.getElementById("autoColorToggle"); // auto colour

  let audioContext;
  let analyser;
  let dataArray;
  let smoothData;
  let source = null;
  let micSource = null;
  let isPlaying = false;
  let currentInput = "file"; // "file" or "mic"

  // default settings
  let currentMode = "smooth";
  let waveColor = "#36fffd";
  let glowIntensity = 30;
  let autoColor = false;

  // ---------- UI LISTENERS ----------

  if (modeToggle) {
    modeToggle.addEventListener("change", () => {
      currentMode = modeToggle.checked ? "raw" : "smooth";
    });
  }

  if (colorPicker) {
    colorPicker.addEventListener("input", () => {
      waveColor = colorPicker.value;
    });
  }

  if (glowSlider) {
    glowSlider.addEventListener("input", () => {
      glowIntensity = parseFloat(glowSlider.value);
    });
    glowIntensity = parseFloat(glowSlider.value || 30);
  }

  if (autoColorToggle) {
    autoColorToggle.addEventListener("change", () => {
      autoColor = autoColorToggle.checked;
    });
  }

  // ---------- FILE PICKER ----------

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      audio.src = url;
      audio.load();

      currentInput = "file";
    });
  }

  // ---------- PLAY BUTTON ----------

  playbtn.addEventListener("click", () => {
    if (!audioContext) {
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;

      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      smoothData = new Float32Array(bufferLength);
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    // If mic was active, disconnect it
    if (micSource) {
      micSource.disconnect();
      micSource = null;
    }

    // If no source yet, create media source
    if (!source) {
      source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    }

    currentInput = "file";
    audio.play();

    if (!isPlaying) {
      isPlaying = true;
      draw();
    }
  });

  // ---------- PAUSE ----------

  pausebtn.addEventListener("click", () => {
    audio.pause();
    isPlaying = false;
  });

  // ---------- MIC BUTTON ----------

  micbtn.addEventListener("click", async () => {
    if (!audioContext) {
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;

      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      smoothData = new Float32Array(bufferLength);
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    // Stop file audio
    audio.pause();

    // Disconnect file source
    if (source) {
      source.disconnect();
      source = null;
    }

    // Disconnect analyser from speakers (avoid echo)
    try {
      analyser.disconnect();
    } catch (e) {}

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micSource = audioContext.createMediaStreamSource(stream);

    micSource.connect(analyser);
    currentInput = "mic";

    if (!isPlaying) {
      isPlaying = true;
      draw();
    }
  });

  // ---------- DRAW LOOP ----------

  function draw() {
    if (!isPlaying || !analyser) return;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    // RAW / SMOOTH
    if (currentMode === "smooth") {
      for (let i = 0; i < dataArray.length; i++) {
        smoothData[i] += (dataArray[i] - smoothData[i]) * 0.6;
      }
    } else {
      for (let i = 0; i < dataArray.length; i++) {
        smoothData[i] = dataArray[i];
      }
    }

    // motion blur clear
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ---------- AUTO COLOR ----------
    let drawColor = waveColor;

    if (autoColor) {
      let bass = 0;
      const bassCount = Math.floor(smoothData.length * 0.15);

      for (let i = 0; i < bassCount; i++) {
        bass += smoothData[i];
      }
      bass /= bassCount;

      const hue = (bass / 255) * 360;
      drawColor = `hsl(${hue}, 100%, 60%)`;
    }

    // waveform style
    ctx.lineWidth = 5;
    ctx.strokeStyle = drawColor;
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = drawColor;

    const points = [];
    const sliceWidth = canvas.width / smoothData.length;

    for (let i = 0; i < smoothData.length; i++) {
      const v = smoothData[i] / 128;
      const centerY = canvas.height / 2;
      const amplitude = 2.5;
      const y = centerY + (v - 1) * centerY * amplitude;
      const x = i * sliceWidth;
      points.push({ x, y });
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    const tension = 0.3;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) * tension / 6;
      const cp1y = p1.y + (p2.y - p0.y) * tension / 6;

      const cp2x = p2.x - (p3.x - p1.x) * tension / 6;
      const cp2y = p2.y - (p3.y - p1.y) * tension / 6;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }

    ctx.stroke();
  }
});