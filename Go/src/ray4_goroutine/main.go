package main

import (
	"fmt"
	"image"
	"time"
	"image/png"
	"os"
	
	. "github.com/go-gl/mathgl/mgl64"
)

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

func main() {

	start := time.Now()

	RenderDefaultSceneToPNG(1024)

	elapsed := time.Since(start)
	fmt.Println(elapsed)
}

func RenderDefaultSceneToPNG(size int) {

	fmt.Println("Create image")

	buffer := image.NewRGBA(image.Rect(0, 0, size, size))

	writer, err := os.Create("test.png")
	if err != nil {
		fmt.Println("Failed open file.")
		return
	}
	defer writer.Close()

	renderToImage(DefaultScene(), buffer)

	i := buffer.SubImage(buffer.Bounds())
	fmt.Println(buffer.Bounds())
	png.Encode(writer, i)
}

//Basic Vec3 test
// func crap() {
// r := Ray{
// 	start:     Vec3{1, 1, 1},
// 	direction: Vec3{2, 2, 2},
// }
// fmt.Println(r)

// // r.start.times(2)
// r.start.Mul(2)
// fmt.Println(r)

// // result := r.direction.dot(&Vec3{3, 3, 3})
// result := r.direction.Dot(Vec3{3, 3, 3})
// fmt.Println(result)

// v2 := Vec3{1, 2, 3}
// r2 := v2.Normalize()
// fmt.Println(r2)

// v3 := Vec3{0, 0, 0}
// r3 := v3.Normalize()
// fmt.Println(r3)

// // r4 := new(Vec3).plus(&v2)
// r4 := new(Vec3).Add(v2)
// fmt.Println(r4)

// }
