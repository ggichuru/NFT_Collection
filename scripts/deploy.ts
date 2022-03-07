import { ethers } from "hardhat";
require("dotenv").config({ path: ".env" });

async function main() {
  const WHITELIST_CONTRACT = "0xffb451D9Fd83648CCa244C667121a342462B4701";
  const METADATA_URL = "https://nft-collection-sneh1999.vercel.app/api/";

  const Wakulima = await ethers.getContractFactory("Wakulima");

  const wakulima = await Wakulima.deploy(METADATA_URL, WHITELIST_CONTRACT);

  console.log("Contract address:", wakulima.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
