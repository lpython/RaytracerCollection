"use strict";
var Vector = /** @class */ (function () {
    function Vector(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Vector.times = function (k, v) { return new Vector(k * v.x, k * v.y, k * v.z); };
    Vector.minus = function (v1, v2) { return new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z); };
    Vector.plus = function (v1, v2) { return new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z); };
    Vector.dot = function (v1, v2) { return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z; };
    Vector.mag = function (v) { return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z); };
    Vector.norm = function (v) {
        var mag = Vector.mag(v);
        var div = (mag === 0) ? Infinity : 1.0 / mag;
        return Vector.times(div, v);
    };
    Vector.cross = function (v1, v2) {
        return new Vector(v1.y * v2.z - v1.z * v2.y, v1.z * v2.x - v1.x * v2.z, v1.x * v2.y - v1.y * v2.x);
    };
    return Vector;
}());
var Color = /** @class */ (function () {
    function Color(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    Color.scale = function (k, v) { return new Color(k * v.r, k * v.g, k * v.b); };
    Color.plus = function (v1, v2) { return new Color(v1.r + v2.r, v1.g + v2.g, v1.b + v2.b); };
    Color.times = function (v1, v2) { return new Color(v1.r * v2.r, v1.g * v2.g, v1.b * v2.b); };
    Color.toDrawingColor = function (c) {
        var legalize = function (d) { return d > 1 ? 1 : d; };
        return {
            r: Math.floor(legalize(c.r) * 255),
            g: Math.floor(legalize(c.g) * 255),
            b: Math.floor(legalize(c.b) * 255)
        };
    };
    Color.white = new Color(1.0, 1.0, 1.0);
    Color.grey = new Color(0.5, 0.5, 0.5);
    Color.black = new Color(0.0, 0.0, 0.0);
    Color.background = Color.black;
    Color.defaultColor = Color.black;
    return Color;
}());
var Camera = /** @class */ (function () {
    function Camera(pos, lookAt) {
        this.pos = pos;
        var down = new Vector(0.0, -1.0, 0.0);
        this.forward = Vector.norm(Vector.minus(lookAt, this.pos));
        this.right = Vector.times(1.5, Vector.norm(Vector.cross(this.forward, down)));
        this.up = Vector.times(1.5, Vector.norm(Vector.cross(this.forward, this.right)));
    }
    return Camera;
}());
var Sphere = /** @class */ (function () {
    function Sphere(center, radius, surface) {
        this.center = center;
        this.surface = surface;
        this.radius2 = radius * radius;
    }
    Sphere.prototype.normal = function (pos) { return Vector.norm(Vector.minus(pos, this.center)); };
    Sphere.prototype.intersect = function (ray) {
        var eo = Vector.minus(this.center, ray.start);
        var v = Vector.dot(eo, ray.dir);
        var dist = 0;
        if (v >= 0) {
            var disc = this.radius2 - (Vector.dot(eo, eo) - v * v);
            if (disc >= 0) {
                dist = v - Math.sqrt(disc);
            }
        }
        if (dist === 0) {
            return null;
        }
        else {
            return { thing: this, ray: ray, dist: dist };
        }
    };
    return Sphere;
}());
var Plane = /** @class */ (function () {
    function Plane(norm, offset, surface) {
        this.surface = surface;
        this.normal = function (pos) { return norm; };
        this.intersect = function (ray) {
            var denom = Vector.dot(norm, ray.dir);
            if (denom > 0) {
                return null;
            }
            else {
                var dist = (Vector.dot(norm, ray.start) + offset) / (-denom);
                return { thing: this, ray: ray, dist: dist };
            }
        };
    }
    return Plane;
}());
var Surfaces;
(function (Surfaces) {
    Surfaces.shiny = {
        diffuse: function (pos) { return Color.white; },
        specular: function (pos) { return Color.grey; },
        reflect: function (pos) { return 0.7; },
        roughness: 250
    };
    Surfaces.checkerboard = {
        diffuse: function (pos) {
            if ((Math.floor(pos.z) + Math.floor(pos.x)) % 2 !== 0) {
                return Color.white;
            }
            else {
                return Color.black;
            }
        },
        specular: function (pos) { return Color.white; },
        reflect: function (pos) {
            if ((Math.floor(pos.z) + Math.floor(pos.x)) % 2 !== 0) {
                return 0.1;
            }
            else {
                return 0.7;
            }
        },
        roughness: 150
    };
})(Surfaces || (Surfaces = {}));
var RayTracer = /** @class */ (function () {
    function RayTracer() {
        this.maxDepth = 5;
    }
    RayTracer.prototype.intersections = function (ray, scene) {
        var closest = +Infinity;
        var closestInter = null;
        for (var i in scene.things) {
            var inter = scene.things[i].intersect(ray);
            if (inter != null && inter.dist < closest) {
                closestInter = inter;
                closest = inter.dist;
            }
        }
        return closestInter;
    };
    RayTracer.prototype.testRay = function (ray, scene) {
        var isect = this.intersections(ray, scene);
        if (isect != null) {
            return isect.dist;
        }
        else {
            return null;
        }
    };
    RayTracer.prototype.traceRay = function (ray, scene, depth) {
        var isect = this.intersections(ray, scene);
        if (isect === null) {
            return Color.background;
        }
        else {
            return this.shade(isect, scene, depth);
        }
    };
    RayTracer.prototype.shade = function (isect, scene, depth) {
        var d = isect.ray.dir;
        var pos = Vector.plus(Vector.times(isect.dist, d), isect.ray.start);
        var normal = isect.thing.normal(pos);
        var reflectDir = Vector.minus(d, Vector.times(2, Vector.times(Vector.dot(normal, d), normal)));
        var naturalColor = Color.plus(Color.background, this.getNaturalColor(isect.thing, pos, normal, reflectDir, scene));
        var reflectedColor = (depth >= this.maxDepth) ? Color.grey : this.getReflectionColor(isect.thing, pos, normal, reflectDir, scene, depth);
        return Color.plus(naturalColor, reflectedColor);
    };
    RayTracer.prototype.getReflectionColor = function (thing, pos, normal, rd, scene, depth) {
        return Color.scale(thing.surface.reflect(pos), this.traceRay({ start: pos, dir: rd }, scene, depth + 1));
    };
    RayTracer.prototype.getNaturalColor = function (thing, pos, norm, rd, scene) {
        var _this = this;
        var addLight = function (col, light) {
            var ldis = Vector.minus(light.pos, pos);
            var livec = Vector.norm(ldis);
            var neatIsect = _this.testRay({ start: pos, dir: livec }, scene);
            var isInShadow = (neatIsect === null) ? false : (neatIsect <= Vector.mag(ldis));
            if (isInShadow) {
                return col;
            }
            else {
                var illum = Vector.dot(livec, norm);
                var lcolor = (illum > 0) ? Color.scale(illum, light.color)
                    : Color.defaultColor;
                var specular = Vector.dot(livec, Vector.norm(rd));
                var scolor = (specular > 0) ? Color.scale(Math.pow(specular, thing.surface.roughness), light.color)
                    : Color.defaultColor;
                return Color.plus(col, Color.plus(Color.times(thing.surface.diffuse(pos), lcolor), Color.times(thing.surface.specular(pos), scolor)));
            }
        };
        return scene.lights.reduce(addLight, Color.defaultColor);
    };
    RayTracer.prototype.render = function (scene, ctx, screenWidth, screenHeight) {
        var getPoint = function (x, y, camera) {
            var recenterX = function (x) { return (x - (screenWidth / 2.0)) / 2.0 / screenWidth; };
            var recenterY = function (y) { return -(y - (screenHeight / 2.0)) / 2.0 / screenHeight; };
            return Vector.norm(Vector.plus(camera.forward, Vector.plus(Vector.times(recenterX(x), camera.right), Vector.times(recenterY(y), camera.up))));
        };
        for (var y = 0; y < screenHeight; y++) {
            for (var x = 0; x < screenWidth; x++) {
                var color = this.traceRay({ start: scene.camera.pos, dir: getPoint(x, y, scene.camera) }, scene, 0);
                var c = Color.toDrawingColor(color);
                ctx.fillStyle = "rgb(" + String(c.r) + ", " + String(c.g) + ", " + String(c.b) + ")";
                ctx.fillRect(x, y, x + 1, y + 1);
            }
        }
    };
    RayTracer.prototype.renderToImage = function (scene, image) {
        var height = image.height;
        var width = image.width;
        var getPoint = function (x, y, camera) {
            var recenterX = function (x) { return (x - (width / 2.0)) / 2.0 / width; };
            var recenterY = function (y) { return -(y - (height / 2.0)) / 2.0 / height; };
            return Vector.norm(Vector.plus(camera.forward, Vector.plus(Vector.times(recenterX(x), camera.right), Vector.times(recenterY(y), camera.up))));
        };
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var color = this.traceRay({ start: scene.camera.pos, dir: getPoint(x, y, scene.camera) }, scene, 0);
                var c = Color.toDrawingColor(color);
                // ctx.fillStyle = "rgb(" + String(c.r) + ", " + String(c.g) + ", " + String(c.b) + ")";
                // ctx.fillRect(x, y, x + 1, y + 1);
                image.data[((y * (width * 4)) + (x * 4))] = c.r;
                image.data[((y * (width * 4)) + (x * 4)) + 1] = c.g;
                image.data[((y * (width * 4)) + (x * 4)) + 2] = c.b;
                image.data[((y * (width * 4)) + (x * 4)) + 3] = 255;
            }
        }
    };
    return RayTracer;
}());
function defaultScene() {
    return {
        things: [
            new Plane(new Vector(0.0, 1.0, 0.0), 0.0, Surfaces.checkerboard),
            new Sphere(new Vector(0.0, 1.0, -0.25), 1.0, Surfaces.shiny),
            new Sphere(new Vector(-1.0, 0.5, 1.5), 0.5, Surfaces.shiny)
        ],
        lights: [
            { pos: new Vector(-2.0, 2.5, 0.0), color: new Color(0.49, 0.07, 0.07) },
            { pos: new Vector(1.5, 2.5, 1.5), color: new Color(0.07, 0.07, 0.49) },
            { pos: new Vector(1.5, 2.5, -1.5), color: new Color(0.07, 0.49, 0.071) },
            { pos: new Vector(0.0, 3.5, 0.0), color: new Color(0.21, 0.21, 0.35) }
        ],
        camera: new Camera(new Vector(3.0, 2.0, 4.0), new Vector(-1.0, 0.5, 0.0))
    };
}
function scene2() {
    return {
        things: [
            new Plane(new Vector(0.0, 1.0, 0.0), 0.0, Surfaces.checkerboard),
            new Sphere(new Vector(0.0, 1.0, -0.25), 1.0, Surfaces.shiny),
            new Sphere(new Vector(-1.0, 0.5, 1.5), 0.5, Surfaces.shiny),
            new Sphere(new Vector(-5.5, 2.0, -3.5), 1.25, Surfaces.checkerboard)
        ],
        lights: [
            { pos: new Vector(-2.0, 2.5, 0.0), color: new Color(0.49, 0.07, 0.07) },
            { pos: new Vector(1.5, 2.5, 1.5), color: new Color(0.07, 0.07, 0.49) },
            { pos: new Vector(1.5, 2.5, -1.5), color: new Color(0.07, 0.49, 0.071) },
            { pos: new Vector(0.0, 3.5, 0.0), color: new Color(0.21, 0.21, 0.35) }
        ],
        camera: new Camera(new Vector(3.0, 2.0, 4.0), new Vector(-1.0, 0.5, 0.0))
    };
}
function emptyScene() {
    return {
        things: [],
        lights: [],
        camera: new Camera(new Vector(3.0, 2.0, 4.0), new Vector(-1.0, 0.5, 0.0))
    };
}
function DefaultXML() {
    return "\n<scene>\n  <camera pos=\"3.0, 2.0, 4.0\" lookAt=\"-1.0, 0.5, 0.0\" />\n  <objects>\n    <plane pos=\"0.0,1.0,0.0\" offset=\"0.0\" surface=\"checkerboard\" />\n    <sphere pos=\"0.0,1.0,-0.25\" size=\"1.0\" surface=\"shiny\"/>\n    <sphere pos=\"-1.0,0.5,1.5\" size=\"0.5\" surface=\"shiny\"/>\n    <sphere pos=\"-5.5,2.0,-3.5\" size=\"1.25\" surface=\"checkerboard\"/>\n  </objects>\n  <lights>\n    <light pos=\"-2.0, 2.5, 0.0\" color=\"0.49, 0.07, 0.07\" /> \n    <light pos=\"1.5, 2.5, 1.5\" color=\"0.07, 0.07, 0.49\" /> \n    <light pos=\"1.5, 2.5, -1.5\" color=\"0.07, 0.49, 0.071\" /> \n    <light pos=\"0.0, 3.5, 0.0\" color=\"0.21, 0.21, 0.35\" /> \n  </lights>\n</scene>\n  ".trim();
}
// Throws error on invalid xml
function ParseXMLToScene(xmlInput) {
    var parser = new DOMParser();
    var xml = parser.parseFromString(xmlInput, 'application/xml');
    console.log('xml', xml);
    var parserErrorNode = xml.getElementsByTagName('parsererror');
    if (parserErrorNode.length != 0) {
        throw new SyntaxError();
    }
    var objects = [];
    var lights = [];
    var camera = new Camera(new Vector(3.0, 2.0, 4.0), new Vector(-1.0, 0.5, 0.0));
    //Level 1
    var sceneNode = xml.getElementsByTagName('scene')[0];
    // console.log(sceneNode);
    //Level 2
    var cameraNode = sceneNode.getElementsByTagName('camera')[0];
    var objectsNode = sceneNode.getElementsByTagName('objects')[0];
    var lightsNode = sceneNode.getElementsByTagName('lights')[0];
    //Level 3
    var planeNodes = objectsNode.getElementsByTagName('plane');
    var sphereNodes = objectsNode.getElementsByTagName('sphere');
    var lightNodes = lightsNode.getElementsByTagName('light');
    var _loop_1 = function (p) {
        var requiredAttributes = ['pos', 'offset', 'surface'];
        if (requiredAttributes.every(function (a) { return p.hasAttribute(a); })) {
            var posAtt = p.getAttribute('pos');
            var offsetAtt = p.getAttribute('offset');
            var surfaceAtt = p.getAttribute('surface');
            var numbers = posAtt.split(',').slice(0, 3).map(function (s) { return parseFloat(s); });
            var vec = new Vector(numbers[0], numbers[1], numbers[2]);
            var offset = parseFloat(offsetAtt);
            var surface = Surfaces.checkerboard;
            if (surfaceAtt === 'shiny') {
                surface = Surfaces.shiny;
            }
            // console.log('vec:', vec);
            // console.log('numbers:', numbers);
            // console.log('offset:', offset);
            // console.log('surface:', surface);
            objects.push(new Plane(vec, offset, surface));
        }
    };
    // xml nodes to typescript objects
    for (var _i = 0, _a = planeNodes; _i < _a.length; _i++) {
        var p = _a[_i];
        _loop_1(p);
    }
    var _loop_2 = function (s) {
        var requiredAttributes = ['pos', 'size', 'surface'];
        if (requiredAttributes.every(function (a) { return s.hasAttribute(a); })) {
            var posAtt = s.getAttribute('pos');
            var sizeAtt = s.getAttribute('size');
            var surfaceAtt = s.getAttribute('surface');
            console.log({ posAtt: posAtt, sizeAtt: sizeAtt, surfaceAtt: surfaceAtt });
            var numbers = posAtt.split(',').slice(0, 3).map(function (s) { return parseFloat(s); });
            var vec = new Vector(numbers[0], numbers[1], numbers[2]);
            var size = parseFloat(sizeAtt);
            var surface = Surfaces.checkerboard;
            if (surfaceAtt === 'shiny') {
                surface = Surfaces.shiny;
            }
            // console.log('vec:', vec);
            // console.log('numbers:', numbers);
            // console.log('size:', size);
            // console.log('surface:', surface);
            objects.push(new Sphere(vec, size, surface));
        }
    };
    for (var _b = 0, _c = sphereNodes; _b < _c.length; _b++) {
        var s = _c[_b];
        _loop_2(s);
    }
    var _loop_3 = function (l) {
        var requiredAttributes = ['pos', 'color'];
        if (requiredAttributes.every(function (a) { return l.hasAttribute(a); })) {
            var posAtt = l.getAttribute('pos');
            var colorAtt = l.getAttribute('color');
            console.log({ posAtt: posAtt, colorAtt: colorAtt });
            var numbers = posAtt.split(',').slice(0, 3).map(function (s) { return parseFloat(s); });
            var vec = new Vector(numbers[0], numbers[1], numbers[2]);
            var color = colorAtt.split(',').slice(0, 3).map(function (s) { return parseFloat(s); });
            // console.log('vec:', vec);
            // console.log('numbers:', numbers);
            // console.log('color:', color);
            lights.push({ pos: vec, color: new Color(color[0], color[1], color[2]) });
        }
    };
    for (var _d = 0, _e = lightNodes; _d < _e.length; _d++) {
        var l = _e[_d];
        _loop_3(l);
    }
    (function parseLight(cameraNode) {
        console.log(cameraNode);
        var requiredAttributes = ['pos', 'lookAt'];
        if (requiredAttributes.every(function (a) { return cameraNode.hasAttribute(a); })) {
            var posAtt = cameraNode.getAttribute('pos');
            var lookAtAtt = cameraNode.getAttribute('lookAt');
            console.log({ posAtt: posAtt, lookAtAtt: lookAtAtt });
            var numbers = posAtt.split(',').slice(0, 3).map(function (s) { return parseFloat(s); });
            var pos = new Vector(numbers[0], numbers[1], numbers[2]);
            numbers = lookAtAtt.split(',').slice(0, 3).map(function (s) { return parseFloat(s); });
            var lookAt = new Vector(numbers[0], numbers[1], numbers[2]);
            // console.log({ pos, lookAt })
            camera = new Camera(pos, lookAt);
        }
    })(cameraNode);
    console.log(objects);
    console.log(lights);
    var scene = {
        things: objects,
        lights: lights,
        camera: camera
    };
    console.log('parsed scene : ', scene);
    return scene;
}
//Scene input was attempt to provide textarea with live raytrace updates on user input.
//Due to Types lost on compile, alternative solution needed.
function exec() {
    var canv = document.querySelector("#ray-canvas");
    var sceneSelector = document.querySelector('#ray-scene');
    var sceneInput = document.querySelector('#ray-input');
    var resSelector = document.querySelector('#ray-res');
    var elapsed = document.querySelector('#ray-elapsed');
    var rayTracer = new RayTracer();
    var ctxMaybe = canv.getContext("2d");
    if (ctxMaybe == null) {
        return;
    }
    var ctx = ctxMaybe;
    var size;
    var img;
    var scene = defaultScene();
    // try {
    //   sceneInput.value = JSON.stringify(defaultScene());
    // }
    // catch (error) {
    //   console.error('Attempt load scene to textarea : ', error);
    // }
    sceneInput.value = DefaultXML();
    var renewRaytrace = function () {
        var start = performance.now();
        rayTracer.renderToImage(scene, img);
        var end = performance.now();
        outputElapsedTime(end - start);
    };
    var outputElapsedTime = function (n) {
        elapsed.textContent = 'Elapsed : ' + (n / 1000.0).toFixed(2).toString() + 's';
        ['btn-primary', 'btn-success', 'btn-warning', 'btn-danger']
            .forEach(function (className) { elapsed.classList.remove(className); });
        if (n > 2000) {
            elapsed.classList.add('btn-danger');
        }
        else if (n > 500) {
            elapsed.classList.add('btn-warning');
        }
        else {
            elapsed.classList.add('btn-success');
        }
    };
    var resizeCanvas = function () { return ctx.canvas.height = ctx.canvas.width; };
    var resizeTextarea = function () { return sceneInput.style.height = ctx.canvas.clientHeight.toString() + 'px'; };
    var changeRenderSize = function () {
        size = parseInt(resSelector.value);
        img = ctx.createImageData(size, size);
    };
    var outputRenderImage = function () {
        createImageBitmap(img, 0, 0, size, size)
            .then(function (img) { return ctx.drawImage(img, 0, 0, canv.width, canv.height); });
    };
    // let sceneJSONFromTextarea = (): Scene => {
    //   try {
    //     const input = JSON.parse(sceneInput.value);
    //     console.log(input);
    //     return input;
    //   }
    //   catch (error) {
    //     console.error('sceneFromTextarea()', error);
    //     //TODO refactor clearing of button
    //     ['btn-primary', 'btn-success', 'btn-warning', 'btn-danger']
    //       .forEach(className => { elapsed.classList.remove(className); });
    //     elapsed.classList.add('btn-danger');
    //     elapsed.textContent = 'Invalid JSON';
    //     return emptyScene();
    //   }
    //   // return input as Scene;
    // }
    var sceneXMLFromTextarea = function () {
        try {
            scene = ParseXMLToScene(sceneInput.value);
        }
        catch (error) {
            console.error('sceneXMLFromTextarea()', error);
            //TODO refactor clearing of button
            ['btn-primary', 'btn-success', 'btn-warning', 'btn-danger']
                .forEach(function (className) { elapsed.classList.remove(className); });
            elapsed.classList.add('btn-danger');
            elapsed.textContent = 'Invalid XML';
            scene = emptyScene();
        }
    };
    window.addEventListener('resize', function () {
        resizeCanvas();
        resizeTextarea();
        outputRenderImage();
    });
    resSelector.addEventListener('change', function () {
        changeRenderSize();
        renewRaytrace();
        outputRenderImage();
    });
    sceneSelector.addEventListener('change', function () {
        scene = [emptyScene, defaultScene, scene2][parseInt(sceneSelector.value)]();
        renewRaytrace();
        outputRenderImage();
    });
    // sceneInput.addEventListener('input', () => {
    // });
    elapsed.addEventListener('click', function () {
        if (sceneSelector.value != "0") {
            console.log('click ignored');
            return;
        }
        sceneXMLFromTextarea();
        renewRaytrace();
        outputRenderImage();
    });
    changeRenderSize();
    renewRaytrace();
    resizeCanvas();
    resizeTextarea();
    outputRenderImage();
}
exec();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF5dHJhY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyYXl0cmFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0E7SUFDRSxnQkFBbUIsQ0FBUyxFQUNuQixDQUFTLEVBQ1QsQ0FBUztRQUZDLE1BQUMsR0FBRCxDQUFDLENBQVE7UUFDbkIsTUFBQyxHQUFELENBQUMsQ0FBUTtRQUNULE1BQUMsR0FBRCxDQUFDLENBQVE7SUFDbEIsQ0FBQztJQUNNLFlBQUssR0FBWixVQUFhLENBQVMsRUFBRSxDQUFTLElBQUksT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3RSxZQUFLLEdBQVosVUFBYSxFQUFVLEVBQUUsRUFBVSxJQUFJLE9BQU8sSUFBSSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0YsV0FBSSxHQUFYLFVBQVksRUFBVSxFQUFFLEVBQVUsSUFBSSxPQUFPLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFGLFVBQUcsR0FBVixVQUFXLEVBQVUsRUFBRSxFQUFVLElBQUksT0FBTyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0UsVUFBRyxHQUFWLFVBQVcsQ0FBUyxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RSxXQUFJLEdBQVgsVUFBWSxDQUFTO1FBQ25CLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUM3QyxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFDTSxZQUFLLEdBQVosVUFBYSxFQUFVLEVBQUUsRUFBVTtRQUNqQyxPQUFPLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQ3pDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQ3pCLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBQ0gsYUFBQztBQUFELENBQUMsQUFwQkQsSUFvQkM7QUFFRDtJQUNFLGVBQW1CLENBQVMsRUFDbkIsQ0FBUyxFQUNULENBQVM7UUFGQyxNQUFDLEdBQUQsQ0FBQyxDQUFRO1FBQ25CLE1BQUMsR0FBRCxDQUFDLENBQVE7UUFDVCxNQUFDLEdBQUQsQ0FBQyxDQUFRO0lBQ2xCLENBQUM7SUFDTSxXQUFLLEdBQVosVUFBYSxDQUFTLEVBQUUsQ0FBUSxJQUFJLE9BQU8sSUFBSSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0UsVUFBSSxHQUFYLFVBQVksRUFBUyxFQUFFLEVBQVMsSUFBSSxPQUFPLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLFdBQUssR0FBWixVQUFhLEVBQVMsRUFBRSxFQUFTLElBQUksT0FBTyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQU14RixvQkFBYyxHQUFyQixVQUFzQixDQUFRO1FBQzVCLElBQUksUUFBUSxHQUFHLFVBQUMsQ0FBUyxJQUFLLE9BQUEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQWIsQ0FBYSxDQUFDO1FBQzVDLE9BQU87WUFDTCxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUNsQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUNsQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztTQUNuQyxDQUFBO0lBQ0gsQ0FBQztJQVpNLFdBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2pDLFVBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2hDLFdBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2pDLGdCQUFVLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztJQUN6QixrQkFBWSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7SUFTcEMsWUFBQztDQUFBLEFBckJELElBcUJDO0FBRUQ7SUFLRSxnQkFBbUIsR0FBVyxFQUFFLE1BQWM7UUFBM0IsUUFBRyxHQUFILEdBQUcsQ0FBUTtRQUM1QixJQUFJLElBQUksR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlFLElBQUksQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuRixDQUFDO0lBQ0gsYUFBQztBQUFELENBQUMsQUFYRCxJQVdDO0FBcUNEO0lBR0UsZ0JBQW1CLE1BQWMsRUFBRSxNQUFjLEVBQVMsT0FBZ0I7UUFBdkQsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUF5QixZQUFPLEdBQVAsT0FBTyxDQUFTO1FBQ3hFLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUNqQyxDQUFDO0lBQ0QsdUJBQU0sR0FBTixVQUFPLEdBQVcsSUFBWSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25GLDBCQUFTLEdBQVQsVUFBVSxHQUFRO1FBQ2hCLElBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNWLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdkQsSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFO2dCQUNiLElBQUksR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUM1QjtTQUNGO1FBQ0QsSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFO1lBQ2QsT0FBTyxJQUFJLENBQUM7U0FDYjthQUFNO1lBQ0wsT0FBcUIsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDO1NBQzVEO0lBQ0gsQ0FBQztJQUNILGFBQUM7QUFBRCxDQUFDLEFBdkJELElBdUJDO0FBRUQ7SUFHRSxlQUFZLElBQVksRUFBRSxNQUFjLEVBQVMsT0FBZ0I7UUFBaEIsWUFBTyxHQUFQLE9BQU8sQ0FBUztRQUMvRCxJQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsR0FBVyxJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3JELElBQUksQ0FBQyxTQUFTLEdBQUcsVUFBVSxHQUFRO1lBQ2pDLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0QyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7Z0JBQ2IsT0FBTyxJQUFJLENBQUM7YUFDYjtpQkFBTTtnQkFDTCxJQUFJLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzdELE9BQXFCLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQzthQUM1RDtRQUNILENBQUMsQ0FBQTtJQUNILENBQUM7SUFDSCxZQUFDO0FBQUQsQ0FBQyxBQWZELElBZUM7QUFFRCxJQUFPLFFBQVEsQ0F5QmQ7QUF6QkQsV0FBTyxRQUFRO0lBQ0YsY0FBSyxHQUFZO1FBQzFCLE9BQU8sRUFBRSxVQUFVLEdBQUcsSUFBSSxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQy9DLFFBQVEsRUFBRSxVQUFVLEdBQUcsSUFBSSxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQy9DLE9BQU8sRUFBRSxVQUFVLEdBQUcsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDdkMsU0FBUyxFQUFFLEdBQUc7S0FDZixDQUFBO0lBQ1UscUJBQVksR0FBWTtRQUNqQyxPQUFPLEVBQUUsVUFBVSxHQUFHO1lBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ3JELE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQzthQUNwQjtpQkFBTTtnQkFDTCxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUM7YUFDcEI7UUFDSCxDQUFDO1FBQ0QsUUFBUSxFQUFFLFVBQVUsR0FBRyxJQUFJLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDaEQsT0FBTyxFQUFFLFVBQVUsR0FBRztZQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNyRCxPQUFPLEdBQUcsQ0FBQzthQUNaO2lCQUFNO2dCQUNMLE9BQU8sR0FBRyxDQUFDO2FBQ1o7UUFDSCxDQUFDO1FBQ0QsU0FBUyxFQUFFLEdBQUc7S0FDZixDQUFBO0FBQ0gsQ0FBQyxFQXpCTSxRQUFRLEtBQVIsUUFBUSxRQXlCZDtBQUdEO0lBQUE7UUFDVSxhQUFRLEdBQUcsQ0FBQyxDQUFDO0lBNEd2QixDQUFDO0lBMUdTLGlDQUFhLEdBQXJCLFVBQXNCLEdBQVEsRUFBRSxLQUFZO1FBQzFDLElBQUksT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDO1FBQ3hCLElBQUksWUFBWSxHQUF3QixJQUFJLENBQUM7UUFDN0MsS0FBSyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFO1lBQzFCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNDLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxHQUFHLE9BQU8sRUFBRTtnQkFDekMsWUFBWSxHQUFHLEtBQUssQ0FBQztnQkFDckIsT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7YUFDdEI7U0FDRjtRQUNELE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUM7SUFFTywyQkFBTyxHQUFmLFVBQWdCLEdBQVEsRUFBRSxLQUFZO1FBQ3BDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzNDLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtZQUNqQixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUM7U0FDbkI7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDSCxDQUFDO0lBRU8sNEJBQVEsR0FBaEIsVUFBaUIsR0FBUSxFQUFFLEtBQVksRUFBRSxLQUFhO1FBQ3BELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzNDLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtZQUNsQixPQUFPLEtBQUssQ0FBQyxVQUFVLENBQUM7U0FDekI7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3hDO0lBQ0gsQ0FBQztJQUVPLHlCQUFLLEdBQWIsVUFBYyxLQUFtQixFQUFFLEtBQVksRUFBRSxLQUFhO1FBQzVELElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDO1FBQ3RCLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEUsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsSUFBSSxVQUFVLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0YsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUM1QyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNyRSxJQUFJLGNBQWMsR0FBRyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6SSxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFTyxzQ0FBa0IsR0FBMUIsVUFBMkIsS0FBWSxFQUFFLEdBQVcsRUFBRSxNQUFjLEVBQUUsRUFBVSxFQUFFLEtBQVksRUFBRSxLQUFhO1FBQzNHLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNHLENBQUM7SUFFTyxtQ0FBZSxHQUF2QixVQUF3QixLQUFZLEVBQUUsR0FBVyxFQUFFLElBQVksRUFBRSxFQUFVLEVBQUUsS0FBWTtRQUF6RixpQkFvQkM7UUFuQkMsSUFBSSxRQUFRLEdBQUcsVUFBQyxHQUFVLEVBQUUsS0FBWTtZQUN0QyxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDeEMsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5QixJQUFJLFNBQVMsR0FBRyxLQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDaEUsSUFBSSxVQUFVLEdBQUcsQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2hGLElBQUksVUFBVSxFQUFFO2dCQUNkLE9BQU8sR0FBRyxDQUFDO2FBQ1o7aUJBQU07Z0JBQ0wsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3BDLElBQUksTUFBTSxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDO29CQUN4RCxDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztnQkFDdkIsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLE1BQU0sR0FBRyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUM7b0JBQ2pHLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDO2dCQUN2QixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsRUFDL0UsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDdEQ7UUFDSCxDQUFDLENBQUE7UUFDRCxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELDBCQUFNLEdBQU4sVUFBTyxLQUFZLEVBQUUsR0FBNkIsRUFBRSxXQUFtQixFQUFFLFlBQW9CO1FBQzNGLElBQUksUUFBUSxHQUFHLFVBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxNQUFjO1lBQ2xELElBQUksU0FBUyxHQUFHLFVBQUMsQ0FBUyxJQUFLLE9BQUEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsV0FBVyxFQUE3QyxDQUE2QyxDQUFDO1lBQzdFLElBQUksU0FBUyxHQUFHLFVBQUMsQ0FBUyxJQUFLLE9BQUEsQ0FBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxZQUFZLEVBQWpELENBQWlELENBQUM7WUFDakYsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEosQ0FBQyxDQUFBO1FBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNyQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNwQyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BHLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3BDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO2dCQUNyRixHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDbEM7U0FDRjtJQUNILENBQUM7SUFFRCxpQ0FBYSxHQUFiLFVBQWMsS0FBWSxFQUFFLEtBQWdCO1FBQzFDLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7UUFDMUIsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztRQUV4QixJQUFJLFFBQVEsR0FBRyxVQUFVLENBQVMsRUFBRSxDQUFTLEVBQUUsTUFBYztZQUMzRCxJQUFJLFNBQVMsR0FBRyxVQUFVLENBQVMsSUFBSSxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRixJQUFJLFNBQVMsR0FBRyxVQUFVLENBQVMsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hKLENBQUMsQ0FBQztRQUNGLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDOUIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNwRyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNwQyx3RkFBd0Y7Z0JBQ3hGLG9DQUFvQztnQkFDcEMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQzthQUNyRDtTQUNGO0lBQ0gsQ0FBQztJQUNILGdCQUFDO0FBQUQsQ0FBQyxBQTdHRCxJQTZHQztBQUdELFNBQVMsWUFBWTtJQUNuQixPQUFPO1FBQ0wsTUFBTSxFQUFFO1lBQ04sSUFBSSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsUUFBUSxDQUFDLFlBQVksQ0FBQztZQUNoRSxJQUFJLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFDNUQsSUFBSSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDO1NBQzVEO1FBQ0QsTUFBTSxFQUFFO1lBQ04sRUFBRSxHQUFHLEVBQUUsSUFBSSxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ3ZFLEVBQUUsR0FBRyxFQUFFLElBQUksTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDdEUsRUFBRSxHQUFHLEVBQUUsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFO1lBQ3hFLEVBQUUsR0FBRyxFQUFFLElBQUksTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUU7U0FDdkU7UUFDRCxNQUFNLEVBQUUsSUFBSSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxJQUFJLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDMUUsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLE1BQU07SUFDYixPQUFPO1FBQ0wsTUFBTSxFQUFFO1lBQ04sSUFBSSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsUUFBUSxDQUFDLFlBQVksQ0FBQztZQUNoRSxJQUFJLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFDNUQsSUFBSSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDO1lBQzNELElBQUksTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsWUFBWSxDQUFDO1NBQ3JFO1FBQ0QsTUFBTSxFQUFFO1lBQ04sRUFBRSxHQUFHLEVBQUUsSUFBSSxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ3ZFLEVBQUUsR0FBRyxFQUFFLElBQUksTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDdEUsRUFBRSxHQUFHLEVBQUUsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFO1lBQ3hFLEVBQUUsR0FBRyxFQUFFLElBQUksTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUU7U0FDdkU7UUFDRCxNQUFNLEVBQUUsSUFBSSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxJQUFJLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDMUUsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLFVBQVU7SUFDakIsT0FBTztRQUNMLE1BQU0sRUFBRSxFQUFFO1FBQ1YsTUFBTSxFQUFFLEVBQUU7UUFDVixNQUFNLEVBQUUsSUFBSSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxJQUFJLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDMUUsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLFVBQVU7SUFDakIsT0FBTyxnckJBZ0JOLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDWCxDQUFDO0FBRUQsOEJBQThCO0FBQzlCLFNBQVMsZUFBZSxDQUFDLFFBQWdCO0lBQ3ZDLElBQU0sTUFBTSxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7SUFDL0IsSUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUNoRSxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN4QixJQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsb0JBQW9CLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDaEUsSUFBSSxlQUFlLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtRQUMvQixNQUFNLElBQUksV0FBVyxFQUFFLENBQUM7S0FDekI7SUFFRCxJQUFNLE9BQU8sR0FBWSxFQUFFLENBQUM7SUFDNUIsSUFBTSxNQUFNLEdBQVksRUFBRSxDQUFDO0lBQzNCLElBQUksTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsSUFBSSxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFL0UsU0FBUztJQUNULElBQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RCwwQkFBMEI7SUFDMUIsU0FBUztJQUNULElBQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvRCxJQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakUsSUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQy9ELFNBQVM7SUFDVCxJQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDN0QsSUFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQy9ELElBQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQzs0QkFJbkQsQ0FBQztRQUNSLElBQU0sa0JBQWtCLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELElBQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBakIsQ0FBaUIsQ0FBQyxFQUFFO1lBQ3BELElBQU0sTUFBTSxHQUFXLENBQUMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0MsSUFBTSxTQUFTLEdBQVcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNuRCxJQUFNLFVBQVUsR0FBVyxDQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXJELElBQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQWIsQ0FBYSxDQUFDLENBQUM7WUFDdEUsSUFBTSxHQUFHLEdBQUcsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRCxJQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckMsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQztZQUNwQyxJQUFJLFVBQVUsS0FBSyxPQUFPLEVBQUU7Z0JBQzFCLE9BQU8sR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO2FBQzFCO1lBRUQsNEJBQTRCO1lBQzVCLG9DQUFvQztZQUNwQyxrQ0FBa0M7WUFDbEMsb0NBQW9DO1lBRXBDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1NBQy9DO0lBQ0gsQ0FBQztJQXhCRCxrQ0FBa0M7SUFFbEMsS0FBYyxVQUFlLEVBQWYsS0FBSyxVQUFVLEVBQWYsY0FBZSxFQUFmLElBQWU7UUFBeEIsSUFBSSxDQUFDLFNBQUE7Z0JBQUQsQ0FBQztLQXNCVDs0QkFFUSxDQUFDO1FBQ1IsSUFBTSxrQkFBa0IsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDdEQsSUFBSSxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFqQixDQUFpQixDQUFDLEVBQUU7WUFDcEQsSUFBTSxNQUFNLEdBQVcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QyxJQUFNLE9BQU8sR0FBVyxDQUFDLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQy9DLElBQU0sVUFBVSxHQUFXLENBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sUUFBQSxFQUFFLE9BQU8sU0FBQSxFQUFFLFVBQVUsWUFBQSxFQUFFLENBQUMsQ0FBQztZQUM3QyxJQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFiLENBQWEsQ0FBQyxDQUFDO1lBQ3RFLElBQU0sR0FBRyxHQUFHLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0QsSUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2pDLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUM7WUFDcEMsSUFBSSxVQUFVLEtBQUssT0FBTyxFQUFFO2dCQUMxQixPQUFPLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQzthQUMxQjtZQUVELDRCQUE0QjtZQUM1QixvQ0FBb0M7WUFDcEMsOEJBQThCO1lBQzlCLG9DQUFvQztZQUVwQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUM5QztJQUNILENBQUM7SUF0QkQsS0FBYyxVQUFnQixFQUFoQixLQUFLLFdBQVcsRUFBaEIsY0FBZ0IsRUFBaEIsSUFBZ0I7UUFBekIsSUFBSSxDQUFDLFNBQUE7Z0JBQUQsQ0FBQztLQXNCVDs0QkFHUSxDQUFDO1FBQ1IsSUFBTSxrQkFBa0IsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM1QyxJQUFJLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQWpCLENBQWlCLENBQUMsRUFBRTtZQUNwRCxJQUFNLE1BQU0sR0FBVyxDQUFDLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzdDLElBQU0sUUFBUSxHQUFXLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDakQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sUUFBQSxFQUFFLFFBQVEsVUFBQSxFQUFFLENBQUMsQ0FBQztZQUNsQyxJQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFiLENBQWEsQ0FBQyxDQUFDO1lBQ3RFLElBQU0sR0FBRyxHQUFHLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0QsSUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBYixDQUFhLENBQUMsQ0FBQztZQUV0RSw0QkFBNEI7WUFDNUIsb0NBQW9DO1lBQ3BDLGdDQUFnQztZQUVoQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDM0U7SUFDSCxDQUFDO0lBaEJELEtBQWMsVUFBZSxFQUFmLEtBQUssVUFBVSxFQUFmLGNBQWUsRUFBZixJQUFlO1FBQXhCLElBQUksQ0FBQyxTQUFBO2dCQUFELENBQUM7S0FnQlQ7SUFFRCxDQUFDLFNBQVMsVUFBVSxDQUFDLFVBQW1CO1FBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDeEIsSUFBTSxrQkFBa0IsR0FBRyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM3QyxJQUFJLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQTFCLENBQTBCLENBQUMsRUFBRTtZQUM3RCxJQUFNLE1BQU0sR0FBVyxVQUFVLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RELElBQU0sU0FBUyxHQUFXLFVBQVUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDNUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sUUFBQSxFQUFFLFNBQVMsV0FBQSxFQUFFLENBQUMsQ0FBQztZQUNuQyxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFiLENBQWEsQ0FBQyxDQUFDO1lBQ3BFLElBQU0sR0FBRyxHQUFHLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0QsT0FBTyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQWIsQ0FBYSxDQUFDLENBQUM7WUFDbkUsSUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU5RCwrQkFBK0I7WUFFL0IsTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUNsQztJQUNILENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBRWYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNyQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXBCLElBQU0sS0FBSyxHQUFVO1FBQ25CLE1BQU0sRUFBRSxPQUFPO1FBQ2YsTUFBTSxFQUFFLE1BQU07UUFDZCxNQUFNLFFBQUE7S0FDUCxDQUFDO0lBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN0QyxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFJRCx1RkFBdUY7QUFDdkYsNERBQTREO0FBQzVELFNBQVMsSUFBSTtJQUNYLElBQU0sSUFBSSxHQUFzQixRQUFRLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3RFLElBQU0sYUFBYSxHQUFzQixRQUFRLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzlFLElBQU0sVUFBVSxHQUF3QixRQUFRLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzdFLElBQU0sV0FBVyxHQUFzQixRQUFRLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzFFLElBQU0sT0FBTyxHQUFxQixRQUFRLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3pFLElBQU0sU0FBUyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7SUFFbEMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQyxJQUFJLFFBQVEsSUFBSSxJQUFJLEVBQUU7UUFBRSxPQUFPO0tBQUU7SUFFakMsSUFBSSxHQUFHLEdBQTZCLFFBQVEsQ0FBQztJQUM3QyxJQUFJLElBQVksQ0FBQztJQUNqQixJQUFJLEdBQWMsQ0FBQztJQUNuQixJQUFJLEtBQUssR0FBVSxZQUFZLEVBQUUsQ0FBQztJQUVsQyxRQUFRO0lBQ1IsdURBQXVEO0lBQ3ZELElBQUk7SUFDSixrQkFBa0I7SUFDbEIsK0RBQStEO0lBQy9ELElBQUk7SUFFSixVQUFVLENBQUMsS0FBSyxHQUFHLFVBQVUsRUFBRSxDQUFDO0lBRWhDLElBQUksYUFBYSxHQUFHO1FBQ2xCLElBQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNoQyxTQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNwQyxJQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDOUIsaUJBQWlCLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDO0lBQ2pDLENBQUMsQ0FBQztJQUVGLElBQUksaUJBQWlCLEdBQUcsVUFBQyxDQUFTO1FBQ2hDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsWUFBWSxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxHQUFHLENBQUM7UUFFOUUsQ0FBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxZQUFZLENBQUM7YUFDeEQsT0FBTyxDQUFDLFVBQUEsU0FBUyxJQUFNLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFbEUsSUFBSSxDQUFDLEdBQUcsSUFBSSxFQUFFO1lBQ1osT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDckM7YUFBTSxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUU7WUFDbEIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDdEM7YUFBTTtZQUNMLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1NBQ3RDO0lBQ0gsQ0FBQyxDQUFDO0lBRUYsSUFBTSxZQUFZLEdBQUcsY0FBTSxPQUFBLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFwQyxDQUFvQyxDQUFDO0lBQ2hFLElBQU0sY0FBYyxHQUFHLGNBQU0sT0FBQSxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsR0FBRyxJQUFJLEVBQW5FLENBQW1FLENBQUM7SUFFakcsSUFBSSxnQkFBZ0IsR0FBRztRQUNyQixJQUFJLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQyxHQUFHLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDeEMsQ0FBQyxDQUFDO0lBRUYsSUFBSSxpQkFBaUIsR0FBRztRQUN0QixpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO2FBQ3JDLElBQUksQ0FBQyxVQUFBLEdBQUcsSUFBSSxPQUFBLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQWpELENBQWlELENBQUMsQ0FBQztJQUNwRSxDQUFDLENBQUE7SUFFRCw2Q0FBNkM7SUFDN0MsVUFBVTtJQUNWLGtEQUFrRDtJQUNsRCwwQkFBMEI7SUFDMUIsb0JBQW9CO0lBQ3BCLE1BQU07SUFDTixvQkFBb0I7SUFDcEIsbURBQW1EO0lBQ25ELHlDQUF5QztJQUN6QyxrRUFBa0U7SUFDbEUseUVBQXlFO0lBRXpFLDJDQUEyQztJQUMzQyw0Q0FBNEM7SUFFNUMsMkJBQTJCO0lBQzNCLE1BQU07SUFFTiw4QkFBOEI7SUFDOUIsSUFBSTtJQUVKLElBQUksb0JBQW9CLEdBQUc7UUFDekIsSUFBSTtZQUNGLEtBQUssR0FBRyxlQUFlLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzNDO1FBQ0QsT0FBTyxLQUFLLEVBQUU7WUFDWixPQUFPLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9DLGtDQUFrQztZQUNsQyxDQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLFlBQVksQ0FBQztpQkFDeEQsT0FBTyxDQUFDLFVBQUEsU0FBUyxJQUFNLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFbEUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDcEMsT0FBTyxDQUFDLFdBQVcsR0FBRyxhQUFhLENBQUM7WUFFcEMsS0FBSyxHQUFHLFVBQVUsRUFBRSxDQUFDO1NBQ3RCO0lBQ0gsQ0FBQyxDQUFDO0lBRUYsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRTtRQUNoQyxZQUFZLEVBQUUsQ0FBQztRQUNmLGNBQWMsRUFBRSxDQUFDO1FBQ2pCLGlCQUFpQixFQUFFLENBQUM7SUFDdEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxXQUFXLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFO1FBQ3JDLGdCQUFnQixFQUFFLENBQUM7UUFDbkIsYUFBYSxFQUFFLENBQUM7UUFDaEIsaUJBQWlCLEVBQUUsQ0FBQztJQUN0QixDQUFDLENBQUMsQ0FBQztJQUVILGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUU7UUFDdkMsS0FBSyxHQUFHLENBQUMsVUFBVSxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUM1RSxhQUFhLEVBQUUsQ0FBQztRQUNoQixpQkFBaUIsRUFBRSxDQUFDO0lBQ3RCLENBQUMsQ0FBQyxDQUFDO0lBRUgsK0NBQStDO0lBRS9DLE1BQU07SUFFTixPQUFPLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFO1FBQ2hDLElBQUksYUFBYSxDQUFDLEtBQUssSUFBSSxHQUFHLEVBQUU7WUFDOUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUM3QixPQUFPO1NBQ1I7UUFDRCxvQkFBb0IsRUFBRSxDQUFDO1FBQ3ZCLGFBQWEsRUFBRSxDQUFDO1FBQ2hCLGlCQUFpQixFQUFFLENBQUM7SUFDdEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxnQkFBZ0IsRUFBRSxDQUFDO0lBQ25CLGFBQWEsRUFBRSxDQUFDO0lBQ2hCLFlBQVksRUFBRSxDQUFDO0lBQ2YsY0FBYyxFQUFFLENBQUM7SUFDakIsaUJBQWlCLEVBQUUsQ0FBQztBQUd0QixDQUFDO0FBRUQsSUFBSSxFQUFFLENBQUMifQ==