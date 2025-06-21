// js/main.js

import * as THREE from './libs/three.module.min.js';

// ==== Scene Setup ====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0c8f0);

const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 40);
camera.lookAt(0, 0, -50);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// Ground
const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load("../textures/grass.jpg");
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(8, 8);

const groundGeo = new THREE.PlaneGeometry(40, 200);
const groundMat = new THREE.MeshLambertMaterial({ map: groundTexture });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Road
const roadMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
const road = new THREE.Mesh(new THREE.BoxGeometry(10, 0.1, 200), roadMat);
road.position.set(0, 0.05, -100);
road.receiveShadow = true;
scene.add(road);

// Benches
const benches = [];
for (let i = 0; i < 5; i++) {
    const benchGeo = new THREE.BoxGeometry(2, 0.5, 0.5);
    const benchMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.set((Math.random() - 0.5) * 8, 0.25, -i * 30 - 20);
    benches.push(bench);
    scene.add(bench);
}

// Obstacles
for (let i = 0; i < 5; i++) {
    const coneGeo = new THREE.ConeGeometry(0.5, 1, 16);
    const coneMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set((Math.random() - 0.5) * 8, 0.5, -i * 40 - 50);
    scene.add(cone);
}

// House
const houseGeo = new THREE.BoxGeometry(10, 8, 10);
const houseMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
const house = new THREE.Mesh(houseGeo, houseMat);
house.position.set(0, 4, -170);
scene.add(house);

// Indoor Group
const indoorGroup = new THREE.Group();
scene.add(indoorGroup);

const indoorFloor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshLambertMaterial({ color: 0xeaeaea }));
indoorFloor.rotation.x = -Math.PI / 2;
indoorFloor.position.set(0, 0, -200);
indoorGroup.add(indoorFloor);

// Sofa
const sofa = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 1), new THREE.MeshLambertMaterial({ color: 0x8B0000 }));
sofa.position.set(-4, 0.5, -200);
indoorGroup.add(sofa);

// Bed
const bed = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 2), new THREE.MeshLambertMaterial({ color: 0x4682B4 }));
bed.position.set(4, 0.25, -200);
indoorGroup.add(bed);

indoorGroup.visible = false;

// Character
const charGeo = new THREE.SphereGeometry(0.5, 32, 32);
const charMat = new THREE.MeshLambertMaterial({ color: 0x0000ff });
const character = new THREE.Mesh(charGeo, charMat);
character.position.set(0, 0.5, 0);
scene.add(character);

// Controls
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

// Recorder
let currentEpisode = { states: [], actions: [], rewards: [] };

function recordStep() {
    let nearBench = benches.some(b => b.position.distanceTo(character.position) < 2) ? 1 : 0;
    let nearSofa = indoorGroup.visible && sofa.position.distanceTo(character.position) < 2 ? 1 : 0;
    let nearBed = indoorGroup.visible && bed.position.distanceTo(character.position) < 2 ? 1 : 0;

    const state = [
        character.position.x,
        character.position.z,
        nearBench,
        nearSofa,
        nearBed
    ];

    const action = [moveDirection, sitAction];

    let reward = 0;
    if (sitAction === 1) {
        if (nearBench) reward = 1;
        if (nearSofa) reward = 2;
        if (nearBed) reward = 3;
    }

    currentEpisode.states.push(state);
    currentEpisode.actions.push(action);
    currentEpisode.rewards.push(reward);
}

// Main loop
function animate() {
    requestAnimationFrame(animate);
    character.position.x += moveDirection * 0.2;

    if (!indoorGroup.visible && character.position.z < -160) {
        indoorGroup.visible = true;
        camera.lookAt(0, 0, -200);
    }

    recordStep();
    renderer.render(scene, camera);
}
animate();
