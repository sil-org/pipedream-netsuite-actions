import { NetsuiteApiClient } from "netsuite-api-client";
import { version } from "./version";

export default {
  name: "NetSuite Get Customer",
  description: "Get a customer record from NetSuite",
  key: "netsuite_get_customer",
  version: version,
  type: "action",

  props: {
    config: {
      type: "object",
      label: "NetSuite Config",
      description:
        "Configuration object returned from the initialization step.",
      secret: true,
    },
    customer_id: {
      type: "string",
      label: "Customer ID",
      description: "The internal ID of the customer to fetch",
    },
  },

  async run({ $ }) {
    const client = new NetsuiteApiClient(this.config);

    try {
      const customer = await client.request({
        path: `/services/rest/record/v1/customer/${this.customer_id}`,
      });

      $.export("$summary", `Successfully fetched customer ${this.customer_id}`);
      return customer.data;
    } catch (error) {
      console.error(
        "NetSuite API Error:",
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to fetch customer: ${error.response?.data?.detail || error.message}`
      );
    }
  },
};
