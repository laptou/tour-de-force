const path = require('path');
const webpack = require('webpack');

module.exports = {
    context: process.cwd(),
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.less', '.css'],
        modules: [__dirname, 'node_modules']
    },
    plugins: [new webpack.DllPlugin({
        name: '[name]',
        path: './build/library/[name].json'
    })],
    entry: {
        library: [
            'pixi.js',
            'stats.js'
        ]
    },
    output: {
        filename: '[name].dll.js',
        path: path.resolve(__dirname, './build/library'),
        library: '[name]'
    }
};