
// ===== Simple Three.js scene setup =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfd1e5);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add ground plane
const groundGeometry = new THREE.PlaneGeometry(20, 100);
const groundMaterial = new THREE.MeshBasicMaterial({color: 0xaaaaaa});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Add simple obstacles (boxes)
for (let i = 0; i < 10; i++) {
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const boxMat = new THREE.MeshBasicMaterial({color: 0xff0000});
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set((Math.random() - 0.5) * 10, 0.5, -i * 10);
    scene.add(box);
}

// Add character (sphere)
const charGeo = new THREE.SphereGeometry(0.5, 32, 32);
const charMat = new THREE.MeshBasicMaterial({color: 0x0000ff});
const character = new THREE.Mesh(charGeo, charMat);
character.position.set(0, 0.5, 0);
scene.add(character);

// ===== Controls =====
let moveDirection = 0;

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') moveDirection = -1;
    if (e.key === 'ArrowRight') moveDirection = 1;
});
document.addEventListener('keyup', () => { moveDirection = 0; });

// Touch buttons
document.getElementById("leftBtn").addEventListener("touchstart", () => { moveDirection = -1; });
document.getElementById("leftBtn").addEventListener("touchend", () => { moveDirection = 0; });

document.getElementById("rightBtn").addEventListener("touchstart", () => { moveDirection = 1; });
document.getElementById("rightBtn").addEventListener("touchend", () => { moveDirection = 0; });

// ===== Episode recording =====
let currentEpisode = {
    states: [],
    actions: [],
    rewards: [],
};

function recordStep() {
    const state = [character.position.x];
    currentEpisode.states.push(state);
    currentEpisode.actions.push(moveDirection);
    currentEpisode.rewards.push(0);
}

function saveEpisodeToIndexedDB() {
    const request = indexedDB.open("RLDatabase", 1);
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        db.createObjectStore("episodes", { autoIncrement: true });
    };
    request.onsuccess = function(event) {
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
    request.onsuccess = function(event) {
        const db = event.target.result;
        const tx = db.transaction("episodes", "readonly");
        const store = tx.objectStore("episodes");
        const allData = store.getAll();
        allData.onsuccess = function() {
            const dataStr = JSON.stringify(allData.result);
            const blob = new Blob([dataStr], {type: "application/json"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "episodes.json";
            a.click();
        };
    };
}

// ===== Main loop =====
function animate() {
    requestAnimationFrame(animate);
    character.position.x += moveDirection * 0.1;
    recordStep();
    renderer.render(scene, camera);
}
animate();

// Auto-save every 30 seconds
setInterval(() => {
    if (currentEpisode.states.length > 0) {
        saveEpisodeToIndexedDB();
        currentEpisode = { states: [], actions: [], rewards: [] };
    }
}, 30000);
