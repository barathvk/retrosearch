require('./lib/globals')
const fs = require('fs')
const scraper = require('./lib/scraper')
const later = require('later')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const api = require('./lib/api')
const http = require('http')
const express = require('express')
const faye = require('faye')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const server = http.createServer(api.app)
const bayeux = new faye.NodeAdapter({ mount: '/faye' })
const scrape = async () => {
  await scraper.scrape(bayeux)
  logger.info('Scraping complete')
  const c = await `http://$${config.es}/games/_count`
  logger.info(`Indexed ${c.data.count} roms`)
}
if (argv.clean) rimraf.sync(config.data_dir)
if (argv.scrape) {
  scrape().then(() => {
    logger.info('Process complete')
  })
} else {
  if (!fs.existsSync(config.download_dir)) {
    mkdirp.sync(config.download_dir)
  }
  logger.info('Starting indexer...')
  const schedule = later.parse.text(`every ${config.scraper.interval}`)
  later.setInterval(scrape, schedule)
  bayeux.attach(server)
  api.app.use('/', express.static(path.resolve('./public')))
  api.app.get('*', (req, res) => {
    res.sendFile(path.resolve('./index.html'))
  })
  server.listen(config.port, () => {
    logger.info(`Started Retrosearch server on port ${config.port}`)
  })
}
