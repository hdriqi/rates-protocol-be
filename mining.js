require('dotenv').config()
const ethers = require("ethers")
const { ThirdwebSDK } = require('@thirdweb-dev/sdk')

const solveChallenge = async (challengeNumber, sender, difficulty) => {
  let nonce = 1;
  let hash;
  let counter = 0
  while (true) {
    console.log(nonce);
    hash = ethers.utils.solidityKeccak256(
      ["bytes32", "address", "uint"],
      [challengeNumber, sender, nonce]
    );

    if (parseInt(hash) < difficulty) {
      console.log(hash);
      break;
    }
    nonce = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    counter++
  }
  console.log(counter)

  return [nonce, hash];
};

async function main() {
  const sdk = ThirdwebSDK.fromPrivateKey(process.env.BASE_GOERLI_PK, 'base-goerli', {
    secretKey: process.env.THIRD_WEB_SECRET_KEY,
  })

  const contract = await sdk.getContract('0xF72b546814a88DF07C0Ee772393827cd1310FC74')
  const address = await sdk.wallet.getAddress();

  const miningDifficulty = await contract.call('getMiningDifficulty')
  console.log("miningDifficulty", miningDifficulty);
  const challengeNumber = await contract.call('getChallengeNumber')
  console.log("challengeNumber", challengeNumber);

  let [nonce, hash] = await solveChallenge(
    challengeNumber,
    address,
    miningDifficulty
  );
  console.log("nonce", nonce);
  console.log("hash", hash);

  const result = await contract.call('mint', [nonce, hash])
  console.log(result)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });