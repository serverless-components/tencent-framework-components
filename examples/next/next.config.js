const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  env: {
    STATIC_URL: isProd ? process.env.STATIC_URL : ''
  },
  assetPrefix: isProd ? process.env.STATIC_URL : ''
}
