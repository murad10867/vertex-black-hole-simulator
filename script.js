(() => {
  'use strict';

  const canvas = document.getElementById('spaceCanvas');
  const ctx = canvas.getContext('2d');

  const gravityRange = document.getElementById('gravityRange');
  const speedRange = document.getElementById('speedRange');
  const bodyRange = document.getElementById('bodyRange');
  const gravityValue = document.getElementById('gravityValue');
  const speedValue = document.getElementById('speedValue');
  const bodyCount = document.getElementById('bodyCount');
  const liveBodies = document.getElementById('liveBodies');
  const swallowedEl = document.getElementById('swallowed');
  const addPlanetBtn = document.getElementById('addPlanetBtn');
  const resetBtn = document.getElementById('resetBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const statusBadge = document.getElementById('statusBadge');

  const W = canvas.width;
  const H = canvas.height;
  let holeX = W / 2;
  let holeY = H / 2;
  let draggingHole = false;

  const EVENT_HORIZON = 52;
  const DISK_INNER = 76;
  const DISK_OUTER = 160;

  let gravityScale = 1;
  let simSpeed = 1;
  let running = true;
  let swallowed = 0;
  let lastTime = performance.now();
  let bodies = [];
  let stars = [];

  const palette = ['#56cfff','#ffd166','#ff7e67','#8f7cff','#7cf3a1','#f59cff','#71a7ff'];

  function makeStars() {
    stars = Array.from({ length: 230 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + .25,
      a: Math.random() * .7 + .2
    }));
  }

  function addBody(x, y, customSpeed) {
    const dx = x - holeX;
    const dy = y - holeY;
    const r = Math.max(95, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);

    const tangent = angle + Math.PI / 2;
    const orbital = customSpeed ?? Math.sqrt(145000 / r) * 21;

    bodies.push({
      x,
      y,
      vx: Math.cos(tangent) * orbital,
      vy: Math.sin(tangent) * orbital,
      radius: 6 + Math.random() * 7,
      color: palette[Math.floor(Math.random() * palette.length)],
      trail: []
    });
  }

  function addRandomBody() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 180 + Math.random() * 280;
    addBody(holeX + Math.cos(angle) * radius, holeY + Math.sin(angle) * radius);
  }

  function resetBodies() {
    bodies = [];
    swallowed = 0;
    const count = Number(bodyRange.value);
    for (let i = 0; i < count; i++) addRandomBody();
    updateHud();
  }

  function updateHud() {
    gravityValue.textContent = gravityScale.toFixed(1) + '×';
    speedValue.textContent = simSpeed.toFixed(1) + '×';
    bodyCount.textContent = bodyRange.value;
    liveBodies.textContent = bodies.length;
    swallowedEl.textContent = swallowed;
  }

  function update(dt) {
    const G = 145000 * gravityScale;

    for (let i = bodies.length - 1; i >= 0; i--) {
      const b = bodies[i];
      const dx = holeX - b.x;
      const dy = holeY - b.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      if (dist < EVENT_HORIZON) {
        bodies.splice(i, 1);
        swallowed++;
        continue;
      }

      const safeDistSq = Math.max(distSq, 1900);
      const accel = G / safeDistSq;
      b.vx += (dx / dist) * accel * dt * 60;
      b.vy += (dy / dist) * accel * dt * 60;

      b.x += b.vx * dt * simSpeed;
      b.y += b.vy * dt * simSpeed;

      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 70) b.trail.shift();

      if (b.x < -200 || b.x > W + 200 || b.y < -200 || b.y > H + 200) {
        bodies.splice(i, 1);
      }
    }

    updateHud();
  }

  function drawSpace() {
    const bg = ctx.createRadialGradient(holeX, holeY, 20, holeX, holeY, Math.max(W,H) * .7);
    bg.addColorStop(0, '#070914');
    bg.addColorStop(.55, '#03050c');
    bg.addColorStop(1, '#010207');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,W,H);

    for (const s of stars) {
      ctx.globalAlpha = s.a;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawAccretionDisk() {
    ctx.save();
    ctx.translate(holeX, holeY);
    ctx.scale(1, .36);

    const glow = ctx.createRadialGradient(0,0,DISK_INNER,0,0,DISK_OUTER);
    glow.addColorStop(0,'rgba(255,255,255,0)');
    glow.addColorStop(.15,'rgba(255,220,145,.78)');
    glow.addColorStop(.42,'rgba(255,127,55,.75)');
    glow.addColorStop(.75,'rgba(181,73,255,.30)');
    glow.addColorStop(1,'rgba(80,60,255,0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0,0,DISK_OUTER,0,Math.PI*2);
    ctx.fill();

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(0,0,DISK_INNER,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawBlackHole() {
    const lens = ctx.createRadialGradient(holeX,holeY,EVENT_HORIZON*.4,holeX,holeY,EVENT_HORIZON*2.3);
    lens.addColorStop(0,'rgba(0,0,0,1)');
    lens.addColorStop(.45,'rgba(0,0,0,1)');
    lens.addColorStop(.67,'rgba(131,77,255,.22)');
    lens.addColorStop(1,'rgba(131,77,255,0)');
    ctx.fillStyle = lens;
    ctx.beginPath();
    ctx.arc(holeX,holeY,EVENT_HORIZON*2.3,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.shadowColor = '#9e61ff';
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(holeX,holeY,EVENT_HORIZON,0,Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(190,150,255,.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(holeX,holeY,EVENT_HORIZON+5,0,Math.PI*2);
    ctx.stroke();
  }

  function drawBodies() {
    for (const b of bodies) {
      if (b.trail.length > 2) {
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x,b.trail[0].y);
        for (let i=1;i<b.trail.length;i++) ctx.lineTo(b.trail[i].x,b.trail[i].y);
        ctx.strokeStyle = b.color + '55';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const glow = ctx.createRadialGradient(b.x-b.radius*.3,b.y-b.radius*.3,1,b.x,b.y,b.radius*2.2);
      glow.addColorStop(0,'#ffffff');
      glow.addColorStop(.18,b.color);
      glow.addColorStop(.52,b.color+'99');
      glow.addColorStop(1,b.color+'00');

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.radius*2.2,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.radius,0,Math.PI*2);
      ctx.fill();
    }
  }

  function draw() {
    drawSpace();
    drawAccretionDisk();
    drawBodies();
    drawBlackHole();

    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BLACK HOLE', holeX, holeY + EVENT_HORIZON + 32);
  }

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, .03);
    lastTime = now;

    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  gravityRange.addEventListener('input', () => {
    gravityScale = Number(gravityRange.value);
    updateHud();
  });

  speedRange.addEventListener('input', () => {
    simSpeed = Number(speedRange.value);
    updateHud();
  });

  bodyRange.addEventListener('input', () => {
    bodyCount.textContent = bodyRange.value;
  });

  bodyRange.addEventListener('change', resetBodies);
  addPlanetBtn.addEventListener('click', addRandomBody);
  resetBtn.addEventListener('click', resetBodies);

  pauseBtn.addEventListener('click', () => {
    running = !running;
    pauseBtn.textContent = running ? 'إيقاف مؤقت' : 'متابعة';
    statusBadge.textContent = running ? 'يعمل' : 'متوقف';
    statusBadge.classList.toggle('paused', !running);
  });

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (W / rect.width),
      y: (event.clientY - rect.top) * (H / rect.height)
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const { x, y } = pointerPosition(event);
    const distanceToHole = Math.hypot(x - holeX, y - holeY);

    if (distanceToHole <= EVENT_HORIZON + 45) {
      draggingHole = true;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
      return;
    }

    addBody(x, y);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!draggingHole) return;

    const { x, y } = pointerPosition(event);
    holeX = Math.max(EVENT_HORIZON + 18, Math.min(W - EVENT_HORIZON - 18, x));
    holeY = Math.max(EVENT_HORIZON + 18, Math.min(H - EVENT_HORIZON - 18, y));
  });

  function stopDragging(event) {
    if (!draggingHole) return;
    draggingHole = false;
    canvas.style.cursor = 'crosshair';

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  canvas.addEventListener('pointerup', stopDragging);
  canvas.addEventListener('pointercancel', stopDragging);

  makeStars();
  resetBodies();
  requestAnimationFrame(loop);
})();