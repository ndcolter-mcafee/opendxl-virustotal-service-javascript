The VirusTotal OpenDXL JavaScript service requires a set of configuration files to operate.

The VirusTotal OpenDXL JavaScript service distribution contains configuration files located in 
the ``sample`` sub-directory that must be populated in order for the samples to connect to the 
DXL fabric.

Each of these files are documented throughout the remainder of this page.

Application configuration directory:

```
sample/
    dxlclient.config
    dxlvtapiservice.config
```

### DXL Client Configuration File (dxlclient.config)

The required `dxlclient.config` file is used to configure the DXL client that will connect to 
the DXL fabric.

The steps to populate this configuration file are the same as those documented in the 
`OpenDXL JavaScript Client (Node.js) SDK`, see the
[OpenDXL JavaScript Client (Node.js) SDK Samples](https://opendxl.github.io/opendxl-client-javascript/jsdoc/tutorial-samples.html)
page for more information.

The following is an example of a populated configuration file:

```ini
[Certs]
BrokerCertChain=c:\\certificates\\brokercerts.crt
CertFile=c:\\certificates\\client.crt
PrivateKey=c:\\certificates\\client.key

[Brokers]
{5d73b77f-8c4b-4ae0-b437-febd12facfd4}={5d73b77f-8c4b-4ae0-b437-febd12facfd4};8883;mybroker.mcafee.com;192.168.1.12
{24397e4d-645f-4f2f-974f-f98c55bdddf7}={24397e4d-645f-4f2f-974f-f98c55bdddf7};8883;mybroker2.mcafee.com;192.168.1.13
```

### VirusTotal API DXL service (dxlvtapiservice.config)

The required `dxlvtapiservice.config` file is used to configure the service, enabling it to use
your VirusTotal API key to authorize RESTful requests to the VirusTotal HTTP server.

The following is an example of a populated configuration file:

```ini
[General]
# The VirusTotal API Key (required)
apiKey=-- YOUR API KEY --
```

#### General

The General section of the `dxlvtapiservice.config` file is used to specify the VirusTotal API 
key.

| Name   | Required | Description                                                     |
| :----- | :------  | :-------------------------------------------------------------- |
| apiKey | yes      | The VirusTotal API key used for authenticating with VirusTotal. |