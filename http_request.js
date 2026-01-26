import { NetsuiteApiClient } from "netsuite-api-client";

export default defineComponent({
  name: "NetSuite Request",
  description: "Send a request to the NetSuite REST API.",
  key: "netsuite_request",
  version: "0.0.8",
  type: "action",

  props: {
    config: {
      type: "object",
      label: "NetSuite Config",
      description: "Configuration object returned from the initialization step.",
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
    if (typeof this.config == "string") {
      this.config = JSON.parse(this.config)
    }

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
