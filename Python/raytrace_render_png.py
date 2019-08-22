from raytrace import render_to_image
from color import Color
import scene_one

from PIL import Image, ImageColor

WIDTH, HEIGHT = 2000, 2000


image = Image.new("RGB", (WIDTH, HEIGHT))

# def dict_to_ImageColor(d:dict) -> ImageColor:
#     return ImageColor.getcolor()

def pixelWriter(x, y, c:Color):
    v = (c['r'] | 15, c['g'], c['b'])
    # v = (c['r'] << 16 |
    #      c['g'] << 8  |
    #      c['b'] )
    image.putpixel((x, y), v)

if __name__ == "__main__":
    render_to_image(scene_one.scene(), WIDTH, HEIGHT, pixelWriter)
    image.save('output.png')    