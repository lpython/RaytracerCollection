from raytrace import render_to_image
from color import Color
import scene_one

from PIL import Image

WIDTH, HEIGHT = 400, 400


image = Image.new("RGB", (WIDTH, HEIGHT))

def pixelWriter(x, y, c:Color):
    v = (c['r'] << 16 |
         c['g'] << 8  |
         c['b'] )
    image.putpixel((x, y), v)

if __name__ == "__main__":
    render_to_image(scene_one.scene(), WIDTH, HEIGHT, pixelWriter)