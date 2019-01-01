from collections import namedtuple

# Types 

Ray = namedtuple('Ray', 'start dir')

Light = namedtuple('Light', 'pos color')

Scene = namedtuple('Scene', 'things lights camera')

Intersection = namedtuple('Intersection', 'thing ray distance')
