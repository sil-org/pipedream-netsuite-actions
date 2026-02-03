import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { format } from 'node:util'

const { default: component } = await import('./exchange_rate_lookup.js')

describe.only('Exchange Rate Lookup', () => {
  it.only('should get the expected value for a specific transaction', async (testContext) => {
    if (!process.env.NETSUITE_CONFIG_DEV) {
      testContext.skip('No NETSUITE_CONFIG_DEV env. var. found, so skipping integration test.')
      return
    }
    component.netsuite_config_json = process.env.NETSUITE_CONFIG_DEV
    component.transaction_date = '2023-04-24'
    component.foreign_currency_id = 25
    component.file_name = 'EXAMPLE.csv'
    component.transaction_id = '123'

    const response = await component.run({
      steps: { trigger: {} },
      $: {
        export: console.log
      }
    })

    assert.equal(response?.Error, undefined)
    assert.equal(response?.CurrencyRate, 0.738618)
  })

  it('should handle errors gracefully', async (testContext) => {
    if (!process.env.NETSUITE_CONFIG_DEV) {
      testContext.skip('No NETSUITE_CONFIG_DEV env. var. found, so skipping integration test.')
      return
    }

    // Change the credentials slightly to cause an error response:
    let netSuiteConfig = JSON.parse(process.env.NETSUITE_CONFIG_DEV)
    netSuiteConfig.token_secret = netSuiteConfig.token_secret + 'X'
    component.netsuite_config_json = JSON.stringify(netSuiteConfig)

    component.transaction_date = '2023-04-24'
    component.foreign_currency_id = 25

    const response = await component.run({
      steps: { trigger: {} },
      $: {
        export: console.log
      }
    })

    assert.equal(
      response?.Error,
      format(
        'ERROR: Exchange Rate search was not successful.\n'
        + 'FileName: %s | Transaction Date: %s | Currency ID: %s | Transaction ID: %s\n'
        + 'NetSuite Error Message: %s',
        component.file_name,
        component.transaction_date,
        component.foreign_currency_id,
        component.transaction_id,
        'Failed to execute SuiteQL query: Invalid login attempt. For more details, see the Login '
        + 'Audit Trail in the NetSuite UI at Setup > Users/Roles > User Management > '
        + 'View Login Audit Trail.'
      )
    )
    assert.equal(response?.CurrencyRate, undefined)
  })
})
