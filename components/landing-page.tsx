"use client"

import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Shield, TrendingUp, Users, Zap, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

// Dynamic import of 3D scene with no SSR
const Scene3D = dynamic(() => import('./scene-3d'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="animate-pulse text-cyan-400">Loading 3D Scene...</div>
    </div>
  )
})

export default function LandingPage() {
  const router = useRouter()

  const benefits = [
    {
      icon: Shield,
      title: "Secure Protection",
      description: "Blockchain-secured insurance policies with transparent smart contracts",
    },
    {
      icon: TrendingUp,
      title: "Stable Returns",
      description: "MXNB stablecoin ensures your policy value remains stable against peso fluctuations",
    },
    {
      icon: Users,
      title: "Family Coverage",
      description: "Comprehensive coverage for you and your beneficiaries",
    },
    {
      icon: Zap,
      title: "Instant Claims",
      description: "Fast, automated claim processing through smart contracts",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">Extra Life</span>
          </div>
          <div className="flex space-x-4">
            <Button
              onClick={() => router.push("/claims")}
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 px-6 py-2 rounded-full font-semibold"
            >
              <FileText className="mr-2 h-4 w-4" />
              File Claim
            </Button>
            <Button
              onClick={() => router.push("/dapp")}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Launch Dapp
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <Scene3D />
        </div>

        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Extra Life Protection
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300">
            Secure your future with blockchain-powered insurance policies backed by MXNB stablecoin
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/dapp")}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-12 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Get Started Now
            </Button>
            <Button
              onClick={() => router.push("/claims")}
              size="lg"
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 px-12 py-4 rounded-full text-lg font-semibold"
            >
              <FileText className="mr-2 h-5 w-5" />
              File a Claim
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-16">Why Choose Extra Life?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
              >
                <benefit.icon className="h-12 w-12 text-cyan-400 mb-6" />
                <h3 className="text-xl font-semibold text-white mb-4">{benefit.title}</h3>
                <p className="text-gray-300">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to Secure Your Future?</h2>
          <p className="text-xl text-gray-300 mb-12">
            Join thousands of Mexicans who trust Extra Life for their protection needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/dapp")}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-12 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Launch Dapp
            </Button>
            <Button
              onClick={() => router.push("/claims")}
              size="lg"
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 px-12 py-4 rounded-full text-lg font-semibold"
            >
              <FileText className="mr-2 h-5 w-5" />
              File a Claim
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
