import fs from "fs"
import path from "path"

const filePath = path.join("/tmp", "policy-hash.txt")

export function savePolicyHash(hash: string) {
  fs.writeFileSync(filePath, hash, "utf-8")
  console.log("🔐 Hash guardado en archivo:", hash)
}

export function getLatestPolicyHash(): string {
  if (fs.existsSync(filePath)) {
    const hash = fs.readFileSync(filePath, "utf-8")
    console.log("📦 Hash recuperado desde archivo:", hash)
    return hash
  }
  console.log("📦 No se encontró hash en archivo.")
  return ""
}