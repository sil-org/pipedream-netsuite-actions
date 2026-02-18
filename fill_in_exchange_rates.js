import { netsuite } from '@sil-org/pipedream-utils@^0.2.0'
import assert from "node:assert/strict";

let cache = {}
let currencyDataStore
let netsuiteConfigJson

const cacheAllKnownExchangeRates = (records) => {
  for (const record of records) {
    if (record.ExchangeRate) {
      setInCache(record.Currency, record.TransactionDate, record.ExchangeRate)
    }
  }
}

const getExchangeRateFor = async (record) => {
  const cachedValue = getFromCache(record.Currency, record.TransactionDate)
  if (cachedValue) {
    return cachedValue
  }
  const foreignCurrencyId = await lookUpCurrencyId(record.Currency)
  const exchangeRate = await lookUpExchangeRateInNetsuite(
    record.TransactionDate,
    foreignCurrencyId
  )
  setInCache(record.Currency, record.TransactionDate, exchangeRate)
  return exchangeRate
}

const getFromCache = (currency, transactionDate) => {
  const key = currency + '-' + transactionDate
  return cache[key]
}

const lookUpCurrencyId = async (currency) => {
  assert.ok(currency, 'No Currency provided to lookUpCurrencyId()')
  const currencyData = await currencyDataStore.get(currency)
  assert.ok(currencyData?.ID, 'No Currency ID found in Currency Data Store for ' + currency)
  return currencyData.ID
}

const lookUpExchangeRateInNetsuite = async (transactionDate, foreignCurrencyId) => {
  assert.ok(transactionDate, 'No Transaction Date provided for NetSuite call')
  assert.ok(foreignCurrencyId, 'No Foreign Currency ID provided for NetSuite call')
  const transactionDateForQuery = toDateOnlyISO8601(transactionDate)
  const netsuiteConfig = JSON.parse(netsuiteConfigJson)
  const query = `
    SELECT
      exchangerate
    FROM
      currencyrate
    WHERE
      basecurrency = 1
      AND effectivedate = TO_DATE('${transactionDateForQuery}', 'YYYY-MM-DD')
      AND id = ${foreignCurrencyId}
  `
  const results = await netsuite.queryRecords(query, netsuiteConfig)
  assert.ok(results.length, 'No exchange rate found for that currency on that date')
  const rawExchangeRate = results[0].exchangerate
  return Number(rawExchangeRate)
}

const setInCache = (currency, transactionDate, exchangeRate) => {
  assert.ok(currency, 'No Currency provided to setInCache()')
  assert.ok(transactionDate, 'No Transaction Date provided to setInCache()')
  assert.ok(exchangeRate, 'No Exchange Rate Date provided to setInCache()')
  const key = currency + '-' + transactionDate
  cache[key] = exchangeRate
}

/**
 * Convert the given date string to a Date-Only ISO-8601 date string (YYYY-MM-DD).
 * @param {string} dateString
 * @return {string}
 */
const toDateOnlyISO8601 = (dateString) => {
  const date = new Date(dateString)
  const isoString = date.toISOString()
  return isoString.substring(0, 10)
}

export default {
  name: "Fill In Exchange Rates",
  description: "Fill in the ExchangeRate on each of the given records, looking it up in NetSuite when necessary",
  key: "fill_in_exchange_rates",
  version: "0.1.0",
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

  methods: {
    emptyCache() {
      cache = {}
    },
  },

  async run({ steps, $ }) {
    netsuiteConfigJson = this.netsuite_config_json
    currencyDataStore = this.currency_data_store
    cacheAllKnownExchangeRates(this.input_records)
    for (const record of this.input_records) {
      if (!record.ExchangeRate) {
        record.ExchangeRate = await getExchangeRateFor(record)
      }
    }
    return this.input_records
  },
}
