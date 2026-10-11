import ExpoModulesCore

public class CutoutModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Cutout")

    // Vision's foreground instance masks need iOS 17.
    Constant("isSupported") {
      Cutter.isSupported
    }

    AsyncFunction("cutOutAsync") { (uri: String, maxSide: Int, maxPieces: Int) -> [String: Any] in
      guard let source = URL(string: uri), source.isFileURL else {
        throw NotAFileException(uri)
      }
      let folder = FileManager.default.temporaryDirectory.appendingPathComponent("cutouts", isDirectory: true)
      let result: CutResult
      do {
        result = try Cutter.cut(source, maxSide: maxSide, maxPieces: maxPieces, into: folder)
      } catch {
        throw CutFailedException(String(describing: error))
      }
      let piece = { (p: CutPiece) -> [String: Any] in ["uri": p.url.absoluteString, "width": p.width, "height": p.height] }
      var out: [String: Any] = ["pieces": result.pieces.map(piece), "alreadyCut": result.alreadyCut]
      if let together = result.together {
        out["together"] = piece(together)
      }
      return out
    }

    // The lines of text in a photo, for screenshots of product pages.
    AsyncFunction("readTextAsync") { (uri: String, maxSide: Int) -> [[String: Any]] in
      guard let source = URL(string: uri), source.isFileURL else {
        throw NotAFileException(uri)
      }
      do {
        return try TextReader.read(source, maxSide: maxSide).map { ["text": $0.text, "x": $0.x, "y": $0.y, "w": $0.w, "h": $0.h] }
      } catch {
        throw ReadFailedException(String(describing: error))
      }
    }
  }
}

internal final class NotAFileException: GenericException<String> {
  override var reason: String {
    "Expected a file URL for the photo, got \(param.prefix(40))"
  }
}

internal final class CutFailedException: GenericException<String> {
  override var reason: String {
    "Couldn't cut the piece out of the photo: \(param)"
  }
}

internal final class ReadFailedException: GenericException<String> {
  override var reason: String {
    "Couldn't read the text in the photo: \(param)"
  }
}
