import * as THREE from 'three';

const DIGIT_W = 0.18;
const DIGIT_H = 0.26;
const DIGIT_DEPTH = 0.012;
const FLIP_DURATION = 0.18; // seconds

function makeDigitCanvas(num, half, color = '#e8c97a', bg = '#0a0603') {
  const W = 128, H = 200;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // horizontal divider line
  ctx.strokeStyle = '#1a0f05';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = `bold ${H * 0.85}px 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // clip to top or bottom half — no gap at the fold line
  ctx.save();
  if (half === 'top') {
    ctx.rect(0, 0, W, H / 2);
  } else {
    ctx.rect(0, H / 2, W, H / 2);
  }
  ctx.clip();
  ctx.fillText(String(num), W / 2, H / 2);
  ctx.restore();

  return c;
}

function makeTexture(num, half) {
  const tex = new THREE.CanvasTexture(makeDigitCanvas(num, half));
  tex.needsUpdate = true;
  return tex;
}

class FlipDigit {
  constructor() {
    this.current = 0;
    this.next = 0;
    this.flipping = false;
    this.flipProgress = 0;

    const mat = (num, half) => new THREE.MeshBasicMaterial({
      map: makeTexture(num, half),
      side: THREE.FrontSide,
    });

    const geo = new THREE.PlaneGeometry(DIGIT_W, DIGIT_H / 2);

    // static top — slightly in front to avoid z-fighting, snapped to fold line
    this.staticTop = new THREE.Mesh(geo, mat(0, 'top'));
    this.staticTop.position.set(0, DIGIT_H / 4, 0.001);

    // static bottom — sits flush behind the fold line
    this.staticBottom = new THREE.Mesh(geo, mat(0, 'bottom'));
    this.staticBottom.position.set(0, -DIGIT_H / 4, 0.0);

    // flap top — current number top half, rotates down
    this.flapTop = new THREE.Mesh(geo, mat(0, 'top'));
    this.flapTop.position.y = DIGIT_H / 4;

    // flap bottom — next number bottom half, rotates up from behind
    this.flapBottom = new THREE.Mesh(geo, mat(0, 'bottom'));
    this.flapBottom.position.y = -DIGIT_H / 4;
    this.flapBottom.rotation.x = Math.PI; // starts facing away

    this.group = new THREE.Group();
    this.group.add(this.staticTop, this.staticBottom, this.flapTop, this.flapBottom);

    // pivot groups for rotation around the fold line
    this.pivotTop = new THREE.Group();
    this.pivotTop.position.y = 0; // fold line
    this.flapTop.position.y = DIGIT_H / 4;
    this.pivotTop.add(this.flapTop);

    this.pivotBottom = new THREE.Group();
    this.pivotBottom.position.y = 0;
    this.flapBottom.position.y = -DIGIT_H / 4;
    this.pivotBottom.add(this.flapBottom);

    this.group.add(this.pivotTop, this.pivotBottom);

    // thin divider line at the fold — sits in front of everything
    const divider = new THREE.Mesh(
      new THREE.PlaneGeometry(DIGIT_W, 0.004),
      new THREE.MeshBasicMaterial({ color: 0x0a0603 })
    );
    divider.position.z = 0.003;
    this.group.add(divider);
  }

  flipTo(next) {
    if (this.flipping || next === this.current) return;
    this.next = next;
    this.flipping = true;
    this.flipProgress = 0;

    // static bottom pre-loads next number
    this.staticBottom.material = new THREE.MeshBasicMaterial({
      map: makeTexture(next, 'bottom'),
      side: THREE.FrontSide,
    });

    // flapBottom shows next number bottom (starts rotated away)
    this.flapBottom.material = new THREE.MeshBasicMaterial({
      map: makeTexture(next, 'bottom'),
      side: THREE.BackSide,
    });

    // flapTop shows current number top
    this.flapTop.material = new THREE.MeshBasicMaterial({
      map: makeTexture(this.current, 'top'),
      side: THREE.FrontSide,
    });

    this.pivotTop.rotation.x = 0;
    this.pivotBottom.rotation.x = Math.PI;
    this.pivotTop.visible = true;
    this.pivotBottom.visible = true;
  }

  update(dt) {
    if (!this.flipping) return;
    this.flipProgress += dt / FLIP_DURATION;
    if (this.flipProgress >= 1) {
      this.flipProgress = 1;
      this.flipping = false;
      this.current = this.next;

      // finalize static faces
      this.staticTop.material = new THREE.MeshBasicMaterial({
        map: makeTexture(this.current, 'top'),
        side: THREE.FrontSide,
      });

      this.pivotTop.visible = false;
      this.pivotBottom.visible = false;
    }

    const t = this.flipProgress;
    // top flap: 0 → PI/2 (folds forward/down)
    this.pivotTop.rotation.x = t * Math.PI / 2;
    // bottom flap: PI → PI/2 (unfolds from behind)
    this.pivotBottom.rotation.x = Math.PI - t * Math.PI / 2;
  }
}

export class FlipClock {
  constructor() {
    this.group = new THREE.Group();

    this.digits = [
      new FlipDigit(), // minutes tens
      new FlipDigit(), // minutes units
      new FlipDigit(), // seconds tens
      new FlipDigit(), // seconds units
    ];

    const gap = DIGIT_W + 0.02;
    const colonGap = 0.08;

    // layout: [d0][d1] : [d2][d3]
    const offsets = [
      -(gap * 1.5 + colonGap / 2),
      -(gap * 0.5 + colonGap / 2),
       (gap * 0.5 + colonGap / 2),  // wait, need colon space
       0,
    ];

    // recalculate with colon
    const totalWidth = gap * 2 + colonGap + gap * 2;
    const positions = [
      -totalWidth / 2 + gap * 0,
      -totalWidth / 2 + gap * 1 + 0.02,
      -totalWidth / 2 + gap * 2 + colonGap + 0.02,
      -totalWidth / 2 + gap * 3 + colonGap + 0.04,
    ];

    this.digits.forEach((d, i) => {
      d.group.position.x = positions[i] + gap / 2;
      this.group.add(d.group);
    });

    // colon dots
    const dotGeo = new THREE.CircleGeometry(0.018, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xe8c97a });
    const dot1 = new THREE.Mesh(dotGeo, dotMat);
    const dot2 = new THREE.Mesh(dotGeo, dotMat);
    const colonX = 0;
    dot1.position.set(colonX, DIGIT_H * 0.2, DIGIT_DEPTH);
    dot2.position.set(colonX, -DIGIT_H * 0.2, DIGIT_DEPTH);
    this.group.add(dot1, dot2);

    // housing box
    const boxW = totalWidth + 0.12;
    const boxH = DIGIT_H + 0.1;
    const boxD = 0.06;
    const boxGeo = new THREE.BoxGeometry(boxW, boxH, boxD);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x1a0e07,
      roughness: 0.8,
      metalness: 0.3,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.z = -boxD / 2 - 0.001;
    this.group.add(box);

    // face glow (emissive panel behind digits)
    const faceGeo = new THREE.PlaneGeometry(totalWidth + 0.04, DIGIT_H + 0.04);
    const faceMat = new THREE.MeshBasicMaterial({ color: 0x0a0603 });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.z = -0.001;
    this.group.add(face);

    // point light inside clock for amber glow effect
    this.glow = new THREE.PointLight(0xe8c97a, 0.6, 1.2);
    this.glow.position.z = 0.1;
    this.group.add(this.glow);

    this.setTime(25, 0);
  }

  setTime(minutes, seconds) {
    const d = [
      Math.floor(minutes / 10),
      minutes % 10,
      Math.floor(seconds / 10),
      seconds % 10,
    ];
    d.forEach((val, i) => {
      if (val !== this.digits[i].current) {
        this.digits[i].flipTo(val);
      }
    });
  }

  update(dt) {
    this.digits.forEach(d => d.update(dt));
  }
}
