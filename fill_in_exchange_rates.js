import assert from 'node:assert/strict'
import { format } from 'node:util'

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

  async run({ steps, $ }) {
    for (const record of this.input_records) {
      if (!record.ExchangeRate) {
        console.debug('Lacks exchange rate:', record)
      }
    }
    return this.input_records
  },
}
