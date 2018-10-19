import java.awt.image.BufferedImage
import java.io.File
import java.io.IOException
import javax.imageio.ImageIO
import kotlin.system.measureTimeMillis

fun main(args: Array<String>) {
    RenderDefaultSceneToPNG(2048)
}

fun  RenderDefaultSceneToPNG(size: Int) {
    println("Creating image.")

    var buffer = BufferedImage(size, size, BufferedImage.TYPE_INT_RGB)

    println("Rendering image...")

    val time = measureTimeMillis { renderToImage(SCENE1, buffer) }

    println("Execution time : $time ms")

    try {
        var outputfile = File("saved.png")
        ImageIO.write(buffer, "png", outputfile)
    } catch (e: IOException) {
        println("Failed to write result to file: $e")
    }
}

fun Double.clamp(min: Double, max: Double): Double = Math.max(min, Math.min(this, max))
fun Int.clamp(min: Int, max: Int): Int = Math.max(min, Math.min(this, max))