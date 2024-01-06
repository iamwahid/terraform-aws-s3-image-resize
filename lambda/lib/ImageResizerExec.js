"use strict";

const ImageData   = require("./ImageData");
const gm = require("gm").subClass({ imageMagick: '7' });
// const gm = require("gm");
const fs = require("fs");
const exec = require('child_process').exec

const cropSpec = /(\d+)x(\d+)([+-]\d+)?([+-]\d+)?(%)?/;

class ImageResizerExec {

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
            const fname = image.fileName.split('/')[image.fileName.split('/').length - 1];
            fs.writeFile(`/tmp/source-${fname}`, image.data, function(err) {
                if(err) {
                    return reject(err);
                }
                console.log("The file was saved!");
                let command = []
                command.push('magick')
                command.push(`/tmp/source-${fname}`)
                command.push('-gravity center')
                command.push('-extent "%[fx:h<w?h:w]x%[fx:h<w?h:w]"')
                command.push(`/tmp/${fname}`)
                command = command.join(' ')
                console.log(command)

                exec(command, (err, stdout, stderr) => {
                    if (err) {
                        console.log(`${err} ${stdout} ${stderr}`)
                        reject(err)
                    } else {
                        console.log(`${stdout}`)
                        console.log(image);
                        fs.readFile(`/tmp/${fname}`, function (err, data) {
                            if (err) return reject(err);
                            console.log(data);
                            return resolve(new ImageData(
                                image.fileName,
                                image.bucketName,
                                data,
                                image.headers,
                                acl || image.acl
                            ));
                        });
                    }
                })
            }); 

        });
    }
}

module.exports = ImageResizerExec;
