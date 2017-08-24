const path = require('path'),
    webpack = require('webpack'),
    ExtractTextPlugin = require('extract-text-webpack-plugin');

const extractCss = new ExtractTextPlugin('guideme.css'),
    extractHtml = new ExtractTextPlugin('index.html')

module.exports = {
    entry: {
        'guideme-bundle': './src/guideme-bundle.js',
        'guideme-alone': './src/guideme-alone.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].min.js'
    },
    devServer: {
        contentBase: './dist'
    },
    devtool: 'hidden-source-map',
    module: {
        loaders: [{
            test: /\.css/,
            loader: extractCss.extract('css-loader'),
        },{
            test: /\.html/,
            loader: extractHtml.extract('html-loader'),
        }]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        extractHtml,
        extractCss,
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