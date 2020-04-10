const path = require('path');

module.exports = {
  entry: './index.js',
  module: {
    rules: [
      {
        test: /\.glsl$/,
        use: '../../'
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