'use strict'

var fs = require('fs')
var path = require('path')
var childProcess = require('child_process')
var assert = require('chai').assert
var expect = require('chai').expect
var VirusTotalApiService = require('..').VirusTotalApiService
var VtApiServiceConstants = require('./../lib/vtapi-service-constants')
var MockVtApiHttpServer = require('./mock-vthttpserver')
var TestConstants = require('./test-constants')
var MessageUtils = require('@opendxl/dxl-bootstrap').MessageUtils

var SAMPLE_DIR = path.join(__dirname, '/../sample')

var STDOUT_CONSOLE_SUBSTR_START = 'Client received response payload: \n'
var DEFAULT_TIMEOUT = 5000
var TEST_PORT = 7777

function createAppConfigFile () {
  // Create/overwri test app config file
  fs.writeFileSync(
    path.join(SAMPLE_DIR, VtApiServiceConstants.APP_CONFIG_FILE),
    '[General]\n' +
    'apiKey=' + TestConstants.EXPECTED_API_KEY + '\n'
  )
}

function getJsonStringFromStdout (stdout) {
  return stdout.substring(
    stdout.indexOf(STDOUT_CONSOLE_SUBSTR_START) + STDOUT_CONSOLE_SUBSTR_START.length,
    stdout.length - 1
  )
}

function sampleTestSetup () {
  var mockServer = new MockVtApiHttpServer()
  mockServer.startServer(TEST_PORT)

  createAppConfigFile()
  VtApiServiceConstants.VTAPI_URL_FORMAT = 'http://localhost:' + TEST_PORT
  return {
    vtApiService: new VirusTotalApiService(SAMPLE_DIR),
    mockServer: mockServer
  }
}

function sampleTestTeardown (sampleTestObjects) {
  setTimeout(
    function () {
      sampleTestObjects.vtApiService.destroy()
      sampleTestObjects.mockServer.stopServer()
    },
    DEFAULT_TIMEOUT
  )
}

function runSample (sampleFilePath, expectedResponsePayload, done) {
  childProcess.exec(
    path.join('node ' + sampleFilePath),
    function (error, stdout, stderr) {
      expect(stdout).has.string(STDOUT_CONSOLE_SUBSTR_START)

      var printedJson = getJsonStringFromStdout(stdout)

      // This conversion will throw a Syntax Error if the JSON string is invalid,
      // causing the calling test to fail.
      try {
        var parsedJson = MessageUtils.jsonToObject(printedJson)

        assert.deepEqual(parsedJson, expectedResponsePayload)
        assert.equal(stderr, '')
        assert.equal(error, null)

        // Allow DXL fabric to unregister service.
        // Without this, timing issues can cause service requests made in subsequent
        // tests to be directed to this (inactive) service instance.
        setTimeout(function () {
          done()
        }, DEFAULT_TIMEOUT)
      } catch (e) {
        console.log('Error converting stdout substring to JSON:\n' + stdout)
        throw (e)
      }
    })
}

describe('VirusTotalApiService Service Setup', function () {
  this.timeout(30000)

  it('should configure VirusTotalApiService API key from file', function (done) {
    setTimeout(function () {
      createAppConfigFile()

      var vtApiService = new VirusTotalApiService(SAMPLE_DIR)
      vtApiService.run(function () {
        assert.equal(vtApiService.apiKey, TestConstants.EXPECTED_API_KEY)

        vtApiService.destroy(function () {
          done()
        })
      })
    }, 100)
  })

  it('should register the service topics with a broker', function (done) {
    createAppConfigFile()
    var vtApiService = new VirusTotalApiService(SAMPLE_DIR)
    vtApiService.run(function () {
      var services = vtApiService._dxlClient._serviceManager._services
      var callbacksByTopic = services[Object.keys(services)[0]]['callbacksByTopic']
      var callbacksByTopicKeys = Object.keys(callbacksByTopic)

      expect(callbacksByTopicKeys).to.have.members(
        [
          VtApiServiceConstants.REQ_TOPIC_IP_ADDRESS_REPORT,
          VtApiServiceConstants.REQ_TOPIC_URL_SCAN,
          VtApiServiceConstants.REQ_TOPIC_URL_REPORT,
          VtApiServiceConstants.REQ_TOPIC_FILE_RESCAN,
          VtApiServiceConstants.REQ_TOPIC_FILE_REPORT,
          VtApiServiceConstants.REQ_TOPIC_DOMAIN_REPORT
        ]
      )

      vtApiService.destroy(function () {
        done()
      })
    })
  })
})

describe('VirusTotalApiService Samples', function () {
  this.timeout(30000)

  it('should run the Domain Report sample and log expected output', function (done) {
    var sampleTestObjects = sampleTestSetup()

    sampleTestObjects.vtApiService.run(function () {
      runSample(
        path.join(SAMPLE_DIR + '/basic/basic-domain-report-example.js'),
        TestConstants.DOMAIN_REPORT_PAYLOAD,
        done
      )

      sampleTestTeardown(sampleTestObjects)
    })
  })

  it('should run the File Report sample and log expected output', function (done) {
    var sampleTestObjects = sampleTestSetup()

    sampleTestObjects.vtApiService.run(function () {
      runSample(
        path.join(SAMPLE_DIR + '/basic/basic-file-report-example.js'),
        TestConstants.FILE_REPORT_PAYLOAD,
        done
      )

      sampleTestTeardown(sampleTestObjects)
    })
  })

  it('should run the File Rescan sample and log expected output', function (done) {
    var sampleTestObjects = sampleTestSetup()

    sampleTestObjects.vtApiService.run(function () {
      runSample(
        path.join(SAMPLE_DIR + '/basic/basic-file-rescan-example.js'),
        TestConstants.FILE_RESCAN_PAYLOAD,
        done
      )

      sampleTestTeardown(sampleTestObjects)
    })
  })

  it('should run the IP Address Report sample and log expected output', function (done) {
    var sampleTestObjects = sampleTestSetup()

    sampleTestObjects.vtApiService.run(function () {
      runSample(
        path.join(SAMPLE_DIR + '/basic/basic-ip-address-report-example.js'),
        TestConstants.IP_REPORT_PAYLOAD,
        done
      )

      sampleTestTeardown(sampleTestObjects)
    })
  })

  it('should run the URL Report sample and log expected output', function (done) {
    var sampleTestObjects = sampleTestSetup()

    sampleTestObjects.vtApiService.run(function () {
      runSample(
        path.join(SAMPLE_DIR + '/basic/basic-url-report-example.js'),
        TestConstants.URL_REPORT_PAYLOAD,
        done
      )

      sampleTestTeardown(sampleTestObjects)
    })
  })

  it('should run the URL Scan sample and log expected output', function (done) {
    var sampleTestObjects = sampleTestSetup()

    sampleTestObjects.vtApiService.run(function () {
      runSample(
        path.join(SAMPLE_DIR + '/basic/basic-url-scan-example.js'),
        TestConstants.URL_SCAN_PAYLOAD,
        done
      )

      sampleTestTeardown(sampleTestObjects)
    })
  })
})
