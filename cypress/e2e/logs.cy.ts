describe('Logs Page (External Events)', () => {
  beforeEach(() => {
    cy.login(['admin'])
  })

  it('renders logs page chrome, source selector, and table', () => {
    cy.visit('/admin/logs')

    cy.get('[data-automation-id="admin-logs-page"]').should('be.visible')
    cy.get('[data-automation-id="admin-logs-source-select"]').should('be.visible')
    cy.get('[data-automation-id="admin-logs-refresh-button"]').should('be.visible')
    cy.get('[data-automation-id="admin-logs-table"]').should('be.visible')
  })

  it('filters external events by source and syncs with URL query parameter', () => {
    cy.visit('/admin/logs')

    // Filter by Stripe
    cy.get('[data-automation-id="admin-logs-source-select"]').click()
    cy.get('.v-list-item').contains('Stripe').click()
    cy.location('search').should('include', 'source=stripe')

    // Filter by Cognito
    cy.get('[data-automation-id="admin-logs-source-select"]').click()
    cy.get('.v-list-item').contains('Cognito').click()
    cy.location('search').should('include', 'source=cognito')

    // Filter by All
    cy.get('[data-automation-id="admin-logs-source-select"]').click()
    cy.get('.v-list-item').contains('All').click()
    cy.location('search').should('not.include', 'source=')
  })

  it('refreshes logs on clicking the Refresh button', () => {
    cy.visit('/admin/logs')
    cy.get('[data-automation-id="admin-logs-refresh-button"]').click()
    cy.get('[data-automation-id="admin-logs-table"]').should('be.visible')
  })
})
