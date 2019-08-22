
import math
from abc import ABCMeta, abstractmethod

from vector import Vector
import color 
from surface import Surface
from ray_types import Ray, Intersection


class Thing(metaclass=ABCMeta):
    @abstractmethod
    def intersect(self, ray:Ray): pass

    @abstractmethod
    def normal(self, pos:Vector): pass

#   @property
#   @abstractmethod
#   def reflect(self): pass

class Sphere(Thing):
#   _diffuse = color.white  
#   @property
#   @classmethod
#   def diffuse(cls):  
#     return cls._diffuse

#   _specular = color.grey
#   @property
#   def specular(self):
#     return self._specular

#   @property  
#   def reflect(self):
#     return 0.7
    def __init__(self, center:Vector, radius: float, surface: Surface):
        self.radius2 = radius * radius
        self.center = center
        self.surface = surface
    
    def normal(self, pos: Vector):
        return (pos - self.center).normal()

    def intersect(self, ray: Ray):
        eo = self.center - ray.start
        v = eo & ray.dir
        dist = 0
        if v >= 0:
            # print('[intersect] radius2:{} eo:{} v:{}'.format(
            #     self.radius2, eo, v))
            disc = self.radius2 - ((eo & eo) - v * v)
            if disc >= 0:
                dist = v - math.sqrt(disc)
        if dist == 0:
            return None
        else:
            return Intersection(self, ray, dist)

class Plane(Thing):
    def __init__(self, normal:Vector, offset:float, surface:Surface):
        self._normal = normal
        self.offset = offset
        self.surface = surface

    def normal(self, pos:Vector):
        return self._normal

    def intersect(self, ray: Ray):
        if isinstance(self._normal, float): print('_normal!')
        if isinstance(ray.dir, float): print('ray.dir!')
        denom = self._normal & ray.dir
        if denom >= 0.0:
            return None
        else:
            dist = ((self._normal & ray.start) + self.offset) / (-denom)
            return Intersection(self, ray, dist)