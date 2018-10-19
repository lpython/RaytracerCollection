extern crate image;

use image::{GenericImage, ImageBuffer};
use std::fs::File;

//let img = ImageBuffer::new(512, 512);

fn main() {
    let img = ImageBuffer::from_fn(512, 512, |x, y| {
        if x / 4 % 2 == 0 {
            image::Luma([0u8])
        } else {
            image::Luma([255u8])
        }
    });

    img.save("test.png").unwrap();

    // let ref mut fout = File::create("test.png").unwrap();

    // img.save(fout, image::PNG).unwrap();
}
