// TODO: Collisions... http://webmaestro.fr/collisions-detection-three-js-raycasting/

var SYQC = {},
	WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight,
	CAMERA_ASPECT = WIDTH / HEIGHT;

SYQC.scene = {};

SYQC.isPaused = false;

SYQC.mouse = {
	raycaster: {},
	position: new THREE.Vector3(),
	isLocked: false
};

SYQC.keyboard = {
	87: { isDown: false },
	83: { isDown: false },
	65: { isDown: false },
	68: { isDown: false }
};
SYQC.controls = {
	UP: 87,
	DOWN: 83,
	LEFT: 65,
	RIGHT: 68
};

SYQC.map = {
	width: 64,
	height: 64,
	depth: 0.5,
	zOffset: 1,

	arena: {
		width: 32,
		height: 32,
		depth: 0.1,
		zOffset: -0.1,

		data: undefined,
		spawnPoints: [[],[]]
	}
};

SYQC.collisionMeshes = [];

SYQC.player = {};

// TODO: Replace ground with 3 terrain colours; Grass (top of the terrain), Dirt (slopes), Ground (arena floor)
SYQC.colours = {
	gas: {
		terrain: {
			grass: 0x5b0085,
			arena: 0x220031
		},
		trees: [ // Green
			0x00855B, // Lightest
			0x005037, // Lighter
			0x00281B // Light
		]
	},
	swamp: {
		terrain: {
			grass: 0x005037,
			arena: 0x002016
		},
		trees: [ // Purple
			0x5B0085,
			0x370050,
			0x1B0028
		]
	},
	desert: {
		terrain: {
			grass: 0xc76f00,
			arena: 0x7e4600
		},
		trees: [ // Blue
			0x005AC7,
			0x003677,
			0x001B3C
		]
	},
	ice: {
		terrain: {
			grass: 0x007177,
			arena: 0x003b3e
		},
		trees: [ // Red
			0xC70A00,
			0x770600,
			0x3C0300
		]
	},
	martian: {
		terrain: {
			grass: 0x3C0300,
			arena: 0x200200
		},
		trees: [ // Cyan
			0x003A3D,
			0x002325,
			0x001112
		]
	}
};

var playerTeam = 1;//Math.floor(Math.random() * 2) + 1;

SYQC.init = function () {
	// Setup the Scene
	SYQC.scene = new THREE.Scene();

	// Setup WebGL Renderer
	SYQC.renderer = new THREE.WebGLRenderer({ antialias: true });
	SYQC.renderer.setSize(WIDTH, HEIGHT);
	SYQC.renderer.shadowMapEnabled = true;
	SYQC.renderer.shadowMapType = THREE.PCFSoftShadowMap;
	document.body.appendChild(SYQC.renderer.domElement);

	/**
	 * Terrain
	 */
	// The colour data function needs to be blocking
	SYQC.Utils.getImageColourData('assets/imgs/map.png', function (w, h, data) {
		SYQC.map.width = w + 34;
		SYQC.map.height = h + 34;
		SYQC.map.arena.width = w;
		SYQC.map.arena.height = h;
		SYQC.map.arena.data = data;

		var selectedTerrainType = pickRand(SYQC.colours);
		SYQC.terrain.generate(SYQC.map, SYQC.colours[selectedTerrainType]);

		/**
		 * Lighting
		 */
		// Hemisphere Light
		var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
		SYQC.scene.add(hemiLight);

		// Direct Light
		var sunLight = new THREE.DirectionalLight( 0xffffff, 1 );
		sunLight.color.setHSL( 0.1, 1, 0.95 );
		sunLight.position.set( 1.5, 1.75, 7 ); //1.5, 1.75, 7
		sunLight.position.multiplyScalar( 50 );
		SYQC.scene.add( sunLight );

		sunLight.castShadow = true;
		sunLight.shadowMapWidth = 2048;
		sunLight.shadowMapHeight = 2048;

		sunLight.shadowCameraLeft = -SYQC.map.arena.width;
		sunLight.shadowCameraRight = SYQC.map.arena.width;
		sunLight.shadowCameraTop = SYQC.map.arena.height;
		sunLight.shadowCameraBottom = -SYQC.map.arena.height;

		sunLight.shadowCameraFar = 3500;
		sunLight.shadowBias = -0.000001;
		sunLight.shadowDarkness = 0.5;

		// Create the Player
		// TODO: Move player spawning position to map location
		SYQC.player = SYQC.Player.spawn(playerTeam);

		// Camera Setup
		SYQC.camera = new THREE.PerspectiveCamera(90, CAMERA_ASPECT, 1, 10000);
		SYQC.camera.position.clone(SYQC.player.position);
		SYQC.camera.position.z = 7;
		SYQC.camera.lookAt(new THREE.Vector3(SYQC.player.position.x, SYQC.player.position.y + (playerTeam===1?2:-2), SYQC.player.position.z));
		SYQC.scene.add(SYQC.camera);

		// Move player to spawn point
		var spawnPoint = SYQC.map.arena.spawnPoints[playerTeam-1][Math.floor(Math.random()*SYQC.map.arena.spawnPoints[playerTeam-1].length)];
		SYQC.player.position.x = spawnPoint[0];
		SYQC.player.position.y = spawnPoint[1];


		// Mouse
		SYQC.mouse.raycaster = new THREE.Raycaster();


		// Add Stats
		SYQC.stats = new Stats();
		SYQC.stats.domElement.style.position = 'absolute';
		SYQC.stats.domElement.style.top = '5px';
		SYQC.stats.domElement.style.left = '5px';
		document.body.appendChild(SYQC.stats.domElement);

		// Start the Game
		SYQC.start();

	});
};

