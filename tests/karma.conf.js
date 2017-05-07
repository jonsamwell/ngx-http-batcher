module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      { pattern: './main.js', watched: false }
    ],
    exclude: [
    ],
    preprocessors: {
      './main.js': ['webpack', 'sourcemap']
    },
    webpack: require('./webpack-spec.config')({env: 'test'}),
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['Chrome'],
    singleRun: true,
    concurrency: Infinity
  })
}
