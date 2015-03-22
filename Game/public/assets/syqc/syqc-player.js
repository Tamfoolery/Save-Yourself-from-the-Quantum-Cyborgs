window.SYQC = window.SYQC || {};

var sizeX = 1,
	sizeY = 0.75,
	sizeZ = 0.75,
	position = new THREE.Vector3(-0.04, 0.2, 0.35);

SYQC.Player = {
	movementSpeed: 0,
	rotationSpeed: 0,
	team: 1, // 1: blue, 2: red

	unit: {},

	spawn: function (team) {
		this.team = team || 1;

		var material = new THREE.MeshPhongMaterial({ color: (this.team===1?0x0097e0:0xC70A00) });

		var bodyGeometry = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
		var body = new THREE.Mesh( bodyGeometry, material );
		body.castShadow = true;
		body.receiveShadow = true;

		var gunGeometry = new THREE.BoxGeometry(sizeX / 2, sizeY / 2, sizeZ / 2);
		var gun = new THREE.Mesh( gunGeometry, material );
		gun.position.x += sizeX - (sizeX / 2);
		gun.castShadow = true;
		gun.receiveShadow = true;

		var middleGeom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
		var middle = new THREE.Mesh(middleGeom, new THREE.MeshPhongMaterial({ color: 0xffffff }));
		middle.position.z = 0.4;

		this.unit = new THREE.Object3D();
		this.unit.add(body);
		this.unit.add(gun);
		this.unit.add(middle);
		this.unit.name = 'unit';
		this.unit.position.x = position.x;
		this.unit.position.y = position.y;
		this.unit.position.z = position.z;
		this.unit.castShadow = true;
		this.unit.receiveShadow = true;
		SYQC.scene.add( this.unit );
		return this.unit;
	}
};