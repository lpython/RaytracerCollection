
class Vector {
  constructor(public x: number,
    public y: number,
    public z: number) {
  }
  static times(k: number, v: Vector) { return new Vector(k * v.x, k * v.y, k * v.z); }
  static minus(v1: Vector, v2: Vector) { return new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z); }
  static plus(v1: Vector, v2: Vector) { return new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z); }
  static dot(v1: Vector, v2: Vector) { return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z; }
  static mag(v: Vector) { return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z); }
  static norm(v: Vector) {
    var mag = Vector.mag(v);
    var div = (mag === 0) ? Infinity : 1.0 / mag;
    return Vector.times(div, v);
  }
  static cross(v1: Vector, v2: Vector) {
    return new Vector(v1.y * v2.z - v1.z * v2.y,
      v1.z * v2.x - v1.x * v2.z,
      v1.x * v2.y - v1.y * v2.x);
  }
}

class Color {
  constructor(public r: number,
    public g: number,
    public b: number) {
  }
  static scale(k: number, v: Color) { return new Color(k * v.r, k * v.g, k * v.b); }
  static plus(v1: Color, v2: Color) { return new Color(v1.r + v2.r, v1.g + v2.g, v1.b + v2.b); }
  static times(v1: Color, v2: Color) { return new Color(v1.r * v2.r, v1.g * v2.g, v1.b * v2.b); }
  static white = new Color(1.0, 1.0, 1.0);
  static grey = new Color(0.5, 0.5, 0.5);
  static black = new Color(0.0, 0.0, 0.0);
  static background = Color.black;
  static defaultColor = Color.black;
  static toDrawingColor(c: Color) {
    var legalize = (d: number) => d > 1 ? 1 : d;
    return {
      r: Math.floor(legalize(c.r) * 255),
      g: Math.floor(legalize(c.g) * 255),
      b: Math.floor(legalize(c.b) * 255)
    }
  }
}

class Camera {
  public forward: Vector;
  public right: Vector;
  public up: Vector;

  constructor(public pos: Vector, lookAt: Vector) {
    var down = new Vector(0.0, -1.0, 0.0);
    this.forward = Vector.norm(Vector.minus(lookAt, this.pos));
    this.right = Vector.times(1.5, Vector.norm(Vector.cross(this.forward, down)));
    this.up = Vector.times(1.5, Vector.norm(Vector.cross(this.forward, this.right)));
  }
}

interface Ray {
  start: Vector;
  dir: Vector;
}

interface Intersection {
  thing: Thing;
  ray: Ray;
  dist: number;
}

interface Surface {
  diffuse: (pos: Vector) => Color;
  specular: (pos: Vector) => Color;
  reflect: (pos: Vector) => number;
  roughness: number;
}

interface Thing {
  intersect: (ray: Ray) => Intersection | null;
  normal: (pos: Vector) => Vector;
  surface: Surface;
}

interface Light {
  pos: Vector;
  color: Color;
}

interface Scene {
  things: Thing[];
  lights: Light[];
  camera: Camera;
}

class Sphere implements Thing {
  public radius2: number;

  constructor(public center: Vector, radius: number, public surface: Surface) {
    this.radius2 = radius * radius;
  }
  normal(pos: Vector): Vector { return Vector.norm(Vector.minus(pos, this.center)); }
  intersect(ray: Ray): Intersection | null {
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
    } else {
      return <Intersection>{ thing: this, ray: ray, dist: dist };
    }
  }
}

class Plane implements Thing {
  public normal: (pos: Vector) => Vector;
  public intersect: (ray: Ray) => Intersection | null;
  constructor(norm: Vector, offset: number, public surface: Surface) {
    this.normal = function (pos: Vector) { return norm; }
    this.intersect = function (ray: Ray): Intersection | null {
      var denom = Vector.dot(norm, ray.dir);
      if (denom > 0) {
        return null;
      } else {
        var dist = (Vector.dot(norm, ray.start) + offset) / (-denom);
        return <Intersection>{ thing: this, ray: ray, dist: dist };
      }
    }
  }
}

module Surfaces {
  export var shiny: Surface = {
    diffuse: function (pos) { return Color.white; },
    specular: function (pos) { return Color.grey; },
    reflect: function (pos) { return 0.7; },
    roughness: 250
  }
  export var checkerboard: Surface = {
    diffuse: function (pos) {
      if ((Math.floor(pos.z) + Math.floor(pos.x)) % 2 !== 0) {
        return Color.white;
      } else {
        return Color.black;
      }
    },
    specular: function (pos) { return Color.white; },
    reflect: function (pos) {
      if ((Math.floor(pos.z) + Math.floor(pos.x)) % 2 !== 0) {
        return 0.1;
      } else {
        return 0.7;
      }
    },
    roughness: 150
  }
}


