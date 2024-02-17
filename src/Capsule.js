import Utils from './Utils.js';
export default class CapsuleCollider
{
	constructor(options)
	{
		let defaults = {
			mass: 0,
			position: new CANNON.Vec3(),
			height: 0.5,
			radius: 0.3,
			segments: 8,
			friction: 0.3
		};
        let utils = new Utils();
		options = utils.setDefaults(options, defaults);
		this.options = options;
		let mat = new CANNON.Material('capsuleMat');
		mat.friction = options.friction;
		let capsuleBody = new CANNON.Body({
			mass: options.mass,
			position: options.position
		});
		let sphereShape = new CANNON.Sphere(options.radius);
		capsuleBody.material = mat;
		capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, 0, 0));
		capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, options.height / 2, 0));
		capsuleBody.addShape(sphereShape, new CANNON.Vec3(0, -options.height / 2, 0));

		this.body = capsuleBody;
	}
}