from raytrace import Scene, Camera
from thing import Plane, Sphere
import surface

def scene():
  return Scene(things=[
            Plane(  Vector(0.0, 1.0, 0.0), 0.0, surfaces.checkerboard),
            Sphere( Vector(0.0, 1.0, -0.25), 1.0, surfaces.shiny),
            Sphere( Vector(-1.0, 0.5, 1.5), 0.5, surfaces.shiny)
        ],
        lights=[
            { pos= Vector(-2.0, 2.5, 0.0), color= Color(0.49, 0.07, 0.07) },
            { pos= Vector(1.5, 2.5, 1.5), color=Color(0.07, 0.07, 0.49) },
            { pos= Vector(1.5, 2.5, -1.5), color= Color(0.07, 0.49, 0.071) },
            { pos= Vector(0.0, 3.5, 0.0), color=Color(0.21, 0.21, 0.35) }
        ],
        camera=Camera( Vector(3.0, 2.0, 4.0),  Vector(-1.0, 0.5, 0.0))
    )