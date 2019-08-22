import unittest

from color import Color, scale, plus, times

class  TestColorFunc(unittest.TestCase):
    def test_scale(self):
        c1 = Color(0.1, 0.1, 0.1)
        result = scale(3.0, c1)
        for n in result:
            self.assertAlmostEqual(n, 0.3)
  
    def test_plus(self):
        c1 = Color(0.1, 0.1, 0.1)
        c2 = Color(0.1, 0.1, 0.1)
        result = plus(c2, c1)
        for n in result:
            self.assertAlmostEqual(n, 0.2)
    
    def test_times(self):
        c1 = Color(0.1, 0.1, 0.1)
        c2 = Color(0.1, 0.1, 0.1)

        result = times(c1, c2)
        for n in result:
            self.assertAlmostEqual(n, 0.01)