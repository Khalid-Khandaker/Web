const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        index: './src/index.js',
        login: './src/pages/login.js',
        firebase: './src/utils/firebase.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js'
    },
    watch: true
}