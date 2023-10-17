import { initializeKeypair } from "./initializeKeypair"
import web3, { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js"
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  NftWithToken,
} from "@metaplex-foundation/js"
import * as fs from "fs"

const tokenName = "Strawberrys Token"
const description = "The best looking Strawberrys Token ever!"
const symbol = "STB"
const sellerFeeBasisPoints = 100
const imageFile = "assets/logo/strawberry.png"

// create NFT
async function updateNft(
  metaplex: Metaplex,
  uri: string,
  mintAddress: PublicKey
) {
  // get "NftWithToken" type from mint address
  const nft = await metaplex.nfts().findByMint({ mintAddress })
  
  await metaplex
    .nfts()
    .update({
      nftOrSft: nft,
      uri: uri,
      name: tokenName,
      sellerFeeBasisPoints: sellerFeeBasisPoints,
      symbol: symbol,
  })

  
  console.log(
    `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  )

  return nft
}

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
  const user = await initializeKeypair(connection)


  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
  )

  // file to buffer
  const buffer = fs.readFileSync(imageFile)

  // buffer to metaplex file
  const file = toMetaplexFile(buffer, imageFile)

  // upload image and get image uri
  const imageUri = await metaplex.storage().upload(file)
  console.log("image uri:", imageUri)

   // upload metadata and get metadata uri (off chain metadata)
   const { uri } = await metaplex
   .nfts()
   .uploadMetadata({
     name: tokenName,
     description: description,
     image: imageUri,
   })

 console.log("metadata uri:", uri)

 // You can get this from the Solana Explorer URL 
 const mintAddress = new PublicKey("F6Z7mvGCT6bqfQWkuz1Rsf7dTDq2A6it76iwQ8LFH1v")
 await updateNft(metaplex, uri, mintAddress)

  // await createNft(metaplex, uri)

}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
