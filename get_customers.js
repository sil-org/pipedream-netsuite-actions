import { netsuite } from '@sil-org/pipedream-utils'

export default {
  name: "Get Netsuite Customers",
  description: "This action gets all netsuite customers from a list of externalids.",
  key: "netsuite_get_customers",
  version: "0.0.28",
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
      // dedupe the external ids
      const ids = [...new Set(this.externalids)];
      
      const fields = this.fields || ["*"]
      const q = `SELECT ${fields.join(",")} FROM customer WHERE externalid IN ('${ids.join("','")}')`
      console.log(q)

      const customers = await netsuite.queryRecords(q, JSON.parse(this.config))
      $.export("customers", customers)

      if (customers.length != ids.length) {
        const notFound = ids.filter((id) => !customers.some((customer) => customer.externalid == id)})
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
