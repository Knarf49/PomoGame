import * as THREE from 'three';
import { buildRoom } from './room.js';
import { FlipClock } from './clock.js';
import { PomodoroTimer } from './timer.js';

// ── scene setup ────────────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x05030a, 8, 18);
scene.background = new THREE.Color(0x05030a);

// ── camera ─────────────────────────────────────────────────────────────────
// first-person: sitting at desk, eye level ~1.2m, looking toward window
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.01, 30);
camera.position.set(0, 1.22, 1.9);
camera.lookAt(0, 1.1, -4);

// ── lighting ───────────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0x050408, 1.0);
scene.add(ambient);

// ── build room ─────────────────────────────────────────────────────────────
const roomObjects = buildRoom(scene);

// ── flip clock on desk ─────────────────────────────────────────────────────
const clock = new FlipClock();
clock.group.position.set(0, 0.96, 0.38);   // on desk, close to window side
clock.group.rotation.x = -0.08;             // slight tilt toward camera
scene.add(clock.group);

// ── pomodoro timer logic ───────────────────────────────────────────────────
const timer = new PomodoroTimer(
  (min, sec, isBreak) => {
    clock.setTime(min, sec);
    updateSessionLabel(isBreak);
  },
  (nowBreak, completed) => {
    updateDots(completed);
    updateSessionLabel(nowBreak);
    setBreakMood(nowBreak);
  }
);

// initialize clock display
clock.setTime(25, 0);

// ── UI wiring ──────────────────────────────────────────────────────────────
const btnStart = document.getElementById('btn-start');
const btnReset = document.getElementById('btn-reset');
const sessionLabel = document.getElementById('session-label');

btnStart.addEventListener('click', () => {
  if (timer.running) {
    timer.pause();
    btnStart.textContent = 'Resume';
  } else {
    timer.start();
    btnStart.textContent = 'Pause';
  }
});

btnReset.addEventListener('click', () => {
  timer.reset();
  btnStart.textContent = 'Start';
  clock.setTime(25, 0);
  setBreakMood(false);
});

function updateSessionLabel(isBreak) {
  sessionLabel.textContent = isBreak ? 'BREAK TIME' : 'FOCUS SESSION';
}

function updateDots(completed) {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById(`dot-${i}`);
    dot.classList.toggle('done', i < (completed % 4 === 0 && completed > 0 ? 4 : completed % 4));
  }
}

function setBreakMood(isBreak) {
  if (isBreak) {
    // soften lamp, brighten moonlight for break
    if (roomObjects.lampLight) roomObjects.lampLight.intensity = 1.2;
    if (roomObjects.moonLight) roomObjects.moonLight.intensity = 2.0;
  } else {
    if (roomObjects.lampLight) roomObjects.lampLight.intensity = 2.5;
    if (roomObjects.moonLight) roomObjects.moonLight.intensity = 1.2;
  }
}

// ── subtle camera sway (breathing effect) ─────────────────────────────────
const camBase = camera.position.clone();
let breathTime = 0;

// ── resize ─────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── render loop ────────────────────────────────────────────────────────────
const threeClock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = threeClock.getDelta();

  timer.update(dt);
  clock.update(dt);

  // breathing camera sway
  breathTime += dt;
  camera.position.y = camBase.y + Math.sin(breathTime * 0.4) * 0.003;
  camera.position.x = camBase.x + Math.sin(breathTime * 0.27) * 0.002;

  // steam animation
  if (roomObjects.steam) {
    roomObjects.steam.forEach(s => {
      s.userData.phase += dt;
      s.position.y = s.userData.baseY + Math.sin(s.userData.phase * 1.5) * 0.015;
      s.material.opacity = 0.08 + Math.sin(s.userData.phase) * 0.07;
      s.position.x = 0.5 + Math.sin(s.userData.phase * 0.8) * 0.015;
    });
  }

  // lamp flicker (very subtle)
  if (roomObjects.lampLight) {
    roomObjects.lampLight.intensity = 2.5 + Math.sin(breathTime * 7.3) * 0.04;
  }

  renderer.render(scene, camera);
}

animate();
