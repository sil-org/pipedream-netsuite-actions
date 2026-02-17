import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { default: component } = await import('./fill_in_exchange_rates.js')

const fakeCurrencyDataStore = {
  // `get()` needs to be async to match Pipedream Data Store's `get()` function.
  get: async (currency) => sampleCurrencyData[currency],
}

const sampleCurrencyData = {
  PGK: {
    ID: 25,
    Name: 'Papua New Guinean Kina',
  }
}

describe(component.name, () => {
  it('should not re-request an exchange rate we already have', async () => {
    component.methods.emptyCache()
    component.input_records = [
      { Currency: 'PGK', TransactionDate: '2025-11-05', ExchangeRate: 0.23352482368875811498 },
      { Currency: 'PGK', TransactionDate: '2025-11-05' },
    ]
    const response = await component.run({
      steps: { trigger: {} },
      $: {
        export: console.log
      }
    })

    assert.equal(response.length, component.input_records.length)
    for (const responseRecord of response) {
      assert.ok(
        responseRecord.ExchangeRate > 0,
        'A record lacks a valid exchange rate: ' + JSON.stringify(responseRecord)
      )
    }
  })

  it('should not re-request an exchange rate we already have, even if out of order', async () => {
    component.methods.emptyCache()
    component.input_records = [
      { Currency: 'PGK', TransactionDate: '2025-11-05' },
      { Currency: 'PGK', TransactionDate: '2025-11-05', ExchangeRate: 0.23352482368875811498 },
    ]
    const response = await component.run({
      steps: { trigger: {} },
      $: {
        export: console.log
      }
    })

    assert.equal(response.length, component.input_records.length)
    for (const responseRecord of response) {
      assert.ok(
        responseRecord.ExchangeRate > 0,
        'A record lacks a valid exchange rate: ' + JSON.stringify(responseRecord)
      )
    }
  })

  it('should fill in the exchange rate for records without one', async (testContext) => {
    // if (!process.env.NETSUITE_CONFIG_DEV) {
    //   testContext.skip('No NETSUITE_CONFIG_DEV env. var. found, so skipping integration test.')
    //   return
    // }
    component.netsuite_config_json = process.env.NETSUITE_CONFIG_DEV
    component.methods.emptyCache()
    component.currency_data_store = fakeCurrencyDataStore
    component.input_records = [
      { Currency: 'PGK', TransactionDate: '2025-11-05' },
      { Currency: 'USD', TransactionDate: '2025-11-05', ExchangeRate: 1.00000000000000000000 },
    ]
    const response = await component.run({
      steps: { trigger: {} },
      $: {
        export: console.log
      }
    })

    assert.equal(response.length, component.input_records.length)
    for (const responseRecord of response) {
      assert.ok(
        responseRecord.ExchangeRate > 0,
        'A record lacks a valid exchange rate: ' + JSON.stringify(responseRecord)
      )
    }
  })
})
