const path = require('path');
const webpack = require('webpack');
const config = require("./config");

const phaser = path.resolve(__dirname, "node_modules/phaser/dist/phaser.js");

module.exports = {
    context: process.cwd(),
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.less', '.css'],
        modules: [__dirname, 'node_modules'],
        alias: {
            phaser
        }
    },
    plugins: [
        new webpack.DllPlugin({
            name: '[name]',
            path: path.resolve(config.build, "library/[name].json")
        })],
    entry: {
        library: [
            'stats.js',
            'phaser'
        ]
    },
    module:
        {
            rules: [
                { test: /phaser\.js$/, loader: 'expose-loader?Phaser' }
            ]
        },
    output: {
        filename: '[name].dll.js',
        path: path.resolve(config.build, 'library'),
        library: '[name]'
    }
};