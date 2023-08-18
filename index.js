require('dotenv').config()

const express = require('express')
const cors = require('cors')
const app = express()
const port = 8001

const { MongoClient } = require('mongodb')

const client = new MongoClient(process.env.MONGO_URI)

app.use(cors())

app.get('/planets', async (req, res) => {
  const sort = req.query.sort ? {
    [req.query.sort.split('::')[0]]: parseInt(req.query.sort.split('::')[1])
  } : {
    nft_id: -1
  }
  const skip = parseInt(req.query.skip || 0)
  const limit = parseInt(req.query.limit || 20)
  const data = await client.db(process.env.DB).collection('planets').find().sort(sort).skip(skip).limit(limit).toArray()
  return res.json(data)
})

app.get('/planets/:id', async (req, res) => {
  const data = await client.db(process.env.DB).collection('planets').findOne({ nft_id: parseInt(req.params.id) })
  res.json(data)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})