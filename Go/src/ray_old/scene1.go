package main

type Scene struct {
	things []Thing
	lights []Light
	camera Camera
}

// func NewScene Scene {
// 	s := Scene{
// 		make([]Thing),
// 		make([]Light),
// 		Camera{}
// 	}
// }

func DefaultScene() Scene {
	var (
		checkerboard Checkerboard
		shiny        Shiny
	)

	s := Scene{
		[]Thing{
			Plane{Vector{0.0, 1.0, 0.0}, 0.0, checkerboard},
			Sphere{Vector{0.0, 1.0, -0.25}, 1.0, shiny},
			Sphere{Vector{-1.0, 0.5, 1.5}, 0.25, shiny},
			// Sphere{Vector{0.5, 0.0, 5.0}, 0.04, checkerboard},
			Sphere{Vector{-5.5, 2.0, -5.0}, 4, checkerboard},
		},
		[]Light{
			Light{Vector{-2.0, 2.5, 0.0}, Color{0.49, 0.07, 0.07}},
			Light{Vector{1.5, 2.5, 1.5}, Color{0.07, 0.07, 0.49}},
			Light{Vector{1.5, 2.5, -1.5}, Color{0.07, 0.49, 0.071}},
			Light{Vector{0.0, 3.5, 0.0}, Color{0.21, 0.21, 0.35}},
		},
		NewCamera(Vector{3.0, 2.0, 4.0}, Vector{-1.0, 0.5, 0.0}),
	}
	return s
}
