package main

type Plane struct {
	Normal  Vector
	Offset  float32
	surface Surface
}

func (p Plane) normal(v Vector) Vector {
	return p.Normal
}

func (p Plane) intersect(r Ray) (i Intersection, hit bool) {
	denom := p.Normal.Dot(r.direction)
	if denom > 0 {
		return Intersection{}, false
	} else {
		dist := (p.Normal.Dot(r.start) + p.Offset) / (-denom)
		return Intersection{thing: p, ray: r, distance: dist}, true
	}
}

func (p Plane) Surface() Surface {
	return p.surface
}
