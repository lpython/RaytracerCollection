
import Vector from "./Vector.js";
import RayTracer from "./Raytracer.js";
import GetScene from "./Scene1.js";


function main() {

    var width = 128;
    var height = 128;

    (document.querySelector('#res') as HTMLSelectElement)
        .addEventListener('change', function (e: Event) {
            var s = <HTMLSelectElement>e.target;
            width = height = parseInt(s.value);
            setTimeout(exec, 1);
        });

    function exec() {
        var canv = <HTMLCanvasElement>document.querySelector("#ray");
        var ctx = canv.getContext("2d");
        if (!ctx) {
            console.error("Failed get context");
            return;
        }
        ctx.clearRect(0, 0, canv.width, canv.height);

        var rayTracer = new RayTracer();

        var img = ctx.createImageData(width, height);

        var start = performance.now();
        rayTracer.renderToImage(GetScene(), img);
        var end = performance.now();

        // createImageBitmap(img, 0, 0, width, height, { resizeHeight: 512, resizeWidth: 512 })
        //     .then(img => ctx.drawImage(img, 0, 0));
        createImageBitmap(img, 0, 0, width, height)
            .then(img => ctx!.drawImage(img, 0, 0, 512, 512));

        document.querySelector('#stopwatch')!.textContent = (end - start).toString();

    }

    exec();
}
main();
