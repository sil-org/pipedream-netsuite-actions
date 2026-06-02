import { NetsuiteApiClient } from "netsuite-api-client";

export default {
  name: "Get Netsuite Customers",
  description: "This action gets all netsuite customers from a list of externalids.",
  key: "netsuite_get_customers",
  version: "0.1.0",
  type: "action",

  props: {
    config: {
      type: "string",
      label: "NetSuite Config",
      description: `NetSuite Configuration JSON object. In format, {"consumer_key":"...","consumer_secret_key":"...","token":"...","token_secret":"...","realm":"..."}`,
      secret: true,
    },
    externalids: {
      type: "string[]",
      label: "List of External Ids",
      description: "You may need to run `data.map((d) => this.trimPrefix(d.Customer, \"INT\"))` to get it into the correct format.",
    },
    fields: {
      type: "string[]",
      label: "List of Fields to Retrieve",
      description: "List of fields to retrieve from customer table",
      optional: true,
    }
  },
  async run({ steps, $ }) {
    try {
      // Dedupe external ids
      const uniqueExternalIDs = [...new Set(this.externalids)]

      const config = JSON.parse(this.config)
      console.log("Realm:", config.realm)
      const client = new NetsuiteApiClient(config);

      const fields = this.fields || ["*"]
      const q = `SELECT ${fields.join(",")} FROM customer WHERE externalid IN ('${uniqueExternalIDs.join("','")}')`
      console.log(q)
      
      let limit = 1000
      let offset = 0
      let response = {}
      let items = []
      do {
        response = await client.query(q, limit, offset)
        items = items.concat(response.items)
        offset += limit
      } while (response.hasMore)

      $.export("customers", items)

      if (items.length != uniqueExternalIDs.length) {
        const notFound = uniqueExternalIDs.filter((id) => !items.some((item) => item.externalid == id))
        $.export("error", `The following externalids were not found: ${notFound.join(",")}`)
        $.export("notFoundExternalIds", notFound)
      }
    } catch (error) {
      console.error("NetSuite API Error:", error.response?.data || error.message);
      throw new Error(
        `Failed to execute SuiteQL query: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  },
};
