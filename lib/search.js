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
let index = new Mani(opts)
const add = value => {
  index.add(value)
}
const all = async data => {
  index = new Mani(opts)
  data.map(d => {
    add(d)
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
