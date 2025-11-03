export default {
  name: "Initialize NetSuite",
  description: "Initialize NetSuite",
  key: "initialize_netsuite",
  version: "0.0.12",
  type: "action",

  props: {
    consumer_key: {
      type: "string",
      label: "NetSuite Consumer Key",
      secret: true,
    },
    consumer_secret_key: {
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
    account_id: {
      type: "string",
      label: "NetSuite Account ID",
    },
    base_url: {
      type: "string",
      label: "NetSuite Base URL",
      optional: true,
    },
  },

  async run({ $ }) {
    const config = {
      consumer_key: this.consumer_key,
      consumer_secret_key: this.consumer_secret_key,
      token: this.token_id,
      token_secret: this.token_secret,
      realm: this.account_id,
      base_url: this.base_url,
    };

    $.export("$summary", "Successfully initialized NetSuite configuration.");
    return config;
  },
};
