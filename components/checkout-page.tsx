"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { simulateContract } from "viem/actions"

import { generatePolicyPDF } from "@/lib/pdf/policy-pdf"

const now = new Date()
const issueDate = now.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
const endDate = new Date(now.setFullYear(now.getFullYear() + 1)).toLocaleDateString()

import {
  Shield,
  CreditCard,
  ArrowLeft,
  Check,
  Copy,
  RefreshCw,
  Users,
  AlertCircle,
} from "lucide-react"

import { publicClient, walletClient, deployerAddress } from "@/lib/viem"
import { oncePolicyAbi } from "@/lib/abi/once-policy"

interface UserData {
  gender: string
  age: number
  region: string
  policyHolderName: string
}

interface ClabeData {
  id: string
  clabe: string
  bank_name: string
  amount: number
  expires_at: string
}

export default function CheckoutPage() {
  const router = useRouter()

  // ─────────────────────────────────── State ────────────────────────────────────
  const [userData, setUserData] = useState<UserData | null>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [clabeData, setClabeData] = useState<ClabeData | null>(null)

  const [isGeneratingClabe, setIsGeneratingClabe] = useState(false)
  const [isVerifyingDeposit, setIsVerifyingDeposit] = useState(false)
  const [depositVerified, setDepositVerified] = useState(false)

  const [beneficiaryName, setBeneficiaryName] = useState("")
  const [beneficiaryClabe, setBeneficiaryClabe] = useState("")

  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false)
  const [policyCreated, setPolicyCreated] = useState(false)
  const [policyNumber, setPolicyNumber] = useState("")
  const [policyTxHash, setPolicyTxHash] = useState("")

  // ───────────────────────────── Persisted form data ────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem("extralife_user_data")
    if (stored) {
      setUserData(JSON.parse(stored))
      // Retrieve last policy number from localStorage and set it
      const storedPolicyNumber = localStorage.getItem("lastPolicyNumber")
      if (storedPolicyNumber) {
        setPolicyNumber(storedPolicyNumber)
      }
    } else {
      router.push("/dapp")
    }
  }, [router])

  // ──────────────────────────────── CLABE helpers ───────────────────────────────
  const generateClabe = async () => {
    setIsGeneratingClabe(true)
    try {
      const res = await fetch("/api/juno/clabe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 10_000,
          reference: `extralife_${Date.now()}`,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setClabeData(json.data)
        setCurrentStep(2)
      }
    } catch (err) {
      console.error("Error generating CLABE:", err)
    } finally {
      setIsGeneratingClabe(false)
    }
  }

  const verifyDeposit = async () => {
    if (!clabeData) return
    setIsVerifyingDeposit(true)

    try {
      // 👉 mock deposit for demo
      await fetch("/api/juno/deposits/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clabe_id: clabeData.id, amount: 10_000 }),
      })
      // 👉 verify
      const res = await fetch(`/api/juno/deposits?clabe_id=${clabeData.id}`)
      const json = await res.json()
      if (json.success && json.data.length > 0) {
        setDepositVerified(true)
        setCurrentStep(3)
      }
    } catch (err) {
      console.error("Error verifying deposit:", err)
    } finally {
      setIsVerifyingDeposit(false)
    }
  }

  // ─────────────────────────────── Mint ONCE policy ─────────────────────────────
  const createPolicy = async () => {
    if (!userData || !clabeData || !beneficiaryClabe || !beneficiaryName) return

    setIsCreatingPolicy(true)
    try {
      const address = deployerAddress // signer de backend
      const genderAsNumber = userData.gender === "male" ? 1 : 0
      const coverageAmount = 1_000_000n * 10n ** 18n
      const premium = 10_000n * 10n ** 18n

      // Updated simulateContract call for deployed createPolicy function (8 parameters)
      const { request } = await simulateContract(publicClient, {
        address: "0x10D7A0cf0516A2a75a0825E1783947B18b198a91",
        abi: oncePolicyAbi,
        functionName: "createPolicy",
        args: [
          address,
          deployerAddress, // assuming the deployer is also the beneficiary
          userData.policyHolderName,
          userData.age,
          genderAsNumber,
          userData.region,
          coverageAmount,
          premium
        ],
        account: address,
      })

      const txHash = await walletClient.writeContract({
        ...request,
        account: walletClient.account, // ✅ La línea mágica
      })
      console.log("✅ Policy created on-chain. Tx hash:", txHash)
      setPolicyTxHash(txHash)
      await fetch("/api/policies/save-hash", {
        method: "POST",
        body: JSON.stringify({ policyHash: txHash }),
      })
      setPolicyNumber(txHash)
      setPolicyCreated(true)
      // Persist the policy number in localStorage
      localStorage.setItem("lastPolicyNumber", txHash)

      generatePolicyPDF({
        policyHolder: userData.policyHolderName,
        beneficiary: beneficiaryName,
        coverageAmount: "1,000,000 MXNB",
        premium: "10,000 MXNB",
        issueDate,
        endDate,
        policyNumber: txHash,
      })

    } catch (err) {
      console.error("Error creating policy:", err)
    } finally {
      setIsCreatingPolicy(false)
    }
  }

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text)

  // ─────────────────────────────────── Render ───────────────────────────────────
  if (!userData) return <div>Loading...</div>

  if (policyCreated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 max-w-md w-full text-center">
          <CardContent className="pt-8 space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-500 rounded-full p-4">
                <Check className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">Policy Created Successfully!</h2>
            <div className="space-y-2">
              <p className="text-gray-300">Your policy number is:</p>
              <p className="text-xl font-bold text-cyan-400 break-all max-w-full overflow-hidden">
                {policyNumber}
              </p>
              {policyTxHash && (
                <div className="text-sm text-gray-400 break-all">
                  Tx Hash: <a
                    href={`https://sepolia.arbiscan.io/tx/${policyTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 underline"
                  >
                    {policyTxHash.slice(0, 10)}…{policyTxHash.slice(-8)}
                  </a>
                </div>
              )}
            </div>
            <p className="text-gray-300 text-sm">
              Your insurance policy is now active. Keep this policy number for your records.
            </p>
            <Button
              onClick={() =>
                generatePolicyPDF({
                  policyHolder: userData?.policyHolderName ?? "",
                  beneficiary: beneficiaryName,
                  coverageAmount: "1,000,000 MXNB",
                  premium: "10,000 MXNB",
                  issueDate,
                  endDate,
                  policyNumber: policyNumber,
                })
              }
              className="w-full bg-white text-purple-700 border border-purple-500 hover:bg-purple-100 py-3 rounded-full font-semibold"
            >
              Descargar Póliza en PDF
            </Button>
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 rounded-full font-semibold"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">Extra Life</span>
          </div>
          <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            Checkout
          </Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 1 ? "bg-cyan-500" : "bg-gray-600"} text-white font-semibold`}
            >
              1
            </div>
            <div className={`h-1 w-16 ${currentStep >= 2 ? "bg-cyan-500" : "bg-gray-600"} rounded`} />
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 2 ? "bg-cyan-500" : "bg-gray-600"} text-white font-semibold`}
            >
              2
            </div>
            <div className={`h-1 w-16 ${currentStep >= 3 ? "bg-cyan-500" : "bg-gray-600"} rounded`} />
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 3 ? "bg-cyan-500" : "bg-gray-600"} text-white font-semibold`}
            >
              3
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400 max-w-md mx-auto">
            <span>Generate CLABE</span>
            <span>Verify Deposit</span>
            <span>Complete Policy</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment Summary */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center">
                <CreditCard className="mr-2 h-6 w-6 text-cyan-400" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-300">Coverage Amount</span>
                  <span className="text-white font-semibold">1,000,000 MXNB</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-300">Annual Premium</span>
                  <span className="text-white font-semibold">10,000 MXNB</span>
                </div>
                <div className="border-t border-white/20 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-white">Total Due</span>
                    <span className="text-2xl font-bold text-cyan-400">10,000 MXNB</span>
                  </div>
                </div>
              </div>

              {/* Policy Holder Info */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Policy Holder Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{userData.policyHolderName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gender:</span>
                    <span className="text-white capitalize">{userData.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Age:</span>
                    <span className="text-white">{userData.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Region:</span>
                    <span className="text-white">{userData.region}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Steps */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">
                Step {currentStep}:{" "}
                {currentStep === 1
                  ? "Generate Deposit CLABE"
                  : currentStep === 2
                    ? "Verify Your Deposit"
                    : "Complete Your Policy"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Generate CLABE */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-gray-300">
                      We'll generate a unique CLABE number for you to make your premium deposit of 10,000 MXNB.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={generateClabe}
                    disabled={isGeneratingClabe}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-4 rounded-full font-semibold"
                  >
                    {isGeneratingClabe ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Generating CLABE...
                      </>
                    ) : (
                      "Generate CLABE for Deposit"
                    )}
                  </Button>
                </div>
              )}

              {/* Step 2: Show CLABE and Verify Deposit */}
              {currentStep === 2 && clabeData && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-gray-300">
                      Use this CLABE to deposit exactly 10,000 MXNB. The CLABE expires in 24 hours.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-white/5 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">CLABE Number:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(clabeData.clabe)}
                        className="text-cyan-400 hover:bg-white/10"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xl font-mono text-white bg-black/20 p-3 rounded">{clabeData.clabe}</div>
                    <div className="text-sm text-gray-400">Bank: {clabeData.bank_name}</div>
                  </div>

                  <Button
                    onClick={verifyDeposit}
                    disabled={isVerifyingDeposit}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-full font-semibold"
                  >
                    {isVerifyingDeposit ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Verifying Deposit...
                      </>
                    ) : (
                      "Verify Deposit"
                    )}
                  </Button>
                </div>
              )}

              {/* Step 3: Beneficiary Information and Submit */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  {depositVerified && (
                    <Alert className="border-green-500/20 bg-green-500/10">
                      <Check className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-400">
                        Deposit verified successfully! Now provide your beneficiary information to complete your policy.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Beneficiary Name */}
                  <div className="space-y-2">
                    <Label htmlFor="beneficiaryName" className="text-white flex items-center">
                      <Users className="mr-2 h-4 w-4 text-cyan-400" />
                      Beneficiary Name
                    </Label>
                    <Input
                      id="beneficiaryName"
                      value={beneficiaryName}
                      onChange={(e) => setBeneficiaryName(e.target.value)}
                      placeholder="Enter beneficiary's full name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>

                  {/* Beneficiary CLABE */}
                  <div className="space-y-2">
                    <Label htmlFor="beneficiaryClabe" className="text-white flex items-center">
                      <Users className="mr-2 h-4 w-4 text-cyan-400" />
                      Beneficiary CLABE
                    </Label>
                    <Input
                      id="beneficiaryClabe"
                      value={beneficiaryClabe}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 18)
                        setBeneficiaryClabe(value)
                      }}
                      placeholder="Enter 18-digit CLABE number"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      maxLength={18}
                    />
                    <p className="text-xs text-gray-400">{beneficiaryClabe.length}/18 digits</p>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm">
                      <strong>Important:</strong> Make sure the beneficiary information is correct. This person will
                      receive the insurance payout in case of a claim.
                    </p>
                  </div>

                  <Button
                    onClick={createPolicy}
                    disabled={beneficiaryClabe.length !== 18 || !beneficiaryName.trim() || isCreatingPolicy}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 text-white py-4 rounded-full font-semibold transition-all duration-300"
                  >
                    {isCreatingPolicy ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Creating Policy...
                      </>
                    ) : (
                      "Create Insurance Policy"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
