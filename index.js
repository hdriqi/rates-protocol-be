require('dotenv').config()

const express = require('express')
const app = express()
const port = 8000
const render = require('./render')

const { MongoClient } = require('mongodb')

const client = new MongoClient(process.env.MONGO_URI)

app.get('/render/:id', async (req, res) => {
  const data = await client.db('rates-protocol').collection('planets').findOne({ nft_id: req.params.id })

  const buffer = render.main({
    seed: data.digest,
    id: data.nft_id,
    px: data.x,
    py: data.y,
    rts: data.rts,
    mrts: data.mrts,
    prts: data.prts,
    arts: data.arts
  })

  res.contentType('image/png')
  res.send(buffer)
})

app.get('/planets', async (req, res) => {
  const data = await client.db('rates-protocol').collection('planets').find().toArray()
  return res.json(data)
})

app.get('/gif/:id', (req, res) => {
  const buffer = render.gif(req.params.id)
  res.contentType('image/png')
  res.send(buffer)
})

app.get('/:id/:amp', (req, res) => {
  const buffer = render.main(req.params.id, req.params.amp)
  res.contentType('image/png')
  res.send(buffer)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})