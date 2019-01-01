from collections import namedtuple

import color
from vector import Vector

import math

Camera = namedtuple('Camera', 'forward right up')

def look_at(position:Vector, lookAt:Vector):
    down = Vector(0.0, -1.0, 0.0)
    forward = (lookAt - position).normal()
    right = 1.5 * (forward ** down).normal()
    up = 1.5 * (forward ** right).normal()
    return Camera(forward, right, up)

Ray = namedtuple('Ray', 'start dir')
Intersection = namedtuple('Intersection', 'thing ray distance')

from surface import shiny, checkerboard

Light = namedtuple('Light', 'pos color')

Scene = namedtuple('Scene', 'things lights camera')

def intersections(ray: Ray, scene: Scene):
    closest = math.inf
    closestInter = None
    for t in scene.things:
        inter = t.intersect(ray)
        if inter != None and inter.distance < closest:
            closestInter = inter
            closest = inter.dist
    return closestInter