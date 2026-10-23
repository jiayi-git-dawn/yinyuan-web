"""Rebuild the existing shot: fixed banks, forward-only overlap, seek-friendly H264.

Usage: python scripts/prepare-water-video-loop.py FFMPEG
Requires numpy and Pillow. Originals are never overwritten.
"""
import gc
import json
import subprocess
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

root = Path(__file__).resolve().parent.parent
ffmpeg = sys.argv[1]
width, height = 1280, 720

def smoothstep(a, b, x):
    t = np.clip((x-a)/(b-a), 0, 1)
    return t*t*(3-2*t)

y, x = np.mgrid[0:height, 0:width]
u, v = x/(width-1), y/(height-1)
depth = np.clip((v-.36)/.64, 0, 1)
left = .465 + (.245-.465)*depth**.72
right = .745+(1.03-.745)*smoothstep(0, .36, depth)
mask = smoothstep(.372,.405,v)*smoothstep(left,left+.034,u)*(1-smoothstep(right-.026,right,u))
mask = np.array(Image.fromarray(np.uint8(mask*255)).filter(ImageFilter.GaussianBlur(8)), dtype=np.float32)[...,None]/255

for variant, fps, name in [('day',25,'yinyuan-water-loop-v1.mp4')]:
    source = root/'assets'/name
    raw = subprocess.run([ffmpeg,'-v','error','-i',str(source),'-pix_fmt','rgb24','-f','rawvideo','pipe:1'],capture_output=True,check=True).stdout
    frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1,height,width,3)
    # Remove the almost repeated endpoint frames before constructing the overlap.
    frames = frames[1:]
    overlap = fps
    background = frames[overlap].astype(np.float32)
    loop = []
    for index in range(overlap, len(frames)):
        moving = frames[index].astype(np.float32)
        if index >= len(frames)-overlap:
            j = index-(len(frames)-overlap)
            blend = float(smoothstep(0,1,j/(overlap-1)))
            moving = moving*(1-blend)+frames[j].astype(np.float32)*blend
        composed = background*(1-mask)+moving*mask
        loop.append(np.uint8(np.clip(np.rint(composed),0,255)))
    del frames, raw
    gc.collect()
    output = root/'assets'/f'yinyuan-water-{variant}-loop-v2.mp4'
    # Four already-seamless passes form one stream, reducing browser seek frequency.
    command = [ffmpeg,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{width}x{height}','-r',str(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','24','-pix_fmt','yuv420p','-profile:v','main','-bf','0','-g',str(fps),'-keyint_min',str(fps),'-sc_threshold','0','-movflags','+faststart',str(output)]
    process = subprocess.Popen(command,stdin=subprocess.PIPE)
    try:
        for _ in range(4):
            for frame in loop: process.stdin.write(frame.tobytes())
    finally:
        process.stdin.close()
    if process.wait(): raise RuntimeError('Video encoding failed')
    # Playback has an exact matching first-frame poster, avoiding an exposure pop.
    Image.fromarray(loop[0]).save(root/'assets'/f'garden-water-{variant}-loop-v2.webp',quality=92)
    down = [frame[::4,::4].astype(np.float32) for frame in loop]
    deltas = [float(np.abs(down[i]-down[i-1]).mean()) for i in range(1,len(down))]
    seam = float(np.abs(down[-1]-down[0]).mean())
    print(json.dumps({'variant':variant,'frames':len(loop)*4,'seconds':len(loop)*4/fps,'bytes':output.stat().st_size,'median_delta':float(np.median(deltas)),'seam_delta':seam,'seam_ratio':seam/float(np.median(deltas))}),flush=True)
    del loop, down
    gc.collect()
