"use strict";

const ImageData   = require("./ImageData");
const gm = require("gm").subClass({ imageMagick: true });
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
                img = img.extent("\"%[fx:h<w?h:w]", "%[fx:h<w?h:w]\"", "")
            }
            
            console.log(img, image);
            const fname = image.fileName.split('/')[image.fileName.split('/').length - 1];
            img.write(`/tmp/${fname}`, function (err) {
                if (err) reject(err);
                console.log('Created an image from a Buffer!');
                fs.readFile(`/tmp/${fname}`, function (err, data) {
                    if (err) reject(err);
                    console.log(data);
                    resolve(new ImageData(
                        image.fileName,
                        image.bucketName,
                        data,
                        image.headers,
                        acl || image.acl
                    ));
                });
            });

            // img.toBuffer((err, buffer) => {
            //     if (err) {
            //         console.error(err)
            //         reject(err);
            //     } else {
            //         resolve(new ImageData(
            //             image.fileName,
            //             image.bucketName,
            //             buffer,
            //             image.headers,
            //             acl || image.acl
            //         ));
            //     }
            // });
        });
    }
}

module.exports = ImageResizer;
