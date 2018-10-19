package main

import (
	"math"
)

type Color struct {
	r, g, b float64
}

// var (
// 	white = Color{1.0, 1.0, 1.0}
// 	black = Color{0.0, 0.0, 0.0}
// )

func (c Color) Scale(k float64) Color {
	return Color{k * c.r, k * c.g, k * c.b}
}

func Plus(c1, c2 Color) Color {
	return Color{c1.r + c2.r, c1.g + c2.g, c1.b + c2.b}
}

func Times(c1, c2 Color) Color {
	return Color{c1.r * c2.r, c1.g * c2.g, c1.b * c2.b}
}

func White() Color { return Color{1.0, 1.0, 1.0} }
func Black() Color { return Color{0.0, 0.0, 0.0} }
func Gray() Color  { return Color{0.5, 0.5, 0.5} }

func Background() Color   { return Black() }
func DefaultColor() Color { return Black() }

func (c Color) toDrawingColor() Color {
	legalize := func(n float64) float64 {
		if n > 1.0 {
			return 1.0
		} else {
			return float64(n)
		}
	}
	return Color{
		r: float64(math.Floor(legalize(c.r) * 255.0)),
		g: float64(math.Floor(legalize(c.g) * 255.0)),
		b: float64(math.Floor(legalize(c.b) * 255.0)),
	}
}
