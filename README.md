[![NPM version](https://img.shields.io/npm/v/mouselog)](https://www.npmjs.com/package/mouselog)
![Repo Size](https://img.shields.io/github/repo-size/microsoft/mouselog.js)


Mouselog.js
====

Mouselog.js is the client-side agent for Microsoft's [Mouselog](https://github.com/microsoft/mouselog), a user behavior monitoring platform for websites.

## NPM
Install Mouselog.js via
```
npm i mouselog --save
```

Then load and configure mouselog
```Javascript
const mouselog = require('mouselog');
let config = {
    // Upload the data object when every `frequency` events are captured.
    frequency: 50,
    // Data objects will be encoded by `encoder` before uploading to the server.
    encoder: JSON.stringify,
    // The response data will be decoded by `decoder` 
    decoder: x => x
}
```
Run Mouselog and it will automatically collect all you want.
```Javascript
mouselog.run("YOUR_SERVER_URL", "YOUR_WEBSITE_ID", config);
```

You can also deactivate Mouselog by calling `mouselog.stop()`.

# Demo
[Mouselog-demo](https://github.com/hsluoyz/mouselog-demo)

# Schema

![image](schema.jpg)


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
