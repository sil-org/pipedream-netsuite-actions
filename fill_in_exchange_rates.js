let cache = {}

const getExchangeRateFor = (record) => {
  const cachedValue = getFromCache(record.Currency, record.TransactionDate)
  if (cachedValue) {
    return cachedValue
  }
  throw new Error('NetSuite call not yet implemented')
}

const getFromCache = (currency, transactionDate) => {
  const key = currency + '-' + transactionDate
  return cache[key]
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
    for (const record of this.input_records) {
      if (record.ExchangeRate) {
        setInCache(record.Currency, record.TransactionDate, record.ExchangeRate)
      } else {
        record.ExchangeRate = getExchangeRateFor(record)
      }
    }
    return this.input_records
  },
}
