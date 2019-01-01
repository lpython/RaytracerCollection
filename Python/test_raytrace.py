import unittest
from pprint import pprint

from vector import Vector
from thing import Plane
import color
import scene_one

from raytrace import Ray, Camera, intersections, test_ray, trace_ray, MAX_DEPTH

class  TestCameraLookAt(unittest.TestCase):
    def check(self, a, b): 
        # print('a:', a, 'b:', b)
        for c, d in zip(a, b):
            self.assertAlmostEqual(c, d)


    def test_camera(self):
        # Move to setup/teardown, maybe
        position, lookAt = Vector(x=3.0, y=2.0, z=4.0), Vector(x=-1.0, y=0.5, z=0.0)
        result = Camera(position, lookAt)

        # pprint(result)

        f = Vector(x=-0.6834861261734088, y=-0.25630729731502827, z=-0.68348612617)
        r = Vector(x = -1.0606601717798212, y=0, z=1.0606601717798)
        u = Vector(x=-0.2718549419985796, y=1.4498930239924248, z=-0.2718549419985796 )

        self.check(f, result.forward)
        self.check(r, result.right)
        self.check(u, result.up)


    def test_intersections(self):
        # This ray ...
        ray = Ray(start=Vector(5.0, 5.0, 5.0), dir=Vector(0, -1.0, 0))
        # and this scene ...
        scene = scene_one.scene()
        res = intersections(ray, scene)
        # hits this Plane ...
        self.assertIsInstance(res.thing, Plane)
        # this far away.
        self.assertAlmostEqual(res.distance, 5.0)

    def test_test_ray(self):
        # This ray ...
        ray = Ray(start=Vector(5.0, 5.0, 5.0), dir=Vector(0, -1.0, 0))
        # and this scene ...
        scene = scene_one.scene()
        res = test_ray(ray, scene)
        # hits this far away.
        self.assertAlmostEqual(res, 5.0)

    def test_trace_ray(self):
        # This ray ...
        ray = Ray(start=Vector(5.0, 5.0, 5.0), dir=Vector(0, 1.0, 0))
        # and this scene ...
        scene = scene_one.scene()
        res = trace_ray(ray, scene, MAX_DEPTH)
        # never hits.
        self.assertIs(res, color.background)


