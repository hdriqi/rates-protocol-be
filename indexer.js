require('dotenv').config()
const { ThirdwebSDK } = require('@thirdweb-dev/sdk')
const { BaseGoerli } = require('@thirdweb-dev/chains')
const { MongoClient } = require('mongodb')
const ethers = require("ethers")

const processTransferEvent = async (event, { client, provider, contract }) => {
  console.log(event)
  const planet = await client.db('rates-protocol').collection('planets').findOne({
    nft_id: event.data.id.toNumber()
  })
  const blockDetail = await provider.getBlock(event.transaction.blockNumber)
  if (!planet) {
    const stats = await contract.call('getTotalStatsPerTokenId', [
      event.data.id.toNumber()
    ])
    const digest = await contract.call('digestForTokenId', [
      event.data.id.toNumber()
    ])
    console.log(digest)
    await client.db('rates-protocol').collection('planets').insertOne({
      rts: stats[0].toNumber(),
      prts: stats[1].toNumber(),
      arts: stats[2].toNumber(),
      mrts: stats[3].toNumber(),
      x: stats[4].toNumber(),
      y: stats[5].toNumber(),
      owner: event.data.to,
      nft_id: event.data.id.toNumber(),
      digest: digest,
      created_at: blockDetail.timestamp * 1000,
      updated_at: blockDetail.timestamp * 1000
    })
  }
  else {
    await client.db('rates-protocol').collection('planets').findOneAndUpdate({
      nft_id: event.data.id.toNumber()
    }, {
      $set: {
        owner: event.data.to,
        updated_at: blockDetail.timestamp * 1000
      }
    })
  }

  await client.db('rates-protocol').collection('event_logs').insertOne({
    event
  })

  await client.db('rates-protocol').collection('kv').findOneAndUpdate({
    key: 'lastBlock'
  }, {
    $set: {
      value: event.transaction.blockNumber
    }
  }, {
    upsert: true
  })
  console.log(`processed nft #${event.data.id.toString()}`)
}

const main = async () => {
  console.log(`connecting to db & rpc ...`)
  const client = new MongoClient(process.env.MONGO_URI)
  const sdk = new ThirdwebSDK(BaseGoerli.slug, {
    secretKey: process.env.THIRD_WEB_SECRET_KEY,
  })
  const rpc = BaseGoerli.rpc[0].replace('${THIRDWEB_API_KEY}', process.env.THIRD_WEB_SECRET_KEY)
  const provider = new ethers.providers.JsonRpcProvider(rpc)

  console.log(`getting contract ...`)
  const contract = await sdk.getContract('0xF72b546814a88DF07C0Ee772393827cd1310FC74')

  const lastBlock = await provider.getBlockNumber()

  const { value: lastIndexedBlock } = await client.db('rates-protocol').collection('kv').findOne({
    key: 'lastBlock'
  })

  if (lastBlock > lastIndexedBlock) {
    console.log(`getting past events ...`)
    const filters = {
      fromBlock: lastIndexedBlock,
      toBlock: 'latest',
      order: 'asc',
    }
    const events = await contract.events.getAllEvents(filters)
    for (const event of events) {
      if (event.eventName === 'Transfer') {
        await processTransferEvent(event, {
          client,
          provider,
          contract
        })
      }
    }
  }

  console.log(`listening new events ...`)
  contract.events.addEventListener(
    "Transfer",
    async (event) => {
      await processTransferEvent(event, {
        client,
        provider,
        contract
      })
    }
  );
}

main()