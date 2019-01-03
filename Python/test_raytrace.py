import unittest
from pprint import pprint

from vector import Vector
from thing import Plane
import color
import scene_one

from raytrace import  intersections, test_ray, trace_ray, get_reflection_color, MAX_DEPTH

from ray_types import Ray, Camera

class  TestRayTrace(unittest.TestCase):
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

    def test_reflection_color(self):
        scene = scene_one.scene()
        input = {
            "scene": scene, 
            "thing": scene.things[1],
            "pos": Vector(
                x=0.9682536088805778,
                y= 1.120726634856072,
                z= -0.46888359583591654
            ),
            "normal": Vector(
                x=0.9682536088805801,
                y=0.12072663485607234,
                z=-0.21888359583591707
            ),
            "rd": Vector(
                x= 0.017881548532950597,
                y=-0.12328111142237405,
                z=-0.9922106720795377
            ),
            "depth": 0
        }
        res = get_reflection_color(**input)

        output = color.Color(
            r=0.15929183224593932,
            g=0.1756515946612255,
            b=0.1870300937260152
        )

        self.assertSequenceEqual(res, output)

    # def test_get_point(self):
    #     inputs =[{
    #         x:
    #     }]