package main

import "math"
import . "github.com/go-gl/mathgl/mgl64"

type Sphere struct {
	Center  Vec3
	Radius2 float64
	surface Surface
}

func (s Sphere) normal(pos Vec3) (r Vec3) {
	return pos.Sub(s.Center).Normalize()
}

func (s Sphere) intersect(r Ray) (Intersection, bool) {
	eo := s.Center.Sub(r.start)
	v := eo.Dot(r.direction)
	var dist float64
	if v >= 0 {
		disc := s.Radius2 - (eo.Dot(eo) - v*v)
		if disc >= 0 {
			dist = v - float64(math.Sqrt(float64(disc)))
		}
	}
	if dist == 0 {
		return Intersection{}, false
	} else {
		return Intersection{thing: s, ray: r, distance: dist}, true
	}

}

func (s Sphere) Surface() Surface {
	return s.surface
}
