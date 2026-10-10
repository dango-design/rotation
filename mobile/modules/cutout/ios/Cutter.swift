// Cuts each piece out of a photo with Apple's Vision framework, the same subject lifting Photos uses, on the device.
// Kept free of UIKit so the logic also runs (and can be tried) on a Mac.

import CoreImage
import Foundation
import ImageIO
import UniformTypeIdentifiers
import Vision

struct CutPiece {
  let url: URL
  let width: Int
  let height: Int
}

struct CutResult {
  /// One cutout per piece Vision found, largest first.
  let pieces: [CutPiece]
  /// Every piece together, when there's more than one (a pair of shoes is two pieces to Vision).
  let together: CutPiece?
  /// The photo already had a transparent background, so it was kept as it is.
  let alreadyCut: Bool
}

enum CutterError: Error {
  case unreadable
  case unwritable
}

enum Cutter {
  /// Pieces smaller than this share of the photo are crumbs, not clothes.
  static let minShare = 0.012

  static var isSupported: Bool {
    if #available(iOS 17.0, macOS 14.0, *) { return true }
    return false
  }

  static func cut(_ source: URL, maxSide: Int, maxPieces: Int, into folder: URL) throws -> CutResult {
    let image = try load(source, maxSide: maxSide)
    try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    let stamp = UUID().uuidString.prefix(8)

    if hasClearBackground(image) {
      let piece = try write(image, to: folder.appendingPathComponent("\(stamp)-0.png"))
      return CutResult(pieces: [piece], together: nil, alreadyCut: true)
    }
    guard #available(iOS 17.0, macOS 14.0, *) else { return CutResult(pieces: [], together: nil, alreadyCut: false) }

    let request = VNGenerateForegroundInstanceMaskRequest()
    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    try handler.perform([request])
    guard let found = request.results?.first, !found.allInstances.isEmpty else {
      return CutResult(pieces: [], together: nil, alreadyCut: false)
    }

    let context = CIContext()
    let area = Double(image.width * image.height)
    var cuts: [CGImage] = []
    for instance in found.allInstances {
      let masked = try found.generateMaskedImage(ofInstances: IndexSet(integer: instance), from: handler, croppedToInstancesExtent: true)
      guard let cg = render(masked, context), Double(cg.width * cg.height) / area >= minShare else { continue }
      cuts.append(cg)
    }
    cuts.sort { $0.width * $0.height > $1.width * $1.height }
    cuts = Array(cuts.prefix(maxPieces))

    var pieces: [CutPiece] = []
    for (i, cg) in cuts.enumerated() {
      pieces.append(try write(cg, to: folder.appendingPathComponent("\(stamp)-\(i).png")))
    }
    var together: CutPiece?
    if pieces.count > 1 {
      let all = try found.generateMaskedImage(ofInstances: found.allInstances, from: handler, croppedToInstancesExtent: true)
      if let cg = render(all, context) { together = try write(cg, to: folder.appendingPathComponent("\(stamp)-all.png")) }
    }
    return CutResult(pieces: pieces, together: together, alreadyCut: false)
  }

  /// Reads the photo upright (camera photos carry their rotation separately) and no larger than maxSide.
  static func load(_ url: URL, maxSide: Int) throws -> CGImage {
    guard let src = CGImageSourceCreateWithURL(url as CFURL, nil) else { throw CutterError.unreadable }
    let opts: [CFString: Any] = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceThumbnailMaxPixelSize: maxSide,
    ]
    guard let img = CGImageSourceCreateThumbnailAtIndex(src, 0, opts as CFDictionary) else { throw CutterError.unreadable }
    return img
  }

  /// True when the corners are see-through: a cutout pasted from Photos, which needs no more cutting.
  static func hasClearBackground(_ image: CGImage) -> Bool {
    switch image.alphaInfo {
    case .none, .noneSkipFirst, .noneSkipLast: return false
    default: break
    }
    let side = 16
    var px = [UInt8](repeating: 0, count: side * side * 4)
    let drawn = px.withUnsafeMutableBytes { buf -> Bool in
      guard let ctx = CGContext(data: buf.baseAddress, width: side, height: side, bitsPerComponent: 8, bytesPerRow: side * 4,
                                space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return false }
      ctx.draw(image, in: CGRect(x: 0, y: 0, width: side, height: side))
      return true
    }
    guard drawn else { return false }
    let corners = [0, side - 1, side * (side - 1), side * side - 1]
    return corners.filter { px[$0 * 4 + 3] < 16 }.count >= 3
  }

  private static func render(_ buffer: CVPixelBuffer, _ context: CIContext) -> CGImage? {
    let ci = CIImage(cvPixelBuffer: buffer)
    return context.createCGImage(ci, from: ci.extent, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB))
  }

  private static func write(_ image: CGImage, to url: URL) throws -> CutPiece {
    guard let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else { throw CutterError.unwritable }
    CGImageDestinationAddImage(dest, image, nil)
    guard CGImageDestinationFinalize(dest) else { throw CutterError.unwritable }
    return CutPiece(url: url, width: image.width, height: image.height)
  }
}
