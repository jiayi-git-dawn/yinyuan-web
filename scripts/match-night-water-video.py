"""Use the repaired day motion with the relit, composition-matched night shot.

Source PNG was edited with imagegen from garden-water-day-loop-v2.webp.
Prompt: relight only to a restrained moonlit night; preserve camera, shores,
grass, rocks, tree silhouettes; no new moon, lights, plants, or objects.
Usage: python scripts/match-night-water-video.py FFMPEG
"""
import subprocess
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

root = Path(__file__).resolve().parent.parent
ffmpeg = sys.argv[1]
width, height, fps = 1280, 720, 25
raw = subprocess.run([ffmpeg,'-v','error','-i',str(root/'assets/yinyuan-water-day-loop-v2.mp4'),'-t','4.96','-pix_fmt','rgb24','-f','rawvideo','pipe:1'],capture_output=True,check=True).stdout
frames = np.frombuffer(raw,dtype=np.uint8).reshape(-1,height,width,3)
night_image = Image.open(root/'assets/source-water-night-matched-v3.png').convert('RGB').resize((width,height),Image.Resampling.LANCZOS)
night = np.array(night_image,dtype=np.float32)
day = frames[0].astype(np.float32)
day_soft = np.array(Image.fromarray(frames[0]).filter(ImageFilter.GaussianBlur(18)),dtype=np.float32)
night_soft = np.array(night_image.filter(ImageFilter.GaussianBlur(18)),dtype=np.float32)
gain = np.clip((night_soft+8)/(day_soft+8),.18,1.2)
output = root/'assets/yinyuan-water-night-loop-v4.mp4'
# Cyclic temporal filtering reduces small night reflection flicker without
# reversing the water. Subtract the filtered first frame to retain the poster.
def smooth_frame(i):
    return frames[(i-1)%len(frames)].astype(np.float32)*.2 + frames[i].astype(np.float32)*.6 + frames[(i+1)%len(frames)].astype(np.float32)*.2
day = smooth_frame(0)
cmd=[ffmpeg,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{width}x{height}','-r',str(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','24','-pix_fmt','yuv420p','-profile:v','main','-bf','0','-g',str(fps),'-keyint_min',str(fps),'-sc_threshold','0','-movflags','+faststart',str(output)]
process=subprocess.Popen(cmd,stdin=subprocess.PIPE)
try:
    for _ in range(4):
        for i in range(len(frames)):
            # Day banks are already pixel-stable: only the forward water motion
            # contributes a delta. No camera sway, reverse, or generated foliage.
            relit=np.uint8(np.clip(np.rint(night+(smooth_frame(i)-day)*gain),0,255))
            process.stdin.write(relit.tobytes())
finally:
    process.stdin.close()
if process.wait(): raise RuntimeError('Encoding failed')
night_image.save(root/'assets/garden-water-night-loop-v3.webp',quality=92)
print({'frames':len(frames)*4,'seconds':len(frames)*4/fps,'bytes':output.stat().st_size})
