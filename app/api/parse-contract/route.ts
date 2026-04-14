export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import pdf from "pdf-parse";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.file || !body?.fileName) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing file or filename",
          contractData: null,
        },
        { status: 400 }
      );
    }

    // Decode base64 file
    const buffer = Buffer.from(body.file, "base64");

    // Extract text from PDF
    let text = "";
    try {
      const parsed = await pdf(buffer);
      text = parsed.text || "";
    } catch {
      text = "";
    }

    if (!text.trim()) {
      return NextResponse.json({
        success: false,
        error: "No readable text found (possibly scanned PDF)",
        contractData: null,
      });
    }

    // Call AI with STRICT JSON requirement
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You are a contract extraction engine.

Return ONLY valid JSON.
No markdown. No commentary. No explanations.

If a value is missing, use null.
Never guess.

JSON schema:

{
  "venueName": string | null,
  "venueAddress": string | null,
  "eventDate": string | null,
  "djTalentName": string | null,
  "djTalentAlias": string | null,
  "purchaserName": string | null,
  "purchaserCompany": string | null,
  "callTime": string | null,
  "setEndTime": string | null,
  "setDuration": string | null,
  "totalPayment": number | null,
  "depositAmount": number | null,
  "balanceAmount": number | null,
  "depositDueHours": number | null,
  "balanceDueHours": number | null,
  "equipmentProvidedBy": "purchaser" | "talent" | null,
  "equipmentRequirements": string[] | null,
  "socialMediaRequired": boolean,
  "socialMediaPlatforms": string[] | null,
  "promoMaterialsDueDays": number | null,
  "governingLaw": string | null,
  "arbitrationRequired": boolean,
  "purchaserSigned": boolean,
  "purchaserSignatureDate": string | null,
  "djTalentSigned": boolean,
  "djTalentSignatureDate": string | null
}
          `,
        },
        {
          role: "user",
          content: text.slice(0, 12000),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw) {
      throw new Error("AI returned empty response");
    }

    let contractData;
    try {
      contractData = JSON.parse(raw);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    return NextResponse.json({
      success: true,
      contractData,
    });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || "Unknown parsing error",
      contractData: null,
    });
  }
}

