data class Color(val r:Double, val g:Double, val b:Double) {
    fun scale(k:Double) = Color(k*this.r, k*this.g, k*this.b)

//    fun toUInt8Color() : List<Int> {
//        var (r, b, g) = listOf(r.times(255.0).toInt(), g.times(255.0).toInt(), b.times(255.0).toInt())
//        r = r and 0xFF
//        g = g and 0xFF
//        b = b and 0xFF
//        return listOf(r,g,b)
//    }

    fun toUInt8Color() : List<Int> {
        val transform : (Double) -> Int = { it.clamp(0.0, 1.0).times(255.0).toInt() }
        val (r, g, b) = listOf(r,g,b).map(transform)
        return listOf(r,g,b)
    }

    operator fun plus(rhs:Color) = Color(this.r+rhs.r, this.g+rhs.g, this.b+rhs.b)
    operator fun times(rhs:Color) = Color(this.r*rhs.r, this.g*rhs.g, this.b*rhs.b)

}


// TODO convert to namespace or module
object Colors {
    val White = Color(1.0, 1.0, 1.0)
    val Gray = Color(0.5,0.5,0.5)
    val Black = Color(0.0,0.0,0.0)

    val Background = Black
    val DefaultColor = Black
}




