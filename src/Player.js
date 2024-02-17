import Capsule from './Capsule.js';
import Utils from './Utils.js';
import KeyBinding from './KeyBinding.js';

export default class Player {
    constructor(startPos) {
        if (!startPos) startPos = new THREE.Vector3(0, 0, 0);
        this.characterCapsule = new Capsule({
            mass: 0,
            position: new CANNON.Vec3(0, 100, 10),
            height: 0.5,
            radius: 0.25,
            segments: 8,
            friction: 0.0
        });
        setTimeout(() => {
            this.characterCapsule.body.position.set(startPos.x, startPos.y, startPos.z);
        }, 100)
        this.ft = true;
        this.world = globalThis.world;
        this.characterCapsule.body.allowSleep = false;
        this.characterCapsule.body.userData = {
            isPlayer: true,
            character: this
        }
        this.world.world.add(this.characterCapsule.body);
        this.keyBinder = new KeyBinding({
            w: false,
            s: false,
            a: false,
            d: false,
            ' ': false
        })

        this.wantsToJump = false;
        this.canJump = false;
        this.initJumpSpeed = -1;
        this.maxDownSpeed = -50;
        this.rayResult = new CANNON.RaycastResult();
        this.rayHasHit = false;
        this.rayCastLength = 0.67;
        this.raySafeOffset = 0.03;
        this.groundImpactData = { velocity: new THREE.Vector3() }
        this.moveSpeed = 4;
        this.characterCapsule.body.collisionFilterGroup = 1;
        this.characterCapsule.body.fixedRotation = true;
        this.characterCapsule.body.updateMassProperties();
        this.velocity = new THREE.Vector3();

        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const boxMat = new THREE.MeshLambertMaterial({
            color: 0xff0000
        });
        this.raycastBox = new THREE.Mesh(boxGeo, boxMat);

        this.utils = new Utils();
        world.scene.add(this.raycastBox);
        this.raycastBox.visible = false;

        world.world.addEventListener('preStep', () => this.physicsPreStep(this.characterCapsule.body, this));
        //world.world.addEventListener('postStep', () => this.physicsPostStep(this.characterCapsule.body, this));

        this.inputVelocity = new THREE.Vector3();
        this.euler = new THREE.Euler();
        this.quat = new THREE.Quaternion();
        this.velocityFactor = 0.12;
        setTimeout(() => {
            this.ft = false;
        }, 100)
    }

