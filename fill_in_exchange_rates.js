let cache = {}
let currencyDataStore = undefined

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
  throw new Error('NetSuite call not yet implemented')
  const foreignCurrencyId = await lookUpCurrencyId(record.Currency)
}

const getFromCache = (currency, transactionDate) => {
  const key = currency + '-' + transactionDate
  return cache[key]
}

const lookUpCurrencyId = async (currency) => {
  assert.ok(currency, 'No Currency provided to lookUpCurrencyId()')
  const currencyData = await currencyDataStore.get(currency)
  assert.ok(currencyData.ID, 'No Currency ID found in Currency Data Store for ' + currency)
  return currencyData.ID
}

const setInCache = (currency, transactionDate, exchangeRate) => {
  const key = currency + '-' + transactionDate
  cache[key] = exchangeRate
}

export default {
  name: "Fill In Exchange Rates",
  description: "Retrieve a specific currency exchange rate from NetSuite",
  key: "exchange_rate_lookup",
  version: "0.1.0",
  type: "action",

  props: {
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
