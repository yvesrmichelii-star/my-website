import { generateText, Output } from 'ai'
import { z } from 'zod'

const contractSchema = z.object({
  // DJ/Talent Information
  djTalentName: z.string().nullable().describe('Full legal name of the DJ/Talent (e.g., "Richard Jackson")'),
  djTalentAlias: z.string().nullable().describe('Stage name after "p/k/a" (e.g., "DJ Rich")'),
  
  // Purchaser Information
  purchaserName: z.string().nullable().describe('Name from signature section - the person who signed (e.g., "Matthew Tadesse")'),
  purchaserTitle: z.string().nullable().describe('Title from signature section (e.g., "Owner/CEO")'),
  purchaserCompany: z.string().nullable().describe('Company name from "On Behalf Of" or agreement intro (e.g., "04 Enterprises LLC")'),
  
  // Agreement Date
  agreementDate: z.string().nullable().describe('Date from "made as of this date" in YYYY-MM-DD format'),
  
  // Venue Information
  venueName: z.string().nullable().describe('Venue name before the comma in location (e.g., "Juliana Restaurant & Lounge")'),
  venueAddress: z.string().nullable().describe('Full street address with city, state, zip (e.g., "3001 W Peterson Ave, Chicago, IL 60659")'),
  
  // Event Details
  eventDate: z.string().nullable().describe('Event Date in YYYY-MM-DD format'),
  callTime: z.string().nullable().describe('Call Time / Set Start time (e.g., "10:00 PM")'),
  setEndTime: z.string().nullable().describe('Set end time - the second time in the range (e.g., "11:00 PM")'),
  setDuration: z.string().nullable().describe('Set Duration as written (e.g., "One (1) hour" or "1 hour")'),
  
  // Payment Information - Look in PAYMENT section
  totalPayment: z.number().nullable().describe('Total payment amount - the main dollar figure (e.g., 75 for "$75.00")'),
  depositAmount: z.number().nullable().describe('Deposit amount from section (a) (e.g., 37.50 for "$37.50")'),
  balanceAmount: z.number().nullable().describe('Balance amount from section (b) (e.g., 37.50 for "$37.50")'),
  depositDueHours: z.number().nullable().describe('Hours for deposit due (e.g., 48 from "forty-eight (48) hours")'),
  balanceDueHours: z.number().nullable().describe('Hours for balance due after event (e.g., 48)'),
  
  // Equipment - Look in PERFORMANCE REQUIREMENTS & EQUIPMENT section
  equipmentProvidedBy: z.enum(['purchaser', 'dj_talent', 'venue']).nullable().describe('Who provides equipment - usually "purchaser" if it says "Purchaser hereby agrees to furnish"'),
  equipmentRequirements: z.array(z.string()).nullable().describe('List equipment items like mixer, CDJs, turntables, monitor speakers, PA system'),
  
  // Social Media - Look in SOCIAL MEDIA PROMOTION section
  socialMediaRequired: z.boolean().nullable().describe('True if there is a social media section requiring posts'),
  socialMediaPlatforms: z.array(z.string()).nullable().describe('Platforms mentioned (e.g., ["Instagram"])'),
  promoMaterialsDueDays: z.number().nullable().describe('Days before event for promo materials (e.g., 10 from "ten (10) days")'),
  
  // Terms - Look in CANCELLATION and GENERAL PROVISIONS sections
  cancellationNoticeDays: z.number().nullable().describe('Days notice for cancellation (e.g., 30 from "thirty (30) days")'),
  governingLaw: z.string().nullable().describe('State from "laws of the State of..." (e.g., "State of Georgia")'),
  arbitrationRequired: z.boolean().nullable().describe('True if American Arbitration Association is mentioned'),
  
  // Signatures - Look at SIGNATURES section at the end
  purchaserSigned: z.boolean().nullable().describe('True if purchaser signature line has a name written/signed'),
  purchaserSignatureDate: z.string().nullable().describe('Date next to purchaser signature in YYYY-MM-DD format'),
  djTalentSigned: z.boolean().nullable().describe('True if DJ/Talent signature line has a name - False if blank lines'),
  djTalentSignatureDate: z.string().nullable().describe('Date next to DJ signature in YYYY-MM-DD format - null if not signed'),
})

export async function POST(req: Request) {
  try {
    const { file, fileName } = await req.json()

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      output: Output.object({
        schema: contractSchema,
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a contract parsing expert. Extract all details from this DJ Services Engagement Agreement / DJ Booking Agreement document.

THIS IS A DJ BOOKING CONTRACT. Look for these specific sections:
1. AGREEMENT HEADER - Contains DJ/Talent name (with "p/k/a" alias), Purchaser company name, and agreement date
2. ENGAGEMENT DETAILS (Section 1) - Venue name, address, Event Date, Call Time/Set Start, Set Duration
3. PAYMENT (Section 2) - Total payment, deposit amount, balance amount, payment deadlines in hours
4. SOCIAL MEDIA PROMOTION (Section 3) - Instagram or other platforms, promo material deadlines
5. PERFORMANCE REQUIREMENTS & EQUIPMENT (Section 4) - Who provides equipment, list of required gear
6. CANCELLATION (Sections 5-6) - Notice period in days
7. GENERAL PROVISIONS (Section 11) - Governing law state, arbitration requirements
8. SIGNATURES - Check if purchaser signed (name filled in) and if DJ/Talent signed (or blank lines)

CRITICAL PARSING RULES:
- All dates must be converted to YYYY-MM-DD format (e.g., "February 23rd, 2026" → "2026-02-23", "April 25th, 2026" → "2026-04-25")
- Dollar amounts should be numbers only (e.g., "$75.00" → 75, "$37.50" → 37.5)
- Time format should include AM/PM (e.g., "10:00 PM")
- If a time range says "10:00 PM to 11:00 am", the "am" is likely a typo - interpret as "11:00 PM"
- For equipmentProvidedBy: if "Purchaser hereby agrees to furnish" equipment, answer is "purchaser"
- For signatures: if a line has "____" it means NOT signed; if there's actual text/name, it IS signed

Extract every field possible from this document:`,
            },
            {
              type: 'file',
              data: file,
              mediaType: 'application/pdf',
              filename: fileName || 'contract.pdf',
            },
          ],
        },
      ],
    })

    return Response.json({ contractData: output })
  } catch (error) {
    console.error('Error parsing contract:', error)
    return Response.json(
      { error: 'Failed to parse contract. Please try again.' },
      { status: 500 }
    )
  }
}
