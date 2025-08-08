// Three.js + WebXR (AR) minimal scene with passthrough on Quest 3
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/webxr/ARButton.js';

const logEl = document.getElementById('log');
function log(msg) {
  if (!logEl) return;
  logEl.textContent += `\n${msg}`;
  logEl.scrollTop = logEl.scrollHeight;
}

// Renderer with alpha so the real world shows through in AR
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
document.body.appendChild(renderer.domElement);

// Scene & camera (XR will drive the camera pose)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 50);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(1, 2, 1);
scene.add(light);

// Cube ~2m in front of the starting view
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.3, 0.3),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc, metalness: 0.1, roughness: 0.4 })
);
cube.position.set(0, 1.4, -2); // x, y, z (meters); y≈eye height so it floats in view
scene.add(cube);

// Simple animation
renderer.setAnimationLoop(() => {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.015;
  renderer.render(scene, camera);
});

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Create the AR button on demand so your custom UI stays in control
const enterBtn = document.getElementById('enter-xr');
let arButtonAdded = false;
let arButtonEl = null;

function ensureArButton() {
  if (arButtonAdded) return;
  arButtonEl = ARButton.createButton(renderer, {
    requiredFeatures: ['local-floor'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: document.body }, // makes #log visible in-session
  });
  // Hide the default styling and trigger it programmatically
  arButtonEl.style.display = 'none';
  document.body.appendChild(arButtonEl);
  arButtonAdded = true;
}

enterBtn?.addEventListener('click', () => {
  ensureArButton();
  log('Requesting immersive-ar session…');
  // Click the hidden ARButton to start the session
  arButtonEl?.click();
});

// XR session lifecycle logging
renderer.xr.addEventListener('sessionstart', () => {
  log('XR session started (immersive-ar).');
});
renderer.xr.addEventListener('sessionend', () => {
  log('XR session ended.');
});