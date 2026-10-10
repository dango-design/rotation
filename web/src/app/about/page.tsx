export default function About() {
  return (
    <>
      <header className="page-head">
        <div>
          <div className="eyebrow">How it works</div>
          <h1>Style what you own. Shop what&apos;s missing.</h1>
        </div>
      </header>
      <div className="card card-pad prose">
        <h2>Outfits from your closet</h2>
        <p>
          An outfit is a top, a bottom and shoes, or a dress and shoes, with an optional layer and accessory. Pieces pair when their colors don&apos;t compete,
          two denims aren&apos;t the same wash, and none is much dressier than the rest. Today&apos;s outfit favors pieces you haven&apos;t worn lately, and the weather
          decides whether you need a layer.
        </p>
        <h2>The Outfit Unlock score</h2>
        <p>
          A suggested piece is ranked by how many new outfits it creates with what you already own, adjusted for your style, your size being in stock, and
          whether you already own something similar. A new layer only counts outfits that none of your layers already work with. Exact duplicates are never
          suggested, and the page shows what was left out and why.
        </p>
        <h2>Piece first, store second</h2>
        <p>
          Rotation recommends a kind of piece, then lists options from several stores: your favorite stores first, then the lowest price. Product names and
          prices are examples for now. When real store links arrive, any commission will be disclosed and will never change the ranking.
        </p>
        <h2>Your data</h2>
        <p>
          Your closet is stored in this browser. An account is optional: sign in and your pieces, outfits, plans and photos are also saved to your account,
          so they follow you to your other devices, and only you can see them. Photo backgrounds are always removed on your device. If photo tagging is on,
          a small copy of the photo is sent to Claude to suggest the type and color, and is not stored. You can download or delete everything in Settings.
        </p>
        <p>
          Rotation is an open, in-progress portfolio project.{' '}
          <a className="link" href="https://github.com/dango-design/rotation" target="_blank" rel="noreferrer">
            See the code and the design process
          </a>
          , or {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="link" href="/?demo">explore the demo closet</a>.
        </p>
      </div>
    </>
  );
}
