import unittest
import random

import color
from vector import Vector
import surface
from thing import Sphere, Plane

from raytrace import Ray

def random_float():
    return random.randrange(-999999999, 999999999)

def random_vector():
    return Vector( *(random_float() for a in range(3)) )

class TestThing(unittest.TestCase):
    def test_plane(self):
        # move to setup/teardown
        p = Plane(Vector(0.0, 1.0, 0.0), 0.0, surface.checkerboard)
        n = p.normal( random_vector() )
        self.assertSequenceEqual(tuple(n), (0.0, 1.0, 0.0))

        i = p.intersect(Ray(start=Vector(5.0, 5.0, 5.0),dir=Vector(0.0, -1.0, 0.0)))
        self.assertAlmostEqual(i.distance, 5.0)
        
    def test_sphere(self):
        s = Sphere(Vector(0.0, 1.0, -0.25), 1.0, surface.shiny)
        data = {
            "pos": {
                "x": 0.1182904327070955,
                "y": 1.992955435817109,
                "z": -0.2568466058167811
            },
            "result": {
                "x": 0.11829043270709626,
                "y": 0.9929554358171155,
                "z": -0.006846605816781137
            }
        }
        n = s.normal(Vector(**data['pos']))

        self.assertSequenceEqual(tuple(n), tuple(data['result'].values()))
