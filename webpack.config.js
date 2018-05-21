const path = require("path");
const webpack = require("webpack");
const config = require("./config");

const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");

const plugins = [
    new ForkTsCheckerWebpackPlugin({
        tslint: true
    }),
    new webpack.DllReferencePlugin({
        context: __dirname,
        manifest: require(path.resolve(config.build, "library/library.json"))
    }),
    // Generate skeleton HTML file
    new HtmlWebpackPlugin({
        inject: true,
        template: "src/index.html",
        xhtml: true
    }),
    new CleanWebpackPlugin(["dist"], {
        exclude: ["library"]
    }),
    new HardSourceWebpackPlugin()
];

module.exports = {
    devtool: "eval-source-map",
    entry: "./src/index.ts",
    context: __dirname,
    plugins,
    output: {
        path: config.output,
        filename: "[name].js",
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
                test: /\.ts$/i,
                use: {
                    loader: "ts-loader",
                    options: { transpileOnly: true }
                },
                exclude: /node_modules/i
            },
            {
                test: /\.(png|svg|jpg|gif)$/i,
                loader: "file-loader",
                options: { name: "[path][name].[ext]" }
            },
            {
                test: /\.(glsl|vert|frag)$/i,
                use: 'raw-loader'
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js", ".glsl", ".json"],
        alias: {
            "@res": path.join(__dirname, "src/res"),
            "@lib": path.join(__dirname, "src/lib"),
            "@shader": path.join(__dirname, "src/shader"),
            "@control": path.join(__dirname, "src/control"),
            "@scene": path.join(__dirname, "src/scene"),
            "@util": path.join(__dirname, "src/util"),
        }
    }
};