class RayTracer {
  private maxDepth = 5;

  private intersections(ray: Ray, scene: Scene) {
    var closest = +Infinity;
    var closestInter: Intersection | null = null;
    for (var i in scene.things) {
      var inter = scene.things[i].intersect(ray);
      if (inter != null && inter.dist < closest) {
        closestInter = inter;
        closest = inter.dist;
      }
    }
    return closestInter;
  }

  private testRay(ray: Ray, scene: Scene) {
    var isect = this.intersections(ray, scene);
    if (isect != null) {
      return isect.dist;
    } else {
      return null;
    }
  }

  private traceRay(ray: Ray, scene: Scene, depth: number): Color {
    var isect = this.intersections(ray, scene);
    if (isect === null) {
      return Color.background;
    } else {
      return this.shade(isect, scene, depth);
    }
  }

  private shade(isect: Intersection, scene: Scene, depth: number) {
    var d = isect.ray.dir;
    var pos = Vector.plus(Vector.times(isect.dist, d), isect.ray.start);
    var normal = isect.thing.normal(pos);
    var reflectDir = Vector.minus(d, Vector.times(2, Vector.times(Vector.dot(normal, d), normal)));
    var naturalColor = Color.plus(Color.background,
      this.getNaturalColor(isect.thing, pos, normal, reflectDir, scene));
    var reflectedColor = (depth >= this.maxDepth) ? Color.grey : this.getReflectionColor(isect.thing, pos, normal, reflectDir, scene, depth);
    return Color.plus(naturalColor, reflectedColor);
  }

  private getReflectionColor(thing: Thing, pos: Vector, normal: Vector, rd: Vector, scene: Scene, depth: number) {
    return Color.scale(thing.surface.reflect(pos), this.traceRay({ start: pos, dir: rd }, scene, depth + 1));
  }

  private getNaturalColor(thing: Thing, pos: Vector, norm: Vector, rd: Vector, scene: Scene) {
    var addLight = (col: Color, light: Light) => {
      var ldis = Vector.minus(light.pos, pos);
      var livec = Vector.norm(ldis);
      var neatIsect = this.testRay({ start: pos, dir: livec }, scene);
      var isInShadow = (neatIsect === null) ? false : (neatIsect <= Vector.mag(ldis));
      if (isInShadow) {
        return col;
      } else {
        var illum = Vector.dot(livec, norm);
        var lcolor = (illum > 0) ? Color.scale(illum, light.color)
          : Color.defaultColor;
        var specular = Vector.dot(livec, Vector.norm(rd));
        var scolor = (specular > 0) ? Color.scale(Math.pow(specular, thing.surface.roughness), light.color)
          : Color.defaultColor;
        return Color.plus(col, Color.plus(Color.times(thing.surface.diffuse(pos), lcolor),
          Color.times(thing.surface.specular(pos), scolor)));
      }
    }
    return scene.lights.reduce(addLight, Color.defaultColor);
  }

  render(scene: Scene, ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number) {
    var getPoint = (x: number, y: number, camera: Camera) => {
      var recenterX = (x: number) => (x - (screenWidth / 2.0)) / 2.0 / screenWidth;
      var recenterY = (y: number) => - (y - (screenHeight / 2.0)) / 2.0 / screenHeight;
      return Vector.norm(Vector.plus(camera.forward, Vector.plus(Vector.times(recenterX(x), camera.right), Vector.times(recenterY(y), camera.up))));
    }
    for (var y = 0; y < screenHeight; y++) {
      for (var x = 0; x < screenWidth; x++) {
        var color = this.traceRay({ start: scene.camera.pos, dir: getPoint(x, y, scene.camera) }, scene, 0);
        var c = Color.toDrawingColor(color);
        ctx.fillStyle = "rgb(" + String(c.r) + ", " + String(c.g) + ", " + String(c.b) + ")";
        ctx.fillRect(x, y, x + 1, y + 1);
      }
    }
  }

