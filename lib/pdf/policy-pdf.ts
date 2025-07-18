import { jsPDF } from "jspdf"

interface PolicyPDFParams {
  policyHolder: string
  beneficiary: string
  coverageAmount: string
  premium: string
  issueDate: string
  endDate: string
  policyNumber: string
}

export function generatePolicyPDF({
  policyHolder,
  beneficiary,
  coverageAmount,
  premium,
  issueDate,
  endDate,
  policyNumber,
}: PolicyPDFParams) {
  const doc = new jsPDF()

  // Fondo morado
  doc.setFillColor(112, 48, 160)
  doc.rect(0, 0, 210, 30, "F")

  // Logo en encabezado
  const logoPath = "/placeholder-logo.png"
  const logo = new Image()
  logo.src = logoPath
  doc.addImage(logo, "PNG", 160, 8, 35, 12) // Ajusta posición y tamaño

  // Texto del encabezado
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Extra Life - Carátula de Póliza", 20, 20)

  doc.setFont("helvetica", "normal")
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)

  // Datos de la póliza
  const yStart = 35
  const lineHeight = 10
  let y = yStart

  const drawLine = () => {
    doc.setDrawColor(200)
    doc.line(20, y - 5, 190, y - 5)
  }

  doc.text(`Número de póliza: ${policyNumber}`, 20, y); y += lineHeight
  doc.text(`Asegurado Titular: ${policyHolder}`, 20, y); y += lineHeight
  doc.text(`Beneficiario: ${beneficiary}`, 20, y); y += lineHeight
  doc.text(`Suma Asegurada: ${coverageAmount}`, 20, y); y += lineHeight
  doc.text(`Prima Pagada: ${premium}`, 20, y); y += lineHeight
  doc.text(`Fecha de Emisión: ${issueDate}`, 20, y); y += lineHeight
  doc.text(`Fin de Cobertura: ${endDate}`, 20, y); y += lineHeight

  drawLine(); y += lineHeight

  // Instrucciones
  doc.text("En caso de siniestro:", 20, y); y += lineHeight
  doc.text("Visita el siguiente enlace para iniciar el proceso:", 20, y); y += lineHeight
  doc.text("http://localhost:3000/claims", 20, y)

  // Guardar el PDF
  doc.save(`Poliza_${policyNumber}.pdf`)
}