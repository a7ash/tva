const canvas = document.getElementById("waveform");
const ctx = canvas.getContext("2d");

const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");

let audioContext;
let analyser;
let dataArray;
let source;

playBtn.addEventListener("click", () => {
  if (!audioContext) {
    audioContext = new AudioContext();

    source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();

    analyser.fftSize = 2048;
    dataArray = new Uint8Array(analyser.fftSize);

    source.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  audio.play();
  draw();
});

function draw() {
  requestAnimationFrame(draw);

  analyser.getByteTimeDomainData(dataArray);

  ctx.fillStyle = "#0f0f0f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#00ffcc";

  ctx.beginPath();

  const sliceWidth = canvas.width / dataArray.length;
  let x = 0;

  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * canvas.height) / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
}