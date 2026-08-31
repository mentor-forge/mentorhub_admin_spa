// Custom Cypress commands
// Imported from e2e.ts

/**
 * Visit a browser URL under the `/admin/` journey prefix and prove the document really
 * was fetched from that prefixed URL.
 *
 * A plain `cy.visit('/settings')` cannot be caught by `cy.location()`: vue-router's
 * `normalizeBase` trims the base to `/admin`, `stripBase` leaves an un-prefixed pathname
 * untouched, and the bootstrap `history.replaceState` then rewrites the address bar to
 * `/admin/settings`. The app therefore *looks* prefixed while the document was served by
 * nginx's un-prefixed `location /` debug fallback — a shape that does not exist behind
 * welcome nginx or the ALB. `PerformanceNavigationTiming.name` records the URL that was
 * actually fetched and is not rewritten by `replaceState`, so it is the honest check.
 */
Cypress.Commands.add('visitPrefixed', (path: string) => {
  expect(path, 'Cypress visits must carry the /admin/ prefix').to.match(/^\/admin\//)

  cy.visit(path)
  cy.window().then((win) => {
    const [navigation] = win.performance.getEntriesByType('navigation')
    expect(new URL(navigation.name).pathname, 'document URL actually fetched').to.equal(
      path.split('?')[0]
    )
  })
})

declare global {
  namespace Cypress {
    interface Chainable {
      /** `cy.visit` restricted to `/admin/`-prefixed URLs, asserting the fetched document URL. */
      visitPrefixed(path: string): Chainable<void>
    }
  }
}

export {}
