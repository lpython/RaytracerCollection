package main

import . "github.com/go-gl/mathgl/mgl32"

type Camera struct {
	forward, right, up Vec3
	position           Vec3
}

func NewCamera(position, lookAt Vec3) Camera {
	var c Camera
	c.position = position
	down := Vec3{0.0, -1.0, 0.0}
	c.forward = lookAt.Sub(position).Normalize()
	c.right = c.forward.Cross(down).Normalize().Mul(1.5)
	c.up = c.forward.Cross(c.right).Normalize().Mul(1.5)
	return c
}
