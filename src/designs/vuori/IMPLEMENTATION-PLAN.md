# Vuori inspired Eleven Forward direction

## Intent
Create a quiet editorial storefront using only existing Eleven Forward photography, product concepts, marks, and copy. Vuori supplies the pacing reference: large campaigns followed by product discovery and community storytelling. Eleven Forward retains its identity and all existing concept disclosures.

## Visual system
White and chalk pages, charcoal text, stone product grounds, and muted olive mission emphasis. Existing Inter with regular display weights, large tightly spaced headings, understated labels, fine rules, and generous white space. Full-width portrait photography establishes an editorial first impression. No invented lifestyle imagery or product claims.

## Home sequence
1. Founder portrait fills the hero with an accessible dark gradient, existing lived-experience headline, and story CTA.
2. Centered mission statement creates a quiet pause.
3. Three product cards provide direct catalog discovery.
4. Wide P001 campaign image with existing product description and concept caption beneath.
5. Asymmetric Survival Club composition combines black-back and white-front imagery with existing community copy.
6. Founder portrait and biography revisit the lived experience behind the brand.
7. Mark section explains the surgery date, forward lean, and ascending forms.
8. Coordinator supplies newsletter, header, footer, and shared commerce.

## Secondary pages
Collection uses a centered introduction, count row, and three-column product grid. Product uses a large image contact sheet beside a sticky purchase panel with shared controls and disclosed concept imagery. Survival Club uses a black/white diptych, community statement, and individual product editorials.

## Responsive behavior
Desktop uses 48px page gutters and broad image compositions. Tablet reduces gutters to 28px and simplifies the tee editorial to two columns. Mobile uses 20px gutters, stacked stories, a two-column catalog, and an independently scrollable product gallery. Reduced motion removes image-hover transitions.

## Integration and checks
Only src/designs/vuori is owned by this implementation. Export home, collection, product, and club from index.cjs. Route every internal URL through ctx.url and every image through ctx.asset. Delegate cart and variant interaction to ctx.productControls. All styles are scoped below [data-design=vuori]. Syntax validation uses node --check; coordinator performs integrated screenshots and interaction review.
