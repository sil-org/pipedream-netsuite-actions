import { NetsuiteApiClient } from "netsuite-api-client";

export default defineComponent({
  name: "NetSuite HTTP Request",
  description: "Run a NetSuite HTTP request.",
  key: "netsuite_request",
  version: "0.0.1",
  type: "action",

  props: {
    config: {
      type: "object",
      label: "NetSuite Config",
      description:
        "Configuration object returned from the initialization step.",
    },
    method: {
      type: "string",
      label: "HTTP Method",
      description: "The HTTP method for the request",
    },
    path: {
      type: "string",
      label: "URL",
      description: "The number of records to skip.",
    },
    body: {
      type: "array",
      label: "Payload",
      description: "Payload/Body for HTTP request",
    },
  },

  async run({ $ }) {
    const client = new NetsuiteApiClient(this.config);

    try {
      const options = {
        method: this.method || "GET",
        path: this.path,
        body: this.body || undefined
      }
      const response = await client.request(options)

      $.export(
        "$summary",
        `Successfully ran ${options.method} ${options.path}`
      );
      return response.data;
    } catch (error) {
      console.error(
        "NetSuite API Error:",
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to execute Netsuite request: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  },
});
