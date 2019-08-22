from collections import namedtuple
from vector import Vector

Color = namedtuple('Color', 'r g b')
# Color = Vector

white = Color(1.0, 1.0, 1.0)
grey = Color(0.5, 0.5, 0.5)
black = Color(0.0, 0.0, 0.0)
background = black
default_color = black

def scale(k: float, v: Color):
  return Color(k * v[0], k * v[1], k * v[2])

def plus(v1: Color, v2: Color):
  return Color(v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2])

def sub(v1: Color, v2: Color):
  return Color(v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2])

def times(v1: Color, v2: Color):
  return Color(v1.r * v2.r, v1.g * v2.g, v1.b * v2.b)

def to_drawing_color(c: Color):
  # cap = lambda d: 1 if d > 1 else d
  def clamp(n):
    n = int(n)
    v = n if n < 255 else 255
    return v if v >= 0 else 0

  return dict(r = clamp(c.r * 255),
              g = clamp(c.g * 255),
              b = clamp(c.b * 255))
  # return dict(r = clamp(c.x * 255),
  #             g = clamp(c.y * 255),
  #             b = clamp(c.z * 255))