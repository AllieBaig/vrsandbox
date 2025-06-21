// ===== Scene Setup =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0c8f0);

// Camera fix: pulled back + wider view
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 40);
camera.lookAt(0, 0, -20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ===== Lighting =====
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// ===== Ground =====
const groundTexture = new THREE.TextureLoader().load("https://threejs.org/examples/textures/grasslight-big.jpg");
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(4, 4);

const groundGeometry = new THREE.PlaneGeometry(20, 40);
const groundMaterial = new THREE.MeshLambertMaterial({ map: groundTexture });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -20;
ground.receiveShadow = true;
scene.add(ground);

// ===== Obstacles =====
for (let i = 0; i < 5; i++) {
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const boxMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set((Math.random() - 0.5) * 10, 0.5, -i * 8 - 10);
    box.castShadow = true;
    scene.add(box);
}

// ===== Benches =====
const benches = [];
for (let i = 0; i < 3; i++) {
    const benchGeo = new THREE.BoxGeometry(2, 0.5, 0.5);
    const benchMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.set((Math.random() - 0.5) * 8, 0.25, -i * 10 - 5);
    bench.castShadow = true;
    benches.push(bench);
    scene.add(bench);
}

// ===== Character =====
const charGeo = new THREE.SphereGeometry(0.5, 32, 32);
const charMat = new THREE.MeshLambertMaterial({ color: 0x0000ff });
const character = new THREE.Mesh(charGeo, charMat);
character.position.set(0, 0.5, -5);
character.castShadow = true;
scene.add(character);

// ===== Controls =====
let moveDirection = 0;
let sitAction = 0;

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') moveDirection = -1;
    if (e.key === 'ArrowRight') moveDirection = 1;
    if (e.key === 's') sitAction = 1;
});
document.addEventListener('keyup', () => {
    moveDirection = 0;
    sitAction = 0;
});

// Touch controls
document.getElementById("leftBtn").addEventListener("touchstart", () => { moveDirection = -1; });
document.getElementById("leftBtn").addEventListener("touchend", () => { moveDirection = 0; });

document.getElementById("rightBtn").addEventListener("touchstart", () => { moveDirection = 1; });
document.getElementById("rightBtn").addEventListener("touchend", () => { moveDirection = 0; });

document.getElementById("sitBtn").addEventListener("touchstart", () => { sitAction = 1; });
document.getElementById("sitBtn").addEventListener("touchend", () => { sitAction = 0; });

// ===== RL Recorder =====
let currentEpisode = {
    states: [],
    actions: [],
    rewards: []
};

function recordStep() {
    const nearestBench = benches.reduce((closest, b) => {
        const dist = b.position.distanceTo(character.position);
        return dist < closest.dist ? { bench: b, dist: dist } : closest;
    }, { bench: null, dist: Infinity });

    const nearBench = nearestBench.dist < 2 ? 1 : 0;

    const state = [character.position.x, character.position.z, nearBench];
    const action = [moveDirection, sitAction];
    let reward = 0;
    if (sitAction === 1 && nearBench === 1) {
        reward = 1;
    }

    currentEpisode.states.push(state);
    currentEpisode.actions.push(action);
    currentEpisode.rewards.push(reward);
}

function saveEpisodeToIndexedDB() {
    const request = indexedDB.open("RLDatabase", 1);
    request.onupgradeneeded = function (event) {
        const db = event.target.result;
        db.createObjectStore("episodes", { autoIncrement: true });
    };
    request.onsuccess = function (event) {
        const db = event.target.result;
        const tx = db.transaction("episodes", "readwrite");
        const store = tx.objectStore("episodes");
        store.add(currentEpisode);
        tx.oncomplete = () => { console.log("Episode saved"); };
        db.close();
    };
}

function exportEpisodes() {
    const request = indexedDB.open("RLDatabase", 1);
    request.onsuccess = function (event) {
        const db = event.target.result;
        const tx = db.transaction("episodes", "readonly");
        const store = tx.objectStore("episodes");
        const allData = store.getAll();
        allData.onsuccess = function () {
            const dataStr = JSON.stringify(allData.result);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "episodes.json";
            a.click();
        };
    };
}

// ===== Main Loop =====
function animate() {
    requestAnimationFrame(animate);
    character.position.x += moveDirection * 0.1;
    recordStep();
    renderer.render(scene, camera);
}
animate();

// ===== Auto-Save every 30 seconds =====
setInterval(() => {
    if (currentEpisode.states.length > 0) {
        saveEpisodeToIndexedDB();
        currentEpisode = { states: [], actions: [], rewards: [] };
    }
}, 30000);

