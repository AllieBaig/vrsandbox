// ===== Updated Camera Position =====
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, -20);

// ===== Update ground plane closer =====
const groundGeometry = new THREE.PlaneGeometry(20, 40); // smaller road
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -20; // center it closer
scene.add(ground);

// ===== Update obstacles closer =====
for (let i = 0; i < 5; i++) {
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const boxMat = new THREE.MeshBasicMaterial({color: 0xff0000});
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set((Math.random() - 0.5) * 10, 0.5, -i * 8 - 10);  // bring closer
    scene.add(box);
}

// ===== Update character starting position =====
character.position.set(0, 0.5, -5);

