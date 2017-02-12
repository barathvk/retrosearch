const Mani = require('mani')
const opts = {
  text: [
    {path: 'title', boost: 10},
    {path: 'genre', boost: 3},
    {path: 'country', boost: 1},
    {path: 'year', boost: 3},
    {path: 'console', boost: 6}
  ]
}
const index = new Mani(opts)
const add = (key, value) => {
  const v = _.clone(value)
  v.id = key
  index.add(v)
}
const all = async data => {
  Object.keys(data).map(d => {
    const vv = _.clone(data[d])
    vv.id = d
    index.add(vv)
  })
  logger.info(`Built search index`)
}
const search = (kw, query) => {
  const opts = {}
  if (kw) opts.text = kw
  if (query) opts.query = query
  const results = index.search(opts)
  return results
}
module.exports = {
  all,
  search,
  add
}
