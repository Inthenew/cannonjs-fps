export default class Utils {
    constructor() {}

    appplyVectorMatrixXZ(a, b) {
        return new THREE.Vector3(
            (a.x * b.z + a.z * b.x),
            b.y,
            (a.z * b.z + -a.x * b.x)
        );
    }

    round(value, decimals = 0) {
        return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }

    roundVector(vector, decimals = 0) {
        return new THREE.Vector3(
            this.round(vector.x, decimals),
            this.round(vector.y, decimals),
            this.round(vector.z, decimals),
        );
    }

    getAngleBetweenVectors(v1, v2, dotTreshold = 0.0005) {
        let angle;
        let dot = v1.dot(v2);

        if (dot > 1 - dotTreshold) {
            angle = 0;
        } else if (dot < -1 + dotTreshold) {
            angle = Math.PI;
        } else {
            angle = Math.acos(dot);
        }

        return angle;
    }

    getSignedAngleBetweenVectors(v1, v2, normal = new THREE.Vector3(0, 1, 0), dotTreshold = 0.0005) {
        let angle = this.getAngleBetweenVectors(v1, v2, dotTreshold);

        let cross = new THREE.Vector3().crossVectors(v1, v2);

        if (normal.dot(cross) < 0) {
            angle = -angle;
        }

        return angle;
    }

    haveSameSigns(n1, n2) {
        return (n1 < 0) === (n2 < 0);
    }

    haveDifferentSigns(n1, n2) {
        return (n1 < 0) !== (n2 < 0);
    }

    setDefaults(options = {}, defaults = {}) {
        // Assuming lodash (underscore) is available
        return _.defaults({}, _.clone(options), defaults);
    }

    getGlobalProperties(prefix = '') {
        let keyValues = [];
        let global = window;

        for (let prop in global) {
            if (prop.indexOf(prefix) === 0) {
                keyValues.push(prop);
            }
        }

        return keyValues;
    }

    spring(source, dest, velocity, mass, damping) {
        let acceleration = dest - source;
        acceleration /= mass;
        velocity += acceleration;
        velocity *= damping;

        let position = source + velocity;

        return new SimulationFrame(position, velocity);
    }

    springV(source, dest, velocity, mass, damping) {
        let acceleration = new THREE.Vector3().subVectors(dest, source);
        acceleration.divideScalar(mass);
        velocity.add(acceleration);
        velocity.multiplyScalar(damping);
        source.add(velocity);
    }

    threeVector(vec) {
        return new THREE.Vector3(vec.x, vec.y, vec.z);
    }

    cannonVector(vec) {
        // Assuming CANNON library is available
        return new CANNON.Vec3(vec.x, vec.y, vec.z);
    }

    threeQuat(quat) {
        return new THREE.Quaternion(quat.x, quat.y, quat.z, quat.w);
    }

    cannonQuat(quat) {
        // Assuming CANNON library is available
        return new CANNON.Quaternion(quat.x, quat.y, quat.z, quat.w);
    }

    setupMeshProperties(child) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material.map !== null) {
            let mat = new THREE.MeshPhongMaterial();
            mat.shininess = 0;
            mat.name = child.material.name;
            mat.map = child.material.map;
            mat.map.anisotropy = 4;
            mat.aoMap = child.material.aoMap;
            mat.transparent = child.material.transparent;
            mat.skinning = child.material.skinning;
            child.material = mat;
        }
    }

    detectRelativeSide(from, to) {
        const right = this.getRight(from, Space.Local);
        const viewVector = to.position.clone().sub(from.position).normalize();

        return right.dot(viewVector) > 0 ? Side.Left : Side.Right;
    }

    easeInOutSine(x) {
        return -(Math.cos(Math.PI * x) - 1) / 2;
    }

    easeOutQuad(x) {
        return 1 - (1 - x) * (1 - x);
    }

    getRight(obj, space = Space.Global) {
        const matrix = this.getMatrix(obj, space);
        return new THREE.Vector3(
            matrix.elements[0],
            matrix.elements[1],
            matrix.elements[2]
        );
    }

    getUp(obj, space = Space.Global) {
        const matrix = this.getMatrix(obj, space);
        return new THREE.Vector3(
            matrix.elements[4],
            matrix.elements[5],
            matrix.elements[6]
        );
    }

    getForward(obj, space = Space.Global) {
        const matrix = this.getMatrix(obj, space);
        return new THREE.Vector3(
            matrix.elements[8],
            matrix.elements[9],
            matrix.elements[10]
        );
    }

    getBack(obj, space = Space.Global) {
        const matrix = this.getMatrix(obj, space);
        return new THREE.Vector3(
            -matrix.elements[8],
            -matrix.elements[9],
            -matrix.elements[10]
        );
    }

    getMatrix(obj, space) {
        switch (space) {
            case Space.Local: return obj.matrix;
            case Space.Global: return obj.matrixWorld;
        }
    }
}

// Assuming these constants are defined somewhere
const Space = { Local: 'local', Global: 'global' };
const Side = { Left: 'left', Right: 'right' };

class SimulationFrame {
    constructor(position, velocity) {
        this.position = position;
        this.velocity = velocity;
    }
}
