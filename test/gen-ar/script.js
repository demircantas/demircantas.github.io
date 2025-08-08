// Use esm.sh so there are no bare-specifier issues in the browser
import * as THREE from 'https://esm.sh/three@0.164.1';
import { GLTFLoader } from 'https://esm.sh/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

// === Scene ===
const scene = new THREE.Scene();
scene.background = null; // AR passthrough

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 2);
scene.add(light);

// Placeholder cube
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);
scene.add(cube);

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animate
renderer.setAnimationLoop(() => {
  cube.rotation.x += 0.005;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
});

// XR Button: Prefer AR, fallback to VR
document.getElementById('enter-vr').addEventListener('click', async () => {
  const log = document.getElementById('log');
  try {
    if (!navigator.xr) {
      log && (log.innerText += "\n❌ WebXR not available on this device/browser.");
      return;
    }

    const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
    const vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
    const sessionMode = arSupported ? 'immersive-ar' : (vrSupported ? 'immersive-vr' : null);

    if (!sessionMode) {
      log && (log.innerText += "\n❌ Neither immersive AR nor VR is supported.");
      return;
    }

    const sessionInit = {
      requiredFeatures: ['local-floor'],
      optionalFeatures: ['anchors', 'hit-test', 'hand-tracking', 'dom-overlay'],
      domOverlay: { root: document.body }
    };

    const session = await navigator.xr.requestSession(sessionMode, sessionInit);
    await renderer.xr.setSession(session);
    renderer.setClearAlpha(0); // Transparent for AR passthrough

    log && (log.innerText += `\n✅ Entered ${sessionMode.toUpperCase()} session.`);
    session.addEventListener('end', () => {
      log && (log.innerText += `\n👋 ${sessionMode.toUpperCase()} session ended.`);
    });
  } catch (e) {
    console.error(e);
    log && (log.innerText += `\n⚠️ Failed to start XR: ${e.message || e}`);
  }
});

// === Model loading ===
const loader = new GLTFLoader();
let currentModel = null;
let currentKey = null;

const modelLibrary = {
  barrel: 'models/barrel.glb',
  teeth: 'models/teeth.glb',
};

const aliasMap = {
  barrel: 'barrel',
  box: 'barrel',
  ship: 'spaceship',
  mouth: 'teeth',
  building: 'teeth',
};

const termToKey = (() => {
  const map = new Map();
  Object.keys(modelLibrary).forEach(k => map.set(k, k));
  Object.entries(aliasMap).forEach(([alias, key]) => map.set(alias, key));
  return map;
})();

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findModelKey(prompt) {
  const clean = normalize(prompt);
  for (const [term, key] of termToKey.entries()) {
    const t = normalize(term);
    if (!t) continue;
    const re = new RegExp(`\\b${escapeRegex(t)}\\b`, 'i');
    if (re.test(clean)) return key;
  }
  return null;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unloadCurrentModel() {
  if (!currentModel) return;
  scene.remove(currentModel);
  currentModel.traverse(obj => {
    if (obj.isMesh) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
  });
  currentModel = null;
  currentKey = null;
}

function loadModelByKey(key) {
  if (!key || !modelLibrary[key]) return;
  if (currentKey === key) return;

  unloadCurrentModel();

  loader.load(
    modelLibrary[key],
    (gltf) => {
      currentModel = gltf.scene;
      currentKey = key;
      currentModel.position.set(0, 0, -2);
      currentModel.scale.set(0.5, 0.5, 0.5);

      const holder = new THREE.Group();
      holder.position.copy(camera.position);
      holder.quaternion.copy(camera.quaternion);
      holder.add(currentModel);
      scene.add(holder);

      console.log(`Loaded model: ${key}`);
    },
    undefined,
    (err) => console.error('GLTF load error:', err)
  );
}

// === Whisper WebSocket ===
const logDiv = document.getElementById('log');
const ws = new WebSocket('https://relative-blvd-targeted-wealth.trycloudflare.com/');

let spawnTimer = null;
const SPAWN_DELAY_MS = 150;

ws.onopen = () => {
  logDiv.innerText = '🟢 Connected. Waiting for transcription...\n';
};

ws.onmessage = (event) => {
  const msg = (event.data || '').trim();
  if (msg === '[dot]') {
    const dot = document.createElement('span');
    dot.textContent = '• ';
    dot.style.color = '#00ff90';
    logDiv.appendChild(dot);
  } else {
    logDiv.innerText += `\n> ${msg}\n`;
    clearTimeout(spawnTimer);
    sp
