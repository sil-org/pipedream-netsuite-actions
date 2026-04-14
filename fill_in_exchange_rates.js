import { netsuite } from '@sil-org/pipedream-utils@^0.2.0'
import assert from "node:assert/strict";

// In-memory caches
let exchangeRateCache = {}
let currencyIdCache = {}

let currencyDataStore
let netsuiteConfigJson

// Helpers
const getCacheKey = (currency, date) => `${currency}-${date}`

const toDateOnlyISO8601 = (dateString) => {
  const date = new Date(dateString)
  return date.toISOString().substring(0, 10)
}

// Currency ID (cached)
const getCurrencyId = async (currency) => {
  assert.ok(currency, 'Missing currency')

  if (currencyIdCache[currency]) {
    return currencyIdCache[currency]
  }

  const data = await currencyDataStore.get(currency)
  assert.ok(data?.ID, `No Currency ID for ${currency}`)

  currencyIdCache[currency] = data.ID
  return data.ID
}

// Batch fetch exchange rates
const fetchExchangeRates = async (requests) => {
  const netsuiteConfig = JSON.parse(netsuiteConfigJson)

  // Group by currency ID to reduce queries
  const grouped = {}

  for (const req of requests) {
    const { currencyId, date } = req

    if (!grouped[currencyId]) {
      grouped[currencyId] = new Set()
    }

    grouped[currencyId].add(date)
  }

  // Execute one query per currency
  for (const currencyId of Object.keys(grouped)) {
    const dates = Array.from(grouped[currencyId])

    // Get min/max date range
    const minDate = dates.sort()[0]
    const maxDate = dates.sort().reverse()[0]

    const query = `
      SELECT exchangerate, effectivedate
      FROM currencyrate
      WHERE basecurrency = 1
      AND transactioncurrency = ${currencyId}
      AND effectivedate <= TO_DATE('${maxDate}', 'YYYY-MM-DD')
      ORDER BY effectivedate DESC
    `

    const results = await netsuite.queryRecords(query, netsuiteConfig)

    if (!results.length) continue

    // Fill cache for all requested dates
    for (const date of dates) {
      const match = results.find(r =>
        toDateOnlyISO8601(r.effectivedate) <= date
      )

      if (match) {
        const key = getCacheKey(reqCurrencyFromId(currencyId), date)
        exchangeRateCache[key] = Number(match.exchangerate)
      }
    }
  }
}

// Reverse lookup helper (optional optimization)
const reqCurrencyFromId = (id) => {
  for (const [currency, cachedId] of Object.entries(currencyIdCache)) {
    if (cachedId == id) return currency
  }
  return null
}

export default {
  name: "Fill In Exchange Rates (Optimized)",
  description: "Fill in the ExchangeRate on each of the given records, looking it up in NetSuite when necessary",
  key: "fill_in_exchange_rates",
  version: "0.2.0",
  type: "action",

  props: {
    netsuite_config_json: {
      type: "string",
      label: "NetSuite Config JSON",
      description: "JSON-encoded configuration object needed for calls to NetSuite",
      secret: true,
    },
    currency_data_store: {
      type: "data_store",
      label: "NetSuite Currency Data Store",
    },
    input_records: {
      type: "any",
      label: "Input Records",
      description: "The list of records, some of which might lack an ExchangeRate",
    },
  },

  async run({ $, steps }) {
    netsuiteConfigJson = this.netsuite_config_json
    currencyDataStore = this.currency_data_store

    const successful = []
    const failed = []

    // Build request list
    const requests = []

    for (const record of this.input_records) {
      try {
        if (record.ExchangeRate) {
          // Already has value -> cache it
          const key = getCacheKey(record.Currency, record.TransactionDate)
          exchangeRateCache[key] = record.ExchangeRate
          continue
        }

        const date = toDateOnlyISO8601(record.TransactionDate)
        const currencyId = await getCurrencyId(record.Currency)

        const key = getCacheKey(record.Currency, date)

        if (!exchangeRateCache[key]) {
          requests.push({
            currency: record.Currency,
            currencyId,
            date,
          })
        }
      } catch (err) {
        record.error = err.message || err
        failed.push(record)
      }
    }

    // Batch fetch
    await fetchExchangeRates(requests)

    // Fill records
    for (const record of this.input_records) {
      try {
        if (!record.ExchangeRate) {
          const date = toDateOnlyISO8601(record.TransactionDate)
          const key = getCacheKey(record.Currency, date)

          const rate = exchangeRateCache[key]

          assert.ok(rate, `No exchange rate for ${key}`)

          record.ExchangeRate = rate
        }

        successful.push(record)
      } catch (err) {
        record.error = err.message || err
        failed.push(record)
      }
    }

    if (failed.length) {
      $.export('errors', failed)
    }

    return successful
  },
}