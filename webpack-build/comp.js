// Configuration of generating compressed `mouselog.min.js`
const path = require("path");

module.exports = {
    mode: "production",
    entry: "./entry.js",
    output: {
        filename: "mouselog.min.js",
        path: path.resolve(__dirname, "../build"),
        libraryTarget: "umd",
        library: "mouselog"
    },
    optimization: {
        minimize: true,
    },
    target: "web"
}