const path = require('path');
const webpack = require('webpack');
const config = require("./config");

module.exports = {
    context: process.cwd(),
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.less', '.css'],
        modules: [__dirname, 'node_modules']
    },
    plugins: [
        new webpack.DllPlugin({
            name: '[name]',
            path: path.resolve(config.output, "library/[name].json")
        })],
    entry: {
        library: [
            'pixi.js',
            'stats.js'
        ]
    },
    output: {
        filename: '[name].dll.js',
        path: path.resolve(config.output, 'library'),
        library: '[name]'
    }
};