import { NetsuiteApiClient } from "netsuite-api-client";

export default defineComponent({
  name: "Batch NetSuite Request",
  description: "Send a batch of requests to a single NetSuite REST API endpoint.",
  key: "batch_netsuite_request",
  version: "0.0.1",
  type: "action",

  props: {
    config: {
      type: "string",
      label: "NetSuite Config",
      description: `NetSuite Configuration JSON object. In format, {"consumer_key":"...","consumer_secret_key":"...","token":"...","token_secret":"...","realm":"..."}`,
      secret: true,
    },
    httpRequest: {
      type: "http_request",
      label: "HTTP Request",
      description: "Request to make to Netsuite."
    },
    bodies: {
      type: "string[]",
      label: "Request Bodies",
      description: "Request Bodies to send to NetSuite. Overrides `Body` from HTTP Request."
    },
    batchSize: {
      type: "integer",
      label: "Batch Size",
      description: "Larger batch sizes may hit concurrent request limit. Defaults to `5`.",
      optional: true,
      default: 5
    },
    requestTimeout: {
      type: "integer",
      label: "Request timeout",
      description: "The maximum number of milliseconds per request before timing out. Defaults to `30000`ms.",
      min: 1,
      default: 30000,
      optional: true,
    },
    batchInterval: {
      type: "integer",
      label: "Batch Interval",
      description: "The request loop will send each subsequent block of requests after no less than this amount of time since the previous block began. Set this according to rate limiting rules in effect for the host.",
      optional: true,
      default: 4000
    },
  },
  methods: {
    async request(client, body) {
      await Promise.any([
        client.request({
          method: this.httpRequest.method,
          path: this.httpRequest.url,
          body: body,
          headers: this.httpRequest.headers
        }),
        this.timeout(this.requestTimeout)
      ]);
    },
    timeout(ms) {
      return new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
      );
    },
  },
  async run({ $ }) {
    const client = new NetsuiteApiClient(JSON.parse(this.config));

    try {
      const queue = [];
      for (let i = 0; i < this.bodies.length; i++) {
        queue.push(this.request(client, this.bodies[i]));

        if (i > 0 && i % this.batchSize == 0) {
          const now = Date.now();
          await Promise.allSettled(queue);
          const elapsed = Date.now() - now;
          await this.delay(this.batchInterval - elapsed);
        }
      }

      // TODO check queue for rejected items
      const result = await Promise.allSettled(queue);
      $.export("$summary", `${this.httpRequest.method} ${this.httpRequest.url} succeeded for ${this.bodies.length} items.`);
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
