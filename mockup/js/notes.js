/* Design rationale shown when "Design notes" is on. Each number matches a data-note pin on that screen. */

const NOTES = {
  today: {
    title: 'Today',
    lede: 'The daily habit that keeps Gap in the customer’s life between orders.',
    items: [
      { n: 1, title: 'Closet first, explained', body: 'The outfit is built from what Jordan owns and weighted toward Gap Inc. pieces. Each reason ties to weather, calendar or wear history, so the pick feels earned rather than random.' },
      { n: 2, title: 'Commerce as a utility', body: 'The Fill the gap card leads with value created (26 new outfits) and the reason, not the product. It is one card, never a carousel.' },
      { n: 3, title: 'A reason to return weekly', body: 'Closet health turns cost-per-wear and utilization into a light progress loop. Metric: outfits worn per active customer per week.' },
      { n: 4, title: 'Rediscover owned Gap pieces', body: 'Under-worn Gap Inc. purchases come back as ready outfits. Re-wear raises perceived value of past purchases and keeps the brand present without a sale.' },
    ],
  },
  closet: {
    title: 'Closet',
    lede: 'Solving the cold-start problem that every closet app leaves to the customer.',
    items: [
      { n: 1, title: 'Purchase sync replaces data entry', body: 'Gap Inc. orders, online or linked to a rewards account in store, arrive with product photos, sizes and colors. Indyx sells a $295 in-home service to do this by hand.' },
      { n: 2, title: 'Provenance on every item', body: 'Badges show where each item came from (synced, photo, link). Customers trust a closet more when they can see why something is there.' },
      { n: 3, title: 'Brand-agnostic by design', body: 'Uniqlo, Levi’s and Nike live here too. A Gap-only closet would be a catalog, and the outfits would be wrong.' },
      { n: 4, title: 'Value, reframed', body: 'Cost-per-wear on every card shifts attention from price paid to value received, which favors durable essentials.' },
    ],
  },
  builder: {
    title: 'Outfit builder',
    lede: 'Where owned pieces and new Gap pieces meet, with the customer in control.',
    items: [
      { n: 1, title: 'Smart flat-lay', body: 'Pieces snap to slots instead of free placement, so composing is fast and every saved outfit looks consistent when shared. Free-form canvas is a later option.' },
      { n: 2, title: 'Gap-first, never Gap-only', body: 'Suggestions rank owned Gap Inc. pieces, then other owned pieces, then new Gap items by Outfit Unlock score. Hiding owned pieces would break trust.' },
      { n: 3, title: 'Try before you buy, with your closet', body: 'A shop item previews on the board with a dashed outline and price, next to the clothes it will actually be worn with.' },
      { n: 4, title: 'Live pairing check', body: 'Rule-based pairing (color, denim wash, formality) explains clashes in plain words. Saves, wears and skips tune it per customer over time.' },
      { n: 5, title: 'Customer holds the switch', body: 'Shopping suggestions can be turned off in one tap. Metric guardrail: share of customers who switch it off.' },
    ],
  },
  fill: {
    title: 'Fill the gap',
    lede: 'The business engine: recommend the Gap piece that creates the most value for this closet.',
    items: [
      { n: 1, title: 'Outfit Unlock score', body: 'Each new Gap item is ranked by the outfits it creates with owned pieces, adjusted for style fit, size availability and duplication.' },
      { n: 2, title: 'Every pick explains itself', body: 'One line says what it pairs with and what is missing today. Explanations make ranking legible and give merchandising a story to test.' },
      { n: 3, title: 'Omnichannel by default', body: 'Pickup in store sits beside add to bag, connecting the digital recommendation to the nearest store.' },
      { n: 4, title: 'What we didn’t recommend', body: 'Showing the duplicate hoodie and the jackets that add nothing proves the system is on the customer’s side. Fewer, better picks should lower returns.' },
    ],
  },
  planner: {
    title: 'Planner',
    lede: 'Plan the week around calendar and forecast, and spot gaps before they become last-minute purchases.',
    items: [
      { n: 1, title: 'Context from calendar and weather', body: 'Events and the forecast set the formality and layers for each day.' },
      { n: 2, title: 'Rediscovery in the plan', body: 'Friday pairs two under-worn Gap pieces, the blazer and soft knit sweater, for a dinner look.' },
      { n: 3, title: 'Trip gap, honest alternative', body: 'The trip card names one missing piece with pickup today, and also offers an owned option that partly covers it.' },
    ],
  },
  insights: {
    title: 'Insights',
    lede: 'Customer value and Gap’s business metrics, told as one story.',
    items: [
      { n: 1, title: 'Shared scoreboard', body: 'Utilization and cost-per-wear are what the customer cares about; Gap share of outfits is what the business cares about. Both rise when the closet is used.' },
      { n: 2, title: 'Waiting to be worn', body: 'Low-wear items get a direct path to an outfit, the cheapest way to deliver value without a new purchase.' },
    ],
  },
  journey: {
    title: 'Across the journey',
    lede: 'One closet powering every stage of the Gap customer journey, online and in store.',
    items: [
      { n: 1, title: 'A closet moment at every stage', body: 'Each stage has a customer thought, a closet-powered moment and the metric it should move.' },
      { n: 2, title: 'Shared platform, brand-distinct expression', body: 'The closet, pairing engine and rewards identity are shared across Gap Inc. Each brand keeps its own voice, visuals and which catalog leads.' },
    ],
  },
};
