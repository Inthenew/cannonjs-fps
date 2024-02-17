import ColladaLoader from '../lib/colladaloader.js';
import Player from './Player.js';

export default class World {
    constructor() {
        this.update = this.update.bind(this);
    }

    setUpThreejs() {
        const scope = this;
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(0, 50, 100);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        const fragment = document.createDocumentFragment();
        fragment.appendChild(this.renderer.domElement);
        document.body.appendChild(fragment);

        window.addEventListener('resize', () => {
            this.changeSize(window.innerWidth, window.innerHeight);
        });
    }

    changeSize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    setUpPointerLock() {
        this.camera.position.set(0, 0, 0);
        const controls = new THREE.PointerLockControls(this.camera, document.body);
        this.scene.add(controls.getObject());

        const pointerLockChange = () => {
            controls.enabled = document.pointerLockElement === document.body || document.mozPointerLockElement === document.body;
        };

        const pointerLockError = (event) => {
            console.error('Pointer lock error', event);
        };

        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('pointerlockerror', pointerLockError, false);

        this.renderer.domElement.addEventListener('click', () => {
            document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;
            document.body.requestPointerLock();
        });

        this.controls = controls;
    }

    setUpCannonjs() {
        this.world = new CANNON.World();
        this.world.quatNormalizeSkip = 0;
        this.world.quatNormalizeFast = false;

        const solver = new CANNON.GSSolver();
        solver.iterations = 7;
        solver.tolerance = 0.1;

        this.world.solver = new CANNON.SplitSolver(solver);

        this.world.gravity.set(0, -20, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();

        this.physicsMaterial = new CANNON.Material("slipperyMaterial");
        this.physicsContactMaterial = new CANNON.ContactMaterial(this.physicsMaterial, this.physicsMaterial, 0.0, 0.3);
        this.world.addContactMaterial(this.physicsContactMaterial);
    }

    testObjects() {
        const greenBox = new THREE.Mesh(new THREE.BoxGeometry(50, 1, 50), new THREE.MeshBasicMaterial({ color: new THREE.Color('green') }));
        const greenBoxBody = new CANNON.Body({ mass: 0 });
        greenBoxBody.addShape(new CANNON.Box(new CANNON.Vec3(25, 0.5, 25)));
        this.world.add(greenBoxBody);
        this.scene.add(greenBox);

        const redSphere = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial({ color: new THREE.Color('red') }));
        const redSphereBody = new CANNON.Body({ mass: 1 });
        redSphereBody.addShape(new CANNON.Sphere(1));
        this.world.add(redSphereBody);
        this.scene.add(redSphere);
        redSphereBody.position.y = 10;

        this.objects.push([redSphereBody, redSphere]);
        this.objects.push([greenBoxBody, greenBox]);
    }

    update() {
        requestAnimationFrame(this.update);

        for (const objectPair of this.objects) {
            const [body, mesh] = objectPair;
            mesh.position.copy(body.position);
            mesh.quaternion.copy(body.quaternion);
        }

        this.renderer.render(this.scene, this.camera);
        this.world.step(1 / 60);
        this.time = Date.now();
        this.player.update();
    }

    initWorld() {
        globalThis.world = this;
        this.setUpThreejs();
        this.renderer.setClearColor(new THREE.Color('skyblue'), 1);
        this.setUpPointerLock();
        this.setUpCannonjs();
        this.player = new Player(new THREE.Vector3(0, 1, 10));
        this.loader = new ColladaLoader();
        this.time = Date.now();
        this.objects = [];

        requestAnimationFrame(this.update);
    }
}
