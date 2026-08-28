describe('Admin Navigation & Runtime Config', () => {
  const openDrawer = () => {
    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible').click()
  }

  const assertAlbHref = (automationId: string, pathname: string) => {
    cy.get(`[data-automation-id="${automationId}"]`)
      .should(($link) => {
        const href = $link.attr('href')
        expect(href).to.eq(`http://localhost:8080${pathname}`)
        expect(href).not.to.include(':8390')
        expect(href).not.to.include('/admin/admin')
      })
  }

  it('renders PageFrame chrome with Admin title and drawer links', () => {
    cy.login(['admin'])
    cy.visit('/admin/')

    // Should redirect /admin/ -> /admin/settings
    cy.location('pathname').should('eq', '/admin/settings')

    cy.get('[data-automation-id="page-frame-title"]')
      .should('be.visible')
      .and('contain.text', 'Admin')

    assertAlbHref('nav-profile-link', '/customer/profile/')

    openDrawer()
    assertAlbHref('nav-products-link', '/discovery/products')
    assertAlbHref('nav-settings-link', '/admin/settings')
    cy.get('[data-automation-id="nav-logout-link"]').scrollIntoView().should('be.visible')
  })

  it('loads /admin/logs and /admin/config through history fallback', () => {
    cy.login(['admin'])

    cy.visit('/admin/logs')
    cy.get('[data-automation-id="admin-logs-page"]').should('be.visible')

    cy.visit('/admin/config')
    cy.get('[data-automation-id="admin-config-page"]').should('be.visible')
  })

  it('redirects unauthenticated visitor to login', () => {
    cy.clearLocalStorage()
    cy.visit('/admin/settings')
    cy.origin('http://localhost:8080', () => {
      cy.location('pathname', { timeout: 10000 }).should('eq', '/login.html')
      cy.location('search').should('include', 'return_to=')
    })
  })

  it('redirects non-admin role away from admin pages', () => {
    cy.login(['admin'])
    cy.window().then((win) => {
      win.localStorage.setItem('user_roles', JSON.stringify(['mentee']))
    })
    cy.visit('/admin/settings')
    cy.origin('http://localhost:8080', () => {
      cy.location('pathname', { timeout: 10000 }).should('include', '/discovery')
    })
  })

  it('serves runtime-config on both /admin/runtime-config.js and /runtime-config.js', () => {
    cy.request('/admin/runtime-config.js').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.include('__MENTORHUB_RUNTIME__')
      expect(response.headers['cache-control']).to.include('no-store')
    })

    cy.request('/runtime-config.js').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.include('__MENTORHUB_RUNTIME__')
      expect(response.headers['cache-control']).to.include('no-store')
    })
  })
})
