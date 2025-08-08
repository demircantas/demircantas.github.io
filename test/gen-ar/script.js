// Use esm.sh so there are no bare-specifier issues in the browser
import * as THREE from 'https://esm.sh/three@0.164.1';
import { GLTFLoader } from 'https://esm.sh/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';
import { XRHandModelFactory } from 'https://esm.sh/three@0.164.1/examples/jsm/webxr/XRHandModelFactory.js';

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

/* ===========================
   DEBUG CUBE (commented out)
=========================== */
// const cube = new THREE.Mesh(
//   new THREE.BoxGeometry(),
//   new THREE.MeshStandardMaterial({ color: 0x00ffcc })
// );
// scene.add(cube);

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ===========================
   HAND TRACKING SETUP
=========================== */
const handFactory = new XRHandModelFactory();
const leftHand = renderer.xr.getHand(0);
leftHand.userData.skipRaycast = true;
leftHand.add(handFactory.createHandModel(leftHand, 'spheres'));
scene.add(leftHand);

const rightHand = renderer.xr.getHand(1);
rightHand.userData.skipRaycast = true;
rightHand.add(handFactory.createHandModel(rightHand, 'spheres'));
scene.add(rightHand);

// Helpers to read joint world positions from THREE's hand model
const TMP = {
  v1: new THREE.Vector3(),
  v2: new THREE.Vector3(),
  v3: new THREE.Vector3(),
  q1: new THREE.Quaternion(),
  q2: new THREE.Quaternion(),
};

function getJoint(hand, name) {
  // XRHandModelFactory 'spheres' creates an Object3D per joint under hand.joints[name]
  return hand && hand.joints && hand.joints[name] ? hand.joints[name] : null;
}
function getJointWorldPos(hand, name, out = new THREE.Vector3()) {
  const j = getJoint(hand, name);
  if (!j) return null;
  j.getWorldPosition(out);
  return out;
}

// Pinch detection (thumb-tip to index-finger-tip)
const PINCH_START = 0.025; // meters
const PINCH_END   = 0.035; // meters (hysteresis)
const GRAB_SNAP_DISTANCE = 0.25; // meters — how close your pinch needs to be to grab the object

function computePinch(hand, state) {
  const thumb = getJointWorldPos(hand, 'thumb-tip', TMP.v1);
  const index = getJointWorldPos(hand, 'index-finger-tip', TMP.v2);
  if (!thumb || !index) {
    state.isPinching = false;
    state.pinchPos.set(NaN, NaN, NaN);
    return state;
  }
  const dist = thumb.distanceTo(index);
  if (!state.isPinching && dist < PINCH_START) state.isPinching = true;
  if (state.isPinching && dist > PINCH_END) state.isPinching = false;

  if (state.isPinching) {
    state.pinchPos.copy(thumb).add(index).multiplyScalar(0.5);
  } else {
    state.pinchPos.set(NaN, NaN, NaN);
  }
  return state;
}

// Per-hand interaction state
function makeHandState() {
  return {
    isPinching: false,
    pinchPos: new THREE.Vector3(),
    // One-hand grab
    grabbing: false,
    grabOffset: new THREE.Vector3(), // object space offset to pinchPos
  };
}
const leftState  = makeHandState();
const rightState = makeHandState();

// Two-hand transform state
let twoHandActive = false;
let twoHandInitial = {
  vec: new THREE.Vector3(),
  dist: 0,
  rot: new THREE.Quaternion(),
  scale: new THREE.Vector3(),
};

// The object holder we manipulate (wraps currentModel)
let currentModel = null;
let currentHolder = null; // THREE.Group we actually move/rotate/scale
let currentKey = null;

// Utility: test nearest hand pinch to object
function nearestPinchToObject() {
  if (!currentHolder) return { hand: null, state: null, distance: Infinity };
  const objPos = currentHolder.getWorldPosition(TMP.v3);
  const dLeft  = Number.isFinite(leftState.pinchPos.x)  ? leftState.pinchPos.distanceTo(objPos)  : Infinity;
  const dRight = Number.isFinite(rightState.pinchPos.x) ? rightState.pinchPos.distanceTo(objPos) : Infinity;
  return (dLeft < dRight)
    ? { hand: leftHand, state: leftState, distance: dLeft }
    : { hand: rightHand, state: rightState, distance: dRight };
}

