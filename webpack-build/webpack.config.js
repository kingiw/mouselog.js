const path = require("path");

module.exports = {
    mode: "production",
    entry: "../src/index.js",
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
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    }
}