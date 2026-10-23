"""Make a sample-continuous water loop with a three-second equal-power overlap."""
import subprocess
import sys
import wave
from pathlib import Path
import numpy as np

source, destination, ffmpeg = sys.argv[1:]
rate = 40000
raw = subprocess.run([ffmpeg, "-v", "error", "-i", source, "-f", "f32le",
                      "-ar", str(rate), "-ac", "2", "pipe:1"],
                     check=True, capture_output=True).stdout
audio = np.frombuffer(raw, dtype="<f4").reshape(-1, 2)
overlap = 3 * rate
if len(audio) <= 2 * overlap:
    raise ValueError("Source must exceed six seconds")
phase = np.linspace(0, np.pi / 2, overlap, endpoint=True)[:, None]
seam = audio[-overlap:] * np.cos(phase) + audio[:overlap] * np.sin(phase)
loop = np.concatenate([audio[overlap:-overlap], seam])
if np.max(np.abs(loop)) >= 1:
    raise ValueError("Overlap clips; review gain before exporting")
pcm = np.rint(loop * 32767).astype("<i2")
with wave.open(str(Path(destination)), "wb") as output:
    output.setnchannels(2)
    output.setsampwidth(2)
    output.setframerate(rate)
    output.writeframes(pcm.tobytes())
print({"source_seconds": len(audio) / rate, "loop_seconds": len(loop) / rate,
       "seam_jump": np.abs(pcm[0].astype(float) - pcm[-1]).tolist(),
       "peak": float(np.max(np.abs(loop)))})
