describe('Settings Page (Products & Discounts)', () => {
  beforeEach(() => {
    cy.login(['admin'])
  })

  it('renders products tab by default and switches tabs with URL query sync', () => {
    cy.visitPrefixed('/admin/settings')

    cy.get('[data-automation-id="admin-settings-page"]').should('be.visible')
    cy.get('[data-automation-id="admin-settings-tab-products"]').should('be.visible')
    cy.get('[data-automation-id="admin-products-table"]').should('be.visible')

    // Switch to Discounts tab
    cy.get('[data-automation-id="admin-settings-tab-discounts"]').click()
    cy.location('search').should('include', 'tab=discounts')
    cy.get('[data-automation-id="admin-discounts-table"]').should('be.visible')

    // Switch back to Products tab
    cy.get('[data-automation-id="admin-settings-tab-products"]').click()
    cy.location('search').should('include', 'tab=products')
    cy.get('[data-automation-id="admin-products-table"]').should('be.visible')
  })

  it('deep-links directly to discounts tab via ?tab=discounts', () => {
    cy.visitPrefixed('/admin/settings?tab=discounts')

    cy.get('[data-automation-id="admin-settings-page"]').should('be.visible')
    cy.get('[data-automation-id="admin-discounts-table"]').should('be.visible')
  })

  it('creates, edits, and archives a product row', () => {
    cy.visitPrefixed('/admin/settings')
    cy.get('[data-automation-id="admin-products-table"]').should('be.visible')

    // Add a new product
    cy.get('[data-automation-id="admin-products-add-button"]').click()
    cy.get('[data-automation-id="admin-products-row"]').first().should('be.visible')

    // Edit cell
    cy.get('[data-automation-id="admin-products-row"]')
      .first()
      .within(() => {
        cy.get('[data-automation-id="admin-products-name-input"]')
          .find('input')
          .should('be.visible')
          .clear()
          .type('E2E Test Product{enter}')
      })

    // Delete with confirmation: first cancel
    cy.get('[data-automation-id="admin-products-row"]')
      .first()
      .within(() => {
        cy.get('[data-automation-id="admin-products-delete-button"]').click()
      })

    cy.get('[data-automation-id="admin-products-delete-cancel-button"]').click()

    // Delete with confirmation: confirm
    cy.get('[data-automation-id="admin-products-row"]')
      .first()
      .within(() => {
        cy.get('[data-automation-id="admin-products-delete-button"]').click()
      })

    cy.get('[data-automation-id="admin-products-delete-confirm-button"]').click()
  })

  it('creates, edits, and archives a discount row', () => {
    cy.visitPrefixed('/admin/settings?tab=discounts')
    cy.get('[data-automation-id="admin-discounts-table"]').should('be.visible')

    // Add a new discount
    cy.get('[data-automation-id="admin-discounts-add-button"]').click()
    cy.get('[data-automation-id="admin-discounts-row"]').first().should('be.visible')

    // Edit cell
    cy.get('[data-automation-id="admin-discounts-row"]')
      .first()
      .within(() => {
        cy.get('[data-automation-id="admin-discounts-name-input"]')
          .find('input')
          .should('be.visible')
          .clear()
          .type('E2E Test Discount{enter}')
      })

    // Delete with confirmation: confirm
    cy.get('[data-automation-id="admin-discounts-row"]')
      .first()
      .within(() => {
        cy.get('[data-automation-id="admin-discounts-delete-button"]').click()
      })

    cy.get('[data-automation-id="admin-discounts-delete-confirm-button"]').click()
  })
})
