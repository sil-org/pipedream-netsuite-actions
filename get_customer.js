import { NetsuiteApiClient } from "netsuite-api-client";

export default {
  name: "NetSuite Get Customer",
  description: "Get a customer record from NetSuite",
  key: "netsuite_get_customer",
  version: "0.0.6",
  type: "action",

  props: {
    netsuite_account_id: {
      type: "string",
      label: "NetSuite Account ID",
      secret: true,
    },
    netsuite_consumer_key: {
      type: "string",
      label: "NetSuite Consumer Key",
      secret: true,
    },
    netsuite_consumer_secret: {
      type: "string",
      label: "NetSuite Consumer Secret",
      secret: true,
    },
    netsuite_token_id: {
      type: "string",
      label: "NetSuite Token ID",
      secret: true,
    },
    netsuite_token_secret: {
      type: "string",
      label: "NetSuite Token Secret",
      secret: true,
    },
    netsuite_base_url: {
      type: "string",
      label: "NetSuite REST API URL",
      description: "E.g., https://1234567.suitetalk.api.netsuite.com",
    },
    customer_id: {
      type: "string",
      label: "Customer ID",
      description: "The internal ID of the customer to fetch",
    },
  },

  async run({ $ }) {
    const client = new NetsuiteApiClient({
      consumer_key: this.netsuite_consumer_key,
      consumer_secret_key: this.netsuite_consumer_secret,
      token: this.netsuite_token_id,
      token_secret: this.netsuite_token_secret,
      realm: this.netsuite_account_id,
      base_url: this.netsuite_base_url,
    });

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
        `Failed to fetch customer: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  },
};
