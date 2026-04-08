# Pipedream Netsuite Actions

A collection of custom Pipedream actions for working with the NetSuite API.

## Available Actions

1. Initialize Netsuite - Initializes Netsuite config for future calls, returns a config object which is used as a parameter for HTTP Request and Query Records
2. HTTP Request - Calls the specified endpoint, with the specified method and body
3. Batch HTTP Request - Send a batch of requests to a single NetSuite REST API endpoint
4. Graceful HTTP Request - Send a request to the NetSuite REST API, exporting to `error` on failure instead of throwing an Error.
5. Query Records - Runs a SuiteQL query against NetSuite records
6. Get Customers - Get all Netsuite customers from a list of externalids
7. Exchange Rate Lookup - Calls NetSuite for what a specific currency's exchange rate was on a specific date
8. Fill In Exchange Rates - Fill in the ExchangeRate on each of the given records, looking it up in NetSuite when necessary

## Tests

### Automated Testing

Tests are automatically run on GitHub Actions during the CI/CD process.

**NOTE:** If a `NETSUITE_CONFIG_DEV` environment variable is provided, then integration
tests that actually call NetSuite will also be run. If not, they will be skipped. That
env. var. should be a JSON string structured like this:
```json
{"consumer_key":"...","consumer_secret_key":"...","token":"...","token_secret":"...","realm":"..."}
```
Depending how you set that environment variable, you might need to escape the quotes, so
`"{\"consumer_key\":\"...\",` and so on.

### Manual Testing

To run tests manually, run `npm test` in your terminal.
