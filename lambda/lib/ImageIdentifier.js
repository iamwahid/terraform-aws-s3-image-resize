"use strict";

const ImageData   = require("./ImageData");
// const gm = require("gm").subClass({ imageMagick: '7+' });
const gm = require("gm");
const fs = require("fs");

const cropSpec = /(\d+)x(\d+)([+-]\d+)?([+-]\d+)?(%)?/;

class ImageIdentifier {

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
            console.log("Identifying: " + (image.fileName));
            gm(image.data).identify("%w %h", function (err, format) {
                if (err) return reject(err);
                console.log(format)
                let w, h;
                w = Number(format.split(' ')[0])
                h = Number(format.split(' ')[1])
                console.log(`w: ${w}, h: ${h}`)
                const headers = Object.assign(image.headers, {
                    Metadata: {
                        width: w,
                        height: h
                    }
                });
                resolve(new ImageData(
                    image.fileName,
                    image.bucketName,
                    image.data,
                    headers,
                    acl
                ));
            });
        });
    }
}

module.exports = ImageIdentifier;
