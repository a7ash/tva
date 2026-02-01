document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("waveform");
  const ctx = canvas.getContext("2d");

  canvas.width = 1450;
  canvas.height = 600;

  const audio = document.getElementById("audio");
  const playbtn = document.getElementById("playbtn");
  const pausebtn = document.getElementById("pausebtn");

  let audioContext;
  let analyser;
  let dataArray;
  let smoothData;
  let source;
  let isPlaying = false;
  let smoothGain = 1;
  let audioCtx;
  let bufferLength;
  let souceNode; 
  

  playbtn.addEventListener("click", () => {
    if (!audioContext) {
      audioContext = new AudioContext();

      source = audioContext.createMediaElementSource(audio);
      analyser = audioContext.createAnalyser();

      analyser.fftSize = 128;
      const bufferLength = analyser.frequencyBinCount;

      dataArray = new Uint8Array(bufferLength);
      smoothData = new Float32Array(bufferLength);

      source.connect(analyser);
      analyser.connect(audioContext.destination);
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    audio.play();

    if (!isPlaying) {
      isPlaying = true;
      draw();
    }
  });

  pausebtn.addEventListener("click", () => {
    audio.pause();
    isPlaying = false;
  });

  function draw() {
    if (!isPlaying || !analyser) return;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    // --- AUTO GAIN ---
let maxDev = 0;
for (let i = 0; i < smoothData.length; i++) {
  const v = smoothData[i] / 128 - 1;   // [-1, +1]
  const d = Math.abs(v);
  if (d > maxDev) maxDev = d;
}

// target how much of the screen height we want to use
const target = 0.8; // 80% of half-height
let autoGain = target / (maxDev + 0.0001); // avoid divide by zero

// clamp so it doesn't go crazy
autoGain = Math.max(0.5, Math.min(autoGain, 3.0));

// smooth the gain (so it doesn't jump)
smoothGain += (autoGain - smoothGain) * 0.1; // 0.05 = slower, 0.2 = faster

    // smoothing (low-pass filter)
    for (let i = 0; i < dataArray.length; i++) {
      smoothData[i] += (dataArray[i] - smoothData[i]) * 0.05;
    }

    // motion blur clear
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // waveform style
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#36fffd";
    ctx.shadowBlur = 30;
    ctx.shadowColor = "#00ffcc";

    const points = [];
const sliceWidth = canvas.width / smoothData.length;

for (let i = 0; i < smoothData.length; i++) {
  const v = smoothData[i] / 128;
  const centerY = canvas.height / 2;
  const amplitude = 2; // 👈 change this number
  const y = centerY + (v - 1) * centerY * amplitude * smoothGain;  const x = i * sliceWidth;
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