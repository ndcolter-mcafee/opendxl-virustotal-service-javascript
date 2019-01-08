'use strict'

var httprequest = require('request')
var path = require('path')
var inherits = require('inherits')
var dxl = require('@opendxl/dxl-client')
var Application = require('@opendxl/dxl-bootstrap').Application
var MessageUtils = require('@opendxl/dxl-bootstrap').MessageUtils
var VtApiServiceConstants = require('./vtapi-service-constants')

// VirusTotal API Key
var API_KEY = ''

/**
 * @classdesc Responsible for all communication with the Data Exchange Layer (DXL) fabric.
 * @external DxlClient
 * @see {@link https://opendxl.github.io/opendxl-client-javascript/jsdoc/Client.html}
 */

/**
 * @classdesc Request messages are sent using the
 * [asyncRequest]{@link https://opendxl.github.io/opendxl-client-javascript/jsdoc/Client.html#asyncRequest}
 * method of a client instance.
 * @external Request
 * @see {@link https://opendxl.github.io/opendxl-client-javascript/jsdoc/Request.html}
 */

/**
 * @classdesc This service exposes access to the VirusTotal API via the Data Exchange Layer
 * (DXL) fabric.
 *
 * @param {String} configDir - The directory containing the 'dxlclient.config'
 * and 'dxlvtapiservice.config' files used to configure this service.
 * @constructor
 */
function VirusTotalApiService (configDir) {
  if (!configDir) {
    throw new Error(
      'Unable to locate client config file at ' +
      path.join(configDir, VtApiServiceConstants.CLIENT_CONFIG_FILE))
  }

  Application.call(this, configDir, VtApiServiceConstants.APP_CONFIG_FILE)
}

inherits(VirusTotalApiService, Application)

/**
 * Create and send an HTTP request to the VirusTotal API server, and pass
 * the response to a callback function.
 * @param {String} [url] - The URL path to which to send the request.
 * @param {Object} [params] - Object containing parameters to include in
 * the URL of the HTTP request.
 * @param {Function} [callback] - Callback function which should be
 *   invoked after receiving the HTTP response.
 * @private
 */
function _sendHttpRequest (url, params, callback) {
  params.apikey = API_KEY

  var postApis = [
    VtApiServiceConstants.REQ_TOPIC_FILE_RESCAN,
    VtApiServiceConstants.REQ_TOPIC_URL_SCAN
  ]

  var method = 'GET'

  if (postApis.some(function (postApi) {
    return url.includes(postApi.substring(VtApiServiceConstants.SERVICE_TYPE.length))
  })) {
    method = 'POST'
  }

  var requestOptions = {
    url: url,
    method: method,
    qs: params
  }

  httprequest(requestOptions, function (err, res, body) {
    if (err !== null) {
      console.log('Error:', err)
    }
    var httpResponse = body.toString()
    callback(httpResponse, res.statusCode)
  })
}

/**
 * Converts a DXL service topic to the full URL required to access that API call
 * from the VirusTotal server.
 * @param {String} [serviceTopic] - The DXL topic to convert into a VirusTotal
 * URL.
 * @private
 */
function _serviceTopicToUrl (serviceTopic) {
  return VtApiServiceConstants.VTAPI_URL_FORMAT +
    serviceTopic.substring(VtApiServiceConstants.SERVICE_TYPE.length)
}

/**
 * A callback to handle DXL requests to the OpenDXL VirusTotal javascript service.
 * All of the requests supported by this service use this function as their
 * assigned callback.
 *
 * @param {external:Request} [request] - The incoming DXL request object.
 * @param {Object} [requiredParams] - Object containing the required parameters
 * for the VirusTotal API call associated with the instance of this callback.
 * @param {external:DxlClient} [dxlClient] - The DXL Client to use for sending
 * the response.
 * @private
 */
