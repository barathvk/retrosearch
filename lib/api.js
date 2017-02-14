const express = require('express')
const cors = require('cors')
const compression = require('compression')
const app = express()
const data = require('./data')
const download = require('download')
const fs = require('fs')
const mkdirp = require('mkdirp')
app.use(cors())
app.use(compression())
app.get('/api/download/:type/:id', async (req, res, next) => {
  const m = await data.get(req.params.type, req.params.id)
  const meta = m._source
  const c = _.first(config.consoles.filter(c => c.lr === meta.console)).rp
  const dldir = `${config.download_dir}/${c}`
  if (!fs.existsSync(dldir)) mkdirp(dldir)
  logger.info(`Downloading ${meta.title}`)
  await download(`${config.scraper.base_url}/downloader/rom/?id=${meta.id}`, dldir, {extract: true})
  logger.info(`Downloaded ${meta.title} to ${dldir}`)
  res.send(`Downloaded ${meta.title} to ${dldir}`)
})
app.get('/api/reload', async (req, res) => {
  exec('killall emulationstation', {async: false, silent: false})
  exec('sudo -H -u pi emulationstation &', {async: false, silent: false})
})
app.get('/api', async (req, res, next) => {
  const page = parseInt(req.query.page) || 0
  const size = parseInt(req.query.size) || 12
  const q = req.query.q || '*'
  const fs = toArray(req.query.facet)
  const hs = toArray(req.query.hist)
  const qfacets = {}
  const qhists = {}
  if (fs) {
    fs.map(f => {
      const k = f.split(':')[0]
      const v = f.split(':')[1].split(';')
      qfacets[k] = v
    })
  }
  if (hs) {
    hs.map(h => {
      const k = h.split(':')[0]
      const vv = h.split(':')[1].split('-')
      const v = {
        from: parseFloat(vv[0]),
        to: parseFloat(vv[1])
      }
      qhists[k] = v
    })
  }
  const r = await axios.get(`http://${config.es}/games/_search?q=${q}&size=${size}&from=${parseInt(page) * size}&sort=views:desc`)
  res.send(r.data)
})
const toArray = input => {
  if (typeof input === 'string') return [input]
  else return input
}
const start = () => {
  app.listen(config.port, () => {
    logger.info(`Started web server on port ${config.port}`)
  })
}
module.exports = { start, app }
