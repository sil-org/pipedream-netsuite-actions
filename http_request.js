import { NetsuiteApiClient } from "netsuite-api-client";

export default defineComponent({
  name: "NetSuite Request",
  description: "Send a request to the NetSuite REST API.",
  key: "netsuite_request",
  version: "0.0.4",
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
      description: "GET, POST, PUT, DELETE, etc.",
      options: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      default: "GET",
    },
    path: {
      type: "string",
      label: "Endpoint Path",
      description: "For example: `/record/v1/customer`",
    },
    body: {
      type: "object",
      label: "Request Body (optional)",
      description: "JSON body for POST/PUT requests.",
      optional: true,
    },
    headers: {
      type: "object",
      label: "Headers (optional)",
      description: "Additional headers to include in the request.",
      optional: true,
    },
  },

  async run({ $ }) {
    const client = new NetsuiteApiClient(this.config);

    const options = {
      method: this.method,
      path: this.path,
      body: this.body ? JSON.stringify(this.body) : undefined,
      headers: this.headers || undefined,
    };

    if (this.method == "GET") {
      delete options.body;
    }

    try {
      const response = await client.request(options);

      $.export("$summary", `${options.method} ${options.path} succeeded.`);
      return response.data;
    } catch (error) {
      console.error(
        "NetSuite API Error:",
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to execute NetSuite request: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  },
});
