import { NetsuiteApiClient } from "netsuite-api-client";

export default defineComponent({
  name: "NetSuite Query Records",
  description: "Run a SuiteQL query against NetSuite records.",
  key: "netsuite_query_records",
  version: "0.0.10",
  type: "action",

  props: {
    config: {
      type: "object",
      label: "NetSuite Config",
      description:
        "Configuration object returned from the initialization step.",
    },
    limit: {
      type: "integer",
      label: "Limit",
      description: "The maximum number of records to return.",
    },
    offset: {
      type: "integer",
      label: "Offset",
      description: "The number of records to skip.",
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
      const response = await client.query(this.query, this.limit, this.offset);

      $.export(
        "$summary",
        `Successfully ran SuiteQL query with limit ${this.limit} and offset ${this.offset}`
      );
      return response.items;
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
