from abc import ABCMeta, abstractmethod

import color 

class Surface(metaclass=ABCMeta):
  @property
  @abstractmethod
  def diffuse(self): pass

  @property
  @abstractmethod
  def specular(self): pass

  @property
  @abstractmethod
  def reflect(self): pass

class Shiny(Surface):
  _diffuse = color.white  
  @property
  @classmethod
  def diffuse(cls):  
    return cls._diffuse

  _specular = color.grey
  @property
  def specular(self):
    return self._specular

  @property  
  def reflect(self):
    return 0.7


