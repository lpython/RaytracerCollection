import java.awt.image.BufferedImage
import java.lang.Math.pow

data class Scene(val things:List<Thing>, val lights:List<Light>, val camera: Camera)

data class Ray(val  start:Vector, val direction:Vector)

data class Intersection(val thing:Thing, val ray:Ray, val distance: Double)

//data class IntersectionTest(val i:Intersection, val hit:Boolean)

data class Light(val position: Vector, val color: Color)

data class PixelResult(val x: Int, val y: Int, val color: Color)

const val MAX_DEPTH = 5

interface Thing {
    fun intersect(ray:Ray): Intersection?
    fun normal(position : Vector): Vector
    fun surface() : Surface
}

fun renderToImage(scene: Scene, image: BufferedImage) {
    val width = image.width
    val height = image.height
    val minX = image.minX
    val minY = image.minY
    val maxX = minX + width
    val maxY = minY + height

    val getPoint = { x:Double, y:Double, camera:Camera ->
        val recenterX = { x:Double -> (x - (width / 2.0)) / 2.0 / width }
        val recenterY = { y:Double -> -(y - (height / 2.0)) / 2.0 / height }
        val recenterRight = camera.right * recenterX(x)
        val recenterUp = camera.up * recenterY(y)
        recenterRight.plus(recenterUp).plus(camera.forward).normalize()
    }

    val emitRay = { x: Int, y: Int ->
        val ray = Ray(start = scene.camera.position, direction = getPoint(x.toDouble(), y.toDouble(), scene.camera))
        val c = traceRay(ray, scene, 0)
        PixelResult(x, y, c)
    }

//    val emitRay = { x: Int, y: Int -> PixelResult(x, y, Color(0.3, 0.3, 0.3)) }

    for (y in minY until maxY) {
        for (x in minX until maxX) {
            val result = emitRay(x, y)
            var (r,g,b) = result.color.toUInt8Color()

            val Int32Color = (r shl 16) or (g shl 8) or b
            image.setRGB(x, y, Int32Color)
        }
    }
}

fun intersections(ray: Ray, scene: Scene) :Intersection? {
    var closestDistance = Double.MAX_VALUE
    var closestIntersection : Intersection? = null
    for (thing in scene.things) {
        val i = thing.intersect(ray)
        if (i != null && i.distance < closestDistance) {
            closestIntersection = i
            closestDistance = i.distance
        }
    }
    return closestIntersection
}

fun testRay(ray: Ray, scene: Scene) : Double? {
    val intersection = intersections(ray, scene)
    return intersection?.distance
}

fun traceRay(ray: Ray, scene: Scene, depth: Int) : Color {
    val intersection = intersections(ray, scene)
    return if (intersection != null) {
        shade(intersection, scene, depth)
    } else {
        Colors.Background
    }
}

fun shade(i : Intersection, scene: Scene, depth: Int) : Color {
    val dir = i.ray.direction
    val pos = dir.times(i.distance).plus(i.ray.start)
    val normal = i.thing.normal(pos)
    val reflectDir = dir.minus(normal * normal.dot(dir) * 2.0 )
    val naturalColor = Colors.Background + NaturalColor(i.thing, pos, normal, reflectDir, scene)

    var reflectedColor = Colors.Gray
    if (depth <= MAX_DEPTH) {
        reflectedColor = ReflectionColor(i.thing, pos, normal, reflectDir, scene, depth)
    }
    return naturalColor + reflectedColor
}

fun ReflectionColor(thing: Thing, position: Vector, normal: Vector, rd: Vector, scene: Scene, depth: Int) : Color {
    var colorResult = traceRay(Ray(position, rd), scene, depth+1)
    val factor = thing.surface().reflect(position)
    return colorResult.scale(factor)
}

fun NaturalColor(thing: Thing, position: Vector, normal: Vector, rd: Vector, scene: Scene) : Color{
    val addLight = fun(color:Color, light:Light) : Color {
        val ldis = light.position - position
        val livec = ldis.normalize()
        val nearIsect = testRay(Ray(position, livec), scene)
//        var isInShadow = nearIsect != null && nearIsect <= ldis.length()
        var isInShadow = false
        if (nearIsect != null && nearIsect <= ldis.length() ) {
            isInShadow = true
        }
        if (isInShadow) {
            return color
        } else {
            val illum = livec.dot(normal)
            val lcolor = if (illum > 0) light.color.scale(illum) else Colors.DefaultColor
            val specular = rd.normalize().dot(livec)
            val scolor = if (specular > 0) {
                light.color.scale(pow(specular, thing.surface().Roughness))
            } else {
                Colors.DefaultColor
            }
            return (color +
                    (lcolor * thing.surface().diffuse(position) +
                     scolor * thing.surface().specular(position))
                    )
        }
    }

    var acc = Colors.DefaultColor
    for (light in scene.lights) {
        acc = addLight(acc, light)
    }

    return acc
}




//typealias Thing = Int