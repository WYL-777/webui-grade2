// ─────────────────────────────────────────────────────────────
//  PAC-MAN  –  standalone canvas game
// ─────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ── DOM ──────────────────────────────────────────────────────
  const canvas    = document.getElementById('game-canvas');
  const ctx       = canvas.getContext('2d');
  const overlay   = document.getElementById('overlay');
  const startBtn  = document.getElementById('start-btn');
  const titleEl   = document.getElementById('overlay-title');
  const subEl     = document.getElementById('overlay-sub');
  const scoreEl   = document.getElementById('score');
  const hiEl      = document.getElementById('high-score');
  const livesEl   = document.getElementById('lives');
  // New Toggle Element
  const modeToggle = document.getElementById('mode-toggle');

  // ── Teachable Machine Configuration ──────────────────────────
  const TM_URL = "https://teachablemachine.withgoogle.com/models/L7sWV2EZJ/";
  let tmModel, webcam;
  let tmInitialized = false;
  let isWebcamActive = true; // Tracks user preference
  let lastConfirmedGesture = "";

  // ── Smooth: Offscreen canvas for static maze (drawn once, reused every frame) ──
  const mazeCanvas  = document.createElement('canvas');
  const mazeCtx     = mazeCanvas.getContext('2d');

  // ── Smooth: Ghost body Path2D cache (built once per ghost size, not every frame) ──
  let ghostBodyPath = null;

  // ── Smooth: Webcam prediction runs on its own interval, not inside the game loop ──
  let webcamInterval = null;
  const WEBCAM_MS    = 100; // predict 10×/sec — imperceptible lag, big CPU saving

  // ── Smooth: Frame counter for minor throttling ──
  let frameCount = 0;


  // ── Maze layout ──────────────────────────────────────────────
  // 0=dot  1=wall  2=empty  3=power-pellet  4=ghost-house
  const MAP_TEMPLATE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,3,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,3,1],
    [1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,2,1,1,1,2,1,1,1,0,1,1,1,1],
    [1,1,1,1,0,1,2,2,2,2,2,2,2,2,2,1,0,1,1,1,1],
    [1,1,1,1,0,1,2,1,4,4,4,4,4,1,2,1,0,1,1,1,1],
    [2,2,2,2,0,2,2,1,4,4,4,4,4,1,2,2,0,2,2,2,2],
    [1,1,1,1,0,1,2,1,1,1,1,1,1,1,2,1,0,1,1,1,1],
    [1,1,1,1,0,1,2,2,2,2,2,2,2,2,2,1,0,1,1,1,1],
    [1,1,1,1,0,1,2,1,1,1,1,1,1,1,2,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1],
    [1,3,0,1,0,0,0,0,0,0,2,0,0,0,0,0,0,1,0,3,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ];

  const ROWS = MAP_TEMPLATE.length;
  const COLS = MAP_TEMPLATE[0].length;
  const TILE = 26;

  canvas.width  = COLS * TILE;
  canvas.height = ROWS * TILE;

  // ── Colours ──────────────────────────────────────────────────
  const C = {
    wall:   '#1e3aff',
    wallG:  '#4466ff',
    dot:    '#ffcf72',
    pellet: '#ffffff',
    pacman: '#FFE000',
    bg:     '#05050f',
    ghosts: ['#ff3b3b', '#ff6bff', '#00e5ff', '#ffb347'],
    scared: '#2233ff',
    scaredFlash: '#ffffff',
  };

  // ── Game state ────────────────────────────────────────────────
  let map, dots, score, highScore = 0, lives, state;
  // state: 'idle' | 'playing' | 'paused' | 'dead' | 'win' | 'gameover'
  let pacman, ghosts, frightenTimer, frightenDuration;
  let animFrame;
  let lastTime = 0;

  // ── Pac-Man object ────────────────────────────────────────────
  function makePacman() {
    return {
      x: 10 * TILE + TILE / 2,
      y: 16 * TILE + TILE / 2,
      dir: { x: 0, y: 0 },
      next: { x: 1, y: 0 },
      speed: 130, // px/s
      mouthAngle: 0,
      mouthDir: 1,
      dead: false,
      deathFrame: 0,
    };
  }

  // ── Ghost object ──────────────────────────────────────────────
  const GHOST_STARTS = [
    { col: 9,  row: 9  },
    { col: 10, row: 9  },
    { col: 11, row: 9  },
    { col: 10, row: 10 },
  ];
  function makeGhost(index) {
    const s = GHOST_STARTS[index];
    return {
      x: s.col * TILE + TILE / 2,
      y: s.row * TILE + TILE / 2,
      dir: { x: 0, y: -1 },
      speed: 110,
      color: C.ghosts[index],
      scared: false,
      flash: false,
      eaten: false,
      releaseDelay: index * 1.8,
      released: false,
    };
  }

  // ── Initialise ────────────────────────────────────────────────
  function init() {
    map   = MAP_TEMPLATE.map(r => r.slice());
    dots  = 0;
    map.forEach(row => row.forEach(v => { if (v === 0 || v === 3) dots++; }));
    score = 0;
    lives = 3;
    frightenTimer    = 0;
    frightenDuration = 7;
    pacman = makePacman();
    ghosts = [0,1,2,3].map(makeGhost);
    updateHUD();

    // Automatically trigger webcam access on load if not done yet
    if (!tmInitialized && isWebcamActive) {
      initTeachableMachine();
    }
  }

  // ── Teachable Machine Integration ────────────────────────────
  async function initTeachableMachine() {
    try {
      subEl.textContent = "Loading camera AI model...";
      const modelURL = TM_URL + "model.json";
      const metadataURL = TM_URL + "metadata.json";

      tmModel = await tmImage.load(modelURL, metadataURL);
      
      const flip = true; 
      webcam = new tmImage.Webcam(120, 120, flip); // Compact video dimensions
      await webcam.setup(); 
      await webcam.play();
      
      tmInitialized = true;
      subEl.textContent = "Camera active! Press SPACE or tap to start";
      
      // Clear any existing interval before starting a fresh one
      if (webcamInterval) clearInterval(webcamInterval);
      
      // Start processing webcam frames independently every 80 milliseconds (~12.5 FPS)
      webcamInterval = setInterval(() => {
        if (tmInitialized && isWebcamActive) {
          predictGestures().catch(console.error);
        }
      }, 80);
      
      // Optional: Visualise camera feed in document border safely
      if (!document.getElementById('tm-canvas-preview')) {
        webcam.canvas.id = 'tm-canvas-preview';
        webcam.canvas.style.position = "fixed";
        webcam.canvas.style.bottom = "10px";
        webcam.canvas.style.right = "10px";
        webcam.canvas.style.borderRadius = "8px";
        webcam.canvas.style.border = "2px solid #1e3aff";
        webcam.canvas.style.zIndex = "10";
        document.body.appendChild(webcam.canvas);
      } else {
        document.getElementById('tm-canvas-preview').style.display = "block";
      }
      
    } catch (err) {
      console.error("Failed to load Teachable Machine", err);
      subEl.textContent = "Camera blocked. Keyboard controls enabled.";
    }
  }

  // Handle live checkbox changes safely
  if (modeToggle) {
    modeToggle.addEventListener('change', async (e) => {
      isWebcamActive = e.target.checked;
      if (isWebcamActive) {
        await initTeachableMachine();
      } else {
        // Stop the background checking loop thread immediately
        if (webcamInterval) {
          clearInterval(webcamInterval);
          webcamInterval = null;
        }
        // Shut down camera stream completely to clear hardware indicator lights
        if (webcam) {
          webcam.stop();
          const preview = document.getElementById('tm-canvas-preview');
          if (preview) preview.style.display = "none";
        }
        tmInitialized = false;
      }
    });
  }

  async function predictGestures() {
    if (!tmInitialized || !webcam || !isWebcamActive) return;
    
    webcam.update();
    const predictions = await tmModel.predict(webcam.canvas);
    
    // Find class with the highest probability
    let maxPrediction = { className: "", probability: 0 };
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i].probability > maxPrediction.probability) {
        maxPrediction = predictions[i];
      }
    }

    if (pacman) {
      const gesture = maxPrediction.className.trim();
      const g = gesture.toLowerCase();

      // Lowered slightly to 0.78 for transitions, using a state lock to avoid shaky direction flickering
      if (maxPrediction.probability > 0.78) {
        if (g.includes("up") && lastConfirmedGesture !== "up") {
          pacman.next = { x: 0, y: -1 };
          lastConfirmedGesture = "up";
        }
        else if (g.includes("down") && lastConfirmedGesture !== "down") {
          pacman.next = { x: 0, y: 1 };
          lastConfirmedGesture = "down";
        }
        else if (g.includes("left") && lastConfirmedGesture !== "left") {
          pacman.next = { x: -1, y: 0 };
          lastConfirmedGesture = "left";
        }
        else if (g.includes("right") && lastConfirmedGesture !== "right") {
          pacman.next = { x: 1, y: 0 };
          lastConfirmedGesture = "right";
        }
      }
    }
  }
  
  // ── HUD ───────────────────────────────────────────────────────
  function updateHUD() {
    scoreEl.textContent = score;
    if (score > highScore) highScore = score;
    hiEl.textContent    = highScore;
    const hearts = Array(lives).fill('●').join(' ');
    livesEl.textContent = hearts || '○';
    livesEl.style.color = lives > 0 ? '' : '#ff3b3b';
  }

  // ── Overlay helpers ───────────────────────────────────────────
  function showOverlay(title, sub, btnText) {
    titleEl.textContent = title;
    subEl.textContent   = sub;
    startBtn.textContent = btnText;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  // ── Tile helpers ──────────────────────────────────────────────
  function tileAt(col, row) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return 1;
    return map[row][col];
  }
  function isWall(col, row) {
    const t = tileAt(col, row);
    return t === 1;
  }
  function canMove(cx, cy, dx, dy, radius) {
    const nx = cx + dx;
    const ny = cy + dy;
    const margin = radius - 1;
    const corners = [
      { x: nx - margin, y: ny - margin },
      { x: nx + margin, y: ny - margin },
      { x: nx - margin, y: ny + margin },
      { x: nx + margin, y: ny + margin },
    ];
    for (const c of corners) {
      const col = Math.floor(c.x / TILE);
      const row = Math.floor(c.y / TILE);
      if (isWall(col, row)) return false;
    }
    return true;
  }

  // ── Input ─────────────────────────────────────────────────────
  // Smooth: pre-defined direction objects — never create { x, y } inside the loop
  const DIR_UP    = Object.freeze({ x:  0, y: -1 });
  const DIR_DOWN  = Object.freeze({ x:  0, y:  1 });
  const DIR_LEFT  = Object.freeze({ x: -1, y:  0 });
  const DIR_RIGHT = Object.freeze({ x:  1, y:  0 });
  const DIR_NONE  = Object.freeze({ x:  0, y:  0 });

  const DIRS = {
    ArrowUp: DIR_UP,    w: DIR_UP,
    ArrowDown: DIR_DOWN, s: DIR_DOWN,
    ArrowLeft: DIR_LEFT, a: DIR_LEFT,
    ArrowRight: DIR_RIGHT, d: DIR_RIGHT,
  };

  // Smooth: reusable ghost direction array — same objects, no GC pressure
  const GHOST_DIRS = Object.freeze([DIR_RIGHT, DIR_LEFT, DIR_DOWN, DIR_UP]);

  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      if (state === 'playing') { state = 'paused'; showOverlay('PAUSED', 'Press SPACE to resume', 'RESUME'); }
      else if (state === 'paused') { hideOverlay(); state = 'playing'; }
      else if (state === 'idle' || state === 'gameover' || state === 'win') startGame();
      return;
    }
    const key = e.key;
    const dir = DIRS[key] || DIRS[key.toLowerCase()];
    if (dir && pacman) pacman.next = dir;
    console.log(dir);// Debugging line to check direction input
  });

  // Touch swipe
  let touchStart = null;
  canvas.addEventListener('touchstart', e => {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  });
  canvas.addEventListener('touchend', e => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      pacman.next = dx > 0 ? { x:1,y:0 } : { x:-1,y:0 };
    } else {
      pacman.next = dy > 0 ? { x:0,y:1 } : { x:0,y:-1 };
    }
    touchStart = null;
  });
  startBtn.addEventListener('click', startGame);

  // ── Start / restart ───────────────────────────────────────────
  function startGame() {
    init();
    state = 'playing';
    hideOverlay();
    if (animFrame) cancelAnimationFrame(animFrame);
    lastTime = performance.now();
    animFrame = requestAnimationFrame(loop);
  }

  // ── Main loop ─────────────────────────────────────────────────
  async function loop(ts) {
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    // Process gesture inputs frame-by-frame
    // if (tmInitialized && isWebcamActive) {
    //   predictGestures().catch(console.error);
    // }

    if (state === 'playing') update(dt);
    draw();

    animFrame = requestAnimationFrame(loop);
  }

  // ── Update ────────────────────────────────────────────────────
  function update(dt) {
    if (state !== 'playing') return;

    // Pacman mouth animation
    pacman.mouthAngle += pacman.mouthDir * dt * 4;
    if (pacman.mouthAngle >= 0.35) { pacman.mouthAngle = 0.35; pacman.mouthDir = -1; }
    if (pacman.mouthAngle <= 0)    { pacman.mouthAngle = 0;    pacman.mouthDir =  1; }

    movePacman(dt);
    eatDots();

    // Frighten timer
    if (frightenTimer > 0) {
      frightenTimer -= dt;
      const flashing = frightenTimer < 2;
      ghosts.forEach(g => {
        g.scared = frightenTimer > 0 && !g.eaten;
        g.flash  = flashing && (Math.floor(frightenTimer * 4) % 2 === 0);
      });
      if (frightenTimer <= 0) {
        ghosts.forEach(g => { g.scared = false; g.flash = false; g.eaten = false; });
      }
    }

    ghosts.forEach((g, i) => {
      g.releaseDelay -= dt;
      if (g.releaseDelay <= 0 && !g.released) {
        g.released = true;
        g.dir = { x: 0, y: -1 };
      }
      if (g.released) moveGhost(g, dt);
    });

    checkCollisions();

    if (dots === 0) {
      state = 'win';
      showOverlay('YOU WIN!', `Score: ${score}`, 'PLAY AGAIN');
    }
  }

  // ── Pac-Man movement ──────────────────────────────────────────
  function movePacman(dt) {
    const speed = pacman.speed * dt;
    const r = TILE * 0.44;

    // Try to switch to queued direction
    if (pacman.next.x !== pacman.dir.x || pacman.next.y !== pacman.dir.y) {
      if (canMove(pacman.x, pacman.y, pacman.next.x * speed, pacman.next.y * speed, r)) {
        pacman.dir = { ...pacman.next };
      }
    }

    if (canMove(pacman.x, pacman.y, pacman.dir.x * speed, pacman.dir.y * speed, r)) {
      pacman.x += pacman.dir.x * speed;
      pacman.y += pacman.dir.y * speed;
    }

    // Wrap tunnel
    if (pacman.x < 0)              pacman.x = COLS * TILE;
    if (pacman.x > COLS * TILE)    pacman.x = 0;
  }

  // ── Dot eating ────────────────────────────────────────────────
  function eatDots() {
    const col = Math.round(pacman.x / TILE - 0.5);
    const row = Math.round(pacman.y / TILE - 0.5);
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
        const t = map[r][c];
        const cx = c * TILE + TILE / 2;
        const cy = r * TILE + TILE / 2;
        const dist = Math.hypot(pacman.x - cx, pacman.y - cy);
        if (t === 0 && dist < TILE * 0.5) {
          map[r][c] = 2;
          score += 10;
          dots--;
          updateHUD();
        } else if (t === 3 && dist < TILE * 0.6) {
          map[r][c] = 2;
          score += 50;
          dots--;
          frightenTimer = frightenDuration;
          ghosts.forEach(g => { g.scared = true; g.eaten = false; });
          updateHUD();
        }
      }
    }
  }

  // ── Ghost AI ──────────────────────────────────────────────────

  function moveGhost(g, dt) {
    const speed = (g.scared ? 65 : g.eaten ? 200 : g.speed) * dt;
    const r = TILE * 0.44;

    // Snap to grid intersection and choose new direction
    const col = (g.x - TILE / 2) / TILE;
    const row = (g.y - TILE / 2) / TILE;
    const snappedCol = Math.round(col);
    const snappedRow = Math.round(row);
    const atJunction = Math.abs(col - snappedCol) < 0.15 && Math.abs(row - snappedRow) < 0.15;

    if (atJunction) {
      // Snap
      g.x = snappedCol * TILE + TILE / 2;
      g.y = snappedRow * TILE + TILE / 2;

      const possible = GHOST_DIRS.filter(d => {
        if (d.x === -g.dir.x && d.y === -g.dir.y) return false; // no U-turn
        const nc = snappedCol + d.x;
        const nr = snappedRow + d.y;
        return !isWall(nc, nr);
      });

      if (possible.length > 0) {
        let chosen;
        if (g.scared) {
          // Random
          chosen = possible[Math.floor(Math.random() * possible.length)];
        } else {
          // Chase pacman (greedy best)
          chosen = possible.reduce((best, d) => {
            const nx = (snappedCol + d.x) * TILE + TILE / 2;
            const ny = (snappedRow + d.y) * TILE + TILE / 2;
            const dist = Math.hypot(nx - pacman.x, ny - pacman.y);
            const bd = Math.hypot(
              (snappedCol + best.x) * TILE + TILE / 2 - pacman.x,
              (snappedRow + best.y) * TILE + TILE / 2 - pacman.y
            );
            return dist < bd ? d : best;
          });
        }
        g.dir = chosen;
      }
    }

    // Move
    const nx = g.x + g.dir.x * speed;
    const ny = g.y + g.dir.y * speed;
    if (canMove(g.x, g.y, g.dir.x * speed, g.dir.y * speed, r)) {
      g.x = nx;
      g.y = ny;
    } else {
      // Pick any valid direction
      const fallback = GHOST_DIRS.filter(d => canMove(g.x, g.y, d.x * speed, d.y * speed, r));
      if (fallback.length) g.dir = fallback[Math.floor(Math.random() * fallback.length)];
    }

    // Wrap
    if (g.x < 0)            g.x = COLS * TILE;
    if (g.x > COLS * TILE)  g.x = 0;
  }

  // ── Collisions ────────────────────────────────────────────────
  let ghostEatCombo = 0;
  function checkCollisions() {
    ghosts.forEach(g => {
      const dist = Math.hypot(g.x - pacman.x, g.y - pacman.y);
      if (dist < TILE * 0.75) {
        if (g.scared && !g.eaten) {
          g.eaten = true;
          g.scared = false;
          ghostEatCombo++;
          score += 200 * ghostEatCombo;
          updateHUD();
          // Reset ghost to house
          const s = GHOST_STARTS[ghosts.indexOf(g)];
          g.x = s.col * TILE + TILE / 2;
          g.y = s.row * TILE + TILE / 2;
          g.dir = { x: 0, y: -1 };
        } else if (!g.scared && !g.eaten) {
          loseLife();
        }
      }
    });
  }

  function loseLife() {
    lives--;
    updateHUD();
    ghostEatCombo = 0;
    if (lives <= 0) {
      state = 'gameover';
      showOverlay('GAME OVER', `Final Score: ${score}`, 'TRY AGAIN');
    } else {
      // Reset positions
      pacman = makePacman();
      ghosts = [0,1,2,3].map(makeGhost);
      frightenTimer = 0;
    }
  }

  // ── Draw ──────────────────────────────────────────────────────
  function draw() {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawMaze();
    drawDots();
    if (state !== 'idle') {
      ghosts.forEach(drawGhost);
      drawPacman();
    }
  }

  function drawMaze() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (MAP_TEMPLATE[r][c] !== 1) continue;
        const x = c * TILE;
        const y = r * TILE;

        // Wall fill
        ctx.fillStyle = '#0b0b2a';
        ctx.fillRect(x, y, TILE, TILE);

        // Wall border glow
        ctx.strokeStyle = C.wall;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = C.wallG;

        // Draw connected borders
        const edges = {
          top:    MAP_TEMPLATE[r-1]?.[c] !== 1,
          bottom: MAP_TEMPLATE[r+1]?.[c] !== 1,
          left:   MAP_TEMPLATE[r]?.[c-1] !== 1,
          right:  MAP_TEMPLATE[r]?.[c+1] !== 1,
        };
        ctx.beginPath();
        if (edges.top)    { ctx.moveTo(x, y+1); ctx.lineTo(x+TILE, y+1); }
        if (edges.bottom) { ctx.moveTo(x, y+TILE-1); ctx.lineTo(x+TILE, y+TILE-1); }
        if (edges.left)   { ctx.moveTo(x+1, y); ctx.lineTo(x+1, y+TILE); }
        if (edges.right)  { ctx.moveTo(x+TILE-1, y); ctx.lineTo(x+TILE-1, y+TILE); }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  }

  function drawDots() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = map[r][c];
        const cx = c * TILE + TILE / 2;
        const cy = r * TILE + TILE / 2;
        if (t === 0) {
          ctx.beginPath();
          ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = C.dot;
          ctx.fill();
        } else if (t === 3) {
          const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 250);
          ctx.beginPath();
          ctx.arc(cx, cy, 6 * pulse, 0, Math.PI * 2);
          ctx.fillStyle = C.pellet;
          ctx.shadowBlur = 14;
          ctx.shadowColor = C.pellet;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }
  }

  function drawPacman() {
    const p = pacman;
    const angle = p.mouthAngle * Math.PI;
    // Rotation angle from direction
    let rot = 0;
    if (p.dir.x === 1)  rot = 0;
    if (p.dir.x === -1) rot = Math.PI;
    if (p.dir.y === -1) rot = -Math.PI / 2;
    if (p.dir.y === 1)  rot = Math.PI / 2;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(rot);

    // Glow
    ctx.shadowBlur  = 18;
    ctx.shadowColor = C.pacman;

    ctx.fillStyle = C.pacman;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, TILE * 0.44, angle, Math.PI * 2 - angle);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(2, -TILE * 0.2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.shadowBlur = 0;
  }

  function drawGhost(g) {
    const x = g.x;
    const y = g.y;
    const r = TILE * 0.44;

    ctx.save();
    ctx.translate(x, y);

    let bodyColor;
    if (g.scared) {
      bodyColor = g.flash ? C.scaredFlash : C.scared;
    } else {
      bodyColor = g.color;
    }

    ctx.shadowBlur  = 14;
    ctx.shadowColor = bodyColor;

    // Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    // Dome
    ctx.arc(0, -r * 0.15, r, Math.PI, 0, false);
    // Skirt with bumps
    const skirtBottom = r * 0.9;
    const bumpCount   = 3;
    const bumpW       = (r * 2) / bumpCount;
    ctx.lineTo(r, skirtBottom);
    for (let i = 0; i < bumpCount; i++) {
      const bx = r - bumpW * i;
      ctx.arc(bx - bumpW / 2, skirtBottom, bumpW / 2, 0, Math.PI, true);
    }
    ctx.lineTo(-r, skirtBottom);
    ctx.closePath();
    ctx.fill();

    // Eyes
    if (!g.scared) {
      // White of eye
      ctx.fillStyle = '#fff';
      [-0.28, 0.28].forEach(ex => {
        ctx.beginPath();
        ctx.ellipse(r * ex, -r * 0.25, r * 0.22, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      // Pupils
      const px = Math.min(Math.max(g.dir.x, -1), 1) * r * 0.1;
      const py = Math.min(Math.max(g.dir.y, -1), 1) * r * 0.08;
      ctx.fillStyle = '#0033cc';
      [-0.28, 0.28].forEach(ex => {
        ctx.beginPath();
        ctx.ellipse(r * ex + px, -r * 0.22 + py, r * 0.12, r * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      // Scared eyes: X X
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      [-0.25, 0.25].forEach(ex => {
        const cx2 = r * ex;
        const cy2 = -r * 0.25;
        const s   = r * 0.12;
        ctx.beginPath();
        ctx.moveTo(cx2-s, cy2-s); ctx.lineTo(cx2+s, cy2+s);
        ctx.moveTo(cx2+s, cy2-s); ctx.lineTo(cx2-s, cy2+s);
        ctx.stroke();
      });
    }

    ctx.restore();
    ctx.shadowBlur = 0;
  }

  // ── Boot ──────────────────────────────────────────────────────
  state = 'idle';
  init();
  draw(); // first frame
  showOverlay('PAC·MAN', 'Press SPACE or tap to start', 'START GAME');

  // Run loop even in idle so pellets pulse
  lastTime = performance.now();
  animFrame = requestAnimationFrame(loop);

})();