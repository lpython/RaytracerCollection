import unittest
from pprint import pprint
from vector import Vector
from surface import Surface, Shiny

class TestSurface(unittest.TestCase):
  def test_surface_ABC(self):
    try:
      a = Surface() #E0110
    except TypeError as t:
      pass
    except Exception as e:
      self.fail('Unexpected exception raised:', e)
    else:
      self.fail('TypeError was not raised')

  def test_surface_shiny(self):
    a = Shiny()
    # print(a.reflect)
    # print(a.specular)
    # print(a.diffuse)