package main

import "math"

type Sphere struct {
	Center  Vector
	Radius2 float32
	surface Surface
}

func (s Sphere) normal(pos Vector) (r Vector) {
	return pos.Sub(s.Center).Normalize()
}

func (s Sphere) intersect(r Ray) (Intersection, bool) {
	eo := s.Center.Sub(r.start)
	v := eo.Dot(r.direction)
	var dist float32
	if v >= 0 {
		disc := s.Radius2 - (eo.Dot(eo) - v*v)
		if disc >= 0 {
			dist = v - float32(math.Sqrt(float64(disc)))
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
