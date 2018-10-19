import java.lang.Math.sqrt

data class Sphere(val center: Vector,
                  val radius2:Double,
                  val surface: Surface) : Thing {
    override fun normal(position: Vector) = position.minus(this.center).normalize()
    override fun intersect(ray: Ray): Intersection? {
        val eo = this.center - ray.start
        val v = eo.dot(ray.direction)

        var dist = 0.0
        if (v >= 0) {
            val disc = this.radius2 - (eo.dot(eo) - v * v)
            if (disc >= 0) {
                dist = v - sqrt(disc)
            }
        }
        return if (dist == 0.0) {
            null
        } else {
            Intersection( this, ray, dist )
        }
    }

    override fun surface() = this.surface
}