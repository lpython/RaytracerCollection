package main

import "math"

type Vector struct {
	x, y, z float32
}

func (v *Vector) times(k float32) *Vector {
	v.x *= k
	v.y *= k
	v.z *= k
	return v
}

func (src *Vector) copy() Vector {
	var dist Vector
	dist.x = src.x
	dist.y = src.y
	dist.z = src.z
	return dist
}

func (v *Vector) minus(v2 *Vector) *Vector {
	v.x -= v2.x
	v.y -= v2.y
	v.z -= v2.z
	return v
}

func (v *Vector) plus(v2 *Vector) *Vector {
	v.x += v2.x
	v.y += v2.y
	v.z += v2.z
	return v
}

func (v *Vector) dot(v2 *Vector) float32 {
	return v.x*v2.x + v.y*v2.y + v.z*v2.z
}

func (v *Vector) mag() float32 {
	return float32(
		math.Sqrt(float64(v.x*v.x + v.y*v.y + v.z*v.z)))
}

func (v *Vector) norm() (r Vector) {
	mag := v.mag()
	var div float32
	if mag == 0.0 {
		div = math.MaxFloat32
	} else {
		div = 1.0 / mag
	}
	r = *v
	r.times(div)
	return
}

func cross(v1, v2 Vector) *Vector {
	r := new(Vector)
	r.x = v1.y*v2.z - v1.z*v2.y
	r.y = v1.z*v2.x - v1.x*v2.z
	r.z = v1.x*v2.y - v1.y*v2.x
	return r
}
