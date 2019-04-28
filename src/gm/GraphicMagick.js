import "gm-base64"
import gm from "gm"
import { basename } from "path"
import { statSync } from "fs-extra"

export class GraphicMagick {
  static defaultOptions = {
    quality: 0,
    format: "png",
    size: "768x512",
    density: 72,
    savedir: "./",
    savename: "untitled",
    compression: "jpeg"
  }

  options = {}

  constructor(options = {}) {
    this.options = { ...GraphicMagick.defaultOptions, ...options }
  }

  /**
   * GM command - identify
   * @param {String} filepath path to valid file
   * @param {Mixed} argument gm identify argument
   * @returns {Promise} Promise
   */
  identify(filepath, argument) {
    let image = gm(filepath)

    return new Promise((resolve, reject) => {
      if (argument) {
        image.identify(argument, (error, data) => {
          if (error) {
            return reject(error)
          }

          return resolve(data)
        })
      } else {
        image.identify((error, data) => {
          if (error) {
            return reject(error)
          }

          return resolve(data)
        })
      }
    })
  }

  /**
   * Initialize base graphicmagick setup.
   * @param {Stream} stream fs stream
   * @param {String} filename save file name
   * @returns {gm} graphicsmagick object
   */
  graphicMagickBaseCommand(stream, filename) {
    let { density, size, quality, compression } = this.options

    return gm(stream, filename)
      .density(density, density)
      .resize(size)
      .quality(quality)
      .compress(compression)
  }

  /**
   * graphicMagickBaseCommand -> write
   * @param {Stream} stream fs stream
   * @param {String} filename save file name
   * @param {String} output save file name
   * @param {String} callback save file name
   * @returns {gm} graphicmagick object
   */
  graphicMagickWrite(stream, filename, output, callback) {
    return this.graphicMagickBaseCommand(stream, filename).write(output, callback)
  }

  /**
   * graphicMagickBaseCommand -> base64
   * @param {Stream} stream fs stream
   * @param {String} filename save file name
   * @param {String} format save file name
   * @param {String} callback save file name
   * @returns {gm} graphicmagick object
   */
  graphicMagickBase64Output(stream, filename, format, callback) {
    return this.graphicMagickBaseCommand(stream, filename).toBase64(format, callback)
  }

  /**
   * GM command - write
   * @param {Stream} stream fs stream
   * @param {String} output output
   * @param {String} filename filename
   * @param {Integer} page page count
   * @returns {Promise} Promise
   */
  writeImage(stream, output, filename, page) {
    return new Promise((resolve, reject) => {
      this.graphicMagickWrite(stream, filename, output, (error) => {
        if (error) {
          return reject(error)
        }

        return resolve({
          name: basename(output),
          size: statSync(output).size / 1000.0,
          path: output,
          page
        })
      })
    })
  }

  /**
   * GM command - toBase64
   * @param {Stream} stream fs stream
   * @param {String} filename filename
   * @param {Integer} page page count
   * @returns {Promise} Promise
   */
  toBase64(stream, filename, page) {
    let { format } = this.options

    return new Promise((resolve, reject) => {
      this.graphicMagickBase64Output(stream, filename, format, (error, base64) => {
        if (error) {
          return reject(error)
        }

        return resolve({
          base64,
          page
        })
      })
    })
  }
}
