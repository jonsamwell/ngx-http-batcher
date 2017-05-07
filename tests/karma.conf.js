module.exports = function (config) {
  const cfg = {
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
    webpack: require('./webpack-spec.config')({ env: 'test' }),
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['Chrome'],
    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
    singleRun: true,
    concurrency: Infinity
  };

  if (process.env.TRAVIS) {
    cfg.browsers = ['Chrome_travis_ci'];
  }

  config.set(cfg);
}
