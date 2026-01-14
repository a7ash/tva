import librosa
import numpy as np
import matplotlib.pyplot as plt
import sounddevice as sd
import time

# Load audio
y, sr = librosa.load("audio.mp3", sr=None, duration=10)

# Time axis
time_axis = np.arange(len(y)) / sr

# Start audio playback
sd.play(y, sr)
start_time = time.time()

# Setup plot
plt.figure(figsize=(10, 4))
plt.title("Waveform (Synced)")
plt.xlabel("Time (seconds)")
plt.ylabel("Amplitude")
plt.xlim(0, time_axis[-1])
plt.ylim(-1, 1)

line, = plt.plot([], [])
plt.show(block=False)

# Real-time visualization loop
while sd.get_stream().active:
    elapsed = time.time() - start_time
    current_sample = int(elapsed * sr)

    if current_sample >= len(y):
        break

    line.set_data(time_axis[:current_sample], y[:current_sample])
    plt.pause(0.01)

plt.close()