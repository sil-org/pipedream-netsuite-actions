import { NetsuiteApiClient } from "netsuite-api-client";

export default defineComponent({
  name: "NetSuite Query Records",
  description: "Run a SuiteQL query against NetSuite records.",
  key: "netsuite_query_records",
  version: "0.0.2",
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
  },

  async run({ $ }) {
    const {
      consumer_key,
      consumer_secret,
      token_id,
      token_secret,
      account_id,
      base_url,
    } = this.config;

    const client = new NetsuiteApiClient({
      consumer_key,
      consumer_secret_key: consumer_secret,
      token: token_id,
      token_secret,
      realm: account_id,
      base_url,
    });

    try {
      const response = await client.request({
        method: "POST",
        path: "/services/rest/query/v1/suiteql",
        headers: { "Content-Type": "application/json" },
        data: { q: this.query },
      });

      $.export(
        "$summary",
        `Successfully ran SuiteQL query (${response.data.count} rows)`
      );
      return response.data;
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