/* ===========================
   ANIMATION + INTERACTION
=========================== */
renderer.setAnimationLoop(() => {
  // if (cube) {
  //   cube.rotation.x += 0.005;
  //   cube.rotation.y += 0.01;
  // }

  // Update pinch states
  computePinch(leftHand, leftState);
  computePinch(rightHand, rightState);

  const leftPinch  = leftState.isPinching;
  const rightPinch = rightState.isPinching;

  // Decide interaction mode
  if (currentHolder) {
    // --- Two-hand transform ---
    if (leftPinch && rightPinch) {
      if (!twoHandActive) {
        twoHandActive = true;
        // Capture initial vector, rotation, scale
        const pL = leftState.pinchPos.clone();
        const pR = rightState.pinchPos.clone();
        twoHandInitial.vec.copy(pR).sub(pL);
        twoHandInitial.dist = Math.max(twoHandInitial.vec.length(), 1e-4);
        currentHolder.getWorldQuaternion(twoHandInitial.rot);
        currentHolder.getWorldScale(twoHandInitial.scale);
      } else {
        const pL = leftState.pinchPos;
        const pR = rightState.pinchPos;
        const curVec = TMP.v1.copy(pR).sub(pL);
        const curDist = Math.max(curVec.length(), 1e-4);

        // Scale from distance ratio
        const s = curDist / twoHandInitial.dist;
        const newScale = TMP.v2.copy(twoHandInitial.scale).multiplyScalar(s);

        // Rotate to align initial vec -> current vec
        const from = TMP.v3.copy(twoHandInitial.vec).normalize();
        const to   = curVec.clone().normalize();
        const deltaRot = new THREE.Quaternion().setFromUnitVectors(from, to);

        // Apply around midpoint
        const mid = TMP.v3.copy(pL).add(pR).multiplyScalar(0.5);
        // Preserve holder's local transform relative to world
        const parent = currentHolder.parent || scene;

        // Compute new rotation
        const newWorldRot = deltaRot.clone().multiply(twoHandInitial.rot);

        // Set transform
        // Move holder so its origin is at the midpoint; most models have origin at their own local origin.
        parent.worldToLocal(mid); // convert midpoint to parent's local space
        currentHolder.position.copy(mid);

        currentHolder.quaternion.copy(newWorldRot);
        currentHolder.scale.copy(newScale);
      }

      // When two-hand is active, cancel any one-hand grabbing states
      leftState.grabbing = false;
      rightState.grabbing = false;

    } else {
      // Leaving two-hand mode
      twoHandActive = false;

      // --- One-hand grab ---
      // Start grab when a pinch begins near the object
      for (const [hand, state] of [[leftHand, leftState], [rightHand, rightState]]) {
        if (!state.grabbing && state.isPinching && Number.isFinite(state.pinchPos.x)) {
          const { distance } = nearestPinchToObject();
          if (distance < GRAB_SNAP_DISTANCE) {
            // Compute offset from holder origin to pinch in holder local space
            const pinchWorld = state.pinchPos.clone();
            const parent = currentHolder.parent || scene;

            // Convert pinchWorld to holder local space:
            const holderInv = new THREE.Matrix4().copy(currentHolder.matrixWorld).invert();
            state.grabOffset.copy(pinchWorld).applyMatrix4(holderInv); // offset in holder local space
            state.grabbing = true;
          }
        }
        if (state.grabbing && !state.isPinching) {
          // Release
          state.grabbing = false;
        }
      }

      // Move object if a hand is currently grabbing
      const grabber = leftState.grabbing ? { hand: leftHand, state: leftState } :
                      rightState.grabbing ? { hand: rightHand, state: rightState } : null;

      if (grabber) {
        const parent = currentHolder.parent || scene;

        // Desired world position for holder origin = pinchWorld - (offset in world)
        const pinchWorld = grabber.state.pinchPos.clone();

        // Convert stored local grabOffset back to world:
        const holderMat = currentHolder.matrixWorld.clone();
        const offsetWorld = grabber.state.grabOffset.clone().applyMatrix4(holderMat).sub(currentHolder.getWorldPosition(new THREE.Vector3()));

        const targetWorld = pinchWorld.clone().sub(offsetWorld);

        // Set holder position (in parent space)
        parent.worldToLocal(targetWorld);
        currentHolder.position.copy(targetWorld);
      }
    }
  }

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
      // hand-tracking requested; dom-overlay helps keep your log visible (if supported)
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
    const msg = (e && e.message) ? e.message : e;
    log && (log.innerText += `\n⚠️ Failed to start XR: ${msg}`);
  }
});

/* ===========================
   MODEL LOADING (unchanged API)
=========================== */
const loader = new GLTFLoader();
let currentKey = null;

const modelLibrary = {
  barrel: 'models/barrel.glb',
  teeth: 'models/teeth.glb',
  chalice: 'models/chalice.glb',
  pillow: 'models/pillow.glb',
  throne: 'models/throne.glb',
  vehicle: 'models/vehicle.glb',
};

const aliasMap = {
  barrel: 'barrel',
  chalice: 'chalice',
  cup: 'chalice',
  pillow: 'pillow',
  cushion: 'pillow',
  throne: 'throne',
  chair: 'throne',
  seat: 'throne',
  vehicle: 'vehicle',
  car: 'vehicle',
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
  if (!currentHolder) return;
  scene.remove(currentHolder);
  currentHolder.traverse(obj => {
    if (obj.isMesh) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
  });
  currentModel = null;
  currentHolder = null;
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

      // Wrap in a holder that we manipulate via gestures
      currentHolder = new THREE.Group();

      // Position ~2m in front of the camera initially
      const forward = new THREE.Vector3(0, 0, -2).applyQuaternion(camera.quaternion);
      currentHolder.position.copy(camera.position).add(forward);
      currentHolder.quaternion.copy(camera.quaternion);

      // Reasonable default scale
      currentModel.scale.set(0.5, 0.5, 0.5);
      currentHolder.add(currentModel);
      scene.add(currentHolder);

      console.log(`Loaded model: ${key}`);
    },
    undefined,
    (err) => console.error('GLTF load error:', err)
  );
}

/* ===========================
   WHISPER WEBSOCKET (unchanged)
=========================== */
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
