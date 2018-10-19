package main

import (
	"image"
	"image/color"
	"math"

	. "github.com/go-gl/mathgl/mgl64"
)

const divisions = 8
const maxDepth = 5

type PixelResult struct {
	x, y  int
	color Color
}

func renderToImage(scene Scene, i *image.RGBA) {
	b := i.Bounds()
	height := float64(b.Dy())
	width := float64(b.Dx())

	getPoint := func(x, y float64, camera Camera) Vec3 {
		recenterX := func(x float64) float64 { return (x - (width / 2.0)) / 2.0 / width }
		recenterY := func(y float64) float64 { return -(y - (height / 2.0)) / 2.0 / height }
		recenterRight := camera.right.Mul(recenterX(x))
		recenterUp := camera.up.Mul(recenterY(y))
		return recenterRight.Add(recenterUp).Add(camera.forward).Normalize()
	}

	// collector := make(chan PixelResult)

	EmitRay := func(x, y int) PixelResult {
		ray := Ray{scene.camera.position, getPoint(float64(x), float64(y), scene.camera)}
		c := traceRay(ray, scene, 0)
		return PixelResult{
			x, y,
			c,
		}
		// collector <- PixelResult{x, y, c}
	}

	for y := b.Min.Y; y < b.Max.Y; y++ {
		for x := b.Min.X; x < b.Max.X; x++ {
			// if x == 40 && y == 40 {
			// 	EnableLogging()
			// } else {
			// 	DisableLogging()
			// }

			res := EmitRay(x, y)
			c := res.color.toDrawingColor()

			i.SetRGBA(x, y, color.RGBA{uint8(c.r), uint8(c.g), uint8(c.b), 255})

			// ray = Ray{scene.camera.position, getPoint(float64(x), float64(y), scene.camera)}
			// Log("Scene.Camera: ", scene.camera)
			// Log("X:", x, " Y:", y)
			// Log("Ray: ", ray.start, ray.direction)
			// Log("Float color : ", c)
			// Log("UINT color : ", c2)
		}
	}
	// fmt.Println("goroutines started.")

	// // Pull from collecter
	// count := height * width
	// for ; count != 0; count-- {
	// 	res := <-collector
	// 	c := res.color.toDrawingColor()
	// 	i.SetRGBA(res.x, res.y, color.RGBA{uint8(c.r), uint8(c.g), uint8(c.b), 255})
	// }
}

func intersections(ray Ray, scene Scene) (i Intersection, hit bool) {
	var closest float64 = math.MaxFloat64
	for _, t := range scene.things {
		inter, h := t.intersect(ray)
		if h && inter.distance < closest {
			i = inter
			hit = true
			closest = inter.distance
		}
	}
	return
}

func testRay(ray Ray, scene Scene) (dist float64, hit bool) {
	isect, hit := intersections(ray, scene)
	if hit == true {
		return isect.distance, true
	}
	return 0, false
}

func traceRay(ray Ray, scene Scene, depth int) Color {
	isect, hit := intersections(ray, scene)
	if hit == true {
		return shade(isect, scene, depth)
	}
	return Background()
}

// Shading

func shade(isect Intersection, scene Scene, depth int) Color {
	d := isect.ray.direction
	pos := d.Mul(isect.distance).Add(isect.ray.start)
	normal := isect.thing.normal(pos)
	reflectDir := d.Sub(normal.Mul(normal.Dot(d)).Mul(2))
	naturalColor := Plus(Background(),
		NaturalColor(isect.thing, pos, normal, reflectDir, scene))
	reflectedColor := Gray()
	if depth <= maxDepth {
		reflectedColor = ReflectionColor(isect.thing, pos, normal, reflectDir, scene, depth)
	}
	return Plus(naturalColor, reflectedColor)
}

func ReflectionColor(thing Thing, position, normal, rd Vec3, scene Scene, depth int) Color {
	c := traceRay(Ray{position, rd}, scene, depth+1)
	return c.Scale(thing.Surface().reflect(position))
}

func NaturalColor(thing Thing, position, normal, rd Vec3, scene Scene) Color {
	addLight := func(color Color, light Light) Color {
		ldis := light.position.Sub(position)
		livec := ldis.Normalize()
		neatIsect, hit := testRay(Ray{position, livec}, scene)
		var isInShadow bool
		if hit && neatIsect <= ldis.Len() {
			isInShadow = true
		}
		if isInShadow {
			return color
		} else {
			illum := livec.Dot(normal)
			lcolor := DefaultColor()
			if illum > 0 {
				lcolor = light.color.Scale(illum)
			}
			specular := rd.Normalize().Dot(livec)
			scolor := DefaultColor()
			if specular > 0 {
				scolor = light.color.Scale(float64(math.Pow(float64(specular), float64(thing.Surface().Roughness()))))
			}
			return Plus(color, Plus(Times(thing.Surface().diffuse(position), lcolor),
				Times(thing.Surface().specular(position), scolor)))
		}
	}
	acc := DefaultColor()
	for _, l := range scene.lights {
		acc = addLight(acc, l)
	}
	return acc
}
