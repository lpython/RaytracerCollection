import kotlin.math.sqrt

data class Vec3(val x:Double, val y:Double, val z:Double) {

    operator fun plus(rhs: Vec3) = Vec3(this.x+rhs.x, this.y+rhs.y, this.z+rhs.z)
    operator fun minus(rhs: Vec3) = Vec3(this.x-rhs.x, this.y-rhs.y, this.z-rhs.z)

    operator fun times(rhs: Double) = Vec3(this.x*rhs, this.y*rhs, this.z*rhs)

    fun length() = sqrt(this.x*this.x + this.y*this.y + this.z*this.z)

    fun dot(rhs: Vec3) = this.x*rhs.x + this.y*rhs.y + this.z*rhs.z
    fun cross(rhs: Vec3) = Vec3(
            this.y*rhs.z-this.z*rhs.y,
            -(this.x*rhs.z-this.z*rhs.x),
            this.x*rhs.y-this.y*rhs.x
    )

    fun isNaN(): Boolean = x.isNaN() || y.isNaN() || z.isNaN()

    fun normalize() : Vec3 {
        val l :Double = 1.0 / length()
        return this * l
    }

    companion object {
        val down = Vec3(0.0, -1.0, 0.0)
    }
}

typealias Vector = Vec3


