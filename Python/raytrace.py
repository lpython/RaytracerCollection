from collections import namedtuple

from vector import Vector

Camera = namedtuple('Camera', 'forward right up')

def look_at(position:Vector, lookAt:Vector):
    down = Vector(0.0, -1.0, 0.0)
    forward = (lookAt - position).normal()
    right = 1.5 * (forward ** down).normal()
    up = 1.5 * (forward ** right).normal()
    return Camera(forward, right, up)

Ray = namedtuple('Ray', 'start dir')
Intersection = namedtuple('Intersection', 'thing ray distance')

Thing = namedtuple('Thing', '')