const path = require('path');
const webpack = require('webpack');

/**
 * Webpack Plugins
 */
const CleanWebpackPlugin = require('clean-webpack-plugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');

module.exports = {
  devtool: 'source-map',

  resolve: {
    extensions: ['.ts', '.js']
  },

  entry: './src/index.ts',

  output: {
    path: path.resolve(__dirname, 'dist/bundles'),
    publicPath: '/',
    filename: 'ngx-http-batcher.umd.js',
    library: 'ngx-http-batcher',
    libraryTarget: 'umd'
  },

  // require those dependencies but don't bundle them
  externals: [/^\@angular\//, /^rxjs\//],

  module: {
    rules: [{
      enforce: 'pre',
      test: /\.ts$/,
      loader: 'tslint-loader',
      exclude: ['node_modules', 'tests', 'dist']
    },
    {
      test: /\.tsx?$/,
      loader: 'ts-loader',
      options: {
        compilerOptions: {
          "inlineSources": false,
          "inlineSourceMap": false,
          "declaration": false
        }
      }
    }]
  },

  plugins: [
    // fix the warning in ./~/@angular/core/src/linker/system_js_ng_module_factory_loader.js
    new webpack.ContextReplacementPlugin(
      /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
      './src'
    ),

    new webpack.LoaderOptionsPlugin({
      options: {
        tslintLoader: {
          emitErrors: true,
          failOnHint: true
        }
      }
    }),

    // Reference: https://github.com/johnagan/clean-webpack-plugin
    // Removes the bundle folder before the build
    new CleanWebpackPlugin(['dist/bundles'], {
      root: './',
      verbose: false,
      dry: false
    })
  ]
};
