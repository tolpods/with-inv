# Builds voice/voiceover.wav (48 kHz mono) placed on the schedule written by render_tour.py
import json, numpy as np, soundfile as sf, os, subprocess
d = os.path.dirname(os.path.abspath(__file__)) + '/voice'
S = json.load(open(d + '/schedule.json')); SR = 48000
out = np.zeros(int((S['dur'] + 1) * SR), dtype=np.float32)
for v in S['voice']:
    a, sr = sf.read(f"{d}/{v['key']}.wav", dtype='float32')
    if sr != SR:
        import subprocess as sp
        tmp = f"{d}/_r.wav"; sp.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f"{d}/{v['key']}.wav", '-ar', str(SR), '-ac', '1', tmp], check=True); a, _ = sf.read(tmp, dtype='float32')
    i = int(v['start'] * SR); out[i:i + len(a)] += a
sf.write(d + '/voiceover.wav', out, SR); print('ok', len(out) / SR)
