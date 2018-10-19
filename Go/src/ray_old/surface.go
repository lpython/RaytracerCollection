package main

import "math"

type Surface interface {
	diffuse(Vector) Color
	specular(Vector) Color
	reflect(Vector) float32
	Roughness() float32
}

// //Better name needed
// type Rough struct {
// 	roughness float32
// }

// func (r Rough) Roughness() float32 {
// 	return r.roughness
// }

type Shiny struct {
	a int
}

func (s Shiny) diffuse(v Vector) Color {
	return White()
}

func (s Shiny) specular(v Vector) Color {
	return Gray()
}

func (s Shiny) reflect(v Vector) float32 {
	return 0.7
}

func (s Shiny) Roughness() float32 {
	return 250
}

// type Checkerboard struct {
// 	b int
// }

type Checkerboard int

func (c Checkerboard) diffuse(position Vector) Color {
	z := int32(math.Floor(float64(position.Z())))
	x := int32(math.Floor(float64(position.X())))
	if (z+x)%2 != 0 {
		return White()
	} else {
		return Black()
	}
}

func (c Checkerboard) specular(position Vector) Color {
	return White()
}

func (c Checkerboard) reflect(position Vector) float32 {
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
