var http = require('http')
var url = require('url')
var VtApiServiceConstants = require('./../lib/vtapi-service-constants')
var TestConstants = require('./test-constants')

var SVC_SUBSTR_LEN =
  VtApiServiceConstants.SERVICE_TYPE.length
var DOMAIN_REPORT_PATH =
  VtApiServiceConstants.REQ_TOPIC_DOMAIN_REPORT.substring(SVC_SUBSTR_LEN)
var FILE_REPORT_PATH =
  VtApiServiceConstants.REQ_TOPIC_FILE_REPORT.substring(SVC_SUBSTR_LEN)
var FILE_RESCAN_PATH =
  VtApiServiceConstants.REQ_TOPIC_FILE_RESCAN.substring(SVC_SUBSTR_LEN)
var URL_REPORT_PATH =
  VtApiServiceConstants.REQ_TOPIC_URL_REPORT.substring(SVC_SUBSTR_LEN)
var URL_SCAN_PATH =
  VtApiServiceConstants.REQ_TOPIC_URL_SCAN.substring(SVC_SUBSTR_LEN)
var IP_REPORT_PATH =
  VtApiServiceConstants.REQ_TOPIC_IP_ADDRESS_REPORT.substring(SVC_SUBSTR_LEN)

var SERVER

function _parsePath (parsedUrl, response) {
  var parsedPath = parsedUrl.pathname

  if ('apikey' in parsedUrl.query) {
    if (parsedUrl.query.apikey === TestConstants.EXPECTED_API_KEY) {
      parsedPath.includes(DOMAIN_REPORT_PATH)
        ? _domainReport(response)
        : parsedPath.includes(FILE_REPORT_PATH)
          ? _fileReport(response)
          : parsedPath.includes(FILE_RESCAN_PATH)
            ? _fileRescan(response)
            : parsedPath.includes(URL_REPORT_PATH)
              ? _urlReport(response)
              : parsedPath.includes(URL_SCAN_PATH)
                ? _urlScan(response)
                : parsedPath.includes(IP_REPORT_PATH)
                  ? _ipAddressReport(response)
                  : _unknownPath(response, parsedUrl)
    } else {
      response.write(
        "Error: Incorrect test API Key - Expected: '" + TestConstants.EXPECTED_API_KEY + "'"
      )
    }
  } else {
    response.write('Error: Missing API Key')
  }
  response.end()
}

function _unknownPath (response, parsedUrl) {
  response.write("Error: Unsupported API URL path: '" + parsedUrl.pathname + "'")
}

function _domainReport (response) {
  response.write(JSON.stringify(TestConstants.DOMAIN_REPORT_PAYLOAD))
}

function _fileReport (response) {
  response.write(JSON.stringify(TestConstants.FILE_REPORT_PAYLOAD))
}

function _fileRescan (response) {
  response.write(JSON.stringify(TestConstants.FILE_RESCAN_PAYLOAD))
}

function _urlReport (response) {
  response.write(JSON.stringify(TestConstants.URL_REPORT_PAYLOAD))
}

function _urlScan (response) {
  response.write(JSON.stringify(TestConstants.URL_SCAN_PAYLOAD))
}

function _ipAddressReport (response) {
  response.write(JSON.stringify(TestConstants.IP_REPORT_PAYLOAD))
}

function MockVtApiHttpServer () {}

MockVtApiHttpServer.prototype.startServer = function (port) {
  SERVER = http.createServer(
    function (request, response) {
      response.writeHead(200, { 'Content-type': 'text/plan' })

      var urlpath = url.parse(request.url, true)
      _parsePath(urlpath, response)
    }
  ).listen(port)
}

MockVtApiHttpServer.prototype.stopServer = function () {
  SERVER.close()
}

module.exports = MockVtApiHttpServer
