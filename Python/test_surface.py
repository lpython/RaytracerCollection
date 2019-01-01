import unittest
from pprint import pprint
import random

import color
from vector import Vector
from surface import Surface, shiny, Checker, checkerboard

class TestSurface(unittest.TestCase):
    def test_checker_diffuse_black(self):
        res = Checker.diffuse(Vector(0.5, random.randrange(-100000, 100000), 0.5))
        for a,b in zip(res, color.black):
            self.assertAlmostEqual(a,b)
    
    def test_checker_diffuse_white(self):
        res = Checker.diffuse(Vector(2.5, random.randrange(-100000, 100000), 1.5))
        for a,b in zip(res, color.white):
            self.assertAlmostEqual(a,b)