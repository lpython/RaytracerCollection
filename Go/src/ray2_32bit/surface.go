package main

import "math"
import . "github.com/go-gl/mathgl/mgl32"

type Surface interface {
	diffuse(Vec3) Color
	specular(Vec3) Color
	reflect(Vec3) float32
	Roughness() float32
}

type Shiny int

func (s Shiny) diffuse(v Vec3) Color {
	return White()
}

func (s Shiny) specular(v Vec3) Color {
	return Gray()
}

func (s Shiny) reflect(v Vec3) float32 {
	return 0.7
}

func (s Shiny) Roughness() float32 {
	return 250
}

// type Checkerboard struct {
// 	b int
// }

type Checkerboard int

func (c Checkerboard) diffuse(position Vec3) Color {
	z := int32(math.Floor(0.0001 + float64(position.Z())))
	y := int32(math.Floor(0.0001 + float64(position.Y())))
	x := int32(math.Floor(0.0001 + float64(position.X())))
	if (z+x+y)%2 != 0 {
		return White()
	} else {
		return Black()
	}
}

func (c Checkerboard) specular(position Vec3) Color {
	return White()
}

func (c Checkerboard) reflect(position Vec3) float32 {
	z := int32(math.Floor(float64(position.Z())))
	x := int32(math.Floor(float64(position.X())))
	if (z+x)%2 != 0 {
		return 0.1
	} else {
		return 0.7
	}
}

func (c Checkerboard) Roughness() float32 {
	return 150
}
