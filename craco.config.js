/* craco.config.js — корень проекта */
const path = require('path');
const alias = (dir) => path.resolve(__dirname, `src/${dir}`);

module.exports = {
    webpack: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@app':      alias('app'),
            '@pages':    alias('pages'),
            '@widgets':  alias('widgets'),
            '@features': alias('features'),
            '@entities': alias('entities'),
            '@shared':   alias('shared'),
        },
        configure: (webpackConfig) => {
            webpackConfig.resolve.extensions.push('.ts', '.tsx');
            return webpackConfig;
        },
    },
};
