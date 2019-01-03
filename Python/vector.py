import math

class Vector:
	x = 0
	y = 0
	z = 0

	def __init__(self, x, y, z):
		self.x = float(x)
		self.y = float(y)
		self.z = float(z)

    # String represntation
	def __str__(self):
		return '<%s, %s, %s>' % (self.x, self.y, self.z)

	# Produce a copy of itself
	def __copy(self):
		return Vector(self.x, self.y, self.z)

	# Signing
	def __neg__(self):
		return Vector(-self.x, -self.y, -self.z)

	# Scalar Multiplication
	def __mul__(self, number):
		return Vector(self.x * number, self.y * number, self.z * number)

	def __rmul__(self, number):
		return self.__mul__(number)

	# Division
	def __div__(self, number):
		return self.__copy() * (number**-1)

	# Arithmetic Operations
	def __add__(self, operand):
		return Vector(self.x + operand.x, self.y + operand.y, self.z + operand.z)

	def __sub__(self, operand):
		return self.__copy() + -operand

	# Cross product
	# cross = a ** b
	def __pow__(self, operand):
		return Vector(self.y*operand.z - self.z*operand.y, 
									self.z*operand.x - self.x*operand.z, 
									self.x*operand.y - self.y*operand.x)

	# Dot Project
	# dp = a & b
	def __and__(self, operand):
		return (self.x * operand.x) + \
		       (self.y * operand.y) + \
		       (self.z * operand.z)
 
	# Operations

	def normal(self):
		mag = self.magnitude()
		# if math.isclose(0, mag): return math.inf
		div = math.inf if mag == 0 else 1.0 / mag
		return Vector.__mul__(self, div)
		# return self.__copy().__div__(self.magnitude())

	def magnitude(self):
		return (self.x**2 + self.y**2 + self.z**2)**(.5)

	def __iter__(self):
		yield self.x
		yield self.y
		yield self.z
		


ZERO = Vector(0,0,0)