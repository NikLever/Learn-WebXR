import * as THREE from '../../libs/three/three.module.js';
import { OrbitControls } from '../../libs/three/jsm/OrbitControls.js';

class App {
  constructor() {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 4);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xaaaaaa);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);
    this.renderer.setAnimationLoop(this.render.bind(this));

    // Add ambient light
    const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.3);
    this.scene.add(ambient);

    // Add directional light
    const light = new THREE.DirectionalLight();
    light.position.set(0.2, 1, 1);
    this.scene.add(light);

    // Add a cube
    const cubeGeometry = new THREE.BoxBufferGeometry();
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.scene.add(this.cube);

    // Orbit controls
    const controls = new OrbitControls(this.camera, this.renderer.domElement);

    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  render() {
    this.cube.rotateY(0.01);
    this.renderer.render(this.scene, this.camera);
  }
}

export { App };
