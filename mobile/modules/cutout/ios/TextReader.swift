// Reads the lines of text in a photo with Apple's Vision text recognition (the same as Live Text), on the device.
// Used for screenshots of product pages. Kept free of UIKit, like Cutter, so it also runs on a Mac.

import CoreGraphics
import Foundation
import Vision

struct TextLine {
  let text: String
  /// Position and size in fractions of the image's width, from the top left, so sizes compare across the image.
  let x: Double
  let y: Double
  let w: Double
  let h: Double
}

enum TextReader {
  static func read(_ source: URL, maxSide: Int) throws -> [TextLine] {
    let image = try Cutter.load(source, maxSide: maxSide)
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
    // Vision's boxes are in fractions of each side, from the bottom left.
    let tall = Double(image.height) / Double(image.width)
    return (request.results ?? []).compactMap { line -> TextLine? in
      guard let text = line.topCandidates(1).first?.string else { return nil }
      let b = line.boundingBox
      return TextLine(text: text, x: b.minX, y: (1 - b.maxY) * tall, w: b.width, h: b.height * tall)
    }
  }
}
