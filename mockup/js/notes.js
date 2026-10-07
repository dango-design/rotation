/* Design rationale shown when "Design notes" is on. Each number matches a data-note pin on that screen. */

const NOTES = {
  today: {
    title: 'Today',
    lede: 'The daily habit: a reason to open the app that has nothing to do with shopping.',
    items: [
      { n: 1, title: 'Closet first, explained', body: 'The outfit is built only from what Jordan owns. Each reason ties to weather, calendar or wear history, so the pick feels earned rather than random.' },
      { n: 2, title: 'Commerce as a utility', body: 'The Fill the gap card leads with value created (26 new outfits) and names a kind of piece, not a product from one store. It is one card, never a carousel.' },
      { n: 3, title: 'A reason to return weekly', body: 'Closet health turns cost-per-wear and utilization into a light progress loop. North-star metric: outfits worn per active person per week.' },
      { n: 4, title: 'Rediscover what you own', body: 'Under-worn pieces come back as ready outfits. Re-wearing is the cheapest way to make a closet feel new.' },
    ],
  },
  closet: {
    title: 'Closet',
    lede: 'Solving the cold-start problem that every closet app leaves to the customer.',
    items: [
      { n: 1, title: 'Your inbox does the work', body: 'Order-confirmation emails from major stores arrive with product photos, sizes and colors, so most of a closet is built without typing. Indyx sells a $295 in-home service to do this by hand.' },
      { n: 2, title: 'Provenance on every item', body: 'Badges show where each item came from (email, photo or link). People trust a closet more when they can see why something is there.' },
      { n: 3, title: 'Every store, equally', body: 'Jordan shops at 15 stores. The closet treats them the same; no store gets special placement.' },
      { n: 4, title: 'Value, reframed', body: 'Cost-per-wear on every card shifts attention from price paid to value received.' },
    ],
  },
  builder: {
    title: 'Outfit builder',
    lede: 'Where owned pieces and new pieces meet, with the customer in control.',
    items: [
      { n: 1, title: 'Smart flat-lay', body: 'Pieces snap to slots instead of free placement, so composing is fast and every saved outfit looks consistent when shared. A free-form canvas is a later option.' },
      { n: 2, title: 'Owned pieces first, least-worn on top', body: 'Suggestions start with what Jordan owns, sorted to bring forgotten pieces back into rotation.' },
      { n: 3, title: 'Try a piece before choosing a store', body: 'A suggested piece previews on the board with a dashed outline next to the clothes it would be worn with. The store comes later, in Compare stores.' },
      { n: 4, title: 'Live pairing check', body: 'Rule-based pairing (color, denim wash, formality) explains clashes in plain words. Saves, wears and skips tune it per person over time.' },
      { n: 5, title: 'The customer holds the switch', body: 'Shopping suggestions can be turned off in one tap. Guardrail metric: the share of people who switch it off.' },
    ],
  },
  fill: {
    title: 'Fill the gap',
    lede: 'Recommend the piece that adds the most to this closet, then let the customer choose the store.',
    items: [
      { n: 1, title: 'Piece first, store second', body: 'The app recommends a kind of piece ranked by Outfit Unlock: the outfits it creates with what Jordan owns, adjusted for style fit and duplication. Stores are options, not the recommendation.' },
      { n: 2, title: 'Every pick explains itself', body: 'One line says what it pairs with and what is missing today. Explanations make the ranking easy to trust and to test.' },
      { n: 3, title: 'Your size, per store', body: 'Sizes come from past orders at each store, and from similar brands where there is no history. Fit is the top reason for apparel returns.' },
      { n: 4, title: 'What we didn’t recommend', body: 'Showing the duplicate hoodie and the jackets that add nothing proves the ranking is on the customer’s side.' },
      { n: 5, title: 'How we make money, in the open', body: 'Commissions are disclosed and never change the ranking. Stores are ordered by the customer’s favorites, then price.' },
    ],
  },
  planner: {
    title: 'Planner',
    lede: 'Plan the week around calendar and forecast, and spot gaps before they become last-minute purchases.',
    items: [
      { n: 1, title: 'Context from calendar and weather', body: 'Events and the forecast set the formality and layers for each day.' },
      { n: 2, title: 'Rediscovery in the plan', body: 'Friday pairs two under-worn pieces, the blazer and the burgundy sweater, for a dinner look.' },
      { n: 3, title: 'Trip gap, honest alternative', body: 'The trip card names one missing piece, and also offers an owned option that partly covers it.' },
    ],
  },
  insights: {
    title: 'Insights',
    lede: 'Show people their closet is working, so they keep using it.',
    items: [
      { n: 1, title: 'Value, not vanity', body: 'Outfits possible, utilization and cost-per-wear all rise when the closet is used, so the app and the customer want the same thing.' },
      { n: 2, title: 'Waiting to be worn', body: 'Low-wear items get a direct path to an outfit, the cheapest way to deliver value without a new purchase.' },
    ],
  },
  journey: {
    title: 'Across the journey',
    lede: 'One closet at every stage of shopping, at any store, online and in person.',
    items: [
      { n: 1, title: 'A closet moment at every stage', body: 'Each stage has a customer thought, a closet-powered moment and the metric it should move.' },
      { n: 2, title: 'Neutral by design', body: 'Ranking, store order and disclosure rules are product decisions, written down and visible to the customer.' },
    ],
  },
};
