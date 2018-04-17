const path = require("path");
const webpack = require("webpack");

const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");

const plugins = [
    new ForkTsCheckerWebpackPlugin({
        tslint: true
    }),
    // Generate skeleton HTML file
    new HtmlWebpackPlugin({
        inject: true,
        template: "src/index.html",
        xhtml: true
    }),
    new CleanWebpackPlugin(["dist"], {
        verbose: false
    }),
    new HardSourceWebpackPlugin()
];

module.exports = {
    devtool: "cheap-module-eval-source-map",
    entry: ["./src"],
    context: __dirname,
    plugins,
    output: {
        path: require("./config").output,
        // publicPath: "/",
        filename: "bundle.js"
    },
    optimization: {
        runtimeChunk: false,
        splitChunks: {
            chunks: "all", //Taken from https://gist.github.com/sokra/1522d586b8e5c0f5072d7565c2bee693
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: "ts-loader",
                    options: { transpileOnly: true }
                },
                exclude: /node_modules/
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                loader: "file-loader",
                options: { name: "[path][name].[ext]" }
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            "@res": path.join(__dirname, "src/res")
        }
    }
};
