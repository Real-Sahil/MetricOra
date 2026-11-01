#!/usr/bin/env python3
"""
Voiceover for the audit trail film (docs/marketing/audit-chain-video.md).

Synthesises each script line with Piper (en_GB voice), lays the lines on a timeline and writes
  public/audio/audit-chain/vo-main.wav, vo-vertical.wav  (gitignored)
  src/videos/audit-chain/voice.json                      (scene boundaries the compositions read)

Needs: pip install piper-tts; a Piper voice folder (PIPER_VOICE_DIR) holding the .onnx and .json.
This is a draft synthetic voice. Replace the wav files with a recorded voiceover for release,
then rerun with VO_DIR pointing at one wav per line (m1..m6, v1..v4) to retime the film.
"""
import json, os, subprocess, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICE_DIR = Path(os.environ.get("PIPER_VOICE_DIR", "/tmp/tts/vits-piper-en_GB-alan-medium"))
VO_DIR = Path(os.environ.get("VO_DIR", "/tmp/tts/out"))
OUT = ROOT / "public/audio/audit-chain"

MAIN = {
    "m1": "Somebody asks you to prove a number from last year. Not the number. How you know nobody changed it since.",
    "m2": "Every sign-in, import, record edit, calculation run and publication is written to an audit trail. Once written, it is never updated. Never deleted.",
    "m3": "Each entry carries a fingerprint of the entry before it. Change one row, and the fingerprint of every row after it stops matching. A gap or an edit shows.",
    "m4": "Press Check the audit trail. MetricOra reads the whole chain and tells you one of three things: intact, broken, or empty. If broken, it names the first row that fails, and why.",
    "m5": "Every assurance pack carries a small verifier script. Your auditor can run it on their own machine, on the exported log. And each night a copy of the latest fingerprint is stored away from the rows it protects, with a weekly copy of the hashes kept elsewhere.",
    "m6": "Every tonne traced. And the trail behind it checkable. MetricOra.",
}
VERT = {
    "v1": "Change one row in the record. Watch what happens.",
    "v2": "Every entry holds the fingerprint of the one before it. Edit one, and everything after stops matching.",
    "v3": "One button tells you: intact, broken or empty. If broken, it names the first bad row.",
    "v4": "Your auditor can check it offline. MetricOra.",
}
SPEED = {"m": 1.0, "v": 0.9}  # Piper length_scale: below 1 is faster


def synth():
    from piper import PiperVoice, SynthesisConfig
    voice = PiperVoice.load(str(next(VOICE_DIR.glob("*.onnx"))), config_path=str(next(VOICE_DIR.glob("*.onnx.json"))))
    VO_DIR.mkdir(parents=True, exist_ok=True)
    for k, text in {**MAIN, **VERT}.items():
        cfg = SynthesisConfig(length_scale=SPEED[k[0]], noise_scale=0.5, noise_w_scale=0.6)
        with wave.open(str(VO_DIR / f"{k}.wav"), "wb") as w:
            voice.synthesize_wav(text, w, syn_config=cfg)


def dur(k):
    with wave.open(str(VO_DIR / f"{k}.wav")) as w:
        return w.getnframes() / w.getframerate()


def lay(keys, lead, gap, tail, name):
    starts, t = {}, lead
    for k in keys:
        starts[k] = round(t, 2)
        t += dur(k) + gap
    total = round(t - gap + tail, 2)
    OUT.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    for k in keys:
        cmd += ["-i", str(VO_DIR / f"{k}.wav")]
    parts = [f"[{i}:a]adelay={int(starts[k]*1000)}|{int(starts[k]*1000)},apad[a{i}]" for i, k in enumerate(keys)]
    mix = "".join(f"[a{i}]" for i in range(len(keys)))
    cmd += ["-filter_complex", ";".join(parts) + f";{mix}amix=inputs={len(keys)}:normalize=0,atrim=0:{total},loudnorm=I=-16:TP=-1.5[o]", "-map", "[o]", "-ar", "48000", str(OUT / name)]
    subprocess.run(cmd, check=True)
    return starts, total


if __name__ == "__main__":
    if os.environ.get("SKIP_SYNTH") != "1":
        synth()
    ms, mt = lay(list(MAIN), 0.5, 0.6, 1.6, "vo-main.wav")
    vs, vt = lay(list(VERT), 0.25, 0.3, 0.5, "vo-vertical.wav")
    (ROOT / "src/videos/audit-chain/voice.json").write_text(json.dumps({"main": {"starts": ms, "total": mt}, "vertical": {"starts": vs, "total": vt}}, indent=2) + "\n")
    print(ms, mt, vs, vt)
