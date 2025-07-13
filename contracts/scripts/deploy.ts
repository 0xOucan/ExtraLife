import { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contract with account:", deployer.address)

  const OncePolicy = await ethers.getContractFactory("OncePolicy")
  const duration = 365 * 24 * 60 * 60 // 1 año

  const once = await OncePolicy.deploy(duration)

  // ⚡️ Ethers v6:
  await once.waitForDeployment()

  console.log("ONCE deployed to:", once.target) // .target en v6 da la address
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})