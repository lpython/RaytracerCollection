System.register("Vector", [], function (exports_1, context_1) {
    "use strict";
    var Vector;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            Vector = /** @class */ (function () {
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
            exports_1("default", Vector);
        }
    };
});
System.register("app", ["Vector"], function (exports_2, context_2) {
    "use strict";
    var Vector_1, Color, Camera, Sphere, Plane, Surfaces, RayTracer;
    var __moduleName = context_2 && context_2.id;
    function defaultScene() {
        return {
            things: [
                new Plane(new Vector_1.default(0.0, 1.0, 0.0), 0.0, Surfaces.checkerboard),
                new Sphere(new Vector_1.default(0.0, 1.0, -0.25), 1.0, Surfaces.shiny),
                new Sphere(new Vector_1.default(-1.0, 0.5, 1.5), 0.5, Surfaces.shiny),
                new Sphere(new Vector_1.default(0.5, 0.0, 5.0), 0.2, Surfaces.checkerboard)
            ],
            lights: [
                { pos: new Vector_1.default(-2.0, 2.5, 0.0), color: new Color(0.49, 0.07, 0.07) },
                { pos: new Vector_1.default(1.5, 2.5, 1.5), color: new Color(0.07, 0.07, 0.49) },
                { pos: new Vector_1.default(1.5, 2.5, -1.5), color: new Color(0.07, 0.49, 0.071) },
                { pos: new Vector_1.default(0.0, 3.5, 0.0), color: new Color(0.21, 0.21, 0.35) }
            ],
            camera: new Camera(new Vector_1.default(3.0, 2.0, 4.0), new Vector_1.default(-1.0, 0.5, 0.0))
        };
    }
    function main() {
        var width = 256;
        var height = 256;
        document.querySelector('#res')
            .addEventListener('change', function (e) {
            var s = e.target;
            width = height = parseInt(s.value);
            setTimeout(exec, 1);
        });
        function exec() {
            var canv = document.querySelector("#ray");
            var ctx = canv.getContext("2d");
            if (!ctx) {
                console.error("Failed get context");
                return;
            }
            ctx.clearRect(0, 0, canv.width, canv.height);
            var rayTracer = new RayTracer();
            var img = ctx.createImageData(width, height);
            var start = performance.now();
            rayTracer.renderToImage(defaultScene(), img);
            var end = performance.now();
            // createImageBitmap(img, 0, 0, width, height, { resizeHeight: 512, resizeWidth: 512 })
            //     .then(img => ctx.drawImage(img, 0, 0));
            createImageBitmap(img, 0, 0, width, height)
                .then(function (img) { return ctx.drawImage(img, 0, 0, 512, 512); });
            document.querySelector('#stopwatch').textContent = (end - start).toString();
        }
        exec();
    }
    return {
        setters: [
            function (Vector_1_1) {
                Vector_1 = Vector_1_1;
            }
        ],
        execute: function () {
            Color = /** @class */ (function () {
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
            Camera = /** @class */ (function () {
                function Camera(pos, lookAt) {
                    this.pos = pos;
                    var down = new Vector_1.default(0.0, -1.0, 0.0);
                    this.forward = Vector_1.default.norm(Vector_1.default.minus(lookAt, this.pos));
                    this.right = Vector_1.default.times(1.5, Vector_1.default.norm(Vector_1.default.cross(this.forward, down)));
                    this.up = Vector_1.default.times(1.5, Vector_1.default.norm(Vector_1.default.cross(this.forward, this.right)));
                }
                return Camera;
            }());
            Sphere = /** @class */ (function () {
                function Sphere(center, radius, surface) {
                    this.center = center;
                    this.surface = surface;
                    this.radius2 = radius * radius;
                }
                Sphere.prototype.normal = function (pos) { return Vector_1.default.norm(Vector_1.default.minus(pos, this.center)); };
                Sphere.prototype.intersect = function (ray) {
                    var eo = Vector_1.default.minus(this.center, ray.start);
                    var v = Vector_1.default.dot(eo, ray.dir);
                    var dist = 0;
                    if (v >= 0) {
                        var disc = this.radius2 - (Vector_1.default.dot(eo, eo) - v * v);
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
            Plane = /** @class */ (function () {
                // public normal: (pos: Vector) => Vector;
                // public intersect: (ray: Ray) => Intersection;
                function Plane(norm, offset, surface) {
                    this.norm = norm;
                    this.offset = offset;
                    this.surface = surface;
                }
                Plane.prototype.normal = function (pos) { return this.norm; };
                Plane.prototype.intersect = function (ray) {
                    var denom = Vector_1.default.dot(this.norm, ray.dir);
                    if (denom > 0) {
                        return null;
                    }
                    else {
                        var dist = (Vector_1.default.dot(this.norm, ray.start) + this.offset) / (-denom);
                        return { thing: this, ray: ray, dist: dist };
                    }
                };
                return Plane;
            }());
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
            RayTracer = /** @class */ (function () {
                function RayTracer() {
                    this.maxDepth = 5;
                }
                RayTracer.prototype.intersections = function (ray, scene) {
                    var closest = +Infinity;
                    var closestInter = undefined;
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
                        return undefined;
                    }
                };
                RayTracer.prototype.traceRay = function (ray, scene, depth) {
                    var isect = this.intersections(ray, scene);
                    if (isect === undefined) {
                        return Color.background;
                    }
                    else {
                        return this.shade(isect, scene, depth);
                    }
                };
                RayTracer.prototype.shade = function (isect, scene, depth) {
                    var d = isect.ray.dir;
                    var pos = Vector_1.default.plus(Vector_1.default.times(isect.dist, d), isect.ray.start);
                    var normal = isect.thing.normal(pos);
                    var reflectDir = Vector_1.default.minus(d, Vector_1.default.times(2, Vector_1.default.times(Vector_1.default.dot(normal, d), normal)));
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
                        var ldis = Vector_1.default.minus(light.pos, pos);
                        var livec = Vector_1.default.norm(ldis);
                        var neatIsect = _this.testRay({ start: pos, dir: livec }, scene);
                        var isInShadow = (neatIsect === undefined) ? false : (neatIsect <= Vector_1.default.mag(ldis));
                        if (isInShadow) {
                            return col;
                        }
                        else {
                            var illum = Vector_1.default.dot(livec, norm);
                            var lcolor = (illum > 0) ? Color.scale(illum, light.color)
                                : Color.defaultColor;
                            var specular = Vector_1.default.dot(livec, Vector_1.default.norm(rd));
                            var scolor = (specular > 0) ? Color.scale(Math.pow(specular, thing.surface.roughness), light.color)
                                : Color.defaultColor;
                            return Color.plus(col, Color.plus(Color.times(thing.surface.diffuse(pos), lcolor), Color.times(thing.surface.specular(pos), scolor)));
                        }
                    };
                    return scene.lights.reduce(addLight, Color.defaultColor);
                };
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
                RayTracer.prototype.renderToImage = function (scene, image) {
                    var height = image.height;
                    var width = image.width;
                    var getPoint = function (x, y, camera) {
                        var recenterX = function (x) { return (x - (width / 2.0)) / 2.0 / width; };
                        var recenterY = function (y) { return -(y - (height / 2.0)) / 2.0 / height; };
                        return Vector_1.default.norm(Vector_1.default.plus(camera.forward, Vector_1.default.plus(Vector_1.default.times(recenterX(x), camera.right), Vector_1.default.times(recenterY(y), camera.up))));
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
            main();
        }
    };
});
