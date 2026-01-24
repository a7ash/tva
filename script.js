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
  
    playbtn.addEventListener("click", () => {
      if (!audioContext) {
        audioContext = new AudioContext();
  
        source = audioContext.createMediaElementSource(audio);
        analyser = audioContext.createAnalyser();
  
        analyser.fftSize = 512;
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
  
      // smoothing (low-pass filter)
      for (let i = 0; i < dataArray.length; i++) {
        smoothData[i] += (dataArray[i] - smoothData[i]) * 1;
      }
  
      // motion blur clear
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // waveform style
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#36fffd";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#00ffcc";
  
      ctx.beginPath();
  
      const sliceWidth = canvas.width / smoothData.length;
      let x = 0;
  
      for (let i = 0; i < smoothData.length; i++) {
        const v = smoothData[i] / 128;
        const centerY = canvas.height / 2;
        const amplitude = 1.2; // tweak this
        const y = centerY + (v - 1) * centerY * amplitude;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
  
        x += sliceWidth;
      }
  
      ctx.stroke();
    }
  });