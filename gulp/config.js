var dest = './build',
src = './src';

module.exports = {
  browserSync: {
    server: {
      // We're serving the src folder as well
      // for sass sourcemap linking
      baseDir: [dest, src],
      middleware: [
        function(req, res, next) {
          res.setHeader("Access-Control-Allow-Origin", "*");
          next();
        }
      ]
    },
    files: [
    dest + '/**'
    ]
  },
  markup: {
    src: src + "/www/**",
    dest: dest
  },
  browserify: {
    // Enable source maps
    debug: true,
    // A separate bundle will be generated for each
    // bundle config in the list below
    bundleConfigs: [{
      entries: src + '/js/app.jsx',
      dest: dest,
      outputName: 'app.js'
    }]
  }
};
