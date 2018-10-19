package main

import . "github.com/go-gl/mathgl/mgl64"

type Scene struct {
	things []Thing
	lights []Light
	camera Camera
}

func DefaultScene() Scene {
	var (
		checkerboard Checkerboard
		shiny        Shiny
	)

	s := Scene{
		[]Thing{
			Plane{Vec3{0.0, 1.0, 0.0}, 0.0, checkerboard},
			Sphere{Vec3{0.0, 1.0, -0.25}, 1.0, shiny},
			Sphere{Vec3{-1.0, 0.5, 1.5}, 0.25, shiny},
			// Sphere{Vec3{0.5, 0.0, 5.0}, 0.04, checkerboard},
			Sphere{Vec3{-5.5, 2.0, -5.0}, 4, checkerboard},
		},
		[]Light{
			Light{Vec3{-2.0, 2.5, 0.0}, Color{0.49, 0.07, 0.07}},
			Light{Vec3{1.5, 2.5, 1.5}, Color{0.07, 0.07, 0.49}},
			Light{Vec3{1.5, 2.5, -1.5}, Color{0.07, 0.49, 0.071}},
			Light{Vec3{0.0, 3.5, 0.0}, Color{0.21, 0.21, 0.35}},
		},
		NewCamera(Vec3{3.0, 2.0, 4.0}, Vec3{-1.0, 0.5, 0.0}),
	}
	return s
}
