/**
 * Navigation chrome coverage for the spa_utils `PageFrame` shell under the `/admin/` base.
 *
 * Every automation id asserted here is compiled into `@mentor-forge/mentorhub_spa_utils`
 * (`nav-drawer-toggle`, `page-frame-title`, `nav-profile-link`, `nav-home-link`,
 * `nav-notifications-link`, `nav-products-link`, `nav-settings-link`, `nav-logout-link`).
 * This SPA defines no `nav-*` id of its own.
 *
 * Role-gated rows are asserted as an exact, ordered id list read from the DOM rather than
 * by naming every absent row, because `cy.login()` with no argument seeds an **admin**
 * token: a bare `cy.login()` would show Products and Settings too.
 */
describe('Navigation (spa_utils PageFrame)', () => {
  const APP_ORIGIN = Cypress.config('baseUrl') as string
  const SETTINGS_PATHNAME = '/admin/settings'
  const IDP_STUB_PATHNAME = '/login.html'

  /** Point the container's IdP at a same-origin stub: the real value is a cross-origin
   *  Tailscale MagicDNS host, and `runtime-config.js` is the highest-priority source. */
  function stubIdpLoginUri() {
    cy.intercept('GET', '**/admin/runtime-config.js', {
      statusCode: 200,
      headers: { 'content-type': 'application/javascript', 'cache-control': 'no-store' },
      body: `window.__MENTORHUB_RUNTIME__ = Object.assign(window.__MENTORHUB_RUNTIME__ || {}, { IDP_LOGIN_URI: '${APP_ORIGIN}${IDP_STUB_PATHNAME}' });`,
    }).as('getRuntimeConfig')

    cy.intercept('GET', `**${IDP_STUB_PATHNAME}*`, {
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      body: '<html><head><title>Stub IdP</title></head><body>stub idp login</body></html>',
    }).as('getIdpLogin')
  }

  function openDrawer() {
    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible').click({ force: true })
    cy.get('.v-navigation-drawer', { timeout: 5000 }).should('be.visible')
  }

  /** Ordered automation ids of the catalog rows (the drawer's first list, above the divider). */
  function drawerCatalogIds() {
    return cy
      .get('.v-navigation-drawer .v-list')
      .first()
      .find('[data-automation-id]')
      .then(($rows) => [...$rows].map((row) => row.getAttribute('data-automation-id') ?? ''))
  }

  function assertAlbHref(automationId: string, expectedPath: string) {
    cy.get(`[data-automation-id="${automationId}"]`)
      .should('match', 'a')
      .and('have.attr', 'href')
      .then((href) => {
        const url = new URL(String(href))
        expect(url.port, `${automationId} port`).to.equal('8080')
        expect(url.pathname, `${automationId} pathname`).to.equal(expectedPath)
        expect(String(href)).not.to.include(':8390')
        expect(String(href)).not.to.include('/admin/admin')
      })
  }

  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('should serve the app shell and its assets under the /admin/ prefix', () => {
    cy.login(['admin'])

    cy.location('pathname').should('eq', SETTINGS_PATHNAME)
    cy.document().then((doc) => {
      const sources = [...doc.querySelectorAll('script[src]')].map((tag) => tag.getAttribute('src'))
      expect(sources, 'runtime config is fetched under the prefix').to.include(
        '/admin/runtime-config.js'
      )
      expect(
        sources.some((src) => src?.startsWith('/admin/assets/')),
        'app bundle is fetched under the prefix'
      ).to.equal(true)
    })
  })

  it('should send API requests to the prefixed /admin/api base', () => {
    cy.intercept('GET', '**/api/config', { statusCode: 200, body: { enumerators: [] } }).as(
      'anyConfigRequest'
    )
    cy.login(['admin'])

    cy.wait('@anyConfigRequest').then((interception) => {
      expect(new URL(interception.request.url).pathname).to.equal('/admin/api/config')
    })
  })

  it('should show Admin chrome, profile link, and admin drawer catalog', () => {
    cy.login(['admin'])

    cy.get('[data-automation-id="page-frame-title"]')
      .should('be.visible')
      .and('contain.text', 'Admin')

    assertAlbHref('nav-profile-link', '/customer/profile/')

    openDrawer()
    drawerCatalogIds().should('deep.equal', [
      'nav-home-link',
      'nav-products-link',
      'nav-notifications-link',
      'nav-settings-link',
    ])
    assertAlbHref('nav-home-link', '/discovery/')
    assertAlbHref('nav-products-link', '/discovery/products')
    assertAlbHref('nav-notifications-link', '/discovery/notifications')
    assertAlbHref('nav-settings-link', '/admin/settings')
    cy.get('[data-automation-id="nav-logout-link"]').scrollIntoView().should('be.visible')
  })

  it('loads /admin/logs and /admin/config through history fallback', () => {
    cy.login(['admin'])

    cy.visitPrefixed('/admin/logs')
    cy.get('[data-automation-id="admin-logs-page"]').should('be.visible')

    cy.visitPrefixed('/admin/config')
    cy.get('[data-automation-id="admin-config-page"]').should('be.visible')
  })

  it('redirects unauthenticated visitor to login with prefixed return_to', () => {
    stubIdpLoginUri()
    // Plain `cy.visit`: the guard leaves for the IdP during bootstrap, so by the time
    // `cy.visitPrefixed` could read the navigation entry the document is the IdP stub.
    cy.visit('/admin/settings')

    cy.location('pathname', { timeout: 10000 }).should('eq', IDP_STUB_PATHNAME)
    cy.location('search').then((search) => {
      const returnTo = new URLSearchParams(search).get('return_to') ?? ''
      expect(new URL(returnTo).pathname).to.equal('/admin/settings')
    })
  })

  it('redirects non-admin role away from admin pages to Discovery', () => {
    // chromeWebSecurity: false lets Cypress observe the cross-origin replace.
    // localStorage does not cross :8390 → :8080, so Discovery may immediately
    // IdP-redirect after the shell loads — assert the document fetch, not the final URL.
    cy.intercept('GET', 'http://localhost:8080/discovery/').as('discoveryShell')

    cy.login(['admin'])
    cy.location('pathname').should('eq', '/admin/settings')

    cy.window().then((win) => {
      // Least privilege: hasStoredRole reads localStorage user_roles.
      win.localStorage.setItem('user_roles', JSON.stringify(['mentee']))
    })

    cy.visit('/admin/logs')

    cy.wait('@discoveryShell', { timeout: 15000 })
      .its('request.url')
      .should('match', /:8080\/discovery\/?$/)
  })

  it('should clear auth and leave for the IdP login URL on logout', () => {
    stubIdpLoginUri()
    cy.login(['admin'])

    openDrawer()
    cy.get('[data-automation-id="nav-logout-link"]').should('be.visible').click()

    // `PageFrame` returns to the ROOT origin, not `/admin/` (recorded spa_utils limitation),
    // so only the IdP pathname and the presence of `return_to` are asserted.
    cy.location('pathname', { timeout: 10000 }).should('eq', IDP_STUB_PATHNAME)
    cy.location('search').should('include', 'return_to=')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('access_token')).to.equal(null)
      expect(win.localStorage.getItem('user_roles')).to.equal(null)
    })
  })

  it('should serve the real container IdP config from the prefixed runtime-config.js', () => {
    cy.request('/admin/runtime-config.js').then((response) => {
      expect(response.status).to.equal(200)
      expect(response.headers['cache-control']).to.contain('no-store')

      const configured = /IDP_LOGIN_URI:\s*'([^']+)'/.exec(String(response.body))?.[1] ?? ''
      expect(new URL(configured).pathname).to.equal('/login.html')
      expect(new URL(configured).port).to.equal('8080')
    })
  })
})
