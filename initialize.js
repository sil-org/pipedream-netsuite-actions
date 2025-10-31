export default {
  name: "Initialize NetSuite",
  description: "Initialize NetSuite",
  key: "initialize_netsuite",
  version: "0.0.1",
  type: "action",

  props: {
    account_id: {
      type: "object",
      label: "NetSuite Account ID",
      secret: true,
    },
    consumer_key: {
      type: "string",
      label: "NetSuite Consumer Key",
      secret: true,
    },
    consumer_secret: {
      type: "string",
      label: "NetSuite Consumer Secret",
      secret: true,
    },
    token_id: {
      type: "string",
      label: "NetSuite Token ID",
      secret: true,
    },
    token_secret: {
      type: "string",
      label: "NetSuite Token Secret",
      secret: true,
    },
    base_url: {
      type: "string",
      label: "NetSuite REST API URL",
      description: "E.g., https://1234567.suitetalk.api.netsuite.com",
    },
  },

  async run({ $ }) {
    const config = {
      account_id: this.account_id,
      consumer_key: this.consumer_key,
      consumer_secret: this.consumer_secret,
      token_id: this.token_id,
      token_secret: this.token_secret,
      base_url: this.base_url,
    };

    $.export("$summary", "Successfully initialized NetSuite configuration.");
    return config;
  },
};
