import { NetsuiteApiClient } from "netsuite-api-client";

export default {
  name: "NetSuite Query Records",
  description: "Run a SuiteQL query against NetSuite records.",
  key: "netsuite_query_records",
  version: "0.0.1",
  type: "action",

  props: {
    query: {
      type: "string",
      label: "SuiteQL Query",
      description:
        "Enter a SuiteQL query, e.g. `SELECT id, entityid, email FROM customer WHERE isinactive = 'F' LIMIT 10`",
    },
  },

  async run({ $ }) {
    const config = steps.initialize_netsuite.$return_value;

    const client = new NetsuiteApiClient({
      consumer_key: config.consumer_key,
      consumer_secret_key: config.consumer_secret,
      token: config.token_id,
      token_secret: config.token_secret,
      realm: config.account_id,
      base_url: config.base_url,
    });

    try {
      const response = await client.request({
        method: "POST",
        path: "/services/rest/query/v1/suiteql",
        headers: {
          "Content-Type": "application/json",
        },
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
};
