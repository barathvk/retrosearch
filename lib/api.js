const express = require('express')
const cors = require('cors')
const compression = require('compression')
const search = require('./search')
const app = express()
const data = require('./data')
const download = require('download')
const fs = require('fs')
const mkdirp = require('mkdirp')
app.use(cors())
app.use(compression())
app.get('/api/download/:id', async (req, res, next) => {
  const meta = await data.get(req.params.id)
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
  exec('emulationstation &', {async: false, silent: false})
})
app.get('/api', async (req, res, next) => {
  const page = parseInt(req.query.page) || 1
  const size = parseInt(req.query.size) || 10
  const q = req.query.q
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
  let results
  if (q) {
    const rs = search.search(q)
    results = rs.items
  } else {
    const all = await data.list()
    results = Object.keys(all).map(a => {
      all[a]._id = a
      return all[a]
    })
  }
  if (qfacets !== {}) {
    Object.keys(qfacets).map(f => {
      results = results.filter(r => {
        if (typeof r[f] === 'string') {
          return qfacets[f].indexOf(r[f]) > -1
        } else {
          const u = qfacets[f].map(ff => {
            return r[f].indexOf(ff) > -1
          })
          return _.some(u)
        }
      })
    })
  }
  if (qhists !== {}) {
    Object.keys(qhists).map(h => {
      results = results.filter(r => r[h] > qhists[h].from && r[h] <= qhists[h].to)
    })
  }
  results.map((dd, i) => {
    dd.index = i + 1
    dd.views_score = _.round(dd.views / maxviews, 2)
    dd.rating_score = _.round(dd.rating / maxrating, 2)
  })
  results = _.reverse(_.sortBy(results, ['views']))
  const chunks = _.chunk(results, size)
  if (!chunks[page - 1]) res.status(203).send('No results found')
  else {
    const facets = {}
    const fields = ['genre', 'country', 'year', 'console']
    fields.map(f => {
      const count = _.groupBy(results, f)
      let ff = []
      Object.keys(count).map(k => {
        ff.push({ bucket: k, count: count[k].length })
      })
      ff = _.reverse(_.sortBy(ff, ['count', 'bucket']))
      facets[f] = ff
    })
    facets.rating = hist(results, 'rating', 10)
    facets.views = hist(results, 'views', 0.001)
    const rval = chunks[page - 1]
    res.send({total: results.length, page: page, pages: chunks.length, size: size, results: rval, facets, parsed: {facets: qfacets, hists: qhists, q}})
  }
})
const hist = (arr, prop, scale) => {
  const ratingshist = _.groupBy(arr, r => Math.floor(r[prop] * scale))
  const ratings = Object.keys(ratingshist).map((r, i) => {
    const prev = i === 0 ? 0 : parseInt(Object.keys(ratingshist)[i - 1]) / scale
    return { bucket: parseFloat(r / scale), count: ratingshist[r].length, bucket_start: prev }
  })
  return ratings
}
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
