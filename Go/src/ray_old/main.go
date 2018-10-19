package main

import (
	"fmt"
	"image"
	"image/png"
	"os"
	"time"

	"github.com/go-gl/mathgl/mgl32"
)

type Vector = mgl32.Vec3

type Ray struct {
	start, direction Vector
}

type Intersection struct {
	thing    Thing
	ray      Ray
	distance float32
}

type Thing interface {
	intersect(Ray) (Intersection, bool)
	normal(postion Vector) Vector
	Surface() Surface
}

type Light struct {
	position Vector
	color    Color
}

func main() {
	start := time.Now()
	RenderDefaultSceneToPNG(512)

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

//Basic vector test
func crap() {
	// r := Ray{
	// 	start:     Vector{1, 1, 1},
	// 	direction: Vector{2, 2, 2},
	// }
	// fmt.Println(r)

	// // r.start.times(2)
	// r.start.Mul(2)
	// fmt.Println(r)

	// // result := r.direction.dot(&Vector{3, 3, 3})
	// result := r.direction.Dot(Vector{3, 3, 3})
	// fmt.Println(result)

	// v2 := Vector{1, 2, 3}
	// r2 := v2.Normalize()
	// fmt.Println(r2)

	// v3 := Vector{0, 0, 0}
	// r3 := v3.Normalize()
	// fmt.Println(r3)

	// // r4 := new(Vector).plus(&v2)
	// r4 := new(Vector).Add(v2)
	// fmt.Println(r4)

}
