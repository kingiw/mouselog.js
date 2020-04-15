// Configuration of generating compressed `mouselog.min.js`
const path = require("path");
var webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
var JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = {
    mode: "production",
    entry: ["isomorphic-fetch", "../src/webpack_entry.js"],
    output: {
        filename: "mouselog.min2.js",
        path: path.resolve(__dirname, "../build"),
        libraryTarget: "umd",
        library: "mouselog"
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
                        plugins: ["@babel/plugin-transform-runtime"]
                    }
                }
            }
        ]
    },
    plugins: [
        new JavaScriptObfuscator ({
            compact: true,
            rotateUnicodeArray: true,
            identifierNamesGenerator: 'mangled',
            selfDefending: false,
            stringArrayEncoding: true,
            shuffleStringArray: true,
            stringArrayThreshold: 1,
            transformObjectKeys: true,
            disableConsoleOutput: true,
            target: 'browser'
        }),
        new UglifyJsPlugin(
            {uglifyOptions: {
                output: {
                    comments: false
                }
            }
        }),
    ]
}