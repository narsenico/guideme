const path = require('path'),
    webpack = require('webpack');

module.exports = {
    entry: './guideme.js',
    output: {
        filename: 'guideme.js',
        path: path.resolve(__dirname, 'dist'),
        sourceMapFilename: 'guideme.js.map'
    },
    devServer: {
        contentBase: './dist'
    },    
    devtool: 'source-map',
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true
        })
    ]
};