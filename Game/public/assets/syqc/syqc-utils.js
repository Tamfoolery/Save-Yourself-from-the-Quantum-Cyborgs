window.SYQC = window.SYQC || {};

SYQC.Utils = {};

SYQC.Utils.rgbToHex = function (r, g, b) {
	return "0x" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

SYQC.Utils.getImageColourData = function (imageUrl, callback) {
	var imageLoader = new THREE.ImageLoader();
	callback = callback || function () {};

	imageLoader.load(
		imageUrl,
		function (image) {
			var canvas = document.createElement('canvas'),
				w = image.width,
				h = image.height;
			var context = canvas.getContext('2d'),
				data = [];
			context.drawImage(image, 0, 0);

			for (var iw = 0, ii = 0; iw < w; iw++) {
				for (var ih = 0; ih < h; ih++) {
					var c = context.getImageData(iw, ih, 1, 1).data;
					data[iw+':'+ih] = SYQC.Utils.rgbToHex(c[0], c[1], c[2]);
				}
			}

			callback(w, h, data);
		}
	);
};