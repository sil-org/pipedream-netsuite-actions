import assert from 'node:assert/strict'
import { loadEnvFile } from 'node:process'
import { describe, it } from 'node:test'

try {
  loadEnvFile('.env')
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('No env file found, proceeding without it')
  } else {
    throw error
  }
}

const { default: component } = await import('./http_request.js')

describe(component.name, () => {
  it('should return error data (not throw an Error)', async (testContext) => {
    if (!process.env.NETSUITE_CONFIG_DEV) {
      testContext.skip('No NETSUITE_CONFIG_DEV env. var. found, so skipping integration test.')
      return
    }
    component.config = process.env.NETSUITE_CONFIG_DEV
    component.method = 'GET'
    component.path = '/record/v1/customer/invalid-id-999'
    component.headers = {}
    component.get_more = false
    component.skip = false

    let response
    try {
      response = await component.run({
        steps: {trigger: {}},
        $: {
          export: console.log
        }
      })
    } catch (error) {
      assert.fail(`An error was thrown (${error.message || error})`)
    }
    assert.ok(
      response.error.length > 0,
      'Did not find the expected error property.'
    )
  })
})
