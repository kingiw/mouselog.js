class Config {
    // Set up a default config
    constructor() {
        // Type: string, REQUIRED
        // Endpoint Url
        this.uploadEndpoint = "http://localhost:9000";

        // Type: string
        // Website ID
        this.websiteId = "unknown";

        // Endpoint type, "absolute" or "relative"
        this.endpointType = "absolute";

        // Upload mode, "mixed", "periodic" or "event-triggered"
        this.uploadMode = "mixed";

        // Type: number
        // If `uploadMode` is "mixed", "periodic", data will be uploaded every `uploadPeriod` ms.
        // If no data are collected in a period, no data will be uploaded
        this.uploadPeriod = 5000;

        // Type: number
        // If `uploadMode` == "event-triggered"
        // The website interaction data will be uploaded when every `frequency` events are captured.
        this.frequency = 50;

        // Type: bool
        // Use GET method to upload data? (stringified data will be embedded in URI)
        this.enableGet = false;

        // Type: number
        // Time interval for resending the failed trace data
        this.resendInterval = 3000;

        this._requiredParams = [
            "uploadEndpoint",
        ]
    }

    build(config) {
        try {
            this._requiredParams.forEach(key => {
                if (!config.hasOwnProperty(key)) {
                    throw new Error(`Param ${key} is required but not declared.`);
                }
            });
            // Overwrite the default config
            Object.keys(config).forEach( key => {
                // Overwriting Class private members / function method is not allowed
                if (this[key] && !key.startsWith("_") && typeof(this[key]) != "function") {
                    this[key] = config[key]
                }
            })

            config.absoluteUrl = this._formatUrl();
        } catch(err) {
            console.log(err);
            return false;
        }
        return true;
    }

    update(config) {
        return this.build(config);
    }

    _formatUrl() {
        let url = this.uploadEndpoint;
        if (this.endpointType == "relative") {
            if (url.startsWith("./")) {
                url = url.slice(1);
            } else if (url[0] !== "/") { 
                url = "/" + url;
            }
            // Format the tail
            if (url[url.length-1] === "/") {
                url = url.slice(0, url.length-1);
            }
            // Construct absolute URL
            url = `${window.location.origin}${url}`
        } else if (this.endpointType !== "absolute") {
            throw new Error('`endpointType` can only be "absolute" or "relative"');
        }
        return url;
    }
}

module.exports = { Config };