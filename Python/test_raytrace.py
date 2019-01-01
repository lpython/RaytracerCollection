import unittest
from pprint import pprint
from vector import Vector
from raytrace import Ray, look_at, intersections

import scene_one

class  TestCameraLookAt(unittest.TestCase):
    def check(self, a, b): 
        # print('a:', a, 'b:', b)
        for c, d in zip(a, b):
            self.assertAlmostEqual(c, d)


    def test_camera(self):
        # Move to setup/teardown, maybe
        position, lookAt = Vector(x=3.0, y=2.0, z=4.0), Vector(x=-1.0, y=0.5, z=0.0)
        result = look_at(position, lookAt)

        # pprint(result)

        f = Vector(x=-0.6834861261734088, y=-0.25630729731502827, z=-0.68348612617)
        r = Vector(x = -1.0606601717798212, y=0, z=1.0606601717798)
        u = Vector(x=-0.2718549419985796, y=1.4498930239924248, z=-0.2718549419985796 )

        self.check(f, result.forward)
        self.check(r, result.right)
        self.check(u, result.up)


    def test_intersections(self):
        res = intersections(Ray(start=Vector(5.0, 5.0, 5.0), dir=Vector(0, -1.0, 0)), scene_one.scene())
        pprint(res)

# ​forward: Object { x: -0.6834861261734088, y: -0.25630729731502827, z: -0.6834861261734088 }
# ​pos: Object { x: 3, y: 2, z: 4 }
# ​right: Object { x: -1.0606601717798212, y: 0, z: 1.0606601717798212 }​
# up: Object { x: -0.2718549419985796, y: 1.4498930239924248, z: -0.2718549419985796 }​


