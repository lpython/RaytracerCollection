
data class Plane(val normal: Vector, val offset: Double, val surface: Surface)
    : Thing
{
    override fun normal(position: Vector) = this.normal
    override fun intersect(ray: Ray): Intersection? {
        val denom = this.normal.dot(ray.direction)
        return if (denom > 0) {
            null
        } else {
            val dist : Double = (this.normal.dot(ray.start) + this.offset) / (-denom)
            Intersection(this, ray, dist)
        }
    }

    override fun surface() = this.surface

}