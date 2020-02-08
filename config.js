let config = {
    // Type: string
    // Endpoint Url
    uploadEndpoint: "http://localhost:9000",

    // Type: string
    // Website ID
    websiteId: "unknown",

    // Endpoint type, "absolute" or "relative"
    endpointType: "absolute",

    // Upload mode, "periodic" or "event-triggered"
    uploadMode: "periodic",

    // Type: number
    // If `uploadMode` == "periodic", data will be uploaded every `uploadPeriod` ms.
    // If no data are collected in a period, no data will be uploaded
    uploadPeriod: 5000,

    // Type: number
    // If `uploadMode` == "event-triggered"
    // The website interaction data will be uploaded when every `frequency` events are captured.
    frequency: 50,

    // Type: function
    // The website interaction data will be encoded by `encoder` before uploading to the server.
    encoder: JSON.stringify,

    // Type: function
    // The response data will be decoded by `decoder` 
    decoder: x => x,

    // Type: bool
    // Use GET method to upload data? (stringified data will be embedded in URI)
    enableGet: false, 

    // Type: number
    // Time interval for resending the failed trace data
    resendInterval: 3000, 
}

requiredParams = [
    "uploadEndpoint",
];

let buildConfig = (params) => {
    requiredParams.forEach(key => {
        if (!(key in params)) {
            throw new Error(`Param ${key} is required but not declared.`);
        }
    });
    Object.keys(params).forEach(key => {
        config[key] = params[key];
    });
}

config.formatUrl = () => {
    // TODO
}

module.exports = { config, buildConfig }