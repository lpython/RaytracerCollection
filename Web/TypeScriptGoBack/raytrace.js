"use strict";
class Vector {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    static times(k, v) { return new Vector(k * v.x, k * v.y, k * v.z); }
    static minus(v1, v2) { return new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z); }
    static plus(v1, v2) { return new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z); }
    static dot(v1, v2) { return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z; }
    static mag(v) { return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z); }
    static norm(v) {
        var mag = Vector.mag(v);
        var div = (mag === 0) ? Infinity : 1.0 / mag;
        return Vector.times(div, v);
    }
    static cross(v1, v2) {
        return new Vector(v1.y * v2.z - v1.z * v2.y, v1.z * v2.x - v1.x * v2.z, v1.x * v2.y - v1.y * v2.x);
    }
}
class Color {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    static scale(k, v) { return new Color(k * v.r, k * v.g, k * v.b); }
    static plus(v1, v2) { return new Color(v1.r + v2.r, v1.g + v2.g, v1.b + v2.b); }
    static times(v1, v2) { return new Color(v1.r * v2.r, v1.g * v2.g, v1.b * v2.b); }
    static toDrawingColor(c) {
        var legalize = (d) => d > 1 ? 1 : d;
        return {
            r: Math.floor(legalize(c.r) * 255),
            g: Math.floor(legalize(c.g) * 255),
            b: Math.floor(legalize(c.b) * 255)
        };
    }
}
Color.white = new Color(1.0, 1.0, 1.0);
Color.grey = new Color(0.5, 0.5, 0.5);
Color.black = new Color(0.0, 0.0, 0.0);
Color.background = Color.black;
Color.defaultColor = Color.black;
class Camera {
    constructor(pos, lookAt) {
        this.pos = pos;
        var down = new Vector(0.0, -1.0, 0.0);
        this.forward = Vector.norm(Vector.minus(lookAt, this.pos));
        this.right = Vector.times(1.5, Vector.norm(Vector.cross(this.forward, down)));
        this.up = Vector.times(1.5, Vector.norm(Vector.cross(this.forward, this.right)));
    }
}
class Sphere {
    constructor(center, radius, surface) {
        this.center = center;
        this.surface = surface;
        this.radius2 = radius * radius;
    }
    normal(pos) { return Vector.norm(Vector.minus(pos, this.center)); }
    intersect(ray) {
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
    }
}
class Plane {
    constructor(norm, offset, surface) {
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
}
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
class RayTracer {
    constructor() {
        this.maxDepth = 5;
    }
    intersections(ray, scene) {
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
    }
    testRay(ray, scene) {
        var isect = this.intersections(ray, scene);
        if (isect != null) {
            return isect.dist;
        }
        else {
            return null;
        }
    }
    traceRay(ray, scene, depth) {
        var isect = this.intersections(ray, scene);
        if (isect === null) {
            return Color.background;
        }
        else {
            return this.shade(isect, scene, depth);
        }
    }
    shade(isect, scene, depth) {
        var d = isect.ray.dir;
        var pos = Vector.plus(Vector.times(isect.dist, d), isect.ray.start);
        var normal = isect.thing.normal(pos);
        var reflectDir = Vector.minus(d, Vector.times(2, Vector.times(Vector.dot(normal, d), normal)));
        var naturalColor = Color.plus(Color.background, this.getNaturalColor(isect.thing, pos, normal, reflectDir, scene));
        var reflectedColor = (depth >= this.maxDepth) ? Color.grey : this.getReflectionColor(isect.thing, pos, normal, reflectDir, scene, depth);
        return Color.plus(naturalColor, reflectedColor);
    }
    getReflectionColor(thing, pos, normal, rd, scene, depth) {
        return Color.scale(thing.surface.reflect(pos), this.traceRay({ start: pos, dir: rd }, scene, depth + 1));
    }
    getNaturalColor(thing, pos, norm, rd, scene) {
        var addLight = (col, light) => {
            var ldis = Vector.minus(light.pos, pos);
            var livec = Vector.norm(ldis);
            var neatIsect = this.testRay({ start: pos, dir: livec }, scene);
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
    }
    render(scene, ctx, screenWidth, screenHeight) {
        var getPoint = (x, y, camera) => {
            var recenterX = (x) => (x - (screenWidth / 2.0)) / 2.0 / screenWidth;
            var recenterY = (y) => -(y - (screenHeight / 2.0)) / 2.0 / screenHeight;
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
    }
    renderToImage(scene, image) {
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
    }
}
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
    return `
<scene>
  <camera pos="3.0, 2.0, 4.0" lookAt="-1.0, 0.5, 0.0" />
  <objects>
    <plane pos="0.0,1.0,0.0" offset="0.0" surface="checkerboard" />
    <sphere pos="0.0,1.0,-0.25" size="1.0" surface="shiny"/>
    <sphere pos="-1.0,0.5,1.5" size="0.5" surface="shiny"/>
    <sphere pos="-5.5,2.0,-3.5" size="1.25" surface="checkerboard"/>
  </objects>
  <lights>
    <light pos="-2.0, 2.5, 0.0" color="0.49, 0.07, 0.07" /> 
    <light pos="1.5, 2.5, 1.5" color="0.07, 0.07, 0.49" /> 
    <light pos="1.5, 2.5, -1.5" color="0.07, 0.49, 0.071" /> 
    <light pos="0.0, 3.5, 0.0" color="0.21, 0.21, 0.35" /> 
  </lights>
</scene>
  `.trim();
}
// Throws error on invalid xml
function ParseXMLToScene(xmlInput) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlInput, 'application/xml');
    console.log('xml', xml);
    const parserErrorNode = xml.getElementsByTagName('parsererror');
    if (parserErrorNode.length != 0) {
        throw new SyntaxError();
    }
    const objects = [];
    const lights = [];
    let camera = new Camera(new Vector(3.0, 2.0, 4.0), new Vector(-1.0, 0.5, 0.0));
    //Level 1
    const sceneNode = xml.getElementsByTagName('scene')[0];
    // console.log(sceneNode);
    //Level 2
    const cameraNode = sceneNode.getElementsByTagName('camera')[0];
    const objectsNode = sceneNode.getElementsByTagName('objects')[0];
    const lightsNode = sceneNode.getElementsByTagName('lights')[0];
    //Level 3
    const planeNodes = objectsNode.getElementsByTagName('plane');
    const sphereNodes = objectsNode.getElementsByTagName('sphere');
    const lightNodes = lightsNode.getElementsByTagName('light');
    // xml nodes to typescript objects
    for (let p of planeNodes) {
        const requiredAttributes = ['pos', 'offset', 'surface'];
        if (requiredAttributes.every(a => p.hasAttribute(a))) {
            const posAtt = p.getAttribute('pos');
            const offsetAtt = p.getAttribute('offset');
            const surfaceAtt = p.getAttribute('surface');
            const numbers = posAtt.split(',').slice(0, 3).map(s => parseFloat(s));
            const vec = new Vector(numbers[0], numbers[1], numbers[2]);
            const offset = parseFloat(offsetAtt);
            let surface = Surfaces.checkerboard;
            if (surfaceAtt === 'shiny') {
                surface = Surfaces.shiny;
            }
            // console.log('vec:', vec);
            // console.log('numbers:', numbers);
            // console.log('offset:', offset);
            // console.log('surface:', surface);
            objects.push(new Plane(vec, offset, surface));
        }
    }
    for (let s of sphereNodes) {
        const requiredAttributes = ['pos', 'size', 'surface'];
        if (requiredAttributes.every(a => s.hasAttribute(a))) {
            const posAtt = s.getAttribute('pos');
            const sizeAtt = s.getAttribute('size');
            const surfaceAtt = s.getAttribute('surface');
            console.log({ posAtt, sizeAtt, surfaceAtt });
            const numbers = posAtt.split(',').slice(0, 3).map(s => parseFloat(s));
            const vec = new Vector(numbers[0], numbers[1], numbers[2]);
            const size = parseFloat(sizeAtt);
            let surface = Surfaces.checkerboard;
            if (surfaceAtt === 'shiny') {
                surface = Surfaces.shiny;
            }
            // console.log('vec:', vec);
            // console.log('numbers:', numbers);
            // console.log('size:', size);
            // console.log('surface:', surface);
            objects.push(new Sphere(vec, size, surface));
        }
    }
    for (let l of lightNodes) {
        const requiredAttributes = ['pos', 'color'];
        if (requiredAttributes.every(a => l.hasAttribute(a))) {
            const posAtt = l.getAttribute('pos');
            const colorAtt = l.getAttribute('color');
            console.log({ posAtt, colorAtt });
            const numbers = posAtt.split(',').slice(0, 3).map(s => parseFloat(s));
            const vec = new Vector(numbers[0], numbers[1], numbers[2]);
            const color = colorAtt.split(',').slice(0, 3).map(s => parseFloat(s));
            // console.log('vec:', vec);
            // console.log('numbers:', numbers);
            // console.log('color:', color);
            lights.push({ pos: vec, color: new Color(color[0], color[1], color[2]) });
        }
    }
    (function parseLight(cameraNode) {
        console.log(cameraNode);
        const requiredAttributes = ['pos', 'lookAt'];
        if (requiredAttributes.every(a => cameraNode.hasAttribute(a))) {
            const posAtt = cameraNode.getAttribute('pos');
            const lookAtAtt = cameraNode.getAttribute('lookAt');
            console.log({ posAtt, lookAtAtt });
            let numbers = posAtt.split(',').slice(0, 3).map(s => parseFloat(s));
            const pos = new Vector(numbers[0], numbers[1], numbers[2]);
            numbers = lookAtAtt.split(',').slice(0, 3).map(s => parseFloat(s));
            const lookAt = new Vector(numbers[0], numbers[1], numbers[2]);
            // console.log({ pos, lookAt })
            camera = new Camera(pos, lookAt);
        }
    })(cameraNode);
    console.log(objects);
    console.log(lights);
    const scene = {
        things: objects,
        lights: lights,
        camera
    };
    console.log('parsed scene : ', scene);
    return scene;
}
// Static data for UI
//Scene input was attempt to provide textarea with live raytrace updates on user input.
//Due to Types lost on compile, alternative solution needed.
function onLoad() {
    const canv = document.querySelector("#ray-canvas");
    const sceneInput = document.querySelector('#ray-input');
    const sceneSelector = document.querySelector('#ray-scene');
    const resSelector = document.querySelector('#ray-res');
    const processorSelector = document.querySelector('#ray-processor');
    const elapsedButton = document.querySelector('#ray-elapsed');
    const renderButton = document.querySelector('#ray-render');
    const rayTracer = new RayTracer();
    let ctxMaybe = canv.getContext("2d");
    if (ctxMaybe == null) {
        return;
    }
    let ctx = ctxMaybe;
    // UI varibles, change due to user events
    let size;
    let img;
    let scene = defaultScene();
    sceneInput.value = DefaultXML();
    let renewRaytrace = () => {
        const start = performance.now();
        rayTracer.renderToImage(scene, img);
        const end = performance.now();
        outputElapsedTime(end - start);
    };
    let outputElapsedTime = (n) => {
        elapsedButton.textContent = 'Elapsed : ' + (n / 1000.0).toFixed(2).toString() + 's';
        ['btn-primary', 'btn-success', 'btn-warning', 'btn-danger']
            .forEach(className => { elapsedButton.classList.remove(className); });
        if (n > 2000) {
            elapsedButton.classList.add('btn-danger');
        }
        else if (n > 500) {
            elapsedButton.classList.add('btn-warning');
        }
        else {
            elapsedButton.classList.add('btn-success');
        }
    };
    const resizeCanvas = () => ctx.canvas.height = ctx.canvas.width;
    const resizeTextarea = () => sceneInput.style.height = ctx.canvas.clientHeight.toString() + 'px';
    let changeRenderSize = () => {
        size = parseInt(resSelector.value);
        img = ctx.createImageData(size, size);
    };
    let outputRenderImage = () => {
        createImageBitmap(img, 0, 0, size, size)
            .then(img => ctx.drawImage(img, 0, 0, canv.width, canv.height));
    };
    let sceneXMLFromTextarea = () => {
        try {
            scene = ParseXMLToScene(sceneInput.value);
        }
        catch (error) {
            console.error('sceneXMLFromTextarea()', error);
            //TODO refactor clearing of button
            ['btn-primary', 'btn-success', 'btn-warning', 'btn-danger']
                .forEach(className => { elapsedButton.classList.remove(className); });
            elapsedButton.classList.add('btn-danger');
            elapsedButton.textContent = 'Invalid XML';
            scene = emptyScene();
        }
    };
    window.addEventListener('resize', () => {
        resizeCanvas();
        resizeTextarea();
        outputRenderImage();
    });
    sceneSelector.addEventListener('change', () => {
        scene = [emptyScene, defaultScene, scene2][parseInt(sceneSelector.value)]();
        renewRaytrace();
        outputRenderImage();
    });
    resSelector.addEventListener('change', () => {
        changeRenderSize();
        renewRaytrace();
        outputRenderImage();
    });
    processorSelector.addEventListener('change', () => {
        processorSelector.value;
    });
    // TODO Bootstrap pop up noticies
    // TODO webworker
    renderButton.addEventListener('click', () => {
        let processor = processors[processorSelector.value];
        if (processor) {
            processor();
        }
        else {
            console.log('Invalid processor select value.');
        }
    });
    changeRenderSize();
    renewRaytrace();
    resizeCanvas();
    resizeTextarea();
    outputRenderImage();
    const processors = {
        'golang-back': () => {
            let xml = sceneInput.value;
            fetch("http://localhost:5600/gen_xml.png?" + "xml-scene=" + encodeURI(xml), {
                "headers": {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                    "accept-language": "en-US,en;q=0.9",
                },
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": null,
                "method": "GET",
                "mode": "cors"
            })
                .then(res => res.blob())
                .then(blob => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            })
                .then(v => {
                let i = document.createElement('img');
                i.src = v;
                console.log(i.src);
                document.body.appendChild(i);
            })
                .catch(err => {
                console.log({ err });
            });
        },
        'typescript-front': () => {
            // Front
            sceneXMLFromTextarea();
            renewRaytrace();
            outputRenderImage();
        }
    };
}
window.addEventListener('load', onLoad);
const gobackPostString = `
res=512&xml-scene=%3Cscene%3E%0D%0A++%3Ccamera+pos%3D%223.0%2C+2.0%2C+4.0%22+lookAt%3D%22-1.0%2C+0.5%2C+0.0%22+%2F%3E%0D%0A++%3Cobjects%3E%0D%0A++++%3Cplane+normal%3D%220.0%2C1.0%2C0.0%22+offset%3D%220.0%22+surface%3D%22checkerboard%22+%2F%3E%0D%0A++++%3Csphere+pos%3D%220.0%2C1.0%2C-0.25%22+size%3D%221.0%22+surface%3D%22shiny%22%2F%3E%0D%0A++++%3Csphere+pos%3D%22-1.0%2C0.5%2C1.5%22+size%3D%220.5%22+surface%3D%22shiny%22%2F%3E%0D%0A++++%3Csphere+pos%3D%22-5.5%2C2.0%2C-3.5%22+size%3D%221.25%22+surface%3D%22checkerboard%22%2F%3E%0D%0A++%3C%2Fobjects%3E%0D%0A++%3Clights%3E%0D%0A++++%3Clight+pos%3D%22-2.0%2C+2.5%2C+0.0%22+color%3D%220.49%2C+0.07%2C+0.07%22+%2F%3E+%0D%0A++++%3Clight+pos%3D%221.5%2C+2.5%2C+1.5%22+color%3D%220.07%2C+0.07%2C+0.49%22+%2F%3E+%0D%0A++++%3Clight+pos%3D%221.5%2C+2.5%2C+-1.5%22+color%3D%220.07%2C+0.49%2C+0.071%22+%2F%3E+%0D%0A++++%3Clight+pos%3D%220.0%2C+3.5%2C+0.0%22+color%3D%220.21%2C+0.21%2C+0.35%22+%2F%3E+%0D%0A++%3C%2Flights%3E%0D%0A%3C%2Fscene%3E
`.trim();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF5dHJhY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyYXl0cmFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsTUFBTSxNQUFNO0lBQ1YsWUFBbUIsQ0FBUyxFQUNuQixDQUFTLEVBQ1QsQ0FBUztRQUZDLE1BQUMsR0FBRCxDQUFDLENBQVE7UUFDbkIsTUFBQyxHQUFELENBQUMsQ0FBUTtRQUNULE1BQUMsR0FBRCxDQUFDLENBQVE7SUFDbEIsQ0FBQztJQUNELE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBUyxFQUFFLENBQVMsSUFBSSxPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BGLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBVSxFQUFFLEVBQVUsSUFBSSxPQUFPLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xHLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBVSxFQUFFLEVBQVUsSUFBSSxPQUFPLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pHLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBVSxFQUFFLEVBQVUsSUFBSSxPQUFPLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FB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TSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hKLENBQUMsQ0FBQTtRQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDckMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDcEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNwRyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNwQyxHQUFHLENBQUMsU0FBUyxHQUFHLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztnQkFDckYsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ2xDO1NB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QUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsUUFBUSxDQUFDLFlBQVksQ0FBQztZQUNoRSxJQUFJLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFDNUQsSUFBSSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDO1NBQzVEO1FBQ0QsTUFBTSxFQUFFO1lBQ04sRUFBRSxHQUFHLEVBQUUsSUFBSSxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ3ZFLEVBQUUsR0FBRyxFQUFFLElBQUksTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDdEUsRUFBRSxHQUFHLEVBQUUsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFO1lBQ3hFLEVBQUUsR0FBRyxFQUFFLElBQUksTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUU7U0FDdkU7UUFDRCxNQUFNLEVBQUUsSUFBSSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxJQUFJLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDMUUsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLE1BQU07SUFDYixPQUFPO1FBQ0wsTUFBTSxFQUFFO1lBQ04sSUFBSSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsUUFBUSxDQUFDLFlBQVksQ0FBQztZQUNoRSxJQUFJLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFDNUQsSUFBSSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDO1lBQzNELElBQUksTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsWUFBWSxDQUFDO1NBQ3JFO1FBQ0QsTUFBTSxFQUFFO1lBQ04sRUFBRSxHQUFHLEVBQUUsSUFBSSxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ3ZFLEVBQUUsR0FBRyxFQUFFLElBQUksTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDdEUsRUFBRSxHQUFHLEVBQUUsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdB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