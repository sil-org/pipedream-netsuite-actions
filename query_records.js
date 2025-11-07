import { NetsuiteApiClient } from "netsuite-api-client";

export default defineComponent({
  name: "NetSuite Query Records",
  description: "Run a SuiteQL query against NetSuite records.",
  key: "netsuite_query_records",
  version: "0.0.12",
  type: "action",

  props: {
    config: {
      type: "object",
      label: "NetSuite Config",
      description:
        "Configuration object returned from the initialization step.",
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
      min: 0,
      optional: true,
    },
  },
  methods: {
    handle_timeout(start, count) {
      const duration = Date.now() - start
      if (this.timeout && duration >= this.timeout * 1000) {
        console.error(`Timeout reached at ${duration / 1000} seconds`)
        return true
      }

      if (this.timeout_records && count >= this.timeout_records) {
        console.error(`Timeout reached at ${count} records in ${duration / 1000} seconds`)
        return true
      }

      return false
    }
  },
  async run({ $ }) {
    delete this.config.base_url
    const client = new NetsuiteApiClient(this.config)
    const limit = Math.min(1000, this.timeout_records)
    let offset = 0
    const start = Date.now()

    try {
      const items = []
      do {
        const response = await client.query(this.query, limit, offset)
        items = items.concat(response.items)
        offset += limit

        if (await this.handle_timeout(start, items.length)) {
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
});
