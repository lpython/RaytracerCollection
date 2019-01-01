import math
from collections import namedtuple

import color
from vector import Vector
from surface import shiny, checkerboard


# Camera = namedtuple('Camera', 'forward right up')

# def look_at(position:Vector, lookAt:Vector):
#     down = Vector(0.0, -1.0, 0.0)
#     forward = (lookAt - position).normal()
#     right = 1.5 * (forward ** down).normal()
#     up = 1.5 * (forward ** right).normal()
#     return Camera(forward, right, up)

class Camera():
    def __init__(self, position:Vector, lookAt:Vector):
        down = Vector(0.0, -1.0, 0.0)
        forward = (lookAt - position).normal()
        right = 1.5 * (forward ** down).normal()
        up = 1.5 * (forward ** right).normal()
        self.forward, self.right, self.up = forward,right,up

Ray = namedtuple('Ray', 'start dir')


Light = namedtuple('Light', 'pos color')

Scene = namedtuple('Scene', 'things lights camera')

Intersection = namedtuple('Intersection', 'thing ray distance')
def intersections(ray: Ray, scene: Scene):
    closest = math.inf
    closestInter = None
    for t in scene.things:
        inter = t.intersect(ray)
        if inter != None and inter.distance < closest:
            closestInter = inter
            closest = inter.distance
    return closestInter