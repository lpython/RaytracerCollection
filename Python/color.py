from collections import namedtuple

Color = namedtuple('Color', 'r g b')


white = Color(1.0, 1.0, 1.0)
grey = Color(0.5, 0.5, 0.5)
black = Color(0.0, 0.0, 0.0)
# background = Color.black
# defaultColor = Color.black

def scale(k: float, v: Color):
  return Color(k * v[0], k * v[1], k * v[2])

def plus(k: float, v: Color):
  return Color(k + v[0], k + v[1], k + v[2])

def times(v1: Color, v2: Color):
  return Color(v1.r * v2.r, v1.g * v2.g, v1.b * v2.b)

def toDrawingColor(c: Color):
  cap = lambda d: 1 if d > 1 else d

  return dict(r = cap(c.r) * 255,
              g = cap(c.g) * 255,
              b = cap(c.b) * 255)