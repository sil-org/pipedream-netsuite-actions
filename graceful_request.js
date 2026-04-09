import { NetsuiteApiClient } from "netsuite-api-client";

export default defineComponent({
  name: "Graceful NetSuite Request",
  description: "Send a request to the NetSuite REST API, exporting to `error` on failure instead of throwing an Error.",
  key: "graceful_netsuite_request",
  version: "0.0.1",
  type: "action",

  props: {
    config: {
      type: "string",
      label: "NetSuite Config",
      description: `NetSuite Configuration JSON object. In format, {"consumer_key":"...","consumer_secret_key":"...","token":"...","token_secret":"...","realm":"..."}`,
      secret: true,
    },
    request: {
      type: "http_request",
      label: "HTTP Request",
      description: "For example: `GET /record/v1/customer`",
    },
    getAll: {
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
    }
  },
  methods: {
    getNextLink(links) {
      const next = links.find(link => link.rel == "next");
      const url = new URL(next.href)
      return this.trimPrefix(url.pathname, "/services/rest") + url.search
    },
    trimPrefix: (str, prefix) => str.startsWith(prefix) ? str.substring(prefix.length) : str
  },
  async run({ $ }) {
    if (this.skip) {
      $.export("$summary", `Skipped`)
      return {}
    }

    const client = new NetsuiteApiClient(JSON.parse(this.config));
    
    const options = {
      method: this.request.method,
      path: this.request.url,
      body: this.request.body?.raw ? JSON.stringify(this.request.body.raw) : undefined,
      headers: this.request.headers,
    };

    if (this.request.method == "GET") {
      delete options.body;
    }

    try {
      let response = await client.request(options);

      if (this.getAll && response.data.hasMore) {
        let items = response.data.items
        do {
          options.path = await this.getNextLink(response.data.links)
          response = await client.request(options)
          items = items.concat(response.data.items)
        } while (response.data.hasMore)

        // try to keep response similar
        response.data.items = items
      }

      $.export("$summary", `${this.request.method} ${this.request.url} succeeded.`);
      return response.data;
    } catch (error) {
      $.export("error", error.response?.data || error.message);
    }
  },
});
