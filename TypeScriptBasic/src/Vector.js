"use strict";
var Vector = /** @class */ (function () {
    function Vector(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Vector.times = function (k, v) { return new Vector(k * v.x, k * v.y, k * v.z); };
    Vector.minus = function (v1, v2) { return new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z); };
    Vector.plus = function (v1, v2) { return new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z); };
    Vector.dot = function (v1, v2) { return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z; };
    Vector.mag = function (v) { return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z); };
    Vector.norm = function (v) {
        var mag = Vector.mag(v);
        var div = (mag === 0) ? Infinity : 1.0 / mag;
        return Vector.times(div, v);
    };
    Vector.cross = function (v1, v2) {
        return new Vector(v1.y * v2.z - v1.z * v2.y, v1.z * v2.x - v1.x * v2.z, v1.x * v2.y - v1.y * v2.x);
    };
    return Vector;
}());
