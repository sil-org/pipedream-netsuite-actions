import { NetsuiteApiClient } from "netsuite-api-client";

export default {
  name: "NetSuite Request",
  description: "Send a request to the NetSuite REST API.",
  key: "netsuite_request",
  version: "0.1.0",
  type: "action",

  props: {
    config: {
      type: "string",
      label: "NetSuite Config",
      description: `NetSuite Configuration JSON object. In format, {"consumer_key":"...","consumer_secret_key":"...","token":"...","token_secret":"...","realm":"..."}`,
      secret: true,
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
    get_more: {
      type: "boolean",
      label: "Get all records if has more",
      description: "Get all records if has more",
      optional: true,
    },
    skip: {
      type: "boolean",
      label: "Skip",
      description: "Set Skip to TRUE or an expression that evaluates to true to skip this step.",
      default: false,
      optional: true,
    },
    throw_errors: {
      type: "boolean",
      label: "Throw errors (vs. returning `error` property)",
      description: "If true, Errors thrown during NetSuite call will be thrown by this. If false, they will be returned in an `error` property in the return value object.",
      default: true,
      optional: true,
    }
  },
  methods: {
    getNextLink(links) {
      const next = links.find(link => link.rel == "next");
      const url = new URL(next.href)
      return this.trimPrefix(url.pathname, "/services/rest") + url.search
    },
    trimPrefix(str, prefix) {
      if (str.startsWith(prefix)) {
        return str.substring(prefix.length)
      }
      return str
    }
  },
  async run({ $ }) {
    if (this.skip) {
      $.export("$summary", `Skipped`)
      return {}
    }

    const client = new NetsuiteApiClient(JSON.parse(this.config));

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
      let response = await client.request(options);

      if (this.get_more && response.data.hasMore) {
        let items = response.data.items
        do {
          options.path = await this.getNextLink(response.data.links)
          response = await client.request(options)
          items = items.concat(response.data.items)
        } while (response.data.hasMore)

        // try to keep response similar
        response.data.items = items
      }

      $.export("$summary", `${this.method} ${this.path} succeeded.`);
      return response.data;
    } catch (error) {
      console.error(
        "NetSuite API Error:",
        error.response?.data || error.message
      );
      if (this.throw_errors) {
        throw new Error(
          `Failed to execute NetSuite request: ${
            error.response?.data?.detail || error.message
          }`
        );
      }
      return {
        error: `Failed to execute NetSuite request: ${
          error.response?.data?.detail || error.message
        }`
      }
    }
  },
};
