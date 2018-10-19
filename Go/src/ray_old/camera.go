package main

type Camera struct {
	forward, right, up Vector
	position           Vector
}

func NewCamera(position, lookAt Vector) Camera {
	// c := new(Camera)
	var c Camera
	c.position = position
	down := Vector{0.0, -1.0, 0.0}
	c.forward = lookAt.Sub(position).Normalize()
	c.right = c.forward.Cross(down).Normalize().Mul(1.5)
	c.up = c.forward.Cross(c.right).Normalize().Mul(1.5)
	return c
}

// c.position = position
// down := Vector{0.0, -1.0, 0.0}
// c.forward = lookAt.minus(&position).norm()
// c.right = cross(c.forward, down).norm()
// c.right.times(1.5)
// c.up = cross(c.forward, c.right).norm()
// c.up.times(1.5)
