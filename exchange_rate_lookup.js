import assert from 'node:assert/strict'
import queryRecords from './query_records.mjs'

export const methods = {
  /**
   * Convert the given date string to a Date-Only ISO-8601 date string (YYYY-MM-DD).
   * @param {string} dateString
   * @return {string}
   */
  toDateOnlyISO8601(dateString) {
    const date = new Date(dateString)
    const isoString = date.toISOString()
    return isoString.substring(0, 10)
  }
}

export default defineComponent({
  name: "Exchange Rate Lookup (NetSuite)",
  description: "Retrieve a specific currency exchange rate from NetSuite",
  key: "exchange_rate_lookup",
  version: "0.0.3",
  type: "action",

  props: {
    netsuite_config_json: {
      type: "string",
      label: "NetSuite Config JSON",
      description: "JSON-encoded configuration object needed for calls to NetSuite",
      secret: true,
    },
    transaction_date: {
      type: "string",
      label: "Transaction Date",
      description: "The date of the specified transaction",
      optional: false,
    },
    foreign_currency_id: {
      type: "integer",
      label: "Foreign Currency ID",
      description: "Our internal ID for the foreign currency",
      optional: false,
    },
  },

  async run({ steps, $ }) {
    const transactionDateForQuery = methods.toDateOnlyISO8601(this.transaction_date)
    queryRecords.config = JSON.parse(this.netsuite_config_json)
    queryRecords.timeout_records = 1000
    queryRecords.query = `
        SELECT
            exchangerate
        FROM
            currencyrate
        WHERE
            basecurrency = 1
          AND effectivedate = TO_DATE('${transactionDateForQuery}', 'YYYY-MM-DD')
          AND id = ${this.foreign_currency_id}
    `;

    try {
      const results = await queryRecords.run({steps, $})
      assert.ok(
        results.length > 0,
        'No matching Currency Rate in NetSuite'
      )
      const rawExchangeRate = results[0].exchangerate
      const exchangeRate = Number(rawExchangeRate)
      assert.ok(
        exchangeRate > 0,
        'Invalid exchange rate: ' + rawExchangeRate
      )
      return {
        CurrencyRate: exchangeRate,
      }
    } catch (error) {
      return {
        Error: error.message,
      }
    }
  },
})
