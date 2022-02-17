const path = require('path');

module.exports = {
  entry: './index-es.js',
  module: {
    rules: [
      {
        test: /\.glsl$/,
        use: {
          loader: '../../',
          options: {
            esModule: true,
            includesOnly: true,
          }
        }
      }
    ]
  },
  resolve: {
    extensions: [ '.glsl' ]
  },
  output: {
    path: path.resolve(__dirname, '../../build/__tests__/webpack'),
    filename: 'index.js'
  }
};
