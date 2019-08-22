import unittest

from vector import Vector
from thing import Plane
import color
import scene_one

from raytrace import  intersections, test_ray, trace_ray, get_reflection_color, MAX_DEPTH

from ray_types import Ray, Camera

# class TestRayTypes(unittest.TestCase):
#     def test_camera()