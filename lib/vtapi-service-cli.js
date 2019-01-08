#!/usr/bin/env node

'use strict'

var VirusTotalApiService = require('./vtapi-service')

module.exports = function (program) {
  if (program.configDir !== undefined) {
    var vtApiService = new VirusTotalApiService(program.configDir)
    vtApiService.run(function () {})
  } else {
    console.log('Error: No configuration directory specified.\n')
    program.outputHelp()
  }
}
