import java.lang.Math.floor

interface Surface {
    val Roughness : Double
    fun diffuse(position: Vector) : Color
    fun specular(position: Vector) : Color
    fun reflect(position: Vector) : Double

}

val Shiny = object : Surface {
    override val Roughness = 250.0
    override fun diffuse(position: Vector): Color = Colors.White
    override fun specular(position: Vector): Color = Colors.Gray
    override fun reflect(position: Vector): Double = 0.7
}

val Checkerboard = object : Surface {
    override val Roughness = 150.0
    override fun diffuse(position: Vector): Color {
        // TODO : remove 0.0001
        val x = floor(0.0001 + position.x).toInt()
        val y = floor(0.0001 + position.y).toInt()
        val z = floor(0.0001 + position.z).toInt()
        return if ((x+y+z)%2 != 0) Colors.White else Colors.Black
    }
    override fun specular(position: Vector): Color = Colors.White
    override fun reflect(position: Vector): Double {
        val z = floor(position.z).toInt()
        val x = floor(position.x).toInt()
        return if ((z+x)%2 != 0) 0.1 else 0.7
    }
}
