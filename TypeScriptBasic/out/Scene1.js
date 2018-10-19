import Vector from "./Vector.js";
import Color from "./Color.js";
import { Plane, Sphere, Surfaces, Camera } from "./Raytracer.js";
export default function defaultScene() {
    return {
        things: [
            new Plane(new Vector(0.0, 1.0, 0.0), 0.0, Surfaces.checkerboard),
            new Sphere(new Vector(0.0, 1.0, -0.25), 1.0, Surfaces.shiny),
            new Sphere(new Vector(-1.0, 0.5, 1.5), 0.5, Surfaces.shiny),
            new Sphere(new Vector(-5.5, 2.0, -5.0), 2, Surfaces.checkerboard)
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

window.defaultScene = defaultScene