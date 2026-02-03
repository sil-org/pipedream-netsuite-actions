import assert from 'node:assert/strict'
import { format } from 'node:util'
import { NetsuiteApiClient } from 'netsuite-api-client@^1.0.3'

export const methods = {
  handleTimeout(start, count, timeout, timeoutRecords) {
    const duration = Date.now() - start
    if (timeout && duration >= timeout * 1000) {
      console.error(`Timeout reached at ${duration / 1000} seconds`)
      return true
    }

    if (timeoutRecords && count >= timeoutRecords) {
      console.error(`Timeout reached at ${count} records in ${duration / 1000} seconds`)
      return true
    }

    return false
  },

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

const queryRecords = {
  name: "NetSuite Query Records",
  description: "Run a SuiteQL query against NetSuite records.",
  key: "netsuite_query_records",
  version: "0.0.19",
  type: "action",

  props: {
    config: {
      type: "object",
      label: "NetSuite Config",
      description: "Configuration object returned from the initialization step.",
      secret: true,
    },
    query: {
      type: "string",
      label: "SuiteQL Query",
      description:
        "Enter a SuiteQL query, e.g. `SELECT id, entityid, email FROM customer WHERE isinactive = 'F' LIMIT 10`",
    },
    timeout: {
      type: "integer",
      label: "Timeout in Seconds",
      description: "The timeout in seconds",
      min: 0,
      optional: true,
    },
    timeout_records: {
      type: "integer",
      label: "Limit",
      description: "The maximum number of records to return before timing out.",
      min: 1,
      default: 1000,
      optional: true,
    },
  },

  async run({ $ }) {
    if (typeof this.config == "string") {
      this.config = JSON.parse(this.config)
    }

    const client = new NetsuiteApiClient(this.config);
    const limit = Math.min(1000, this.timeout_records)
    let offset = 0
    const start = Date.now()
    let response = {}

    try {
      let items = []
      do {
        response = await client.query(this.query, limit, offset)
        items = items.concat(response.items)
        offset += limit

        if (methods.handleTimeout(start, items.length, this.timeout, this.timeout_records)) {
          break
        }
      } while (response.hasMore)

      $.export(
        "$summary",
        `Successfully ran SuiteQL query`
      );
      return items;
    } catch (error) {
      console.error(
        "NetSuite API Error:",
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to execute SuiteQL query: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  },
};

export default {
  name: "Exchange Rate Lookup (NetSuite)",
  description: "Retrieve a specific currency exchange rate from NetSuite",
  key: "exchange_rate_lookup",
  version: "0.2.0",
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
