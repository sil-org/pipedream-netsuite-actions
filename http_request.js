import { NetsuiteApiClient } from "netsuite-api-client";

export default defineComponent({
  name: "NetSuite Request",
  description: "Send a request to the NetSuite REST API.",
  key: "netsuite_request",
  version: "0.0.6",
  type: "action",

  props: {
    config: {
      type: "object",
      label: "NetSuite Config",
      description: "Configuration object returned from the initialization step. Optional if environment variables " +
        "are defined: NETSUITE_CONSUMER_KEY, NETSUITE_CONSUMER_SECRET, NETSUITE_TOKEN_ID, NETSUITE_TOKEN_SECRET, " +
        "NETSUITE_ACCOUNT.",
      optional: true,
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
    const envConfig = {
      consumer_key: process.env.NETSUITE_CONSUMER_KEY,
      consumer_secret_key: process.env.NETSUITE_CONSUMER_SECRET,
      token: process.env.NETSUITE_TOKEN_ID,
      token_secret: process.env.NETSUITE_TOKEN_SECRET,
      realm: process.env.NETSUITE_ACCOUNT,
    }
    const config = { ...envConfig, ...this.config }
    const client = new NetsuiteApiClient(config);

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
      throw new Error(
        `Failed to execute NetSuite request: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  },
});
