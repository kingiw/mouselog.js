[![NPM version](https://img.shields.io/npm/v/mouselog)](https://www.npmjs.com/package/mouselog)
![Repo Size](https://img.shields.io/github/repo-size/microsoft/mouselog.js)


Mouselog.js
====

Mouselog.js is the client-side agent for Microsoft's [Mouselog](https://github.com/microsoft/mouselog), a user behavior monitoring platform for websites.

## CDN
Embed Mouselog in your HTML files:
```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/mouselog@latest/build/mouselog.js"></script>
<script>
    var agent = mouselog.init();
    agent.run({
        uploadEndpoint: "Your_Server_Url",
        websiteId: "Your_Website_Id",
        endpointType: "absolute"
    });
</script>
```
You can also include mouselog dynamically in Javascript:
```Javascript
(function() {
    var script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mouselog@latest/build/mouselog.js";
    script.onload = function() {
        var agent = mouselog.init();
        agent.run({
            uploadEndpoint: "Your_Server_Url",
            websiteId: "Your_Website_Id",
            endpointType: "absolute"
        });
    }
    var t = document.getElementsByTagName("script");
    var s = t.length > 0 ? t[0].parentNode : document.body;
    s.appendChild(script, s);
})();
```

###
To achieve high compatability for IE9, you should refer to [promise-polyfill](https://github.com/taylorhakes/promise-polyfill) before refering Mouselog agent.

## Build Manually
You can also bundle Mouselog.js manually via
```
npm i
npm run build
```
This will generate the bundled scripts in `./build`.

## NPM
Install Mouselog.js via
```
npm i mouselog --save
```

Then run Mouselog and it will automatically collect all you want.
```Javascript
// const { Mouselog } = require('mouselog');
import Mouselong from 'mouselog';
let agent = new Mouselog();
agent.run({
    uploadEndpoint: "Your_Server_Url",
    websiteId: "Your_Website_Id",
    endpointType: "absolute"
});
```
You can also deactivate Mouselog by calling `agent.stop()`.


# Configuration

## Username

You can set username by assigning the username to `window.mouselogUserId`.
```js
window.mouselogUserId = "Username"；
```
Mouselog agent will automatically load it when uploading the data to the server.

## Other parameters
```js
{
    // Type: string
    // Endpoint Url, required
    uploadEndpoint: "your_server_url",

    // Type: string
    // Website ID
    websiteId: "unknown",

    // Endpoint type, "absolute" or "relative"
    endpointType: "absolute",

    // Upload mode, "mixed", "periodic" or "event-triggered"
    // "periodic": upload data in every period.
    // "event-triggered": upload data when a number of interaction data is captured
    // "mixed": the mixture of the previous two upload mode 
    uploadMode: "mixed",

    // Type: number
    // If `uploadMode` == "periodic", data will be uploaded every `uploadPeriod` ms.
    // If no data are collected in a period, no data will be uploaded
    uploadPeriod: 5000,

    // Type: number
    // If `uploadMode` == "event-triggered"
    // The website interaction data will be uploaded when every `frequency` events are captured.
    frequency: 50,

    // Maximum size of a single package
    sizeLimit = 65535,

    // Type: bool
    // Use GET method to upload data? (stringified data will be embedded in URI)
    enableGet: false,

    // Type: HTML DOM Element
    // Agent only listens and captures events in `config.scope`
    scope: window.document
}
```

# Demo
[Mouselog-demo](https://github.com/hsluoyz/mouselog-demo)

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
