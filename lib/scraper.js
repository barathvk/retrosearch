const cheerio = require('cheerio')
const counts = {}
const YQL = require('yql')
const q = require('q')
const async = require('async')
const pagecount = {}
const data = require('./data')
let baseprog = 0
const scrape = async bayeux => {
  logger.info('Collecting basic information...')
  const all = await axios.get(`${config.scraper.base_url}/roms/listall`)
  const $ = cheerio.load(all.data)
  const sizes = $('tbody tr')
  const fc = bayeux.getClient()
  sizes.map(s => {
    const size = cheerio.load(sizes[s])
    const id = _.last(size('td a').attr('href').split('/'))
    const ss = size('td')[1]
    const count = parseInt($(ss).text())
    if (_.first(config.consoles.filter(c => c.lr === id))) counts[id] = count
  })
  for (let c in counts) {
    await processCons(c, fc)
    baseprog += 100.0 / _.keys(counts).length
  }
}
const processCons = (cons, fc) => {
  const def = q.defer()
  pagecount[cons] = 0
  logger.info(`Processing ${cons}`)
  const cc = counts[cons]
  const romids = _.range(cc)
  const pages = _.range(_.chunk(romids, 15).length)
  async.eachLimit(pages, 10, (p, nextp) => {
    processPage(cons, p, pages).then(() => {
      const prog = baseprog + (parseInt(pagecount[cons]) * 100.0) / (_.keys(counts).length * pages.length)
      fc.publish('/scrape', {
        message: `[${cons}] Processed page ${parseInt(pagecount[cons])} of ${pages.length}`,
        progress: prog
      })
      nextp()
    }).catch(err => {
      const prog = baseprog + (parseInt(pagecount[cons]) * 100.0) / (counts.length * pages.length)
      fc.publish('/scrape', {
        message: `[${cons}] Processed page ${parseInt(pagecount[cons])} of ${pages.length}`,
        progress: prog
      })
      console.warn(err.message)
      nextp()
    })
  }, err => {
    if (err) def.reject(err)
    else def.resolve()
  })
  return def.promise
}
const processPage = (cons, page, pages) => {
  const def = q.defer()
  const url = `${config.scraper.base_url}/roms/${cons}?page=${parseInt(page) + 1}`
  const query = new YQL(`select * from html where url='${url}' and xpath='//table[contains(@class, "ziriusTable")]//tbody//tr'`)
  query.exec((err, resp) => {
    if (err) def.reject(err)
    else {
      try {
        const results = resp.query.results.tr
        results.map(r => {
          const id = parseInt(r.id.replace('rom-', '').trim())
          const link = r.td[0].a.href.trim()
          const image = r.td[0].a.img.src
          const country = r.td[1].a[0].span[0].class.replace('flags ', '').trim()
          const title = r.td[1].a[0].span[1].trim()
          const genre = r.td[1].div.a.content.split('\n')[2].trim().split(',').map(f => f.trim())
          const year = r.td[1].div.a.content.split('\n')[3].trim()
          const rating = parseFloat(r.td[2].a.span.trim())
          const views = parseInt(r.td[3].a.span.content.trim())
          const obj = {
            id,
            link,
            image,
            country,
            title,
            genre,
            year,
            rating,
            views,
            console: cons
          }
          data.index(obj)
        })
        pagecount[cons] ++
        logger.info(`   Processed page ${parseInt(pagecount[cons])} of ${pages.length}`)
        def.resolve()
      } catch (err) {
        pagecount[cons] ++
        def.reject(err)
      }
    }
  })
  return def.promise
}
module.exports = { scrape }
