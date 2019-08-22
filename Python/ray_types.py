from collections import namedtuple

from vector import Vector

# Types 

Ray = namedtuple('Ray', 'start dir')

Light = namedtuple('Light', 'pos color')

Scene = namedtuple('Scene', 'things lights camera')

Intersection = namedtuple('Intersection', 'thing ray distance')

Surface = namedtuple('Surface', 'diffuse specular reflect roughness')

Intersection = namedtuple('Intersection', 'thing ray distance')


class Camera():
    def __init__(self, position:Vector, lookAt:Vector):
        self.pos = position
        down = Vector(0.0, -1.0, 0.0)
        forward = (lookAt - position).normal()
        right = 1.5 * (forward ** down).normal()
        up = 1.5 * (forward ** right).normal()
        self.forward, self.right, self.up = forward,right,up
