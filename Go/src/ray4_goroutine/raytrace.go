package main

import (
	"fmt"
	"image"
	"image/color"
	"math"
	"sync"
	"image/png"
	"os"

	. "github.com/go-gl/mathgl/mgl64"
)

const DIVISIONS int = 8
const maxDepth = 5

type Ray struct {
	start, direction Vec3
}

type Intersection struct {
	thing    Thing
	ray      Ray
	distance float64
}

type Thing interface {
	intersect(Ray) (Intersection, bool)
	normal(postion Vec3) Vec3
	Surface() Surface
}

type Light struct {
	position Vec3
	color    Color
}

type PixelResult struct {
	x, y  int
	color Color
}

func RenderDefaultSceneToPNG(fileName string, size int) {
	writer, err := os.Create("test.png")
	if err != nil {
		fmt.Println("Failed open file.")
		return
	}
	defer writer.Close()

	buffer := RenderDefaultSceneToBuffer(size)

	i := buffer.SubImage(buffer.Bounds())
	fmt.Println(buffer.Bounds())
	png.Encode(writer, i)
}

func RenderDefaultSceneToBuffer(size int) *image.RGBA {

	fmt.Println("Create image")

	buffer := image.NewRGBA(image.Rect(0, 0, size, size))

	renderToImage(DefaultScene(), buffer)

	return buffer
}

func renderToImage(scene Scene, i *image.RGBA) {
	var wg sync.WaitGroup

	b := i.Bounds()
	height := b.Dy()
	width := b.Dx()
	f_height := float64(b.Dy())
	f_width := float64(b.Dx())

	xStep := width / DIVISIONS
	yStep := height / DIVISIONS
	fmt.Println("xStep:%v,yStep:%v", xStep, yStep)

	// Closures

	getPoint := func(x, y float64, camera Camera) Vec3 {
		recenterX := func(x float64) float64 { return (x - (f_width / 2.0)) / 2.0 / f_width }
		recenterY := func(y float64) float64 { return -(y - (f_height / 2.0)) / 2.0 / f_height }
		recenterRight := camera.right.Mul(recenterX(x))
		recenterUp := camera.up.Mul(recenterY(y))
		return recenterRight.Add(recenterUp).Add(camera.forward).Normalize()
	}

	EmitRay := func(x, y int) PixelResult {
		ray := Ray{scene.camera.position, getPoint(float64(x), float64(y), scene.camera)}
		c := traceRay(ray, scene, 0)
		return PixelResult{x, y, c}
	}

	EmitRayOverBounds := func(b image.Rectangle) {
		for y := b.Min.Y; y < b.Max.Y; y++ {
			for x := b.Min.X; x < b.Max.X; x++ {
				res := EmitRay(x, y)
				c := res.color.toDrawingColor()
				i.SetRGBA(res.x, res.y, color.RGBA{uint8(c.r), uint8(c.g), uint8(c.b), 255})
			}
		}
		wg.Done()
	}

	for y := b.Min.Y; y < b.Max.Y; y += yStep {
		for x := b.Min.X; x < b.Max.X; x += xStep {
			right, bottom := x+xStep, y+yStep
			right = min(right, b.Max.X)
			bottom = min(bottom, b.Max.Y)
			bounds := image.Rect(x, y, right, bottom)
			fmt.Printf("Bounds:%#v\n", bounds)

			go EmitRayOverBounds(bounds)
			wg.Add(1)
		}
	}

	wg.Wait()
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
		return Shade(isect, scene, depth)
	}
	return Background()
}

// Shading

func Shade(isect Intersection, scene Scene, depth int) Color {
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
