'use strict'

var common = require('../common')
var dxl = common.require('@opendxl/dxl-client')
var MessageUtils = common.require('@opendxl/dxl-bootstrap').MessageUtils

// The function we will be calling to send the DXL Request to the
// OpenDXL VirusTotal API Service
function sendFileReportRequest (client) {
  var requestTopic = '/opendxl-virustotal/service/vtapi/file/report'

  var request = new dxl.Request(requestTopic)

  var payloadObj = {
    'resource': '7657fcb7d772448a6d8504e4b20168b8'
  }

  MessageUtils.objectToJsonPayload(request, payloadObj)

  client.asyncRequest(request,
    function (error, response) {
      if (error) {
        console.log('Request error: "' + error.message + '"')
      } else {
        // Parse the JSON Object
        var jsonObject = MessageUtils.jsonPayloadToObject(response)

        // Pretty-print the parsed JSON object
        console.log('Client received response payload: \n' +
          MessageUtils.objectToJson(jsonObject, true)
        )
      }

      // Because this is a sample, we will destroy the client after one
      // use. For a real application, the client should exist as long as
      // the application will be sending/receiving messages over DXL.
      client.destroy()
    })
}

// Create our DXL Client to send requests
var config = dxl.Config.createDxlConfigFromFile(common.CONFIG_FILE)
var dxlClient = new dxl.Client(config)

dxlClient.connect(function () {
  sendFileReportRequest(dxlClient)
})
