const fsbx = require('fuse-box')
const fusebox = new fsbx.FuseBox({
  homeDir: './ui',
  sourceMap: {
    bundleReference: 'sourcemaps.js.map',
    outFile: './public/sourcemaps.js.map'
  },
  outFile: './public/bundle.js',
  plugins: [
    [
      fsbx.SassPlugin({ outputStyle: 'compressed' }),
      fsbx.CSSPlugin({ minify: true })
    ],
    fsbx.CSSPlugin({ minify: true }),
    fsbx.JSONPlugin(),
    fsbx.BabelPlugin({
      config: {
        sourceMaps: true,
        presets: ['react', 'es2015', 'stage-0'],
        plugins: [
          [
            'transform-decorators-legacy',
            'syntax-async-functions',
            'transform-runtime'
          ]
        ]
      }
    })
  ]
})
if (process.env.NODE_ENV === 'development') {
  fusebox.devServer('>index.js', {
    port: 4000,
    httpServer: false,
    cache: false
  })
} else {
  fusebox.bundle('>index.js')
}
