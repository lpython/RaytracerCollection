import Vector from "./Vector.js";
import Color from "./Color.js";


export interface Ray {
  start: Vector;
  dir: Vector;
}

export interface Intersection {
  thing: Thing;
  ray: Ray;
  dist: number;
}

export interface Surface {
  diffuse: (pos: Vector) => Color;
  specular: (pos: Vector) => Color;
  reflect: (pos: Vector) => number;
  roughness: number;
}

export interface Thing {
  intersect: (ray: Ray) => Intersection | null;
  normal: (pos: Vector) => Vector;
  surface: Surface;
}

export interface Light {
  pos: Vector;
  color: Color;
}

export interface Scene {
  things: Thing[];
  lights: Light[];
  camera: Camera;
}

export class Camera {
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

export class Sphere implements Thing {
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
      return { thing: this, ray: ray, dist: dist };
    }
  }
}

export class Plane implements Thing {
  // public normal: (pos: Vector) => Vector;
  // public intersect: (ray: Ray) => Intersection;
  constructor(public norm: Vector, public offset: number, public surface: Surface) { }

  normal(pos: Vector) { return this.norm; }
  intersect(ray: Ray): Intersection | null {
    var denom = Vector.dot(this.norm, ray.dir);
    if (denom > 0) {
      return null;
    } else {
      var dist = (Vector.dot(this.norm, ray.start) + this.offset) / (-denom);
      return { thing: this, ray: ray, dist: dist };
    }
  }
}

export module Surfaces {
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


export default class RayTracer {
  private maxDepth = 5;

  private intersections(ray: Ray, scene: Scene) {
    var closest = +Infinity;
    var closestInter: Intersection | undefined = undefined;
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
      return undefined;
    }
  }

  private traceRay(ray: Ray, scene: Scene, depth: number): Color {
    var isect = this.intersections(ray, scene);
    if (isect === undefined) {
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
      var isInShadow = (neatIsect === undefined) ? false : (neatIsect <= Vector.mag(ldis));
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

  // render(scene: Scene, ctx: WebGLRenderingContext, screenWidth: number, screenHeight: number) {
  //     var getPoint = (x: number, y: number, camera: Camera) => {
  //         var recenterX = x:number => (x - (screenWidth / 2.0)) / 2.0 / screenWidth;
  //         var recenterY = y:number => - (y - (screenHeight / 2.0)) / 2.0 / screenHeight;
  //         return Vector.norm(Vector.plus(camera.forward, Vector.plus(Vector.times(recenterX(x), camera.right), Vector.times(recenterY(y), camera.up))));
  //     }
  //     for (var y = 0; y < screenHeight; y++) {
  //         for (var x = 0; x < screenWidth; x++) {
  //             var color = this.traceRay({ start: scene.camera.pos, dir: getPoint(x, y, scene.camera) }, scene, 0);
  //             var c = Color.toDrawingColor(color);
  //             ctx.fillStyle = "rgb(" + String(c.r) + ", " + String(c.g) + ", " + String(c.b) + ")";
  //             ctx.fillRect(x, y, x + 1, y + 1);
  //         }
  //     }
  // }

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
