import { NetsuiteApiClient } from "netsuite-api-client";

export default defineComponent({
  name: "NetSuite Query Records",
  description: "Run a SuiteQL query against NetSuite records.",
  key: "netsuite_query_records",
  version: "0.0.8",
  type: "action",

  props: {
    config: {
      type: "object",
      label: "NetSuite Config",
      description:
        "Configuration object returned from the initialization step.",
      secret: true,
    },
    query: {
      type: "string",
      label: "SuiteQL Query",
      description:
        "Enter a SuiteQL query, e.g. `SELECT id, entityid, email FROM customer WHERE isinactive = 'F' LIMIT 10`",
    },
  },

  async run({ $ }) {
    const client = new NetsuiteApiClient(this.config);

    try {
      const response = await client.request({
        method: "POST",
        path: "/query/v1/suiteql",
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
        `Failed to execute SuiteQL query: ${error.response?.data?.detail || error.message}`
      );
    }
  },
});
