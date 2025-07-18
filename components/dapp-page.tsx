"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Shield, ArrowRight, User, MapPin, Calendar, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"

const mexicanStates = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
]

export default function DappPage() {
  const router = useRouter()
  const [gender, setGender] = useState("")
  const [age, setAge] = useState([25])
  const [region, setRegion] = useState("")
  const [policyHolderName, setPolicyHolderName] = useState("")

  const handleProceedToCheckout = () => {
    // Store user data in sessionStorage for checkout process
    const userData = {
      gender,
      age: age[0],
      region,
      policyHolderName: policyHolderName.trim(),
    }
    sessionStorage.setItem("extralife_user_data", JSON.stringify(userData))
    router.push("/checkout")
  }

  const canProceed = () => {
    return gender && age[0] && region && policyHolderName.trim()
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
            Insurance Platform
          </Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white mb-2">Obtén tu Cotización de Seguro</CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              Proporciona tu información para calcular tu prima y continuar con tu póliza
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Gender Selection */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-white">
                <User className="h-5 w-5 text-cyan-400" />
                <label className="text-lg font-semibold">Género</label>
              </div>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Selecciona tu género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Hombre</SelectItem>
                  <SelectItem value="female">Mujer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Age Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-white">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                  <label className="text-lg font-semibold">Edad</label>
                </div>
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                  {age[0]} años
                </Badge>
              </div>
              <Slider value={age} onValueChange={setAge} max={99} min={18} step={1} className="w-full" />
              <div className="flex justify-between text-sm text-gray-400">
                <span>18</span>
                <span>99</span>
              </div>
            </div>

            {/* Region Selection */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-white">
                <MapPin className="h-5 w-5 text-cyan-400" />
                <label className="text-lg font-semibold">Estado</label>
              </div>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Selecciona tu estado" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {mexicanStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Policy Holder Name */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-white">
                <User className="h-5 w-5 text-cyan-400" />
                <label className="text-lg font-semibold">Tu Nombre Completo</label>
              </div>
              <Input
                value={policyHolderName}
                onChange={(e) => setPolicyHolderName(e.target.value)}
                placeholder="Escribe tu nombre completo"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            {/* Coverage Preview */}
            {canProceed() && (
              <div className="bg-white/5 rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-semibold text-white mb-4">Resumen de tu Cobertura</h3>
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-white">
                    <DollarSign className="h-6 w-6 text-cyan-400" />
                    <span className="text-lg font-semibold">Monto de Cobertura</span>
                  </div>
                  <div className="text-4xl font-bold text-cyan-400">1,000,000</div>
                  <div className="text-lg text-gray-300">MXNB</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                  <div>
                    <span className="text-gray-400">Prima Anual:</span>
                    <span className="text-white ml-2 font-semibold">10,000 MXNB</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Mensual:</span>
                    <span className="text-white ml-2 font-semibold">833 MXNB</span>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleProceedToCheckout}
              disabled={!canProceed()}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 text-white py-4 rounded-full font-semibold transition-all duration-300"
            >
              Continuar al Pago
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