function _VtApiServiceRequestCallback (request, requiredParams, dxlClient) {
  try {
    console.log('Service received request payload: ' +
      request.payload.toString()
    )

    var params = MessageUtils.jsonPayloadToObject(request)

    for (var required in requiredParams) {
      if (requiredParams.hasOwnProperty(required)) {
        if (!(requiredParams[required] in params)) {
          throw new Error('Required parameter not specified: ' + requiredParams[required])
        }
      }
    }

    _sendHttpRequest(
      _serviceTopicToUrl(request.destinationTopic),
      params,
      function (httpResponse, error) {
        var response
        try {
          if (error !== 200) {
            throw new Error('VirusTotal error, HTTP response code: ' + error.toString())
          } else {
            response = new dxl.Response(request)
            MessageUtils.objectToJsonPayload(response, httpResponse)
            dxlClient.sendResponse(response)
          }
        } catch (ex) {
          var errorResponse = new dxl.ErrorResponse(request, 0, MessageUtils.encode(ex.message))
          dxlClient.sendResponse(errorResponse)
        }
      })
  } catch (ex) {
    if (ex.message.includes(API_KEY)) {
      ex.message.replace(API_KEY, '--api-key--')
    }
    console.log("Error handling request - '" + ex.message.toString() + "'")

    var errorResponse = new dxl.ErrorResponse(request, 0, MessageUtils.encode(ex.message))
    dxlClient.sendResponse(errorResponse)
  }
}

/**
 * Invoked after the dxlvtapiservice.config file has been loaded and parsed
 * for configuration settings.
 * @param {Object} config - The application-specific configuration, as an
 *   object parsed from the application-configuration file. For example, the
 *   configuration file could have the following content on disk:
 *
 *   ```ini
 *   [General]
 *   apiKey = abc123
 *   ```
 *
 *   The application could then reference the `apiKey` setting from the
 *   `config` object as follows:
 *
 *   ```js
 *   this.apiKey = config.General.apiKey
 *   ```
 */
VirusTotalApiService.prototype.onLoadConfiguration = function (config) {
  // Set apiKey from config section/value
  API_KEY = config.General.apiKey
}

/**
 * Invoked when services should be registered with the application.
 */
VirusTotalApiService.prototype.onRegisterServices = function () {
  var that = this
  var client = this._dxlClient
  var serviceRegInfo = new dxl.ServiceRegistrationInfo(client, VtApiServiceConstants.SERVICE_TYPE)

  serviceRegInfo.ttl = 1
  serviceRegInfo.addTopic(
    VtApiServiceConstants.REQ_TOPIC_DOMAIN_REPORT, function (request) {
    _VtApiServiceRequestCallback(
      request,
      [VtApiServiceConstants.PARAM_DOMAIN],
      that._dxlClient)
    }
  )
  serviceRegInfo.addTopic(
    VtApiServiceConstants.REQ_TOPIC_FILE_REPORT, function (request) {
    _VtApiServiceRequestCallback(
      request,
      [VtApiServiceConstants.PARAM_RESOURCE],
      that._dxlClient)
    }
  )
  serviceRegInfo.addTopic(
    VtApiServiceConstants.REQ_TOPIC_FILE_RESCAN, function (request) {
    _VtApiServiceRequestCallback(
      request,
      [VtApiServiceConstants.PARAM_RESOURCE],
      that._dxlClient)
    }
  )
  serviceRegInfo.addTopic(
    VtApiServiceConstants.REQ_TOPIC_URL_REPORT, function (request) {
    _VtApiServiceRequestCallback(
      request,
      [VtApiServiceConstants.PARAM_RESOURCE],
      that._dxlClient)
    }
  )
  serviceRegInfo.addTopic(
    VtApiServiceConstants.REQ_TOPIC_URL_SCAN, function (request) {
    _VtApiServiceRequestCallback(
      request,
      [VtApiServiceConstants.PARAM_URL],
      that._dxlClient)
    }
  )
  serviceRegInfo.addTopic(
    VtApiServiceConstants.REQ_TOPIC_IP_ADDRESS_REPORT, function (request) {
    _VtApiServiceRequestCallback(
      request,
      [VtApiServiceConstants.PARAM_IP],
      that._dxlClient)
    }
  )

  client.registerServiceAsync(serviceRegInfo,
    function (error) {
      if (error) {
        client._dxlClient.destroy()
        console.log('Error registering service: ' + error.message)
      }
    })
}

/**
 * Holds the VirusTotal API Key to use for communication with the
 * VirusTotal server. This string is empty at initialization of the
 * service, and is populated
 * @type {string}
 * @private
 */
Object.defineProperty(VirusTotalApiService.prototype, 'apiKey', {
  get: function () {
    return API_KEY
  }
})

module.exports = VirusTotalApiService
