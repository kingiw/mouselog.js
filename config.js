

// Default config
let config = {
    // Type: string, REQUIRED
    // Endpoint Url
    uploadEndpoint: "http://localhost:9000",

    // Type: string
    // Website ID
    websiteId: "unknown",

    // Endpoint type, "absolute" or "relative"
    endpointType: "absolute",

    // upload protocol, "https" or "http"
    // If you declare it in `uploadEndpoint`, this property will be ignored. 
    uploadProtocol: "https",

    // Upload mode, "mixed", "periodic" or "event-triggered"
    uploadMode: "mix",

    // Type: number
    // If `uploadMode` is "mixed", "periodic", data will be uploaded every `uploadPeriod` ms.
    // If no data are collected in a period, no data will be uploaded
    uploadPeriod: 5000,

    // Type: number
    // If `uploadMode` == "event-triggered"
    // The website interaction data will be uploaded when every `frequency` events are captured.
    frequency: 50,

    // Type: bool
    // Use GET method to upload data? (stringified data will be embedded in URI)
    enableGet: false, 

    // Type: number
    // Time interval for resending the failed trace data
    resendInterval: 3000, 
}

// ----------------------------

let requiredParams = [
    "uploadEndpoint",
];

// Returns a boolean indicating if config is built successfully
let buildConfig = (params) => {
    try {
        requiredParams.forEach(key => {
            if (!(params.hasOwnProperty(key))) {
                throw new Error(`Param ${key} is required but not declared.`);
            }
        });
        config = Object.assign(config, params);
        config.absoluteUrl = formatUrl();
    } catch(err) {
        console.log(err);
        return false;
    }
    return true;
}

let updateConfig = (params) => {
    // Generate new config
    return buildConfig(params);
}

let formatUrl = () => {
    let url = config.uploadEndpoint
    if (config.endpointType == "relative") {
        // Format the head -> "/*"
        if (url.startsWith("./")) {
            url = url.slice(1);
        } else if (url[0] !== "/") {
            url = `/${url}`;
        }
        // Format the tail
        if (url[url.length-1] === "/") {
            url = url.slice(0, url.length-1);
        }
        // Construct absolute URL
        url = `${config.uploadProtocol}://${window.location.hostname}${url}`;
    } else if (config.endpointType == "absolute") {
        if (!(url.startsWith("http://") || url.startsWith("https://"))) {
            url = `${config.uploadProtocol}://${url}`;
        }
    } else {
        throw new Error('`endpointType` can only be "absolute" or "relative"');
    }
    return url;
}

module.exports = { config, buildConfig, updateConfig }