import { z } from 'zod'

export const ticketExtractSchema = z.object({
  type: z
    .enum(['flight', 'train', 'hotel', 'car_rental', 'other'])
    .describe('Type of transport/booking'),
  departure: z.string().max(100).describe('Departure city/airport/station'),
  arrival: z.string().max(100).describe('Arrival city/airport/station'),
  date: z.string().describe('Date in YYYY-MM-DD format'),
  time: z.string().nullable().describe('Departure time in HH:MM format, null if unknown'),
  end_date: z.string().nullable().describe('End date for hotels (checkout), null for transport'),
  carrier: z.string().nullable().describe('Airline/train company name'),
  reference: z.string().nullable().describe('Booking reference / PNR code'),
  passengers: z.number().int().min(1).describe('Number of passengers'),
})

export type TicketExtract = z.infer<typeof ticketExtractSchema>
