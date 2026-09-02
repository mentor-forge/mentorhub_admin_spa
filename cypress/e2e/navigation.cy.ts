/**
 * Host routing and PageFrame wiring for Admin.
 * Hamburger catalog role gates and collection hrefs are covered in spa_utils.
 */
describe('Navigation (spa_utils PageFrame)', () => {
  const APP_ORIGIN = Cypress.config('baseUrl') as string
  const SETTINGS_PATHNAME = '/admin/settings'
  const CONFIG_PATHNAME = '/admin/config'
  const IDP_STUB_PATHNAME = '/login.html'
  const SETTINGS_HREF = `${APP_ORIGIN}${CONFIG_PATHNAME}`

  const adminConfigBody = {
    config_items: [],
    versions: [],
    enumerators: [],
    token: {
      profile_id: 'profile-e2e',
      customer_id: 'customer-e2e',
      mentor_id: 'mentor-e2e',
    },
  }

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

  function stubAdminConfig() {
    cy.intercept('GET', '**/admin/api/config', adminConfigBody).as('getAdminConfig')
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

  it('shows Admin PageFrame chrome and hosts Settings at /admin/config', () => {
    stubAdminConfig()
    cy.login(['admin'])
    cy.wait('@getAdminConfig')

    cy.get('[data-automation-id="page-frame-title"]')
      .should('be.visible')
      .and('contain.text', 'Admin')
    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible')
    cy.get('[data-automation-id="nav-profile-link"]').should('be.visible')

    cy.get('[data-automation-id="nav-drawer-toggle"]').click({ force: true })
    cy.get('[data-automation-id="nav-settings-link"]')
      .should('have.attr', 'href', SETTINGS_HREF)
      .click()
    cy.wait('@getAdminConfig')
    cy.location('origin').should('eq', APP_ORIGIN)
    cy.location('pathname').should('eq', CONFIG_PATHNAME)
    cy.url().should('not.include', '/admin/admin')
    cy.get('[data-automation-id="admin-config-page"]').should('be.visible')

    cy.get('[data-automation-id="admin-tab-token"]').click()
    cy.get('[data-automation-id="admin-token-profile-id-display"]')
      .find('input')
      .should('have.value', 'profile-e2e')
    cy.get('[data-automation-id="admin-token-customer-id-display"]')
      .find('input')
      .should('have.value', 'customer-e2e')
    cy.get('[data-automation-id="admin-token-mentor-id-display"]')
      .find('input')
      .should('have.value', 'mentor-e2e')
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
    cy.visit('/admin/settings')

    cy.location('pathname', { timeout: 10000 }).should('eq', IDP_STUB_PATHNAME)
    cy.location('search').then((search) => {
      const returnTo = new URLSearchParams(search).get('return_to') ?? ''
      expect(new URL(returnTo).pathname).to.equal('/admin/settings')
    })
  })

  it('keeps an admin on /admin/config', () => {
    stubAdminConfig()
    cy.login(['admin'])
    cy.visitPrefixed(CONFIG_PATHNAME)

    cy.location('origin').should('eq', APP_ORIGIN)
    cy.location('pathname').should('eq', CONFIG_PATHNAME)
    cy.url().should('not.include', '/admin/admin')
    cy.get('[data-automation-id="admin-tab-token"]').should('be.visible')
  })

  it('does not keep a non-admin on /admin/config showing AdminPage', () => {
    cy.intercept('GET', 'http://localhost:8080/discovery/', {
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      body: '<html><head><title>Discovery Stub</title></head><body>discovery shell</body></html>',
    }).as('discoveryShell')

    cy.task<{ token: string; expiresAt: string }>('signCypressJwt', {
      roles: ['mentee'],
      secret: Cypress.env('JWT_SECRET'),
    }).then(({ token, expiresAt }) => {
      cy.visit(CONFIG_PATHNAME, {
        onBeforeLoad(win) {
          win.localStorage.setItem('access_token', token)
          win.localStorage.setItem('token_expires_at', expiresAt)
          win.localStorage.setItem('user_roles', JSON.stringify(['mentee']))
        },
      })
    })

    cy.wait('@discoveryShell', { timeout: 15000 })
      .its('request.url')
      .should('match', /:8080\/discovery\/?$/)

    cy.origin('http://localhost:8080', { args: { CONFIG_PATHNAME } }, ({ CONFIG_PATHNAME }) => {
      cy.location('pathname', { timeout: 10000 }).should('eq', '/discovery/')
      cy.location('pathname').should('not.eq', CONFIG_PATHNAME)
      cy.get('[data-automation-id="admin-config-page"]').should('not.exist')
      cy.get('[data-automation-id="admin-tab-token"]').should('not.exist')
      cy.get('[data-automation-id="admin-tab-config"]').should('not.exist')
    })
  })

  it('should clear auth and leave for the IdP login URL on logout', () => {
    stubIdpLoginUri()
    cy.login(['admin'])

    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible').click({ force: true })
    cy.get('[data-automation-id="nav-logout-link"]').should('be.visible').click()

    cy.location('pathname', { timeout: 10000 }).should('eq', IDP_STUB_PATHNAME)
    cy.location('search').then((search) => {
      const returnTo = new URLSearchParams(search).get('return_to')
      expect(returnTo, 'logout return_to').not.to.equal(null)
      const returnUrl = new URL(returnTo!)
      expect(returnUrl.href).to.equal('http://localhost:8080/discovery/')
      expect(returnUrl.hostname).to.equal('localhost')
      expect(returnUrl.port).to.equal('8080')
      expect(returnUrl.pathname).to.equal('/discovery/')
      expect(returnUrl.href).not.to.include('127.0.0.1')
      expect(returnUrl.pathname).not.to.equal('/')
      expect(returnUrl.pathname).not.to.equal('/admin/')
      expect(returnUrl.pathname).not.to.equal('/admin/settings')
      expect(returnUrl.href).not.to.include('/admin/')
    })
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
