

val SCENE1 = Scene(
        things = listOf(
                Plane(Vector(0.0, 1.0,0.0),0.0, Checkerboard),
                Sphere(Vector(0.0, 1.0, -0.25), 1.0, Shiny),
                Sphere(Vector(-1.0, 0.5, 1.5), 0.5, Shiny),
                Sphere(Vector(-5.5, 2.0, -5.0), 4.0, Checkerboard)
        ),
        lights = listOf(
                Light(position = Vector(-2.0, 2.5, 0.0), color = Color(0.49, 0.07, 0.07)),
                Light(Vector(1.5, 2.5, 1.5), Color(0.07, 0.07, 0.49)),
                Light(Vector(1.5, 2.5, -1.5), Color(0.07, 0.49, 0.071)),
                Light(Vector(0.0, 3.5, 0.0), Color(0.21, 0.21, 0.35))
        ),
        camera = Camera.lookAt(Vector(3.0, 2.0, 4.0), Vector(-1.0, 0.5, 0.0))

)