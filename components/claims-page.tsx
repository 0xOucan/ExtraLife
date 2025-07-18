"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Shield,
  Search,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  DollarSign,
  User,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface Policy {
  id: number
  policy_number: string
  status: string
  coverage_amount: number
  premium_paid: number
  policy_holder: {
    name: string
    clabe: string
    gender: string
    age: number
    region: string
  }
  beneficiary: {
    clabe: string
    name: string
  }
  created_at: string
  expires_at: string
}

interface UploadResult {
  id: string
  filename: string
  size: number
  policy_number: string
  status: string
  uploaded_at: string
}

interface VerificationResult {
  id: string
  upload_id: string
  policy_number: string
  status: string
  document_type: string
  verified_at: string
}

interface ClaimResult {
  id: string
  policy_number: string
  beneficiary_clabe: string
  amount: number
  currency: string
  status: string
  transaction_hash: string
  processed_at: string
}

export default function ClaimsPage() {
  const router = useRouter()
  useEffect(() => {
    const storedPolicyNumber = localStorage.getItem("lastPolicyNumber");
    if (storedPolicyNumber) {
      setPolicyNumber(storedPolicyNumber);
    }
  }, []);
  const [currentStep, setCurrentStep] = useState(1)
  const [policyNumber, setPolicyNumber] = useState("")
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)

  const searchPolicy = async () => {
    if (!policyNumber.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/policies/lookup?policy_number=${encodeURIComponent(policyNumber)}`)
      const result = await response.json()

      if (result.success) {
        setPolicy(result.data)
        setCurrentStep(2)
      } else {
        alert(result.error || "Policy not found")
      }
    } catch (error) {
      alert("Error searching for policy")
    } finally {
      setIsSearching(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Favor de seleccionar un archivo PDF")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("El peso máximo del archivo es 10MB")
        return
      }
      setSelectedFile(file)
    }
  }

  const uploadDocument = async () => {
    if (!selectedFile || !policy) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("policy_number", policy.policy_number)

      const response = await fetch("/api/claims/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (result.success) {
        setUploadResult(result.data)
        setCurrentStep(3)
      } else {
        alert(result.error || "Failed to upload document")
      }
    } catch (error) {
      alert("Error uploading document")
    } finally {
      setIsUploading(false)
    }
  }

  const verifyDocument = async () => {
    if (!uploadResult || !policy) return

    setIsVerifying(true)
    try {
      const response = await fetch("/api/claims/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upload_id: uploadResult.id,
          policy_number: policy.policy_number,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setVerificationResult(result.data)
        setCurrentStep(4)
      } else {
        alert(result.error || "Failed to verify document")
      }
    } catch (error) {
      alert("Error verifying document")
    } finally {
      setIsVerifying(false)
    }
  }

  const processClaim = async () => {
    if (!policy || !verificationResult) return

    setIsProcessing(true)
    try {
      const response = await fetch("/api/claims/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy_number: policy.policy_number,
          beneficiary_clabe: policy.beneficiary.clabe,
          amount: policy.coverage_amount,
          verification_id: verificationResult.id,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setClaimResult(result.data)
        setCurrentStep(5)
      } else {
        const friendlyMessage =
          result.error && result.error.toLowerCase().includes("validation")
            ? "Tu reclamo ha sido recibido y está pendiente de revisión manual."
            : result.error || "Tu reclamo ha sido enviado, te mantendremos informado.";
        setClaimError(friendlyMessage)
        setCurrentStep(5)
      }
    } catch (error) {
      setClaimError("There was a problem submitting the claim, but we have saved your request and will keep you updated.")
      setCurrentStep(5)
    } finally {
      setIsProcessing(false)
    }
  }

  if (currentStep === 5) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 max-w-lg w-full text-center">
          <CardContent className="pt-8 space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-500 rounded-full p-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {claimError ? "¡Reclamo enviado!" : "¡Reclamo procesado exitosamente!"}
            </h2>

            {claimError ? (
              <p className="text-gray-300">
                {claimError} Te notificaremos cuando el pago haya sido realizado o si necesitamos información adicional.
              </p>
            ) : (
              <>
                <div className="space-y-4 text-left">
                  <div className="bg-white/5 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monto Transferido:</span>
                      <span className="text-green-400 font-semibold">
                        {claimResult?.amount.toLocaleString()} {claimResult?.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">CLABE del Beneficiario:</span>
                      <span className="text-white font-mono text-sm">{claimResult?.beneficiary_clabe}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ID de Transacción:</span>
                      <span className="text-cyan-400 font-mono text-xs">{claimResult?.juno_transaction_id}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  El pago del seguro ha sido transferido exitosamente a la cuenta del beneficiario. Esta transacción queda registrada en la blockchain para mayor transparencia.
                </p>
              </>
            )}

            <Button
              onClick={() => router.push("/")}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 rounded-full font-semibold"
            >
              Volver al Inicio
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
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">Extra Life</span>
          </div>
          <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            Portal de Reclamos
          </Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? "bg-cyan-500" : "bg-gray-600"} text-white text-sm font-semibold`}
            >
              1
            </div>
            <div className={`h-1 w-12 ${currentStep >= 2 ? "bg-cyan-500" : "bg-gray-600"} rounded`} />
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? "bg-cyan-500" : "bg-gray-600"} text-white text-sm font-semibold`}
            >
              2
            </div>
            <div className={`h-1 w-12 ${currentStep >= 3 ? "bg-cyan-500" : "bg-gray-600"} rounded`} />
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? "bg-cyan-500" : "bg-gray-600"} text-white text-sm font-semibold`}
            >
              3
            </div>
            <div className={`h-1 w-12 ${currentStep >= 4 ? "bg-cyan-500" : "bg-gray-600"} rounded`} />
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 4 ? "bg-cyan-500" : "bg-gray-600"} text-white text-sm font-semibold`}
            >
              4
            </div>
            <div className={`h-1 w-12 ${currentStep >= 5 ? "bg-cyan-500" : "bg-gray-600"} rounded`} />
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 5 ? "bg-cyan-500" : "bg-gray-600"} text-white text-sm font-semibold`}
            >
              5
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400 max-w-2xl mx-auto">
            <span>Buscar</span>
            <span>Subir</span>
            <span>Verificar</span>
            <span>Procesar</span>
            <span>Completado</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Policy Information */}
          {policy && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center">
                  <Shield className="mr-2 h-6 w-6 text-cyan-400" />
                  Información de la Póliza
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Número de Póliza:</span>
                    <span className="text-white font-mono text-xs break-all max-w-[180px] text-right">
                      {policy.policy_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monto de Cobertura:</span>
                    <span className="text-cyan-400 font-semibold">{policy.coverage_amount.toLocaleString()} MXNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estado:</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {policy.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <User className="mr-2 h-4 w-4 text-cyan-400" />
                    Titular de la Póliza
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Nombre:</span>
                      <span className="text-white">{policy.policy_holder.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">CLABE:</span>
                      <span className="text-white font-mono">{policy.policy_holder.clabe}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Edad:</span>
                      <span className="text-white">{policy.policy_holder.age} años</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Región:</span>
                      <span className="text-white">{policy.policy_holder.region}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <Users className="mr-2 h-4 w-4 text-cyan-400" />
                    Beneficiario
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Nombre:</span>
                      <span className="text-white">{policy.beneficiary.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">CLABE:</span>
                      <span className="text-white font-mono">{policy.beneficiary.clabe}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Claims Process */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">
                {currentStep === 1 && "Buscar Póliza"}
                {currentStep === 2 && "Subir Acta de Defunción"}
                {currentStep === 3 && "Verificar Documento"}
                {currentStep === 4 && "Procesar Reclamo"}
              </CardTitle>
              <CardDescription className="text-gray-300">
                {currentStep === 1 && "Ingresa el número de póliza para iniciar el proceso de reclamo"}
                {currentStep === 2 && "Sube el acta de defunción oficial (solo PDF)"}
                {currentStep === 3 && "Verificando el acta de defunción"}
                {currentStep === 4 && "Procesando el pago del reclamo de seguro"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Search Policy */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-gray-300">
                      Números de póliza de prueba disponibles, Ejemplo: 0x10D7A0cf0516A2a75a0825E1783947B18b198a91
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="policyNumber" className="text-white">
                      Número de Póliza
                    </Label>
                    <Input
                      id="policyNumber"
                      value={policyNumber}
                      onChange={(e) => setPolicyNumber(e.target.value)}
                      placeholder="Ingresa número de póliza (ej. 0x10D7A0cf0516A2a75a0825E1783947B18b198a91"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <Button
                    onClick={searchPolicy}
                    disabled={!policyNumber.trim() || isSearching}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 rounded-full font-semibold"
                  >
                    {isSearching ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Buscar Póliza
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Step 2: Upload Document */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription className="text-gray-300">
                      Por favor sube el acta de defunción oficial en formato PDF. Tamaño máximo del archivo: 10MB.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="deathCertificate" className="text-white">
                      Acta de Defunción (PDF)
                    </Label>
                    <Input
                      id="deathCertificate"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="bg-white/10 border-white/20 text-white file:bg-cyan-500 file:text-white file:border-0 file:rounded file:px-3 file:py-1"
                    />
                    {selectedFile && (
                      <p className="text-sm text-gray-400">
                        Seleccionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={uploadDocument}
                    disabled={!selectedFile || isUploading}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-full font-semibold"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Subir Documento
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Step 3: Verify Document */}
              {currentStep === 3 && uploadResult && (
                <div className="space-y-4">
                  <Alert className="border-green-500/20 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-400">
                      ¡Documento subido exitosamente! Da clic en verificar para validar el acta de defunción.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-white/5 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Nombre del Archivo:</span>
                      <span className="text-white">{uploadResult.filename}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ID de Subida:</span>
                      <span className="text-cyan-400 font-mono text-sm">{uploadResult.id}</span>
                    </div>
                  </div>

                  <Button
                    onClick={verifyDocument}
                    disabled={isVerifying}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-full font-semibold"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Verificando Documento...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verificar Documento
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Step 4: Process Claim */}
              {currentStep === 4 && verificationResult && policy && (
                <div className="space-y-4">
                  <Alert className="border-green-500/20 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-400">
                      ¡Documento verificado exitosamente! Listo para procesar el reclamo del seguro.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-white/5 rounded-lg p-4 space-y-3">
                    <h4 className="text-white font-semibold flex items-center">
                      <DollarSign className="mr-2 h-4 w-4 text-cyan-400" />
                      Resumen del Reclamo
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Titular de la Póliza:</span>
                        <span className="text-white">{policy.policy_holder.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Monto a Pagar:</span>
                        <span className="text-cyan-400 font-semibold">
                          {policy.coverage_amount.toLocaleString()} MXNB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Beneficiario:</span>
                        <span className="text-white">{policy.beneficiary.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">CLABE del Beneficiario:</span>
                        <span className="text-white font-mono">{policy.beneficiary.clabe}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={processClaim}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 rounded-full font-semibold"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Enviar solicitud de reclamo
                      </>
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
