let ctx = null;
let activeOscillators = [];
let alarmInterval = null;
let autoStopTimer = null;
let unlocked = false;

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  return ctx;
}

export function unlockAudio() {
  if (unlocked) return;
  const audioCtx = getCtx();
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") {
    audioCtx.resume().then(() => {
      const buf = audioCtx.createBuffer(1, 1, 22050);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(audioCtx.destination);
      src.start(0);
      unlocked = true;
    }).catch(() => {});
  } else {
    unlocked = true;
  }
}

function ensureUnlocked() {
  if (unlocked) return true;
  unlockAudio();
  return unlocked;
}

function beep(ctx, freq, startTime, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
  gain.gain.setValueAtTime(0.5, startTime + duration - 0.02);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
  activeOscillators.push(osc);
  osc.onended = () => {
    activeOscillators = activeOscillators.filter((o) => o !== osc);
  };
}

function playCycle() {
  const audioCtx = getCtx();
  if (!audioCtx || audioCtx.state !== "running") return;
  const now = audioCtx.currentTime;
  for (let i = 0; i < 4; i++) {
    beep(audioCtx, 880, now + i * 0.25, 0.15);
  }
}

export function playAlarm() {
  stopAlarm();
  ensureUnlocked();
  playCycle();
  alarmInterval = setInterval(playCycle, 2000);
  autoStopTimer = setTimeout(stopAlarm, 30000);
}

export function stopAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if (autoStopTimer) {
    clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }
  activeOscillators.forEach((osc) => {
    try { osc.stop(); } catch {}
  });
  activeOscillators = [];
}
