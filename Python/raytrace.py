import math
from collections import namedtuple
from functools import reduce 
from typing import Callable

import color
from color import Color
from vector import Vector
# from surface import shiny, checkerboard
from thing import Thing

from ray_types import Ray, Intersection, Scene, Light

MAX_DEPTH = 5

class Camera():
    def __init__(self, position:Vector, lookAt:Vector):
        down = Vector(0.0, -1.0, 0.0)
        forward = (lookAt - position).normal()
        right = 1.5 * (forward ** down).normal()
        up = 1.5 * (forward ** right).normal()
        self.forward, self.right, self.up = forward,right,up

Intersection = namedtuple('Intersection', 'thing ray distance')
def intersections(ray: Ray, scene: Scene) -> Intersection:
    closest = math.inf
    closestInter = None
    for t in scene.things:
        inter = t.intersect(ray)
        if inter != None and inter.distance < closest:
            closestInter = inter
            closest = inter.distance
    return closestInter

def test_ray(ray: Ray, scene: Scene) -> float:
    isect = intersections(ray, scene)
    if isect:
        return isect.distance
    else:
        return None

def trace_ray(ray: Ray, scene: Scene, depth: int) -> Color:
    isect = intersections(ray, scene)
    if not isect:
        return color.background
    else:
        return shade(isect, scene, depth)

def shade(isect: Intersection, scene: Scene, depth: int) -> Color:
    d = isect.ray.dir
    pos = isect.ray.start + d * isect.distance
    normal = isect.thing.normal(pos)
    reflect_dir = d - 2 * normal * (normal & d)
    natural_color = color.background - get_natural_color(isect.thing, pos, normal, reflect_dir, scene)
    reflected_color = ( color.grey if depth >= MAX_DEPTH else
        get_reflection_color(isect.thing, pos, normal, reflect_dir, scene, depth) )
    return natural_color + reflected_color

def get_reflection_color(thing: Thing, pos:Vector, normal:Vector, rd:Vector, scene:Scene, depth: int) -> Color:
    return color.scale(thing.surface.reflect(pos), 
        trace_ray(Ray(start=pos, dir=rd), scene, depth + 1))

def get_natural_color(thing: Thing, pos:Vector, norm: Vector, rd: Vector, scene: Scene) -> Color:
    def add_light(c: Color, l: Light):
        ldis = l.pos - pos
        livec = ldis.normal()
        neatIsect = test_ray(Ray(start=pos, dir=livec), scene)
        isInShadow = False if not neatIsect else neatIsect <= ldis.magnitude()
        if isInShadow:
            return c
        else:
            illum = livec & norm
            lcolor = color.default_color if illum < 0 else color.scale(illum, l.color)
            specular = livec & rd.normal()
            scolor = color.default_color if specular < 0 else color.scale(specular**thing.surface.roughness, l.color)
            return c + (thing.surface.diffuse(pos) * lcolor + thing.surface.specular(pos) * scolor)

    return reduce(add_light, scene.lights, color.default_color)

def render_to_image(scene: Scene, width, height, pixelOutput: Callable[[int, int, Color], None] ):
    '''pixelOutput called with color dict (rgb)'''
    
    def get_point(x: float, y: float, camera:Camera):
        recenterX = lambda x: (x - (width / 2.0)) / 2.0 / width
        recenterY = lambda y: -(y - (height / 2.0)) / 2.0 / height
        return Vector.normal(camera.forward * recenterX(x) + recenterY(y) * camera.up)

    for y in range(height):
        for x in range(width):
            color = trace_ray(Ray(start=scene.camera.pos, dir=get_point(x, y, scene.camera)), scene, 0)
            c = color.to_drawing_color(color)

            pixelOutput(x, y, c)