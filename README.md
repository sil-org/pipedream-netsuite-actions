# Pipedream Netsuite Actions

A collection of custom Pipedream actions for working with the NetSuite API.

## Available Actions

1. Initialize Netsuite - Initializes Netsuite config for future calls, returns a config object which is used as a parameter for HTTP Request and Query Records
2. HTTP Request - Calls the specified endpoint, with the specified method and body
3. Query Records - Runs a SuiteQL query against NetSuite records
4. Get Customers - Get all Netsuite customers from a list of externalids
5. Exchange Rate Lookup - Calls NetSuite for what a specific currency's exchange rate was on a specific date

## Tests

### Automated Testing

A subset of the tests are automatically run on GitHub Actions during the CI/CD process.

**NOTE:** If a `NETSUITE_CONFIG_DEV` environment variable is provided, then (some of the)
integration tests that actually call NetSuite will also be run. If not, they will be
skipped. That env. var. should be a JSON string structured like this:
```json
{"consumer_key":"...","consumer_secret_key":"...","token":"...","token_secret":"...","realm":"..."}
```
Depending on how you set that environment variable, you might need to escape the quotes, so
`"{\"consumer_key\":\"...\",` and so on.

### Manual Testing

To run tests manually, run `npm run test:all` or `npm run test:only` in your terminal.

### "all" vs "only" tests

To minimize error logs on live systems, the CI/CD system is configured to only run tests
marked as `only` (see
[the Node.js docs about `only`](https://nodejs.org/docs/latest-v20.x/api/test.html#only-tests)).
This includes integration tests expected to succeed, but skips integration tests that
are likely to trigger an error on live systems, such as testing invalid credentials.

Running `npm run test:all` will run all the tests (including all integration tests, if
you provided credentials).

Running `npm run test:only` will only run a subset of the tests (including some
integration tests, if you provided credentials).
