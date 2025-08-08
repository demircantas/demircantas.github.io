// Use esm.sh so there are no bare-specifier issues in the browser
import * as THREE from 'https://esm.sh/three@0.164.1';
import { VRButton } from 'https://esm.sh/three@0.164.1/examples/jsm/webxr/VRButton.js';
import { GLTFLoader } from 'https://esm.sh/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

// === Scene ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 2);
scene.add(light);

// Placeholder cube so we see *something* before a model spawns
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

// VR Button (kept explicit per your original flow)
document.getElementById('enter-vr').addEventListener('click', () => {
  document.body.appendChild(VRButton.createButton(renderer));
});

// === Model loading ===
const loader = new GLTFLoader();
let currentModel = null;
let currentKey = null;

// Put your models in /models/
const modelLibrary = {
  barrel: 'models/barrel.glb',
  // spaceship: 'models/spaceship.glb',
  teeth: 'models/teeth.glb',
};

// Optional synonyms/aliases → canonical keys in modelLibrary
const aliasMap = {
  barrel: 'barrel',
  box: 'barrel',
  ship: 'spaceship',
  mouth: 'teeth',
  building: 'teeth',
};

// Build a list of matchable terms → keys
const termToKey = (() => {
  const map = new Map();
  Object.keys(modelLibrary).forEach(k => map.set(k, k));
  Object.entries(aliasMap).forEach(([alias, key]) => map.set(alias, key));
  return map;
})();

// Normalize incoming text: lowercase, strip punctuation/diacritics, collapse spaces
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')               // split accents
    .replace(/[\u0300-\u036f]/g, '')// remove diacritics
    .replace(/[^\w\s]/g, ' ')       // strip punctuation
    .replace(/\s+/g, ' ')           // collapse whitespace
    .trim();
}

// Find a matching model key using word-boundary regex
function findModelKey(prompt) {
  const clean = normalize(prompt);

  // Try all terms; use word boundaries so "bananagram" doesn't match "banana"
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

  // Avoid reloading the exact same one
  if (currentKey === key) return;

  unloadCurrentModel();

  loader.load(
    modelLibrary[key],
    (gltf) => {
      currentModel = gltf.scene;
      currentKey = key;

      // Place the model 2m in front of the camera
      currentModel.position.set(0, 0, -2);
      currentModel.scale.set(0.5, 0.5, 0.5);

      // Make it relative to the camera orientation
      // (add to a group attached to the camera’s parent space)
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

// === Whisper Transcription WebSocket ===
const logDiv = document.getElementById('log');
// const ws = new WebSocket('ws://localhost:8765'); // change if your server differs
const ws = new WebSocket('ws://128.31.37.145:8765'); // change if your server differs

// Simple debounce to avoid spawning on every partial if your server streams a lot
let spawnTimer = null;
const SPAWN_DELAY_MS = 150; // small delay to catch end of phrase

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

    // Debounced spawn attempt
    clearTimeout(spawnTimer);
    spawnTimer = setTimeout(() => {
      const matchKey = findModelKey(msg);
      if (!matchKey) {
        console.log('No model match found for:', msg);
      } else {
        loadModelByKey(matchKey);
      }
    }, SPAWN_DELAY_MS);
  }

  logDiv.scrollTop = logDiv.scrollHeight;
};

ws.onclose = () => {
  logDiv.innerText += '\n🔴 WebSocket closed.';
};

ws.onerror = (err) => {
  logDiv.innerText += '\n⚠️ WebSocket error.';
  console.error(err);
};
