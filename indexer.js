require('dotenv').config()
const { ThirdwebSDK } = require('@thirdweb-dev/sdk')
const { MongoClient } = require('mongodb')

const main = async () => {
  const client = new MongoClient(process.env.MONGO_URI)
  const sdk = new ThirdwebSDK('base-goerli', {
    secretKey: process.env.THIRD_WEB_SECRET_KEY,
  })

  const contract = await sdk.getContract('0xF72b546814a88DF07C0Ee772393827cd1310FC74')

  const filters = {
    fromBlock: 8499191,
    toBlock: 'latest',
    order: 'desc',
  }

  const events = await contract.events.getAllEvents(filters)
  for (const event of events) {
    if (event.eventName === 'Transfer') {
      console.log(event)
      const stats = await contract.call('getTotalStatsPerTokenId', [
        parseInt(event.data.id.toString())
      ])
      const digest = await contract.call('digestForTokenId', [
        parseInt(event.data.id.toString())
      ])
      console.log(digest)
      // const metadata = {
      //   'description': 'Rates Protocol is an immersive on-chain MMO strategy game where you harness the power of room-temperature superconductor material, Rates. Build your base, claim resources, and engage in interstellar commerce like never before.',
      //   'external_url': 'https://openseacreatures.io/3',
      //   'image': 'https://storage.googleapis.com/opensea-prod.appspot.com/puffs/3.png',
      //   'name': 'Dave Starbelly',
      //   'attributes': {}
      // }
      await client.db('rates-protocol').collection('planets').findOneAndUpdate({
        nft_id: event.data.id.toNumber()
      }, {
        $set: {
          rts: stats[0].toString(),
          prts: stats[1].toString(),
          arts: stats[2].toString(),
          mrts: stats[3].toString(),
          x: stats[4].toString(),
          y: stats[5].toString(),
          owner: event.data.to,
          nft_id: event.data.id.toNumber(),
          digest: digest
        }
      }, {
        upsert: true
      })
      console.log(`processed nft #${event.data.id.toNumber()}`)
    }
  }

  const unsubscribe = contract.events.addEventListener(
    "Transfer",
    async (event) => {
      console.log(event)
      const stats = await contract.call('getTotalStatsPerTokenId', [
        parseInt(event.data.id.toString())
      ])
      const digest = await contract.call('digestForTokenId', [
        parseInt(event.data.id.toString())
      ])
      console.log(digest)
      // const metadata = {
      //   'description': 'Rates Protocol is an immersive on-chain MMO strategy game where you harness the power of room-temperature superconductor material, Rates. Build your base, claim resources, and engage in interstellar commerce like never before.',
      //   'external_url': 'https://openseacreatures.io/3',
      //   'image': 'https://storage.googleapis.com/opensea-prod.appspot.com/puffs/3.png',
      //   'name': 'Dave Starbelly',
      //   'attributes': {}
      // }
      await client.db('rates-protocol').collection('planets').findOneAndUpdate({
        nft_id: event.data.id.toNumber()
      }, {
        $set: {
          rts: stats[0].toString(),
          prts: stats[1].toString(),
          arts: stats[2].toString(),
          mrts: stats[3].toString(),
          x: stats[4].toString(),
          y: stats[5].toString(),
          owner: event.data.to,
          nft_id: event.data.id.toNumber(),
          digest: digest
        }
      }, {
        upsert: true
      })
      console.log(`processed nft #${event.data.id.toString()}`)
    },
  );
}

main()