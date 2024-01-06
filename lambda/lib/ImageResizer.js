"use strict";

const ImageData   = require("./ImageData");
const gm = require("gm").subClass({ imageMagick: '7+' });
// const gm = require("gm");
const fs = require("fs");

const cropSpec = /(\d+)x(\d+)([+-]\d+)?([+-]\d+)?(%)?/;

class ImageResizer {

    /**
     * Image Resizer
     * resize image with ImageMagick
     *
     * @constructor
     * @param Object options
     */
    constructor(options) {
        this.options = options;
    }

    /**
     * Execute resize
     *
     * @public
     * @param ImageData image
     * @return Promise
     */
    exec(image) {
        const acl = this.options.acl;

        return new Promise((resolve, reject) => {
            console.log("Resizing to: " + (this.options.directory || "in-place"));

            let img = gm(image.data).geometry(this.options.size.toString());
            if ( "orientation" in this.options ) {
                img = img.autoOrient();
            }
            if ( "gravity" in this.options ) {
                img = img.gravity(this.options.gravity);
            }
            if ( "background" in this.options ) {
              img = img.background(this.options.background).flatten();
            }
            if ( "crop" in this.options ) {
                const cropArgs = this.options.crop.match(cropSpec);
                const cropWidth = cropArgs[1];
                const cropHeight = cropArgs[2];
                const cropX = cropArgs[3];
                const cropY = cropArgs[4];
                const cropPercent = cropArgs[5];
                img = img.crop(cropWidth, cropHeight, cropX, cropY, cropPercent === "%");
            }
            if( "format" in this.options ) {
                img = img.setFormat(this.options.format);
            }
            if ("extentSquare" in this.options) {
                console.log("extentSquare: " + this.options.extentSquare);
                // img = gm(image.data).command('').setFormat('jpeg').gravity(this.options.gravity).out('-extent', '%[fx:h<w?h:w]x%[fx:h<w?h:w]');
                let w, h, n;
                gm(image.data).identify("%w %h", function (err, format) {
                    if (err) console.log(err)
                    console.log(format)
                    w = Number(format.split(' ')[0])
                    h = Number(format.split(' ')[1])
                    n = w;
                    if (h < n) {
                        n = h;
                    }
                    img = gm(image.data).setFormat('jpeg').geometry(`${n}x${n}^`).gravity('center').extent(n, n);
                    console.log(img)

                    const fname = image.fileName.split('/')[image.fileName.split('/').length - 1];
                    console.log(image.data);
                    console.log(`/tmp/${fname}`);
                    img.write(`/tmp/${fname}`, function (err1) {
                        if (err1) return reject(err1);
                        console.log('Created an image from a Buffer!');
                        fs.readFile(`/tmp/${fname}`, function (err2, data) {
                            if (err2) return reject(err2);
                            console.log(data);
                            return resolve(new ImageData(
                                image.fileName,
                                image.bucketName,
                                data,
                                image.headers,
                                acl || image.acl
                            ));
                        });
                    });
                })
            } else {
                img.toBuffer((err, buffer) => {
                    if (err) {
                        console.error(err)
                        reject(err);
                    } else {
                        resolve(new ImageData(
                            image.fileName,
                            image.bucketName,
                            buffer,
                            image.headers,
                            acl || image.acl
                        ));
                    }
                });
            }
        });
    }
}

module.exports = ImageResizer;
