#!/usr/bin/env node

'use strict'

var program = require('commander')
var vtApiServiceCli = require('../lib/vtapi-service-cli')

function processError (error) {
  if (error) {
    var verbosity = vtApiServiceCli.getProgramVerbosity(program)
    if (verbosity) {
      vtApiServiceCli.logError(error, { verbosity: verbosity })
    }
    process.exit(1)
  }
}

program
  .version('0.1.0')
  .option('-c, --config-dir [dir]',
    'Directory with dxlclient.config and dxlvtapiservice.config files')
  .parse(process.argv)

vtApiServiceCli(program, processError)
