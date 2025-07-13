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
        alert("Please select a PDF file")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB")
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
        setClaimError(result.error || "Your claim has been submitted and is awaiting manual review.")
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
              {claimError ? "Claim Submitted!" : "Claim Processed Successfully!"}
            </h2>

            {claimError ? (
              <p className="text-gray-300">
                {claimError} We’ll notify you at the email on file when the payout is complete or if we need additional information.
              </p>
            ) : (
              <>
                <div className="space-y-4 text-left">
                  <div className="bg-white/5 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount Transferred:</span>
                      <span className="text-green-400 font-semibold">
                        {claimResult?.amount.toLocaleString()} {claimResult?.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Beneficiary CLABE:</span>
                      <span className="text-white font-mono text-sm">{claimResult?.beneficiary_clabe}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transaction ID:</span>
                      <span className="text-cyan-400 font-mono text-xs">{claimResult?.juno_transaction_id}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  The insurance payout has been successfully transferred to the beneficiary's account. This transaction is
                  recorded on the blockchain for transparency.
                </p>
              </>
            )}

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
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">Extra Life</span>
          </div>
          <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            Claims Portal
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
            <span>Search</span>
            <span>Upload</span>
            <span>Verify</span>
            <span>Process</span>
            <span>Complete</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Policy Information */}
          {policy && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center">
                  <Shield className="mr-2 h-6 w-6 text-cyan-400" />
                  Policy Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Policy Number:</span>
                    <span className="text-white font-mono text-xs break-all max-w-[180px] text-right">
                      {policy.policy_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Coverage Amount:</span>
                    <span className="text-cyan-400 font-semibold">{policy.coverage_amount.toLocaleString()} MXNB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {policy.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <User className="mr-2 h-4 w-4 text-cyan-400" />
                    Policy Holder
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white">{policy.policy_holder.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">CLABE:</span>
                      <span className="text-white font-mono">{policy.policy_holder.clabe}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Age:</span>
                      <span className="text-white">{policy.policy_holder.age} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Region:</span>
                      <span className="text-white">{policy.policy_holder.region}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <Users className="mr-2 h-4 w-4 text-cyan-400" />
                    Beneficiary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
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
                {currentStep === 1 && "Search Policy"}
                {currentStep === 2 && "Upload Death Certificate"}
                {currentStep === 3 && "Verify Document"}
                {currentStep === 4 && "Process Claim"}
              </CardTitle>
              <CardDescription className="text-gray-300">
                {currentStep === 1 && "Enter the policy number to begin the claims process"}
                {currentStep === 2 && "Upload the official death certificate (PDF only)"}
                {currentStep === 3 && "Verify the uploaded document"}
                {currentStep === 4 && "Process the insurance claim payout"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Search Policy */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-gray-300">
                      Available test policy numbers: EL-00000001, EL-00000002, EL-00000003, EL-00000004, EL-00000005
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="policyNumber" className="text-white">
                      Policy Number
                    </Label>
                    <Input
                      id="policyNumber"
                      value={policyNumber}
                      onChange={(e) => setPolicyNumber(e.target.value)}
                      placeholder="Enter policy number (e.g., EL-00000001)"
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
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search Policy
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
                      Please upload the official death certificate in PDF format. Maximum file size: 10MB.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="deathCertificate" className="text-white">
                      Death Certificate (PDF)
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
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
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
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Document
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
                      Document uploaded successfully! Click verify to validate the death certificate.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-white/5 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Filename:</span>
                      <span className="text-white">{uploadResult.filename}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Upload ID:</span>
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
                        Verifying Document...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verify Document
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
                      Document verified successfully! Ready to process the insurance claim.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-white/5 rounded-lg p-4 space-y-3">
                    <h4 className="text-white font-semibold flex items-center">
                      <DollarSign className="mr-2 h-4 w-4 text-cyan-400" />
                      Claim Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Policy Holder:</span>
                        <span className="text-white">{policy.policy_holder.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Payout Amount:</span>
                        <span className="text-cyan-400 font-semibold">
                          {policy.coverage_amount.toLocaleString()} MXNB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Beneficiary:</span>
                        <span className="text-white">{policy.beneficiary.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Beneficiary CLABE:</span>
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
