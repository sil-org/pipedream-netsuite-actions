import assert from 'node:assert/strict'
import { loadEnvFile } from 'node:process'
import { describe, it } from 'node:test'

try {
  loadEnvFile('.env')
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('No env file found, proceeding without it')
  } else {
    throw error
  }
}

const { default: component } = await import('./fill_in_exchange_rates.js')

const fakeCurrencyDataStore = {
  // `get()` needs to be async to match Pipedream Data Store's `get()` function.
  get: async (currency) => sampleCurrencyData[currency],
}

const sampleCurrencyData = {
  PGK: {
    ID: 25,
    Name: 'Papua New Guinean Kina',
  },
}

describe(component.name, () => {
  it('should not re-request an exchange rate we already have', async () => {
    component.methods.emptyCache()
    component.currency_data_store = fakeCurrencyDataStore
    component.input_records = [
      { Currency: 'PGK', TransactionDate: '2023-04-24', ExchangeRate: 0.738618 },
      { Currency: 'PGK', TransactionDate: '2023-04-24' },
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

  it('should not re-request an exchange rate we already have, even one later in the list', async () => {
    component.methods.emptyCache()
    component.currency_data_store = fakeCurrencyDataStore
    component.input_records = [
      { Currency: 'PGK', TransactionDate: '2023-04-24' },
      { Currency: 'PGK', TransactionDate: '2023-04-24', ExchangeRate: 0.738618 },
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
    if (!process.env.NETSUITE_CONFIG_DEV) {
      testContext.skip('No NETSUITE_CONFIG_DEV env. var. found, so skipping integration test.')
      return
    }
    component.netsuite_config_json = process.env.NETSUITE_CONFIG_DEV
    component.methods.emptyCache()
    component.currency_data_store = fakeCurrencyDataStore
    component.input_records = [
      { Currency: 'PGK', TransactionDate: '2023-04-24' },
      { Currency: 'USD', TransactionDate: '2023-04-24', ExchangeRate: 1.000000 },
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

  it('should return successful records and errors separately', async (testContext) => {
    if (!process.env.NETSUITE_CONFIG_DEV) {
      testContext.skip('No NETSUITE_CONFIG_DEV env. var. found, so skipping integration test.')
      return
    }
    const namedExports = {}
    component.netsuite_config_json = process.env.NETSUITE_CONFIG_DEV
    component.methods.emptyCache()
    component.currency_data_store = fakeCurrencyDataStore
    component.input_records = [
      { Currency: 'PGK', TransactionDate: '2023-04-24' },
      { Currency: 'PGK', TransactionDate: '1111-11-11' }, // 1111-11-11 is an unknown date.
      { Currency: 'USD', TransactionDate: '2023-04-24', ExchangeRate: 1.000000 },
    ]
    const response = await component.run({
      steps: { trigger: {} },
      $: {
        export: (key, value) => {
          console.log(key, value)
          namedExports[key] = value
        }
      }
    })

    assert.ok(
      response.length < component.input_records.length,
      'Expected to only receive successful records back in returned data.'
    )
    assert.equal(namedExports.errors.length, 1, 'Expected 1 error record')
    for (const responseRecord of response) {
      assert.ok(
        responseRecord.ExchangeRate > 0,
        'A successful record lacks a valid exchange rate: ' + JSON.stringify(responseRecord)
      )
    }
  })
})
