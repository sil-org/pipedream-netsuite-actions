import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { default: component } = await import('./exchange_rate_lookup.js')

describe('Exchange Rate Lookup', () => {
  it('should get the expected value for a specific transaction', async (testContext) => {
    if (!process.env.NETSUITE_CONFIG_DEV) {
      testContext.skip('No NETSUITE_CONFIG_DEV env. var. found, so skipping integration test.')
      return
    }
    component.netsuite_config_json = process.env.NETSUITE_CONFIG_DEV
    component.transaction_date = '2023-04-24'
    component.foreign_currency_id = 25

    const response = await component.run({
      steps: { trigger: {} },
      $: {
        export: console.log
      }
    })

    assert.equal(response?.Error, undefined)
    assert.equal(response?.CurrencyRate, 0.738618)
  })
})