    update() {
        let body = this.characterCapsule.body;
        let actions = this.keyBinder.actions;

        if (actions[' ']) this.wantsToJump = true;
        this.inputVelocity.set(0, 0, 0);
        if (this.ft) {
            actions.a = true;
        }

        if (actions.w) this.inputVelocity.z = -this.velocityFactor * 60;
        if (actions.s) this.inputVelocity.z = this.velocityFactor * 60;
        if (actions.a) this.inputVelocity.x = -this.velocityFactor * 60;
        if (actions.d) this.inputVelocity.x = this.velocityFactor * 60;

        this.euler.x = globalThis.pitchObject.rotation.x;
        this.euler.y = globalThis.yawObject.rotation.y;
        this.euler.order = "XYZ";
        this.euler.x = 0;
        this.quat.setFromEuler(this.euler);
        this.inputVelocity.applyQuaternion(this.quat);
        if (!actions.w && !actions.s && !actions.a && !actions.d) {
            const decelerationFactor = .85;
            body.velocity.x *= decelerationFactor;
            body.velocity.z *= decelerationFactor;
        } else {
            body.velocity.x = this.inputVelocity.x;
            body.velocity.z = this.inputVelocity.z;
        }
        const velocityDivisor = 60;
        body.position.x += body.velocity.x / velocityDivisor;
        body.position.y += body.velocity.y / velocityDivisor;
        body.position.z += body.velocity.z / velocityDivisor;
        globalThis.yawObject.position.copy(this.utils.threeVector(body.position));
        globalThis.yawObject.position.y += 1;

        let newVelocity = new THREE.Vector3();
        let rayResult = this.rayResult;
        let rayHasHit = this.rayHasHit;

        this.canJump = rayResult.body ? true : false;

        if (rayHasHit) {
            newVelocity.y = 0;

            if (rayResult.body.mass > 0) {
                let pointVelocity = new CANNON.Vec3();
                rayResult.body.getVelocityAtWorldPoint(rayResult.hitPointWorld, pointVelocity);
                newVelocity.add(this.utils.threeVector(pointVelocity));
            }

            let up = new THREE.Vector3(0, 1, 0);
            let normal = new THREE.Vector3(rayResult.hitNormalWorld.x, rayResult.hitNormalWorld.y, rayResult.hitNormalWorld.z);
            let q = new THREE.Quaternion().setFromUnitVectors(up, normal);
            let m = new THREE.Matrix4().makeRotationFromQuaternion(q);
            newVelocity.applyMatrix4(m);
            //body.velocity.copy(newVelocity);
            body.position.y = rayResult.hitPointWorld.y + this.rayCastLength + (newVelocity.y / velocityDivisor);
        } else {
            if (body.velocity.y > this.maxDownSpeed) {
                body.velocity.y -= -world.world.gravity.y / velocityDivisor;
            }

            let groundImpactData = this.groundImpactData;
            groundImpactData.velocity.x = body.velocity.x;
            groundImpactData.velocity.y = body.velocity.y;
            groundImpactData.velocity.z = body.velocity.z;
        }

        if (this.wantsToJump) {
            if (rayResult.body) {
                body.velocity.copy(newVelocity);
                if (this.initJumpSpeed > -1) {
                    // Handle initialization jump speed
                } else {
                    let add = new CANNON.Vec3();
                    rayResult.body.getVelocityAtWorldPoint(rayResult.hitPointWorld, add);
                    body.velocity.vsub(add, body.velocity);
                }

                body.velocity.y += 10;
                body.position.y += this.raySafeOffset * 2;
            }

            this.wantsToJump = false;
        }
        if (this.ft) {
            actions.a = false;
        }
    }

    physicsPreStep(body, character) {
        character.feetRaycast();

        if (character.rayHasHit && character.raycastBox.visible) {
            let hitPointWorld = character.rayResult.hitPointWorld;
            character.raycastBox.position.set(hitPointWorld.x, hitPointWorld.y, hitPointWorld.z);
        } else if (character.raycastBox.visible) {
            let bodyPosition = body.position;
            character.raycastBox.position.set(bodyPosition.x, bodyPosition.y - character.rayCastLength - character.raySafeOffset, bodyPosition.z);
        }
    }

    feetRaycast() {
        let body = this.characterCapsule.body;
        let rayCastLength = this.rayCastLength;
        let raySafeOffset = this.raySafeOffset;
        let rayResult = this.rayResult;

        const start = new CANNON.Vec3(body.position.x, body.position.y, body.position.z);
        const end = new CANNON.Vec3(body.position.x, body.position.y - rayCastLength - raySafeOffset, body.position.z);
        const rayCastOptions = {
            skipBackfaces: false
        };

        this.rayHasHit = globalThis.world.world.raycastClosest(start, end, rayCastOptions, rayResult);

        if (this.rayHasHit) {
            const hitNormal = rayResult.hitNormalWorld;
            const rayDirection = new CANNON.Vec3();
            end.vsub(start, rayDirection);
            rayDirection.normalize();

            const dotProduct = hitNormal.dot(rayDirection);
            const isBackface = dotProduct > 0;

            if (isBackface) {
                rayResult.hitNormalWorld.scale(-1, rayResult.hitNormalWorld);
            }
        }
    }

    jump(initJumpSpeed = -1) {
        this.wantsToJump = true;
        this.initJumpSpeed = initJumpSpeed;
    }
}
