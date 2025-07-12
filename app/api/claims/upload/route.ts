import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const policyNumber = formData.get("policy_number") as string

    if (!file || !policyNumber) {
      return NextResponse.json({ success: false, error: "File and policy number are required" }, { status: 400 })
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ success: false, error: "Only PDF files are allowed" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Simulate file processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock file upload response
    const uploadResult = {
      id: `upload_${Date.now()}`,
      filename: file.name,
      size: file.size,
      policy_number: policyNumber,
      status: "uploaded",
      uploaded_at: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: uploadResult,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to upload file" }, { status: 500 })
  }
}
