// Configuration of generating compressed `mouselog.min.js`
const path = require("path");

module.exports = {
    mode: "production",
    entry: ["isomorphic-fetch", "../src/webpack_entry.js"],
    output: {
        filename: "mouselog.min.js",
        path: path.resolve(__dirname, "../build"),
        libraryTarget: "umd",
        library: "mouselog"
    },
    optimization: {
        minimize: true
    },
    target: "web",
    module: {
        rules: [
            {
                test: /\.js$/,
                include: [
                    path.resolve(__dirname, '../src')
                ],
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ["@babel/preset-env"/*, {
                                // Must declare "modules":"commonjs" if CommonJS styles import/export are used
                                // https://github.com/webpack/webpack/issues/4039
                                "modules": "commonjs"
                            }*/]
                        ],
                        // Polyfill for IE: starts-with-ends-with
                        plugins: ["@babel/plugin-transform-runtime", "starts-with-ends-with"]
                    }
                }
            }
        ]
    }
}