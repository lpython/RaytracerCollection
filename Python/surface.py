import math
from collections import namedtuple
# from abc import ABCMeta, abstractmethod

import color 
from vector import Vector

from ray_types import Surface

shiny = Surface(diffuse=lambda n: color.white,
                specular=lambda n: color.grey,
                reflect=lambda n: 0.7,
                roughness=250)

#inline module
class Checker():
    @staticmethod
    def diffuse(pos:Vector):
        if ((math.floor(pos.z) + math.floor(pos.x)) % 2 != 0 ):
            return color.white
        else:
            return color.black

    @staticmethod
    def specular(pos:Vector): return color.white
    
    @staticmethod
    def reflect(pos:Vector):
        if ((math.floor(pos.z) + math.floor(pos.x)) % 2 != 0 ):
            return 0.1
        else:
            return 0.7

checkerboard = Surface(Checker.diffuse, Checker.specular, Checker.reflect,
                       roughness=150)


# class Surface(metaclass=ABCMeta):
#   @property
#   @abstractmethod
#   def diffuse(self): pass

#   @property
#   @abstractmethod
#   def specular(self): pass

#   @property
#   @abstractmethod
#   def reflect(self): pass

# class Shiny(Surface):
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


