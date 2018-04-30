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
            path: path.resolve(config.build, "library/[name].json")
        }),
        new webpack.DefinePlugin({
            'CANVAS_RENDERER': JSON.stringify(true),
            'WEBGL_RENDERER': JSON.stringify(true)
        })
    ],
    entry: {
        library: [
            'stats.js',
            'phaser'
        ]
    },
    module:
        {
            rules: [
                {
                    test: /\.(glsl|vert|frag)$/i,
                    use: 'raw-loader'
                }
            ]
        },
    output: {
        filename: '[name].dll.js',
        path: path.resolve(config.build, 'library'),
        library: '[name]'
    }
};