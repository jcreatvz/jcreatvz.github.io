// Media Wheel Widget (Webflow Ready)
// Auto-inits all widgets: .wf-media-wheel[data-widget="media-wheel"]

(function () {
  if (!window.THREE) {
    console.error("Three.js required");
    return;
  }

  const widgets = document.querySelectorAll(
    '.wf-media-wheel[data-widget="media-wheel"]:not([data-init])'
  );

  widgets.forEach((root) => {
    root.setAttribute("data-init", "true");

    const $ = (sel) => root.querySelector(sel);
    const $$ = (sel) => Array.from(root.querySelectorAll(sel));

    const els = {
      canvasContainer: $('[data-el="canvas-container"]'),
      labelOverlay: $('[data-el="label-overlay"]'),
      previewPanel: $('[data-el="preview-panel"]'),
      previewImage: $('[data-el="preview-image"]'),
      previewTitle: $('[data-el="preview-title"]'),
      settingsPanel: $('[data-el="settings-panel"]'),
      settingsBtn: $('[data-el="settings-btn"]'),
      infoBadge: $('[data-el="info-badge"]'),
      animSwitch: $('[data-action="toggle-anim"]'),
    };

    const CFG = {
      radius: 2.1,
      camY: 6.8,
      camZ: 12.8,
      fov: 31,
      animSpeed: 1.1,
      animating: true,

      scrollCamEnabled: true,
      scrollCamStart: 0.1,
      scrollCamEnd: 0.9,
      scrollStartCamY: 6.8,
      scrollEndCamY: 2.0,
      scrollStartCamZ: 12.8,
      scrollEndCamZ: 6.5,
      scrollStartFov: 31,
      scrollEndFov: 60,
    };

    let scene, camera, renderer;
    let rotAngle = 0;
    let scrollVelocity = 0;

    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function ease(t) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function getSize() {
      const r = root.getBoundingClientRect();
      return { width: r.width, height: r.height };
    }

    function getScrollProgress() {
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;

      const total = rect.height + vh;
      const raw = (vh - rect.top) / total;

      const t = (raw - CFG.scrollCamStart) /
                (CFG.scrollCamEnd - CFG.scrollCamStart);

      return clamp(t, 0, 1);
    }

    function getCameraValues() {
      if (!CFG.scrollCamEnabled) {
        return { y: CFG.camY, z: CFG.camZ, fov: CFG.fov };
      }

      const t = ease(getScrollProgress());

      return {
        y: lerp(CFG.scrollStartCamY, CFG.scrollEndCamY, t),
        z: lerp(CFG.scrollStartCamZ, CFG.scrollEndCamZ, t),
        fov: lerp(CFG.scrollStartFov, CFG.scrollEndFov, t),
      };
    }

    function init() {
      const { width, height } = getSize();

      scene = new THREE.Scene();
      scene.background = new THREE.Color("#ffffff");

      camera = new THREE.PerspectiveCamera(
        CFG.fov,
        width / height,
        0.1,
        500
      );

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      els.canvasContainer.appendChild(renderer.domElement);

      window.addEventListener("resize", resize);
      renderer.domElement.addEventListener("wheel", onWheel);

      loop();
    }

    function resize() {
      const { width, height } = getSize();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    function onWheel(e) {
      scrollVelocity += e.deltaY * 0.00004;
    }

    function updateCamera() {
      const cam = getCameraValues();

      camera.fov = cam.fov;
      camera.updateProjectionMatrix();

      camera.position.set(0, cam.y, cam.z);
      camera.lookAt(0, 0, 0);
    }

    function loop() {
      requestAnimationFrame(loop);

      updateCamera();

      rotAngle += CFG.animSpeed * 0.005 + scrollVelocity;
      scrollVelocity *= 0.92;

      renderer.render(scene, camera);
    }

    init();
  });
})();