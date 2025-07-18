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
      const genderAsNumber = userData.gender === "Male" ? 1 : 0
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
            <h2 className="text-2xl font-bold text-white">¡Póliza creada con éxito!</h2>
            <div className="space-y-2">
              <p className="text-gray-300">Tu número de póliza es:</p>
              <p className="text-xl font-bold text-cyan-400 break-all max-w-full overflow-hidden">
                {policyNumber}
              </p>
              {policyTxHash && (
                <div className="text-sm text-gray-400 break-all">
                  Hash de transacción: <a
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
              Tu póliza de seguro ahora está activa. Guarda este número para futuras referencias.
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
              Descargar póliza en PDF
            </Button>
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 rounded-full font-semibold"
            >
              Regresar al inicio
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
            Atrás
          </Button>
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">Extra Life</span>
          </div>
          <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            Contratación
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
            <span>Generar CLABE</span>
            <span>Verificar depósito</span>
            <span>Completar póliza</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment Summary */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center">
                <CreditCard className="mr-2 h-6 w-6 text-cyan-400" />
                Resumen de pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-300">Monto asegurado</span>
                  <span className="text-white font-semibold">1,000,000 MXNB</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-300">Prima anual</span>
                  <span className="text-white font-semibold">10,000 MXNB</span>
                </div>
                <div className="border-t border-white/20 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-white">Total a pagar</span>
                    <span className="text-2xl font-bold text-cyan-400">10,000 MXNB</span>
                  </div>
                </div>
              </div>

              {/* Policy Holder Info */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Información del titular</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nombre:</span>
                    <span className="text-white">{userData.policyHolderName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Género:</span>
                    <span className="text-white capitalize">{userData.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Edad:</span>
                    <span className="text-white">{userData.age} años</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Región:</span>
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
                Paso {currentStep}:{" "}
                {currentStep === 1
                  ? "Generar CLABE de depósito"
                  : currentStep === 2
                    ? "Verificar tu depósito"
                    : "Completa tu póliza"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Generate CLABE */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-gray-300">
                      Generaremos un número CLABE único para que realices el depósito de tu prima por 10,000 MXNB.
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
                        Generando CLABE...
                      </>
                    ) : (
                      "Generar CLABE para depósito"
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
                      Utiliza esta CLABE para depositar exactamente 10,000 MXNB. La CLABE expira en 24 horas.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-white/5 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Número CLABE:</span>
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
                    <div className="text-sm text-gray-400">Banco: {clabeData.bank_name}</div>
                  </div>

                  <Button
                    onClick={verifyDeposit}
                    disabled={isVerifyingDeposit}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-full font-semibold"
                  >
                    {isVerifyingDeposit ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Verificando depósito...
                      </>
                    ) : (
                      "Verificar depósito"
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
                        ¡Depósito verificado exitosamente! Ahora proporciona la información del beneficiario para completar tu póliza.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Beneficiary Name */}
                  <div className="space-y-2">
                    <Label htmlFor="beneficiaryName" className="text-white flex items-center">
                      <Users className="mr-2 h-4 w-4 text-cyan-400" />
                      Nombre del beneficiario
                    </Label>
                    <Input
                      id="beneficiaryName"
                      value={beneficiaryName}
                      onChange={(e) => setBeneficiaryName(e.target.value)}
                      placeholder="Ingresa el nombre completo del beneficiario"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>

                  {/* Beneficiary CLABE */}
                  <div className="space-y-2">
                    <Label htmlFor="beneficiaryClabe" className="text-white flex items-center">
                      <Users className="mr-2 h-4 w-4 text-cyan-400" />
                      CLABE del beneficiario
                    </Label>
                    <Input
                      id="beneficiaryClabe"
                      value={beneficiaryClabe}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 18)
                        setBeneficiaryClabe(value)
                      }}
                      placeholder="Ingresa una CLABE de 18 dígitos"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      maxLength={18}
                    />
                    <p className="text-xs text-gray-400">{beneficiaryClabe.length}/18 dígitos</p>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm">
                      <strong>Importante:</strong> Asegúrate de que la información del beneficiario sea correcta. Esta persona recibirá el pago del seguro en caso de reclamación.
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
                        Creando póliza...
                      </>
                    ) : (
                      "Crear póliza de seguro"
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
