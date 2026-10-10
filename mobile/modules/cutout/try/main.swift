// Tries the cutout on a Mac, outside the app (see mobile/README.md). It sits outside ios/ so it isn't built into the app.
// Usage: cutout <photo> <output folder>

import Foundation

let args = CommandLine.arguments
guard args.count == 3 else {
  print("Usage: cutout <photo> <output folder>")
  exit(1)
}
let result = try Cutter.cut(URL(fileURLWithPath: args[1]), maxSide: 2048, maxPieces: 6, into: URL(fileURLWithPath: args[2]))
if result.alreadyCut { print("Already a cutout; kept as it is.") }
if result.pieces.isEmpty { print("No piece stood out from the background.") }
for piece in result.pieces { print("piece  \(piece.width)×\(piece.height)  \(piece.url.path)") }
if let together = result.together { print("all    \(together.width)×\(together.height)  \(together.url.path)") }
