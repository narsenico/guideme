const path = require('path'),
    webpack = require('webpack'),
    ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: './src/guideme.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'guideme.min.js'
    },
    devServer: {
        contentBase: './dist'
    },
    devtool: 'hidden-source-map',
    module: {
        loaders: [{
            test: /\.css/,
            loader: ExtractTextPlugin.extract('css-loader'),
        }]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new ExtractTextPlugin('guideme.css'),
        // new webpack.LoaderOptionsPlugin({
        //     minimize: true,
        //     debug: false,
        // }),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            mangle: true,
            compress: {
                warnings: false,
                pure_getters: true,
                unsafe: true,
                unsafe_comps: true,
                screw_ie8: true
            },
            output: {
                comments: false,
            },
            // exclude: [/\.min\.js$/gi] // skip pre-minified libs
        })
    ]
};