  renderToImage(scene: Scene, image: ImageData) {
    var height = image.height;
    var width = image.width;

    var getPoint = function (x: number, y: number, camera: Camera) {
      var recenterX = function (x: number) { return (x - (width / 2.0)) / 2.0 / width; };
      var recenterY = function (y: number) { return -(y - (height / 2.0)) / 2.0 / height; };
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


function defaultScene(): Scene {
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

function scene2(): Scene {
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

function emptyScene(): Scene {
  return {
    things: [],
    lights: [],
    camera: new Camera(new Vector(3.0, 2.0, 4.0), new Vector(-1.0, 0.5, 0.0))
  };
}

function DefaultXML(): string {
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
function ParseXMLToScene(xmlInput: string): Scene {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlInput, 'application/xml');
  console.log('xml', xml);
  const parserErrorNode = xml.getElementsByTagName('parsererror');
  if (parserErrorNode.length != 0) {
    throw new SyntaxError();
  }

  const objects: Thing[] = [];
  const lights: Light[] = [];
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

  for (let p of <any>planeNodes) {
    const requiredAttributes = ['pos', 'offset', 'surface'];
    if (requiredAttributes.every(a => p.hasAttribute(a))) {
      const posAtt = <string>p.getAttribute('pos');
      const offsetAtt = <string>p.getAttribute('offset');
      const surfaceAtt = <string>p.getAttribute('surface');

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

  for (let s of <any>sphereNodes) {
    const requiredAttributes = ['pos', 'size', 'surface'];
    if (requiredAttributes.every(a => s.hasAttribute(a))) {
      const posAtt = <string>s.getAttribute('pos');
      const sizeAtt = <string>s.getAttribute('size');
      const surfaceAtt = <string>s.getAttribute('surface');
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


  for (let l of <any>lightNodes) {
    const requiredAttributes = ['pos', 'color'];
    if (requiredAttributes.every(a => l.hasAttribute(a))) {
      const posAtt = <string>l.getAttribute('pos');
      const colorAtt = <string>l.getAttribute('color');
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

  (function parseLight(cameraNode: Element) {
    console.log(cameraNode);
    const requiredAttributes = ['pos', 'lookAt'];
    if (requiredAttributes.every(a => cameraNode.hasAttribute(a))) {
      const posAtt = <string>cameraNode.getAttribute('pos');
      const lookAtAtt = <string>cameraNode.getAttribute('lookAt');
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

  const scene = <Scene>{
    things: objects,
    lights: lights,
    camera
  };

  console.log('parsed scene : ', scene);
  return scene;
}



//Scene input was attempt to provide textarea with live raytrace updates on user input.
//Due to Types lost on compile, alternative solution needed.
function exec() {
  const canv = <HTMLCanvasElement>document.querySelector("#ray-canvas");
  const sceneSelector = <HTMLSelectElement>document.querySelector('#ray-scene');
  const sceneInput = <HTMLTextAreaElement>document.querySelector('#ray-input');
  const resSelector = <HTMLButtonElement>document.querySelector('#ray-res');
  const elapsed = <HTMLInputElement>document.querySelector('#ray-elapsed');
  const rayTracer = new RayTracer();

  let ctxMaybe = canv.getContext("2d");
  if (ctxMaybe == null) { return; }

  let ctx: CanvasRenderingContext2D = ctxMaybe;
  let size: number;
  let img: ImageData;
  let scene: Scene = defaultScene();

  // try {
  //   sceneInput.value = JSON.stringify(defaultScene());
  // }
  // catch (error) {
  //   console.error('Attempt load scene to textarea : ', error);
  // }

  sceneInput.value = DefaultXML();

  let renewRaytrace = () => {
    const start = performance.now();
    rayTracer.renderToImage(scene, img);
    const end = performance.now();
    outputElapsedTime(end - start);
  };

  let outputElapsedTime = (n: number) => {
    elapsed.textContent = 'Elapsed : ' + (n / 1000.0).toFixed(2).toString() + 's';

    ['btn-primary', 'btn-success', 'btn-warning', 'btn-danger']
      .forEach(className => { elapsed.classList.remove(className); });

    if (n > 2000) {
      elapsed.classList.add('btn-danger');
    } else if (n > 500) {
      elapsed.classList.add('btn-warning');
    } else {
      elapsed.classList.add('btn-success');
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
  }


  let sceneXMLFromTextarea = () => {
    try {
      scene = ParseXMLToScene(sceneInput.value);
    }
    catch (error) {
      console.error('sceneXMLFromTextarea()', error);
      //TODO refactor clearing of button
      ['btn-primary', 'btn-success', 'btn-warning', 'btn-danger']
        .forEach(className => { elapsed.classList.remove(className); });

      elapsed.classList.add('btn-danger');
      elapsed.textContent = 'Invalid XML';

      scene = emptyScene();
    }
  };

  window.addEventListener('resize', () => {
    resizeCanvas();
    resizeTextarea();
    outputRenderImage();
  });

  resSelector.addEventListener('change', () => {
    changeRenderSize();
    renewRaytrace();
    outputRenderImage();
  });

  sceneSelector.addEventListener('change', () => {
    scene = [emptyScene, defaultScene, scene2][parseInt(sceneSelector.value)]();
    renewRaytrace();
    outputRenderImage();
  });

  // sceneInput.addEventListener('input', () => {

  // });

  elapsed.addEventListener('click', () => {
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
