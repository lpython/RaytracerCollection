from raytrace import Scene, Camera, Light
from thing import Plane, Sphere
import surface
from vector import Vector
from color import Color

def scene():
  return Scene(things=[
            Plane(  Vector(0.0, 1.0, 0.0), 0.0, surface.checkerboard),
            Sphere( Vector(0.0, 1.0, -0.25), 1.0, surface.shiny),
            Sphere( Vector(-1.0, 0.5, 1.5), 0.5, surface.shiny)
        ],
        lights=[
            Light(Vector(-2.0, 2.5, 0.0), Color(0.49, 0.07, 0.07) ),
            Light(Vector(1.5, 2.5, 1.5),  Color(0.07, 0.07, 0.49) ),
            Light(Vector(1.5, 2.5, -1.5), Color(0.07, 0.49, 0.071) ),
            Light(Vector(0.0, 3.5, 0.0),  Color(0.21, 0.21, 0.35))
        ],
        camera=Camera( Vector(3.0, 2.0, 4.0),  Vector(-1.0, 0.5, 0.0))
    )