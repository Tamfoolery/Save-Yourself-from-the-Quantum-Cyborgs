window.SYQC = window.SYQC || {};

SYQC.terrain = {
	generate: function(map, colours) {

		// Ground
		var terrainColour = colours.terrain,
			treeColours = colours.trees;

		var groundGeometry = new THREE.PlaneGeometry(map.width, map.height, map.width, map.height),
			groundGeometryHeight = [];

		for (var i = 0; i < groundGeometry.vertices.length; i++) {

			var x = groundGeometry.vertices[i].x,
				y = groundGeometry.vertices[i].y;

			if (x > -(map.arena.width / 2) && x < (map.arena.width / 2) &&
				y > -(map.arena.height / 2) && y < (map.arena.height / 2)) {

				var ax = x + (map.arena.width / 2),
					ay = y + (map.arena.height / 2);

				if (map.arena.data[ax+':'+ay] === '0xffffff') {
					groundGeometry.vertices[i].z = Math.random() * map.depth + map.zOffset;
				} else {
					groundGeometry.vertices[i].z = Math.random() * map.arena.depth + map.arena.zOffset;
				}

				if (map.arena.data[ax+':'+ay] === '0xff0000') SYQC.map.arena.spawnPoints[0].push([x, y]);
				if (map.arena.data[ax+':'+ay] === '0x0000ff') SYQC.map.arena.spawnPoints[1].push([x, y]);

			} else {

				groundGeometry.vertices[i].z = Math.random() * map.depth + map.zOffset;

			}

			groundGeometryHeight[x+':'+y] = groundGeometry.vertices[i].z;
		}

		groundGeometry.computeFaceNormals();

		var faceIndices = ['a', 'b', 'c', 'd'],
			f,
			n,
			vertexIndex,
			p;

		for (var i = 0; i < groundGeometry.faces.length; i++) {
			f = groundGeometry.faces[i];

			n = (f instanceof THREE.Face3) ? 3 : 4;

			for (var j = 0; j < n; j++) {
				vertexIndex = f[faceIndices[j]];

				p = groundGeometry.vertices[vertexIndex];

				if (p.z < map.zOffset) {
					f.vertexColors[j] = new THREE.Color( terrainColour.arena );
				} else {
					f.vertexColors[j] = new THREE.Color( terrainColour.grass );
				}
			}
		}

		var groundMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, shading: THREE.FlatShading, side: THREE.FrontSide, vertexColors: THREE.VertexColors });
		var groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);

		groundMesh.position.z = 0;
		groundMesh.receiveShadow = true;
		groundMesh.castShadow = true;

		SYQC.collisionMeshes.push(groundMesh);
		SYQC.scene.add(groundMesh);

		// Trees
		var treeGeometry = new THREE.CylinderGeometry(0,0.75,1,4,false);
		treeGeometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 1/2, 0 ) ); // Move anchor point from center to bottom

		for (var i = 0; i < 1000;) {

			var w = map.width / 2,
				h = map.height / 2,
				x = Math.random() * (w - -w) + -w,
				y = Math.random() * (h - -h) + -h,
				s = Math.random() * (1 - 0.75) + 0.75;

			var xx = Math.round(x),
				yy = Math.round(y);

			if (groundGeometryHeight[xx+':'+yy] >= map.zOffset) {

				if (groundGeometryHeight[(xx + 1)+':'+yy] >= map.zOffset &&
					groundGeometryHeight[(xx - 1)+':'+yy] >= map.zOffset &&
					groundGeometryHeight[xx+':'+(yy + 1)] >= map.zOffset &&
					groundGeometryHeight[xx+':'+(yy - 1)] >= map.zOffset) {

					var treeMaterial = new THREE.MeshLambertMaterial({
							color: treeColours[Math.floor(Math.random() * treeColours.length)],
							shading: THREE.FlatShading,
							side: THREE.FrontSide
						}),
						treeMesh = new THREE.Mesh(treeGeometry, treeMaterial);

					treeMesh.castShadow = true;
					treeMesh.receiveShadow = true;

					treeMesh.position.z = groundGeometryHeight[Math.round(x) + ':' + Math.round(y)];
					treeMesh.position.x = x;
					treeMesh.position.y = y;
					treeMesh.rotation.x = 1.5;
					treeMesh.scale.set(s, s, s);
					SYQC.scene.add(treeMesh);
					i++;

				}

			}
		}
	}
};