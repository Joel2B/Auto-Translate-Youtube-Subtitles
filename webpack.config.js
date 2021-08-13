const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');

module.exports = (env, arg) => {
    const mode = arg.mode;
    return {
        mode: mode,
        devtool: mode == 'development' ? 'inline-source-map' : false,
        entry: {
            'pop-up': './src/pop-up/modules/script.js',
            background: './src/extension/modules/background.js',
            'content-script': './src/extension/modules/content-script.js',
        },
        resolve: { extensions: ['.js'], modules: [path.resolve(__dirname, 'src'), 'node_modules'] },
        optimization: {
            minimize: mode != 'development',
        },
        plugins: [
            new webpack.DefinePlugin({
                // replace with your own api
                TRANSLATION_API: JSON.stringify(
                    'http://localhost/chrome-extensions/custom-subtitles/dist/translation-api/',
                ),
            }),
            new HtmlWebpackPlugin({
                template: 'src/pop-up/index.html',
                filename: 'pop-up.html',
                minify: mode != 'development',
                inject: false,
                scriptLoading: 'blocking',
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: './src/extension/manifest.json',
                    },
                    {
                        from: './src/extension/css/',
                        to: './css/',
                    },
                    {
                        from: './src/pop-up/img/',
                        to: './img/',
                    },
                    {
                        from: './src/translation-api/',
                        to: './translation-api/',
                    },
                    {
                        from: './src/pop-up/css/styles.css',
                        to: './css/pop-up.css',
                    },
                ],
            }),
            new FileManagerPlugin({
                events: {
                    onEnd: {
                        move: [
                            { source: './dist/pop-up.js', destination: './dist/js/pop-up.js' },
                            { source: './dist/content-script.js', destination: './dist/js/content-script.js' },
                        ],
                    },
                },
            }),
        ],
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist'),
            clean: true,
        },
    };
};
