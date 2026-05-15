import * as THREE from 'three';

const W = 512, H = 160;

function makeClockCanvas(minutes, seconds) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // background
  ctx.fillStyle = '#0a0603';
  ctx.fillRect(0, 0, W, H);

  // subtle inner border glow
  ctx.strokeStyle = '#2a1a08';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, W - 12, H - 12);

  // time text
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const text = `${mm}:${ss}`;

  ctx.font = `bold ${H * 0.72}px 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // dim shadow layer for depth
  ctx.fillStyle = '#3a2008';
  ctx.fillText(text, W / 2 + 2, H / 2 + 3);

  // main amber digits
  ctx.fillStyle = '#e8c97a';
  ctx.fillText(text, W / 2, H / 2);

  return c;
}

export class FlipClock {
  constructor() {
    this.group = new THREE.Group();
    this._minutes = -1;
    this._seconds = -1;

    const aspect = W / H;
    const clockH = 0.22;
    const clockW = clockH * aspect;

    // canvas texture on a plane
    this._canvas = makeClockCanvas(25, 0);
    this._texture = new THREE.CanvasTexture(this._canvas);

    const faceMat = new THREE.MeshBasicMaterial({ map: this._texture });
    const faceGeo = new THREE.PlaneGeometry(clockW, clockH);
    this._face = new THREE.Mesh(faceGeo, faceMat);
    this.group.add(this._face);

    // housing box
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x1a0e07,
      roughness: 0.8,
      metalness: 0.3,
    });
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(clockW + 0.06, clockH + 0.06, 0.05),
      boxMat
    );
    box.position.z = -0.026;
    this.group.add(box);

    // amber glow
    this.glow = new THREE.PointLight(0xe8c97a, 0.6, 1.2);
    this.glow.position.z = 0.1;
    this.group.add(this.glow);
  }

  setTime(minutes, seconds) {
    if (minutes === this._minutes && seconds === this._seconds) return;
    this._minutes = minutes;
    this._seconds = seconds;

    const ctx = this._canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#0a0603';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#2a1a08';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, W - 12, H - 12);

    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    const text = `${mm}:${ss}`;

    ctx.font = `bold ${H * 0.72}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#3a2008';
    ctx.fillText(text, W / 2 + 2, H / 2 + 3);

    ctx.fillStyle = '#e8c97a';
    ctx.fillText(text, W / 2, H / 2);

    this._texture.needsUpdate = true;
  }

  update(_dt) {}
}