SYQC.start = function () {
	// Start Loops
	SYQC.logic();
	SYQC.render();

	// Hide loading screen
	document.getElementById('loading').classList.add('hide');
};

SYQC.render = function () {
	// Render the frame
	SYQC.renderer.render(SYQC.scene, SYQC.camera);

	// Update the stats
	SYQC.stats.update();

	// Run again if not paused
	if (!SYQC.isPaused) window.requestAnimationFrame(SYQC.render); // Update on next frame, speed can vary
};

SYQC.logic = function () {
	// Move unit
	var moveSpeed = 0.1,
		playerHitBox = 1.5;

	if (SYQC.keyboard[SYQC.controls.UP].isDown && !(SYQC.player.position.y >= (SYQC.map.arena.height / 2) - playerHitBox)) {
		SYQC.player.position.y += moveSpeed;
	} else if (SYQC.keyboard[SYQC.controls.DOWN].isDown && !(SYQC.player.position.y <= -((SYQC.map.arena.height / 2) - playerHitBox))) {
		SYQC.player.position.y -= moveSpeed;
	}
	if (SYQC.keyboard[SYQC.controls.LEFT].isDown && !(SYQC.player.position.x <= -((SYQC.map.arena.width / 2) - playerHitBox))) {
		SYQC.player.position.x -= moveSpeed;
	} else if (SYQC.keyboard[SYQC.controls.RIGHT].isDown && !(SYQC.player.position.x >= (SYQC.map.arena.width / 2) - playerHitBox)) {
		SYQC.player.position.x += moveSpeed;
	}

	// Rotate Unit
	SYQC.player.rotation.z = Math.atan2(SYQC.mouse.position.y, SYQC.mouse.position.x);

	// Update Camera
	SYQC.camera.position.x = SYQC.player.position.x;
	SYQC.camera.position.y = SYQC.player.position.y - 2;

	if (!SYQC.isPaused) setTimeout(SYQC.logic, 1000 / 60); // Updated 60 times a second
};

SYQC.mouse.onMove = function (e) {
	SYQC.mouse.position.x = (e.clientX / WIDTH) * 2 - 1;
	SYQC.mouse.position.y = -(e.clientY / HEIGHT) * 2 + 1;
};

SYQC.mouse.onClick = function (e) {
	e.preventDefault();

	// Update position
	SYQC.mouse.onMove(e);

	// Raycasting
	// TODO: Not really used in onClick, perhaps move to onMove
	SYQC.mouse.raycaster.setFromCamera(SYQC.mouse.position, SYQC.camera);

	return false;
};

// Run Init
window.addEventListener("load", SYQC.init);

// Detect window resize
window.onresize = function () {
	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;

	CAMERA_ASPECT = WIDTH / HEIGHT;

	SYQC.camera.aspect = CAMERA_ASPECT;
	SYQC.camera.updateProjectionMatrix();
	SYQC.renderer.setSize(WIDTH, HEIGHT);
};

// On Mouse move / click
window.addEventListener("mousemove", SYQC.mouse.onMove, false);
window.addEventListener("mousedown", SYQC.mouse.onClick, false);
// Disable right click
document.addEventListener('contextmenu', function (e) {
	e.preventDefault();
}, false);

// On Key Change
window.addEventListener("keydown", function (e) {
	SYQC.keyboard[e.keyCode] = SYQC.keyboard[e.keyCode] || {};
	SYQC.keyboard[e.keyCode].isDown = true;
});

window.addEventListener("keyup", function (e) {
	SYQC.keyboard[e.keyCode] = SYQC.keyboard[e.keyCode] || {};
	SYQC.keyboard[e.keyCode].isDown = false;
});