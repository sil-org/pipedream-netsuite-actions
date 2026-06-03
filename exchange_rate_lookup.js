import { netsuite } from '@sil-org/pipedream-utils@^0.2.0'
import assert from 'node:assert/strict'
import { format } from 'node:util'

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
  },
}

export default {
  name: "Exchange Rate Lookup (NetSuite)",
  description: "Retrieve a specific currency exchange rate from NetSuite",
  key: "exchange_rate_lookup",
  type: "action",

  // Unless urgently needed, this action should only be modified in Github
  version: "0.2.2",

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
    file_name: {
      type: "string",
      label: "File Name",
      description: "The name of the file being processed (e.g. a CSV file)",
      optional: false,
    },
    transaction_id: {
      type: "string",
      label: "Transaction ID",
      description: "The ID of the transaction being processed",
      optional: false,
    },
  },

  async run({ steps, $ }) {
    const transactionDateForQuery = methods.toDateOnlyISO8601(this.transaction_date)
    const netsuiteConfig = JSON.parse(this.netsuite_config_json)
    console.log("Realm:", netsuiteConfig.realm)

    const query = `
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
      const results = await netsuite.queryRecords(query, netsuiteConfig)
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
        Error: format(
          'ERROR: Exchange Rate search was not successful.\n'
          + 'FileName: %s | Transaction Date: %s | Currency ID: %s | Transaction ID: %s\n'
          + 'NetSuite Error Message: %s',
          this.file_name,
          this.transaction_date,
          this.foreign_currency_id,
          this.transaction_id,
          error.message
        ),
      }
    }
  },
}
