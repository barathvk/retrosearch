require('./lib/globals')
const fs = require('fs')
const scraper = require('./lib/scraper')
const data = require('./lib/data')
const later = require('later')
const mkdirp = require('mkdirp')
const search = require('./lib/search')
const rimraf = require('rimraf')
const api = require('./lib/api')
const http = require('http')
const faye = require('faye')
const argv = require('minimist')(process.argv.slice(2))
const server = http.createServer(api.app)
const bayeux = new faye.NodeAdapter({ mount: '/faye' })
let newdir = false
const scrape = async () => {
  await scraper.scrape(bayeux)
  logger.info('Scraping complete')
  const list = await data.list()
  data.list().then(all => {
    search.all(Object.keys(all).map(a => {
      all[a].id = a
      return all[a]
    }))
  })
  logger.info(`Indexed ${Object.keys(list).length} roms`)
}
if (argv.clean) rimraf.sync(config.data_dir)
if (!fs.existsSync(config.data_dir)) {
  newdir = true
  mkdirp.sync(config.data_dir)
  scrape()
}
logger.info('Starting indexer...')
const schedule = later.parse.text(`every ${config.scraper.interval}`)
later.setInterval(scrape, schedule)
if (!newdir && process.env.NODE_ENV !== 'development') scrape()
data.list().then(all => {
  search.all(Object.keys(all).map(a => {
    all[a].id = a
    return all[a]
  }))
})
bayeux.attach(server)
server.listen(config.port, () => {
  logger.info(`Started Retrosearch server on port ${config.port}`)
})
