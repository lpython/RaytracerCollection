
data class Camera(val forward:Vector,
                  val right: Vector,
                  val up: Vector,
                  val position:Vector) {

    companion object {
        fun lookAt(position: Vector, lookAt: Vector): Camera {
            val down = Vector.down
            val forward = lookAt.minus(position).normalize()
            val right = forward.cross(down).normalize().times(1.5)
            val up = forward.cross(right).normalize() * 1.5
            return Camera(forward, right, up, position)
        }
    }
}