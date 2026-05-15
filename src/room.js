import * as THREE from 'three';

export function buildRoom(scene) {
  const objects = {};

  // ── materials ──────────────────────────────────────────────────────────────

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x2a2420,
    roughness: 0.95,
    metalness: 0.0,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3d2510,
    roughness: 0.85,
    metalness: 0.05,
  });

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1e1208,
    roughness: 0.9,
    metalness: 0.0,
  });

  // ── room geometry ──────────────────────────────────────────────────────────

  const ROOM_W = 7;
  const ROOM_H = 4;
  const ROOM_D = 8;

  // floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), stoneMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM_H;
  scene.add(ceiling);

  // back wall
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), stoneMat);
  backWall.position.set(0, ROOM_H / 2, -ROOM_D / 2);
  scene.add(backWall);

  // left wall
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), stoneMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-ROOM_W / 2, ROOM_H / 2, 0);
  scene.add(leftWall);

  // right wall
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, ROOM_H), stoneMat);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(ROOM_W / 2, ROOM_H / 2, 0);
  scene.add(rightWall);

  // front wall (behind camera, two side panels around opening)
  const frontMat = stoneMat.clone();
  const frontPanel = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), frontMat);
  frontPanel.rotation.y = Math.PI;
  frontPanel.position.set(0, ROOM_H / 2, ROOM_D / 2);
  scene.add(frontPanel);

  // ── window wall (the hero — front-facing wall with window) ─────────────────
  buildWindowWall(scene, stoneMat, ROOM_W, ROOM_H, ROOM_D, objects);

  // ── desk ──────────────────────────────────────────────────────────────────
  buildDesk(scene, woodMat, objects);

  // ── bookshelf on right wall ───────────────────────────────────────────────
  buildBookshelf(scene, woodMat, ROOM_W);

  // ── stone pillar details (corner stones) ──────────────────────────────────
  addCornerStones(scene, stoneMat, ROOM_W, ROOM_H, ROOM_D);

  return objects;
}

function buildWindowWall(scene, stoneMat, ROOM_W, ROOM_H, ROOM_D, objects) {
  const WIN_W = 2.2;
  const WIN_H = 2.8;
  const WIN_Y = 1.4;
  const wallZ = -ROOM_D / 2 + 0.01;

  // left panel
  const leftW = (ROOM_W - WIN_W) / 2;
  const left = new THREE.Mesh(new THREE.PlaneGeometry(leftW, ROOM_H), stoneMat);
  left.position.set(-WIN_W / 2 - leftW / 2, ROOM_H / 2, wallZ);
  scene.add(left);

  // right panel
  const right = new THREE.Mesh(new THREE.PlaneGeometry(leftW, ROOM_H), stoneMat);
  right.position.set(WIN_W / 2 + leftW / 2, ROOM_H / 2, wallZ);
  scene.add(right);

  // above window
  const aboveH = ROOM_H - WIN_Y - WIN_H;
  const above = new THREE.Mesh(new THREE.PlaneGeometry(WIN_W, aboveH), stoneMat);
  above.position.set(0, WIN_Y + WIN_H + aboveH / 2, wallZ);
  scene.add(above);

  // below window (sill area)
  const below = new THREE.Mesh(new THREE.PlaneGeometry(WIN_W, WIN_Y), stoneMat);
  below.position.set(0, WIN_Y / 2, wallZ);
  scene.add(below);

  // window sill (ledge)
  const sill = new THREE.Mesh(new THREE.BoxGeometry(WIN_W + 0.3, 0.08, 0.22), stoneMat);
  sill.position.set(0, WIN_Y, wallZ + 0.1);
  scene.add(sill);

  // window frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a0f07, roughness: 0.7 });
  const frameThick = 0.06;

  // top/bottom bars
  [WIN_Y + WIN_H, WIN_Y].forEach(y => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(WIN_W + frameThick, frameThick, frameThick), frameMat);
    bar.position.set(0, y, wallZ + frameThick / 2);
    scene.add(bar);
  });

  // left/right bars
  [-WIN_W / 2, WIN_W / 2].forEach(x => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(frameThick, WIN_H + frameThick, frameThick), frameMat);
    bar.position.set(x, WIN_Y + WIN_H / 2, wallZ + frameThick / 2);
    scene.add(bar);
  });

  // center cross bars
  const hBar = new THREE.Mesh(new THREE.BoxGeometry(WIN_W, frameThick, frameThick), frameMat);
  hBar.position.set(0, WIN_Y + WIN_H / 2, wallZ + frameThick / 2);
  scene.add(hBar);
  const vBar = new THREE.Mesh(new THREE.BoxGeometry(frameThick, WIN_H, frameThick), frameMat);
  vBar.position.set(0, WIN_Y + WIN_H / 2, wallZ + frameThick / 2);
  scene.add(vBar);

  // ── night view behind window ──────────────────────────────────────────────
  buildNightView(scene, WIN_W, WIN_H, WIN_Y, wallZ, objects);
}

