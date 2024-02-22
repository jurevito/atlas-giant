import './style.css'
import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import GSAP from "gsap";

const container = document.getElementById('app');
const canvas = document.getElementById('giantCanvas');

// How much does scene rotate on mouse move.
const coeff = 0.15;

// Maximum height of the canvas. Width is set automatically.
const maxHeight = 500;

const handleResize = () => {
    const width = container.clientWidth;
    const height = Math.min(width, maxHeight);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    currentWidth = width;
};

const handleMouseMove = (event) => {
    lerp.target = (2*event.clientX / currentWidth - 1) * coeff;
}

const animate = () => {
    requestAnimationFrame(animate);

    // Update animations.
    const delta = clock.getDelta();
    mixer.update( delta );

    const weight = Math.abs(Math.sin(timePassed) * 0.5 + 0.5);
    timePassed += delta*5;

    // Animate sea mesh with shape keys.
    if (seaMesh.morphTargetInfluences !== undefined) {
        seaMesh.morphTargetInfluences[0] = weight;
    }

    lerp.current = GSAP.utils.interpolate(
        lerp.current,
        lerp.target,
        lerp.ease
    );

    // Rotate scene on mouse move.
    scene.rotation.y = lerp.current;

    renderer.render(scene, camera);
};

let mixer;
let timePassed = 0;
let seaMesh;
const clock = new THREE.Clock();

let lerp = {
    current: 0,
    target: 0,
    ease: 0.1,
};

// Handle window resizing.
let currentWidth = container.clientWidth;
const height = Math.min(currentWidth, maxHeight);
window.addEventListener('resize', handleResize);
window.addEventListener('mousemove', handleMouseMove);

// Create renderer.
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(currentWidth, height);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Create scene.
const scene = new THREE.Scene();

// Create a new camera.
const camera = new THREE.PerspectiveCamera(15, canvas.clientWidth / height, 1, 100);
camera.position.set(-35, 8, 0);
camera.lookAt(0, 2, 0);

// Create a directional light.
const directLight = new THREE.DirectionalLight(0xffffff, 3.0);
directLight.position.set(-2, 8, -5);
directLight.castShadow = true;
scene.add(directLight);

// Create an ambient light.
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const loader = new GLTFLoader();
loader.load('./atlas_giant.glb', (gltf) => {

    // Setup sea animation shape keys.
    seaMesh = gltf.scene.getObjectByName('Cube003');
    seaMesh.morphTargetInfluences = [0];

    const model = gltf.scene;
    scene.add(model);

    mixer = new THREE.AnimationMixer(model);

    // Play boat animations.
    [gltf.animations[0], gltf.animations[1], gltf.animations[2]].forEach((animation) => {
        mixer.clipAction(animation).play();
    });

    animate();
}, undefined, (e) => {
    console.error(e);
});