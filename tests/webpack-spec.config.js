module.exports = () => {
    return {
        entry: {
            main: './src/index.ts'
        },
        output: {
            path: './dist-spec',
            filename: 'ngx-http-batcher.bundle.js'
        },
        resolve: {
            extensions: ['.js', '.ts', '.html']
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loaders: [
                        'ts-loader'
                    ]
                }
            ]
        },
        devtool: 'inline-source-map'
    };
};
