const path = require("path");

module.exports = {
    mode: "production",
    entry: "../index.js",
    output: {
        filename: "mouselog.js",
        path: path.resolve(__dirname, "../build"),
        libraryTarget: "umd",
        library: "mouselog"
    },
    optimization: {
        minimize: false
    },
    target: "web",
}