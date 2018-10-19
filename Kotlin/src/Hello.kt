fun oldmain(args: Array<String>) {

}

fun test1() {
    val v = Vector(1.0, 1.0,1.0)
    println(v)

    val r = Ray(start = Vector(1.0,1.0,1.0), direction = Vector(2.0,2.0,2.0))
    println(r)

    println(r.start * 2.0)

    val v2 = Vector(1.0, 2.0, 3.0)
    println(v2)
    println(v2.dot(v2))
    println(v2.dot(v))

    println(v2.normalize().dot(v2.normalize()))
    println(v2.normalize().dot(v.normalize()))

    val z = Vec3(0.0, 0.0, 0.0)
    println(z.normalize())
    println(z.normalize().isNaN())
}