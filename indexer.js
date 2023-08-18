require('dotenv').config()
const { ThirdwebSDK } = require('@thirdweb-dev/sdk')
const { BaseGoerli, Base } = require('@thirdweb-dev/chains')
const { MongoClient } = require('mongodb')
const ethers = require("ethers")

const processTransferEvent = async (event, { client, provider, contract }) => {
  console.log(event)
  const planet = await client.db(process.env.DB).collection('planets').findOne({
    nft_id: event.data.tokenId.toNumber()
  })
  const blockDetail = await provider.getBlock(event.transaction.blockNumber)
  if (!planet) {
    const stats = await contract.call('getTotalStatsPerTokenId', [
      event.data.tokenId.toNumber()
    ])
    const digest = await contract.call('digestForTokenId', [
      event.data.tokenId.toNumber()
    ])
    console.log(digest)
    await client.db(process.env.DB).collection('planets').insertOne({
      id: event.data.tokenId.toNumber(),
      image: `https://assets.ratesprotocol.com/planets/${event.data.tokenId}`,
      attributes: [
        {
          "display_type": "number",
          "value": stats[4].toNumber(),
          "trait_type": "X"
        },
        {
          "display_type": "number",
          "value": stats[5].toNumber(),
          "trait_type": "Y"
        }
      ],
      rts: stats[0].toNumber(),
      prts: stats[1].toNumber(),
      arts: stats[2].toNumber(),
      mrts: stats[3].toNumber(),
      x: stats[4].toNumber(),
      y: stats[5].toNumber(),
      owner: event.data.to,
      nft_id: event.data.tokenId.toNumber(),
      digest: digest,
      created_at: blockDetail.timestamp * 1000,
      updated_at: blockDetail.timestamp * 1000
    })
  }
  else {
    await client.db(process.env.DB).collection('planets').findOneAndUpdate({
      nft_id: event.data.tokenId.toNumber()
    }, {
      $set: {
        owner: event.data.to,
        updated_at: blockDetail.timestamp * 1000
      }
    })
  }

  await client.db(process.env.DB).collection('event_logs').insertOne({
    event
  })

  await client.db(process.env.DB).collection('kv').findOneAndUpdate({
    key: 'lastBlock'
  }, {
    $set: {
      value: event.transaction.blockNumber
    }
  }, {
    upsert: true
  })
  console.log(`processed nft #${event.data.tokenId.toString()}`)
}

const main = async () => {
  console.log(`connecting to db & rpc ...`)
  const client = new MongoClient(process.env.MONGO_URI)

  let sdk
  let rpc

  if (process.env.NODE_ENV === "mainnet") {
    sdk = new ThirdwebSDK(Base.slug, {
      secretKey: process.env.THIRD_WEB_SECRET_KEY,
    })
    rpc = Base.rpc[0].replace('${THIRDWEB_API_KEY}', process.env.THIRD_WEB_SECRET_KEY)
  } else if (process.env.NODE_ENV === "testnet") {
    sdk = new ThirdwebSDK(BaseGoerli.slug, {
      secretKey: process.env.THIRD_WEB_SECRET_KEY,
    })
    rpc = BaseGoerli.rpc[0].replace('${THIRDWEB_API_KEY}', process.env.THIRD_WEB_SECRET_KEY)
  }
  const provider = new ethers.providers.JsonRpcProvider(rpc)

  console.log(`getting contract ...`)
  const contract = await sdk.getContract(process.env.CONTRACT_ADDRESS);

  const lastBlock = await provider.getBlockNumber()

  const lastIndexedBlock = await client.db(process.env.DB).collection('kv').findOne({
    key: 'lastBlock'
  })

  if (!lastIndexedBlock || lastIndexedBlock && lastBlock > lastIndexedBlock.value) {
    console.log(`getting past events ...`)
    const filters = {
      fromBlock: lastIndexedBlock ? lastIndexedBlock.value : 8499192,
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