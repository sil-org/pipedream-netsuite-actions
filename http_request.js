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
    httpRequest: {
      type: "http_request",
      label: "HTTP Request Configuration",
    },
  },

  async run({ $ }) {
    const client = new NetsuiteApiClient(this.config);

    try {
      const options = {
        method: this.httpRequest.method,
        path: this.httpRequest.url,
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
