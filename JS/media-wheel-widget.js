(function () {
  function initWidget(root) {
    if (!root || root.dataset.init === "true") return;
    root.dataset.init = "true";

    if (!window.THREE) {
      console.error("Three.js is required.");
      return;
    }

    const $ = (sel, scope = root) => scope.querySelector(sel);
    const $$ = (sel, scope = root) => Array.from(scope.querySelectorAll(sel));

    const els = {
      canvasContainer: $('[data-el="canvas-container"]'),
      labelOverlay: $('[data-el="label-overlay"]'),
      rotateToggle: $('[data-el="rotate-toggle"]'),
      previewPanel: $('[data-el="preview-panel"]'),
      previewImage: $('[data-el="preview-image"]'),
      previewTitle: $('[data-el="preview-title"]'),
      settingsBtn: $('[data-el="settings-btn"]'),
      settingsPanel: $('[data-el="settings-panel"]'),
      infoBadge: $('[data-el="info-badge"]'),
      animSwitch: $('[data-action="toggle-anim"]'),
      fovGroup: $('[data-el="fov-group"]'),
      ozoomGroup: $('[data-el="ozoom-group"]')
    };

    const DEFAULT_SETTINGS = {
      camera: {
        projection: "perspective",
        height: 6.8,
        distance: 12.8,
        fov: 31,
        orthoZoom: 1.0
      },
      scrollCamera: {
        enabled: true,
        start: 0.10,
        end: 0.90,
        startCamY: 6.8,
        endCamY: 2.0,
        startCamZ: 12.8,
        endCamZ: 6.5,
        startFov: 31,
        endFov: 10
      },
      card: {
        width: 200,
        height: 149,
        padding: 0,
        cornerRadius: 0.5,
        rotation: { x: 4, y: -90, z: 0 }
      },
      wheel: {
        radius: 2.1,
        itemMultiplier: 2,
        animSpeed: 1.11,
        animating: true
      },
      appearance: {
        bgColor: "#ff0000",
        showLabels: true,
        showPreview: true
      },
      media: {
        globalFit: "cover"
      },
      selector: {
        angle: 325,
        tolerance: 8,
        showLine: true,
        lineColor: "#111111",
        lineWidth: 2,
        lineOpacity: 0.45,
        lineBlend: "difference",
        start: 0.14,
        end: 0.5
      }
    };

    const CFG = {
      cardW: DEFAULT_SETTINGS.card.width,
      cardH: DEFAULT_SETTINGS.card.height,
      radius: DEFAULT_SETTINGS.wheel.radius,
      padding: DEFAULT_SETTINGS.card.padding,
      cardCorner: DEFAULT_SETTINGS.card.cornerRadius,
      multiplier: DEFAULT_SETTINGS.wheel.itemMultiplier,
      bgColor: DEFAULT_SETTINGS.appearance.bgColor,
      showLabels: DEFAULT_SETTINGS.appearance.showLabels,
      showPreview: DEFAULT_SETTINGS.appearance.showPreview,
      animSpeed: DEFAULT_SETTINGS.wheel.animSpeed,
      animating: DEFAULT_SETTINGS.wheel.animating,
      camY: DEFAULT_SETTINGS.camera.height,
      camZ: DEFAULT_SETTINGS.camera.distance,
      fov: DEFAULT_SETTINGS.camera.fov,
      camType: DEFAULT_SETTINGS.camera.projection,
      orthoZoom: DEFAULT_SETTINGS.camera.orthoZoom,
      cardRotX: DEFAULT_SETTINGS.card.rotation.x,
      cardRotY: DEFAULT_SETTINGS.card.rotation.y,
      cardRotZ: DEFAULT_SETTINGS.card.rotation.z,
      globalFit: DEFAULT_SETTINGS.media.globalFit,
      selectorAngle: DEFAULT_SETTINGS.selector.angle,
      selectorTolerance: DEFAULT_SETTINGS.selector.tolerance,
      showSelectorLine: DEFAULT_SETTINGS.selector.showLine,
      selectorLineColor: DEFAULT_SETTINGS.selector.lineColor,
      selectorLineWidth: DEFAULT_SETTINGS.selector.lineWidth,
      selectorLineOpacity: DEFAULT_SETTINGS.selector.lineOpacity,
      selectorLineBlend: DEFAULT_SETTINGS.selector.lineBlend,
      selectorStart: DEFAULT_SETTINGS.selector.start,
      selectorEnd: DEFAULT_SETTINGS.selector.end,

      scrollCamEnabled: DEFAULT_SETTINGS.scrollCamera.enabled,
      scrollCamStart: DEFAULT_SETTINGS.scrollCamera.start,
      scrollCamEnd: DEFAULT_SETTINGS.scrollCamera.end,
      scrollStartCamY: DEFAULT_SETTINGS.scrollCamera.startCamY,
      scrollEndCamY: DEFAULT_SETTINGS.scrollCamera.endCamY,
      scrollStartCamZ: DEFAULT_SETTINGS.scrollCamera.startCamZ,
      scrollEndCamZ: DEFAULT_SETTINGS.scrollCamera.endCamZ,
      scrollStartFov: DEFAULT_SETTINGS.scrollCamera.startFov,
      scrollEndFov: DEFAULT_SETTINGS.scrollCamera.endFov
    };

    let rotAngle = 0, hoveredIdx = -1;
    let autoVelocity = CFG.animSpeed * 0.006;
    let scrollVelocity = 0;

    let touchDragging = false;
    let lastTouchY = 0;
    let lastTouchX = 0;
    let touchVelocity = 0;

    let items = [], cards = [];
    let scene, perspCam, orthoCam, camera, renderer, raycaster, mouse, groundMesh, resizeObserver;
    const svgOv = els.labelOverlay;
    const DEG = Math.PI / 180;

    const BASE = [
      {
        title:'Aurelia fractalis',
        sub:'photo sample',
        c:['#e63946','#ff8a8a','#c0392b'],
        media:{ type:'image', url:'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1200&q=80' }
      },
      {
        title:'Botanica mirabilis',
        sub:'landscape sample',
        c:['#457b9d','#88c4e8','#2980b9'],
        media:{ type:'image', url:'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80' }
      },
      {
        title:'Motion sample',
        sub:'autoplay muted loop',
        c:['#1d3557','#7fb3ff','#457b9d'],
        media:{ type:'video', url:'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' }
      },
      { title:'Rosaflora quantica',   sub:'63.88|76.40|4.4', c:['#f48fb1','#ffb6d3','#e91e63'] },
      { title:'Heliopsis minoris',    sub:'54.31|65.77|2.9', c:['#fdd835','#fff9c4','#f9a825'] },
      { title:'Veloria noctiflora',   sub:'88.99|45.31|0.6', c:['#2e7d32','#81c784','#1b5e20'] },
      { title:'Chloranthus sporalis', sub:'18.06|23.05|1.2', c:['#1565c0','#64b5f6','#0d47a1'] },
      { title:'Petalum obscura',      sub:'45.10|42.63|8.7', c:['#7b1fa2','#ce93d8','#4a148c'] },
      { title:'Viola luminaris',      sub:'03.31|1.25',      c:['#c62828','#ef9a9a','#b71c1c'] },
      { title:'Frostia delicata',     sub:'72.44|88.91|6.3', c:['#558b2f','#aed581','#33691e'] },
      { title:'Viridia nocturna',     sub:'66.28|14.52',     c:['#00695c','#80cbc4','#004d40'] }
    ];

    function getSize(){
      const r = root.getBoundingClientRect();
      return {
        width: Math.max(1, Math.round(r.width)),
        height: Math.max(1, Math.round(r.height))
      };
    }

    function clamp(v, min, max){
      return Math.max(min, Math.min(max, v));
    }

    function lerp(a, b, t){
      return a + (b - a) * t;
    }

    function easeInOutCubic(t){
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function getSectionScrollProgress(){
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const total = rect.height + vh;
      if (total <= 0) return 0;

      const raw = (vh - rect.top) / total;
      const start = CFG.scrollCamStart;
      const end = CFG.scrollCamEnd <= start ? start + 0.001 : CFG.scrollCamEnd;
      const mapped = (raw - start) / (end - start);

      return clamp(mapped, 0, 1);
    }

    function getActiveCameraValues(){
      let camY = CFG.camY;
      let camZ = CFG.camZ;
      let fov = CFG.fov;

      if (CFG.scrollCamEnabled) {
        const progress = getSectionScrollProgress();
        const t = easeInOutCubic(progress);

        camY = lerp(CFG.scrollStartCamY, CFG.scrollEndCamY, t);
        camZ = lerp(CFG.scrollStartCamZ, CFG.scrollEndCamZ, t);
        fov  = lerp(CFG.scrollStartFov, CFG.scrollEndFov, t);
      }

      return { camY, camZ, fov };
    }

    function normalizeDeg(deg){
      return ((deg % 360) + 360) % 360;
    }

    function shortestAngleDelta(a, b){
      let d = normalizeDeg(a) - normalizeDeg(b);
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      return d;
    }

    function setSelectorBlend(mode){
      CFG.selectorLineBlend = mode;
      $$('[data-action="blend-mode"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === mode);
      });
    }

    function projectWorldToScreen(vec3){
      const p = vec3.clone().project(camera);
      const { width, height } = getSize();
      return {
        x: (p.x * 0.5 + 0.5) * width,
        y: (-p.y * 0.5 + 0.5) * height,
        z: p.z
      };
    }

    function onTouchStart(e){
      if (!e.touches || !e.touches.length) return;
      touchDragging = true;
      lastTouchY = e.touches[0].clientY;
      lastTouchX = e.touches[0].clientX;
      touchVelocity = 0;
    }

    function onTouchMove(e){
      if (!touchDragging || !e.touches || !e.touches.length) return;

      const y = e.touches[0].clientY;
      const x = e.touches[0].clientX;

      const dy = y - lastTouchY;
      const dx = x - lastTouchX;
      const delta = dy + dx * 0.35;

      touchVelocity = delta * 0.00022;
      scrollVelocity += touchVelocity;

      lastTouchY = y;
      lastTouchX = x;

      e.preventDefault();
    }

    function onTouchEnd(){
      touchDragging = false;
    }

    function mix(h1,h2,t){
      const r1=parseInt(h1.slice(1,3),16),g1=parseInt(h1.slice(3,5),16),b1=parseInt(h1.slice(5,7),16);
      const r2=parseInt(h2.slice(1,3),16),g2=parseInt(h2.slice(3,5),16),b2=parseInt(h2.slice(5,7),16);
      const r=Math.round(r1+(r2-r1)*t),g=Math.round(g1+(g2-g1)*t),b=Math.round(b1+(b2-b1)*t);
      return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
    }

    function genTex(item, w, h) {
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext('2d');
      const [c1, c2, c3] = item.c;

      const bg = ctx.createLinearGradient(0,0,w*0.3,h);
      bg.addColorStop(0, mix(c2,'#ffffff',0.75));
      bg.addColorStop(0.4, mix(c1,'#ffffff',0.55));
      bg.addColorStop(1, mix(c3,'#ffffff',0.35));
      ctx.fillStyle = bg;
      ctx.fillRect(0,0,w,h);

      for(let i=0;i<6;i++){
        const bx=w*(0.15+Math.random()*0.7),by=h*(0.1+Math.random()*0.7),br=20+Math.random()*50;
        const rg=ctx.createRadialGradient(bx,by,0,bx,by,br);
        rg.addColorStop(0,mix(c2,'#ffffff',0.6)+'55');
        rg.addColorStop(1,mix(c2,'#ffffff',0.6)+'00');
        ctx.fillStyle=rg;
        ctx.beginPath();
        ctx.arc(bx,by,br,0,Math.PI*2);
        ctx.fill();
      }

      const fcx=w*0.5,fcy=h*0.42;
      ctx.strokeStyle='#4a7c59';
      ctx.lineWidth=2.5;
      ctx.beginPath();
      ctx.moveTo(fcx,fcy+20);
      ctx.bezierCurveTo(fcx+8,fcy+50,fcx-12,fcy+90,fcx+4,h);
      ctx.stroke();

      ctx.fillStyle='#5a9e6f';
      ctx.globalAlpha=0.7;
      ctx.beginPath();ctx.ellipse(fcx+12,fcy+45,20,7,0.6,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(fcx-10,fcy+60,16,6,-0.4,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;

      const np=5+Math.floor(Math.random()*4);
      const pLen=22+Math.random()*28,pW=10+Math.random()*12;
      for(let p=0;p<np;p++){
        const a=(p/np)*Math.PI*2-Math.PI/2;
        ctx.save();
        ctx.translate(fcx,fcy);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(pLen*0.5,0,pLen*0.55,pW*0.5,0,0,Math.PI*2);
        const pg=ctx.createLinearGradient(0,-pW,pLen,pW);
        pg.addColorStop(0,mix(c2,'#ffffff',0.5));
        pg.addColorStop(0.5,c1);
        pg.addColorStop(1,c3);
        ctx.fillStyle=pg;
        ctx.fill();
        ctx.restore();
      }
      return cv;
    }

    function drawMediaLikeCSS(ctx, source, destW, destH, fit = 'cover', bg = '#ffffff') {
      const sw = source.videoWidth || source.naturalWidth || source.width;
      const sh = source.videoHeight || source.naturalHeight || source.height;
      if (!sw || !sh) return;

      ctx.clearRect(0, 0, destW, destH);

      if (fit === 'contain') {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, destW, destH);
      }

      const srcAspect = sw / sh;
      const dstAspect = destW / destH;
      let drawW, drawH, dx, dy;

      if (fit === 'contain') {
        if (srcAspect > dstAspect) {
          drawW = destW;
          drawH = destW / srcAspect;
          dx = 0;
          dy = (destH - drawH) / 2;
        } else {
          drawH = destH;
          drawW = destH * srcAspect;
          dx = (destW - drawW) / 2;
          dy = 0;
        }
        ctx.drawImage(source, dx, dy, drawW, drawH);
      } else {
        if (srcAspect > dstAspect) {
          drawH = destH;
          drawW = destH * srcAspect;
          dx = (destW - drawW) / 2;
          dy = 0;
        } else {
          drawW = destW;
          drawH = destW / srcAspect;
          dx = 0;
          dy = (destH - drawH) / 2;
        }
        ctx.drawImage(source, dx, dy, drawW, drawH);
      }
    }

    function rrect(w,h,r){
      const s = new THREE.Shape();
      s.moveTo(-w/2+r,-h/2);
      s.lineTo(w/2-r,-h/2);
      s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
      s.lineTo(w/2,h/2-r);
      s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
      s.lineTo(-w/2+r,h/2);
      s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
      s.lineTo(-w/2,-h/2+r);
      s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
      return s;
    }

    function buildItems(){
      items = [];
      for(let m=0; m<CFG.multiplier; m++){
        for(const it of BASE) items.push({ ...it });
      }
    }

    function createCardTextureFromCanvas(cardCanvas) {
      const tex = new THREE.CanvasTexture(cardCanvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
      return tex;
    }

    function createMediaCanvas(item, w, h, onFrameReady) {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      const initialFallback = genTex(item, w, h);
      ctx.drawImage(initialFallback, 0, 0, w, h);

      const notifyReady = () => {
        if (typeof onFrameReady === 'function') onFrameReady();
      };

      if (!item.media) {
        notifyReady();
        return { canvas, ctx, sourceType: 'fallback', ready: true, mediaEl: null };
      }

      if (item.media.type === 'image') {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        const state = { canvas, ctx, sourceType: 'image', ready: false, mediaEl: img };

        img.onload = () => {
          state.ready = true;
          drawMediaLikeCSS(ctx, img, w, h, CFG.globalFit);
          notifyReady();
        };

        img.onerror = () => {
          const procedural = genTex(item, w, h);
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(procedural, 0, 0, w, h);
          state.ready = true;
          state.sourceType = 'fallback';
          notifyReady();
        };

        img.src = item.media.url;
        return state;
      }

      if (item.media.type === 'video') {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.autoplay = true;
        video.preload = 'auto';

        const state = { canvas, ctx, sourceType: 'video', ready: false, mediaEl: video };

        const drawFirstFrame = () => {
          if (video.videoWidth && video.videoHeight) {
            state.ready = true;
            drawMediaLikeCSS(ctx, video, w, h, CFG.globalFit);
            notifyReady();
          }
        };

        video.addEventListener('loadeddata', drawFirstFrame);
        video.addEventListener('canplay', () => {
          drawFirstFrame();
          video.play().catch(() => {});
        });

        video.addEventListener('error', () => {
          const procedural = genTex(item, w, h);
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(procedural, 0, 0, w, h);
          state.ready = true;
          state.sourceType = 'fallback';
          notifyReady();
        });

        video.src = item.media.url;
        video.load();
        return state;
      }

      notifyReady();
      return { canvas, ctx, sourceType: 'fallback', ready: true, mediaEl: null };
    }

    function buildWheel(){
      cards.forEach(c=>{
        if (c.mediaState?.mediaEl && c.mediaState.sourceType === 'video') {
          c.mediaState.mediaEl.pause();
          c.mediaState.mediaEl.removeAttribute('src');
          c.mediaState.mediaEl.load();
        }
        scene.remove(c.group);
        c.group.traverse(ch=>{
          if(ch.isMesh){
            if(ch.material.map) ch.material.map.dispose();
            ch.material.dispose();
            ch.geometry.dispose();
          }
        });
      });

      cards = [];
      buildItems();

      const n = items.length;
      const step = (Math.PI * 2) / n;
      const R = CFG.radius;
      const aspect = CFG.cardW / CFG.cardH;
      const ch3 = 2.4;
      const cw3 = ch3 * aspect;
      const pad = CFG.padding;
      const cr = CFG.cardCorner;

      for(let i=0;i<n;i++){
        const item = items[i];
        const angle = step * i;
        const iw = cw3 - pad * 2;
        const ih = ch3 - pad * 2;

        let frontTex, backTex;

        const mediaState = createMediaCanvas(
          item,
          CFG.cardW * 2,
          CFG.cardH * 2,
          () => {
            if (frontTex) frontTex.needsUpdate = true;
            if (backTex) backTex.needsUpdate = true;
            if (hoveredIdx === i) updPreview(i);
          }
        );

        frontTex = createCardTextureFromCanvas(mediaState.canvas);
        backTex  = createCardTextureFromCanvas(mediaState.canvas);

        const fGeo = new THREE.ShapeGeometry(rrect(iw, ih, cr), 8);
        const fPos = fGeo.attributes.position;
        const fUvs = new Float32Array(fPos.count * 2);
        for(let v=0; v<fPos.count; v++){
          fUvs[v*2] = (fPos.getX(v) + iw/2) / iw;
          fUvs[v*2+1] = (fPos.getY(v) + ih/2) / ih;
        }
        fGeo.setAttribute('uv', new THREE.BufferAttribute(fUvs, 2));

        const bkGeo = new THREE.ShapeGeometry(rrect(iw, ih, cr), 8);
        const bkPos = bkGeo.attributes.position;
        const bkUvs = new Float32Array(bkPos.count * 2);
        for(let v=0; v<bkPos.count; v++){
          bkUvs[v*2] = 1 - ((bkPos.getX(v) + iw/2) / iw);
          bkUvs[v*2+1] = (bkPos.getY(v) + ih/2) / ih;
        }
        bkGeo.setAttribute('uv', new THREE.BufferAttribute(bkUvs, 2));

        const front = new THREE.Mesh(
          fGeo,
          new THREE.MeshBasicMaterial({
            map: frontTex,
            side: THREE.FrontSide,
            transparent: true
          })
        );
        front.position.z = 0.005;

        const back = new THREE.Mesh(
          bkGeo,
          new THREE.MeshBasicMaterial({
            map: backTex,
            side: THREE.FrontSide,
            transparent: true
          })
        );
        back.rotation.y = Math.PI;
        back.position.z = -0.005;

        const brGeo = new THREE.ShapeGeometry(rrect(cw3, ch3, cr + 0.02), 8);
        const brMat = new THREE.MeshBasicMaterial({color:0xffffff, side:THREE.DoubleSide});
        const border = new THREE.Mesh(brGeo, brMat);

        const group = new THREE.Group();
        const pivot = new THREE.Group();
        pivot.add(front);
        pivot.add(back);
        pivot.add(border);
        pivot.rotation.set(CFG.cardRotX * DEG, CFG.cardRotY * DEG, CFG.cardRotZ * DEG);
        group.add(pivot);

        const x = Math.sin(angle) * R;
        const z = Math.cos(angle) * R;
        group.position.set(x, ch3 / 2 + 0.02, z);
        group.rotation.y = angle + Math.PI;

        scene.add(group);

        cards.push({
          group, pivot, front, back, border,
          angle, item, index:i, cw3, ch3,
          hoverY: ch3 / 2 + 0.02,
          baseY: ch3 / 2 + 0.02,
          mediaState,
          frontTex,
          backTex
        });
      }
    }

    function createPerspCam(){
      const { width, height } = getSize();
      perspCam = new THREE.PerspectiveCamera(CFG.fov, width / height, 0.1, 500);
    }

    function createOrthoCam(){
      const { width, height } = getSize();
      const a = width / height;
      const z = CFG.orthoZoom;
      orthoCam = new THREE.OrthographicCamera(-z*a, z*a, z, -z, 0.1, 500);
    }

    function updCam(){
      const { width, height } = getSize();
      const camVals = getActiveCameraValues();

      if(CFG.camType === 'perspective'){
        perspCam.fov = camVals.fov;
        perspCam.aspect = width / height;
        perspCam.updateProjectionMatrix();
        perspCam.position.set(0, camVals.camY, camVals.camZ);
        perspCam.lookAt(0,1,0);
        camera = perspCam;
      } else {
        const a = width / height;
        const z = CFG.orthoZoom;
        orthoCam.left = -z*a;
        orthoCam.right = z*a;
        orthoCam.top = z;
        orthoCam.bottom = -z;
        orthoCam.updateProjectionMatrix();
        orthoCam.position.set(0, camVals.camY, camVals.camZ);
        orthoCam.lookAt(0,1,0);
        camera = orthoCam;
      }
    }

    function drawSelectorGuide(){
      if(!CFG.showSelectorLine || !cards.length) return;

      const { width: W, height: H } = getSize();

      const centerWorld = new THREE.Vector3(0, 0, 0);
      const centerScreen = projectWorldToScreen(centerWorld);

      let bestCard = null;
      let bestDelta = Infinity;

      for (const card of cards) {
        const liveDeg = normalizeDeg((card.angle + rotAngle) * 180 / Math.PI);
        const delta = Math.abs(shortestAngleDelta(liveDeg, CFG.selectorAngle));
        if (delta < bestDelta) {
          bestDelta = delta;
          bestCard = card;
        }
      }

      let guideWorld;
      if (bestCard) {
        guideWorld = new THREE.Vector3();
        bestCard.group.getWorldPosition(guideWorld);
        guideWorld.y = 0;
      } else {
        const a = CFG.selectorAngle * DEG;
        const guideRadius = Math.max(CFG.radius * 1.35, CFG.radius + 1.2);
        guideWorld = new THREE.Vector3(
          Math.sin(a) * guideRadius,
          0,
          Math.cos(a) * guideRadius
        );
      }

      const guideScreen = projectWorldToScreen(guideWorld);
      if (guideScreen.z > 1 || centerScreen.z > 1) return;

      const dx = guideScreen.x - centerScreen.x;
      const dy = guideScreen.y - centerScreen.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) return;

      const nx = dx / len;
      const ny = dy / len;

      const ext = Math.max(W, H) * 0.9;
      const startDist = ext * CFG.selectorStart;
      const endDist = ext * CFG.selectorEnd;

      const x1 = centerScreen.x + nx * startDist;
      const y1 = centerScreen.y + ny * startDist;
      const x2 = centerScreen.x + nx * endDist;
      const y2 = centerScreen.y + ny * endDist;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.style.stroke = CFG.selectorLineColor;
      line.style.strokeWidth = String(CFG.selectorLineWidth);
      line.style.opacity = String(CFG.selectorLineOpacity);
      line.style.mixBlendMode = CFG.selectorLineBlend;
      line.setAttribute('stroke-linecap', 'round');
      svgOv.appendChild(line);

      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      marker.setAttribute('cx', guideScreen.x);
      marker.setAttribute('cy', guideScreen.y);
      marker.setAttribute('r', Math.max(3, CFG.selectorLineWidth * 1.35));
      marker.style.fill = CFG.selectorLineColor;
      marker.style.opacity = String(Math.min(1, CFG.selectorLineOpacity + 0.15));
      marker.style.mixBlendMode = CFG.selectorLineBlend;
      svgOv.appendChild(marker);
    }

    function redrawAllMediaTextures() {
      for (const card of cards) {
        const state = card.mediaState;
        if (!state) continue;

        if (state.sourceType === 'fallback') {
          const procedural = genTex(card.item, state.canvas.width, state.canvas.height);
          state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
          state.ctx.drawImage(procedural, 0, 0, state.canvas.width, state.canvas.height);
        } else if (state.mediaEl && state.ready) {
          drawMediaLikeCSS(state.ctx, state.mediaEl, state.canvas.width, state.canvas.height, CFG.globalFit);
        }

        card.frontTex.needsUpdate = true;
        card.backTex.needsUpdate = true;
      }
    }

    function updPreview(idx){
      const p = els.previewPanel;
      const imgEl = els.previewImage;

      if(!CFG.showPreview || idx < 0 || idx >= items.length){
        p.classList.remove('visible');
        return;
      }

      const item = items[idx];
      imgEl.style.objectFit = CFG.globalFit === 'contain' ? 'contain' : 'cover';

      if(item.media && item.media.type === 'image'){
        imgEl.src = item.media.url;
      } else if(item.media && item.media.type === 'video'){
        const card = cards.find(c=>c.index===idx);
        if(card?.mediaState?.canvas){
          imgEl.src = card.mediaState.canvas.toDataURL('image/png');
        } else {
          imgEl.src = '';
        }
      } else {
        imgEl.src = genTex(item, 440, 310).toDataURL();
      }

      els.previewTitle.textContent = item.title;
      p.classList.add('visible');
    }

    function drawLabels(){
      svgOv.innerHTML = '';
      if((!CFG.showLabels && !CFG.showSelectorLine) || !cards.length) return;

      const { width: W, height: H } = getSize();
      svgOv.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svgOv.setAttribute('width', W);
      svgOv.setAttribute('height', H);

      if(CFG.showLabels){
        const c3 = new THREE.Vector3(0,0,0).project(camera);
        const cx = (c3.x*0.5+0.5)*W, cy = (-c3.y*0.5+0.5)*H;

        for(let i=0;i<cards.length;i++){
          const card = cards[i];
          const wp = new THREE.Vector3();
          card.group.getWorldPosition(wp);

          const base = new THREE.Vector3(wp.x,0,wp.z).project(camera);
          if(base.z > 1) continue;

          const sx = (base.x*0.5+0.5)*W, sy = (-base.y*0.5+0.5)*H;
          if(sy < H*0.25 || sx < -80 || sx > W+80) continue;

          const totalA = card.angle + rotAngle;
          const deg = (((totalA*180/Math.PI)%360)+360)%360;

          const dx = sx-cx, dy = sy-cy;
          const d = Math.sqrt(dx*dx+dy*dy);
          if(d<15) continue;
          const nx = dx/d, ny = dy/d;

          const topP = wp.clone().project(camera);
          const topSy = (-topP.y*0.5+0.5)*H;
          const screenH = Math.abs(sy-topSy);
          const fade = Math.min(1,Math.max(0.1,screenH/140));

          const ext = Math.max(W,H);
          const ex = sx+nx*ext, ey = sy+ny*ext;

          const ln = document.createElementNS('http://www.w3.org/2000/svg','line');
          ln.setAttribute('x1',sx); ln.setAttribute('y1',sy);
          ln.setAttribute('x2',ex); ln.setAttribute('y2',ey);
          ln.style.stroke = `rgba(0,0,0,${(0.05*fade).toFixed(3)})`;
          ln.style.strokeWidth = '2';
          svgOv.appendChild(ln);

          const al = 25*fade;
          const aln = document.createElementNS('http://www.w3.org/2000/svg','line');
          aln.setAttribute('x1',sx); aln.setAttribute('y1',sy);
          aln.setAttribute('x2',sx+nx*al); aln.setAttribute('y2',sy+ny*al);
          aln.style.stroke = card.item.c[0];
          aln.style.strokeWidth = '3';
          aln.style.opacity = (fade*0.8).toFixed(2);
          svgOv.appendChild(aln);

          const td = 55+d*0.25;
          const lx = sx+nx*td, ly = sy+ny*td;
          if(lx<-60||lx>W+60||ly<-40||ly>H+40) continue;

          const la = Math.atan2(ny,nx)*180/Math.PI;
          let tr = la;
          if(tr>90) tr-=180;
          if(tr<-90) tr+=180;

          const g = document.createElementNS('http://www.w3.org/2000/svg','g');
          g.setAttribute('transform',`translate(${lx},${ly}) rotate(${tr})`);
          g.style.opacity = fade.toFixed(2);

          const t1 = document.createElementNS('http://www.w3.org/2000/svg','text');
          t1.setAttribute('x',0); t1.setAttribute('y',-5); t1.setAttribute('text-anchor','middle');
          t1.style.cssText = `font-family:'DM Sans',sans-serif;font-size:${Math.max(8,12*fade)}px;font-weight:600;font-style:italic;fill:#1a1a1a`;
          t1.textContent = card.item.title;
          g.appendChild(t1);

          const t2 = document.createElementNS('http://www.w3.org/2000/svg','text');
          t2.setAttribute('x',0); t2.setAttribute('y',8); t2.setAttribute('text-anchor','middle');
          t2.style.cssText = `font-family:'Space Mono',monospace;font-size:${Math.max(6,9*fade)}px;fill:#999`;
          t2.textContent = card.item.sub;
          g.appendChild(t2);

          const t3 = document.createElementNS('http://www.w3.org/2000/svg','text');
          t3.setAttribute('x',0); t3.setAttribute('y',20); t3.setAttribute('text-anchor','middle');
          t3.style.cssText = `font-family:'Space Mono',monospace;font-size:${Math.max(6,9*fade)}px;font-weight:700;fill:#e63946`;
          t3.textContent = deg.toFixed(0)+'°';
          g.appendChild(t3);

          svgOv.appendChild(g);
        }
      }

      drawSelectorGuide();
    }

    function checkHover(){
      raycaster.setFromCamera(mouse, camera);
      const targets = [];
      cards.forEach(c=>{targets.push(c.front); targets.push(c.back);});
      const hits = raycaster.intersectObjects(targets);

      if(hits.length){
        const hitObj = hits[0].object;
        const card = cards.find(c=>c.front===hitObj || c.back===hitObj);
        if(card && hoveredIdx !== card.index){
          hoveredIdx = card.index;
          updPreview(card.index);
        }
      } else if(hoveredIdx !== -1){
        hoveredIdx = -1;
        els.previewPanel.classList.remove('visible');
      }
    }

    const HOVER_LIFT = 1;
    const HOVER_SPEED = 0.3;
    const SCROLL_FRICTION = 0.93;

    function toggleAnim(on){
      CFG.animating = on;
      els.infoBadge.textContent = on
        ? 'Rotating · Scroll to add momentum · Hover for preview'
        : 'Paused · Scroll to spin · Hover for preview';
    }

    function toggleSettings(){
      els.settingsPanel.classList.toggle('open');
    }

    function setCamType(type){
      CFG.camType = type;
      $$('[data-action="cam-type"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === type);
      });
      els.fovGroup.style.display = type==='perspective' ? '' : 'none';
      els.ozoomGroup.style.display = type==='orthographic' ? '' : 'none';
      updCam();
    }

    function setGlobalFit(mode){
      CFG.globalFit = mode;
      $$('[data-action="fit-mode"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === mode);
      });
      redrawAllMediaTextures();
      if (hoveredIdx >= 0) updPreview(hoveredIdx);
    }

    function upd(key,val){
      const ints = [
        'multiplier','cardW','cardH','fov','cardRotX','cardRotY','cardRotZ','selectorAngle',
        'scrollStartFov','scrollEndFov'
      ];

      const floats = [
        'radius','padding','cardCorner','animSpeed','camY','camZ','orthoZoom',
        'selectorTolerance','selectorLineWidth','selectorLineOpacity','selectorStart','selectorEnd',
        'scrollCamStart','scrollCamEnd',
        'scrollStartCamY','scrollEndCamY',
        'scrollStartCamZ','scrollEndCamZ'
      ];

      if(ints.includes(key)) CFG[key] = parseInt(val, 10);
      else if(floats.includes(key)) CFG[key] = parseFloat(val);
      else if(key === 'bgColor'){
        CFG.bgColor = val;
        root.style.setProperty('--bg', val);
        scene.background = new THREE.Color(val);
        groundMesh.material.color.set(val);
        return;
      }
      else if(key === 'showLabels'){
        CFG.showLabels = val;
        if(!val && !CFG.showSelectorLine) svgOv.innerHTML = '';
        return;
      }
      else if(key === 'showPreview'){
        CFG.showPreview = val;
        if(!val) els.previewPanel.classList.remove('visible');
        return;
      }
      else if(key === 'showSelectorLine'){
        CFG.showSelectorLine = val;
        if(!val && !CFG.showLabels) svgOv.innerHTML = '';
        return;
      }
      else if(key === 'selectorLineColor'){
        CFG.selectorLineColor = val;
        return;
      }
      else if(key === 'scrollCamEnabled'){
        CFG.scrollCamEnabled = val;
        return;
      }

      const valEl = $(`[data-val="${key}"]`);
      if(valEl) valEl.textContent = val;

      if(['camY','camZ','fov','orthoZoom','scrollCamStart','scrollCamEnd','scrollStartCamY','scrollEndCamY','scrollStartCamZ','scrollEndCamZ','scrollStartFov','scrollEndFov'].includes(key)) {
        updCam();
      }

      if(['cardW','cardH','radius','padding','cardCorner','multiplier'].includes(key)) {
        buildWheel();
      }
    }

    function bindControls(){
      els.settingsBtn.addEventListener('click', toggleSettings);

      els.animSwitch.addEventListener('change', (e) => {
        toggleAnim(e.target.checked);
      });

      $$('[data-action="cam-type"]').forEach(btn => {
        btn.addEventListener('click', () => setCamType(btn.dataset.value));
      });

      $$('[data-action="fit-mode"]').forEach(btn => {
        btn.addEventListener('click', () => setGlobalFit(btn.dataset.value));
      });

      $$('[data-action="blend-mode"]').forEach(btn => {
        btn.addEventListener('click', () => setSelectorBlend(btn.dataset.value));
      });

      $$('[data-action="upd"]').forEach(input => {
        input.addEventListener('input', () => {
          upd(input.dataset.key, input.value);
        });
      });

      $$('[data-action="upd-color"]').forEach(input => {
        input.addEventListener('input', () => {
          upd(input.dataset.key, input.value);
        });
      });

      $$('[data-action="upd-check"]').forEach(input => {
        input.addEventListener('change', () => {
          upd(input.dataset.key, input.checked);
        });
      });
    }

    function onResize(){
      if (!renderer) return;
      const { width, height } = getSize();
      updCam();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }

    function onWheel(e){
      scrollVelocity += e.deltaY * 0.00004;
    }

    function loop(){
      requestAnimationFrame(loop);

      updCam();

      autoVelocity = CFG.animating ? CFG.animSpeed * 0.006 : 0;

      scrollVelocity *= SCROLL_FRICTION;
      if(Math.abs(scrollVelocity) < 0.000001) scrollVelocity = 0;

      rotAngle += autoVelocity + scrollVelocity;

      const R = CFG.radius;
      const rx = CFG.cardRotX*DEG, ry = CFG.cardRotY*DEG, rz = CFG.cardRotZ*DEG;

      cards.forEach(card=>{
        const a = card.angle + rotAngle;
        const x = Math.sin(a)*R, z = Math.cos(a)*R;
        card.group.position.x = x;
        card.group.position.z = z;
        card.group.rotation.y = a + Math.PI;

        const liveDeg = normalizeDeg(a * 180 / Math.PI);
        const angleDelta = Math.abs(shortestAngleDelta(liveDeg, CFG.selectorAngle));
        const hitSelector = angleDelta <= CFG.selectorTolerance;

        const shouldLift = (hoveredIdx===card.index) || hitSelector;
        const targetY = shouldLift ? card.baseY + HOVER_LIFT : card.baseY;

        card.hoverY += (targetY - card.hoverY) * HOVER_SPEED;
        card.group.position.y = card.hoverY;

        card.pivot.rotation.set(rx,ry,rz);

        const state = card.mediaState;
        if (state && state.sourceType === 'video' && state.ready && state.mediaEl.readyState >= 2) {
          drawMediaLikeCSS(state.ctx, state.mediaEl, state.canvas.width, state.canvas.height, CFG.globalFit);
          card.frontTex.needsUpdate = true;
          card.backTex.needsUpdate = true;
        }
      });

      checkHover();
      drawLabels();
      renderer.render(scene, camera);
    }

    function destroy(){
      window.removeEventListener('resize', onResize);
      if (resizeObserver) resizeObserver.disconnect();
      if (renderer && renderer.domElement) {
        renderer.domElement.removeEventListener('wheel', onWheel);
        renderer.domElement.removeEventListener('touchstart', onTouchStart);
        renderer.domElement.removeEventListener('touchmove', onTouchMove);
        renderer.domElement.removeEventListener('touchend', onTouchEnd);
        renderer.domElement.removeEventListener('touchcancel', onTouchEnd);
      }
    }

    function init(){
      scene = new THREE.Scene();
      scene.background = new THREE.Color(CFG.bgColor);

      const gGeo = new THREE.PlaneGeometry(400,400);
      const gMat = new THREE.MeshBasicMaterial({color:new THREE.Color(CFG.bgColor)});
      groundMesh = new THREE.Mesh(gGeo, gMat);
      groundMesh.rotation.x = -Math.PI / 2;
      scene.add(groundMesh);

      createPerspCam();
      createOrthoCam();
      updCam();

      renderer = new THREE.WebGLRenderer({antialias:true, logarithmicDepthBuffer:true});
      const { width, height } = getSize();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      els.canvasContainer.appendChild(renderer.domElement);

      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2(-999,-999);

      buildWheel();
      setSelectorBlend(CFG.selectorLineBlend);
      bindControls();

      window.addEventListener('resize', onResize);

      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(() => onResize());
        resizeObserver.observe(root);
      }

      renderer.domElement.addEventListener('wheel', onWheel, {passive:true});

      renderer.domElement.addEventListener('mousemove', e=>{
        const r = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      });

      renderer.domElement.addEventListener('mouseleave', ()=>{
        mouse.x = -999;
        mouse.y = -999;
        hoveredIdx = -1;
        els.previewPanel.classList.remove('visible');
      });

      renderer.domElement.addEventListener('touchstart', onTouchStart, { passive:false });
      renderer.domElement.addEventListener('touchmove', onTouchMove, { passive:false });
      renderer.domElement.addEventListener('touchend', onTouchEnd, { passive:false });
      renderer.domElement.addEventListener('touchcancel', onTouchEnd, { passive:false });

      loop();

      root.mediaWheel = {
        set(key, value){ upd(key, value); },
        config: CFG,
        destroy
      };
    }

    init();
  }

  function initAllWidgets() {
    document
      .querySelectorAll('.wf-media-wheel[data-widget="media-wheel"]:not([data-init="true"])')
      .forEach(initWidget);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAllWidgets);
  } else {
    initAllWidgets();
  }
})();