function buildNightView(scene, WIN_W, WIN_H, WIN_Y, wallZ, objects) {
  // sky plane far behind window
  const skyGeo = new THREE.PlaneGeometry(WIN_W * 3, WIN_H * 3);
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 512; skyCanvas.height = 512;
  const ctx = skyCanvas.getContext('2d');

  // deep night gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#020510');
  grad.addColorStop(0.6, '#050a1a');
  grad.addColorStop(1, '#0a1520');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // stars
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 300;
    const r = Math.random() * 1.2 + 0.3;
    const alpha = Math.random() * 0.8 + 0.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,240,${alpha})`;
    ctx.fill();
  }

  // distant city lights (bottom strip)
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 512;
    const y = 310 + Math.random() * 80;
    const w = Math.random() * 6 + 2;
    const h = Math.random() * 20 + 5;
    const colors = ['#e8c97a', '#ffd89b', '#a8d8ff', '#ffb366', '#c8e8ff'];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.globalAlpha = Math.random() * 0.6 + 0.2;
    ctx.fillRect(x, y, w, h);
  }

  // moon
  ctx.globalAlpha = 1;
  const moonGrad = ctx.createRadialGradient(400, 80, 0, 400, 80, 45);
  moonGrad.addColorStop(0, '#fffff0');
  moonGrad.addColorStop(0.7, '#f0e8c0');
  moonGrad.addColorStop(1, 'rgba(240,232,192,0)');
  ctx.fillStyle = moonGrad;
  ctx.beginPath();
  ctx.arc(400, 80, 45, 0, Math.PI * 2);
  ctx.fill();

  const skyTex = new THREE.CanvasTexture(skyCanvas);
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.position.set(0, WIN_Y + WIN_H / 2, wallZ - 1.5);
  scene.add(sky);
  objects.nightSky = sky;

  // window glass (slightly blue transparent)
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x8ab4cc,
    transparent: true,
    opacity: 0.08,
    roughness: 0.05,
    transmission: 0.9,
  });
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(WIN_W - 0.1, WIN_H - 0.06),
    glassMat
  );
  glass.position.set(0, WIN_Y + WIN_H / 2, wallZ + 0.03);
  scene.add(glass);

  // moonlight coming through window
  const moonLight = new THREE.SpotLight(0x8ab4cc, 1.2, 10, Math.PI / 5, 0.4);
  moonLight.position.set(0, WIN_Y + WIN_H - 0.3, wallZ + 0.5);
  moonLight.target.position.set(0, 0, 2);
  scene.add(moonLight);
  scene.add(moonLight.target);
  objects.moonLight = moonLight;
}

function buildDesk(scene, woodMat, objects) {
  // desk top
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.1), woodMat);
  top.position.set(0, 0.84, 0.8);
  top.receiveShadow = true;
  top.castShadow = true;
  scene.add(top);

  // desk legs
  const legGeo = new THREE.BoxGeometry(0.07, 0.84, 0.07);
  const legPositions = [
    [-1.1, 0.42, 0.28], [1.1, 0.42, 0.28],
    [-1.1, 0.42, 1.3], [1.1, 0.42, 1.3],
  ];
  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    scene.add(leg);
  });

  // desk lamp
  buildDeskLamp(scene, objects);

  // notebook on desk
  const notebookMat = new THREE.MeshStandardMaterial({ color: 0x1a2840, roughness: 0.9 });
  const notebook = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.65), notebookMat);
  notebook.position.set(-0.6, 0.89, 0.85);
  scene.add(notebook);

  // pen
  const penMat = new THREE.MeshStandardMaterial({ color: 0x8b1a1a, roughness: 0.6 });
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4, 8), penMat);
  pen.rotation.z = Math.PI / 2;
  pen.rotation.y = 0.3;
  pen.position.set(-0.55, 0.9, 1.1);
  scene.add(pen);

  // coffee mug
  buildMug(scene, objects);

  objects.deskTop = top;
}

function buildDeskLamp(scene, objects) {
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.4, metalness: 0.7 });

  // base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.04, 16), metalMat);
  base.position.set(0.75, 0.86, 0.55);
  scene.add(base);

  // arm
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.55, 8), metalMat);
  arm.position.set(0.75, 1.13, 0.55);
  arm.rotation.z = 0.2;
  scene.add(arm);

  // shade
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.7, side: THREE.DoubleSide });
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.22, 16, 1, true), shadeMat);
  shade.position.set(0.87, 1.44, 0.55);
  shade.rotation.z = 0.2;
  scene.add(shade);

  // lamp light
  const lampLight = new THREE.PointLight(0xffd07a, 2.5, 2.5);
  lampLight.position.set(0.87, 1.38, 0.55);
  lampLight.castShadow = true;
  scene.add(lampLight);
  objects.lampLight = lampLight;
}

function buildMug(scene, objects) {
  const mugMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.8 });
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.13, 16), mugMat);
  mug.position.set(0.5, 0.91, 0.65);
  scene.add(mug);

  // steam particles (simple animated planes)
  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  });
  objects.steam = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.1), steamMat.clone());
    s.position.set(0.5 + (i - 1) * 0.025, 1.0 + i * 0.04, 0.65);
    s.userData.baseY = s.position.y;
    s.userData.phase = i * 1.2;
    scene.add(s);
    objects.steam.push(s);
  }
}

function buildBookshelf(scene, woodMat, ROOM_W) {
  const shelfMat = woodMat;
  const x = ROOM_W / 2 - 0.08;

  // shelf boards
  for (let i = 0; i < 3; i++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 1.2), shelfMat);
    shelf.position.set(x, 0.9 + i * 0.7, -2.5);
    scene.add(shelf);
  }

  // back panel
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.2, 1.3), shelfMat);
  back.position.set(x - 0.03, 1.5, -2.5);
  scene.add(back);

  // books
  const bookColors = [0x8b1a1a, 0x1a4a8b, 0x1a6b1a, 0x6b4a1a, 0x4a1a6b, 0x8b6b1a];
  let bookX = x;
  for (let shelf = 0; shelf < 3; shelf++) {
    let z = -3.0;
    for (let b = 0; b < 6; b++) {
      const bW = 0.06 + Math.random() * 0.04;
      const bH = 0.18 + Math.random() * 0.1;
      const bookMat = new THREE.MeshStandardMaterial({
        color: bookColors[b % bookColors.length],
        roughness: 0.85,
      });
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.09, bH, bW), bookMat);
      book.position.set(bookX, 0.92 + shelf * 0.7 + bH / 2, z + bW / 2);
      book.rotation.y = (Math.random() - 0.5) * 0.08;
      scene.add(book);
      z += bW + 0.01;
      if (z > -2.05) break;
    }
  }
}

function addCornerStones(scene, stoneMat, ROOM_W, ROOM_H, ROOM_D) {
  const pillarGeo = new THREE.BoxGeometry(0.2, ROOM_H, 0.2);
  const corners = [
    [-ROOM_W / 2, ROOM_H / 2, -ROOM_D / 2],
    [ROOM_W / 2, ROOM_H / 2, -ROOM_D / 2],
    [-ROOM_W / 2, ROOM_H / 2, ROOM_D / 2],
    [ROOM_W / 2, ROOM_H / 2, ROOM_D / 2],
  ];
  corners.forEach(([x, y, z]) => {
    const p = new THREE.Mesh(pillarGeo, stoneMat);
    p.position.set(x, y, z);
    scene.add(p);
  });
}
