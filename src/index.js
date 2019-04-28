import { GraphicMagick } from "@app/gm/GraphicMagick"
import {
  sep as separator,
  basename,
  extname
} from "path"
import {
  createReadStream,
  existsSync,
  mkdirsSync
} from "fs-extra"

export default class PDF2Pic extends GraphicMagick {
  /**
   * Intialize converter
   * @param {String} pdf_path path to file
   * @param {Page} page page number to be converted
   * @returns {Object} image status
   */
  async convert(pdf_path, page = 1) {
    this.isValidPDF(pdf_path)
    this.fileExists(pdf_path)

    let output = basename(pdf_path, extname(basename(pdf_path)))

    // Set output dir
    if (this.getOption("savedir")) {
      this.setOption("savedir", this.getOption("savedir") + separator)
    } else {
      this.setOption("savedir", output + separator)
    }

    mkdirsSync(this.getOption("savedir"))

    if (!this.getOption("savename")) {
      this.setOption("savename", output)
    }

    let pages = await this.getPageCount(pdf_path)

    if (page > pages) {
      throw new Error("Cannot convert non-existent page")
    }

    return await this.toImage(pdf_path, page)
  }

  /**
   * Intialize pdftobase64 converter,
   * @param {String} pdf_path path to file
   * @param {Page} page page number to be converted
   * @returns {Object} image status
   */
  async convertToBase64(pdf_path, page = 1) {
    this.isValidPDF(pdf_path)
    this.fileExists(pdf_path)

    let output = basename(pdf_path, extname(basename(pdf_path)))

    // Set output dir
    if (this.getOption("savedir")) {
      this.setOption("savedir", this.getOption("savedir") + separator)
    } else {
      this.setOption("savedir", output + separator)
    }

    mkdirsSync(this.getOption("savedir"))

    if (!this.getOption("savename")) {
      this.setOption("savename", output)
    }

    let pages = await this.getPageCount(pdf_path)

    if (page > pages) {
      throw new Error("Cannot convert non-existent page")
    }

    return await this.streamToBase64(pdf_path, page, true)
  }

  /**
   * Intialize pdftobase64 converter, well the bulk version
   * @param {String} pdf_path path to file
   * @param {Page} pages page number to be converted (-1 for all pages)
   * @returns {Object} image status
   */
  async convertToBase64Bulk(pdf_path, pages = -1) {
    let result = []

    let pageCount = Array.isArray(pages) ? pages : [1]

    pages = pages === -1
      ? await this.getPage(pdf_path)
      : pageCount

    pages = pages.map(page => {
      return this.convertToBase64(pdf_path, page)
    })

    result = await Promise.all(pages)

    return result
  }

  /**
   * Intialize converter, well the bulk version
   * @param {String} pdf_path path to file
   * @param {Page} pages page number to be converted (-1 for all pages)
   * @returns {Object} image status
   */
  async convertBulk(pdf_path, pages = -1) {
    let result = []

    let pageCount = Array.isArray(pages) ? pages : [1]

    pages = pages === -1
      ? await this.getPage(pdf_path)
      : pageCount

      /** not sure yet if this would work */
    pages = pages.map(page => {
      return this.convert(pdf_path, page)
    })

    result = await Promise.all(pages)

    return result
  }

  /**
   * Get how many pages are there in the pdf file
   * @param {String} pdf_path path to file
   * @returns {Integer} number of pages
   */
  async getPageCount(pdf_path) {
    return await this.getPage(pdf_path).length
  }

  /**
   * Get pages numbers
   * @param {String} pdf_path path to file
   * @returns {Array} pages
   */
  async getPage(pdf_path) {
    let page = await this.identify(pdf_path, "%p ")

    return page.split(" ")
  }

  /**
   * Converts pdf to image
   * @param {String} pdf_path pdf path
   * @param {Integer} page page count
   * @returns {Promise} Promise
   */
  async toImage(pdf_path, page = 1) {
    let { savedir, savename, format } = this.getOption()
    let iStream = createReadStream(pdf_path)
    let file = `${savedir.replace(/\/*$/, "/")}${savename}_${page}.${format}`
    let filename = `${this.getFilePath(iStream)}[${page - 1}]`

    return await this.writeImage(iStream, file, filename, page)
  }

  /**
   * Converts pdf to image
   * @param {String} pdf_path pdf path
   * @param {Integer} page page count
   * @returns {Promise} Promise
   */
  async streamToBase64(pdf_path, page = 1) {
    let iStream = createReadStream(pdf_path)
    let filename = `${this.getFilePath(iStream)}[${page - 1}]`

    return await this.toBase64(iStream, filename, page)
  }

  /**
   * Get file path
   * @param {Stream} stream fs stream
   * @returns {String} path
   */
  getFilePath(stream) {
    if (!stream) {
      throw new Error("Invalid Stream")
    }

    return stream.path
  }

  /**
   * Checks if the supplied file has the exact file format
   * @param {String} pdf_path path to file
   * @returns {Mixed} file status
   */
  isValidPDF(pdf_path) {
    if (extname(basename(pdf_path)).toLowerCase() !== ".pdf") {
      throw new Error("File supplied is not a valid PDF")
    }

    return true
  }

  /**
   * Checks if the supplied file has exists
   * @param {String} pdf_path path to file
   * @returns {Mixed} file status
   */
  fileExists(pdf_path) {
    if (!existsSync(pdf_path)) {
      throw new Error("File supplied cannot be found")
    }

    return true
  }

  /**
   * Returns a value from this.options
   * @param {string} key key from this.options
   * @returns {mixed} value from this.options
   */
  getOption(key) {
    return key ? this.options[key] : this.options
  }

  /**
   * Set a key-value to this options
   * @param {*} key key from this.options
   * @param {*} value value to be assigned on this.options[key]
   * @returns {object} this
   */
  setOption(key, value) {
    this.options[key] = value

    return this
  }
}
