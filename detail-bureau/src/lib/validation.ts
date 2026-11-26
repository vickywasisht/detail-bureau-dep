import { NextRequest, NextResponse } from 'next/server'
import { z, type ZodType } from 'zod'

// ---------------------------------------------------------------------------
// Shared enums (kept in sync with src/types/index.ts and the client-side
// constants that produce these values, e.g. book-service/page.tsx TIME_SLOTS)
// ---------------------------------------------------------------------------
export const VEHICLE_TYPES = ['Sedan', 'SUV', 'Truck', 'Van', 'Convertible'] as const
export const PACKAGE_SLUGS = ['basic', 'value', 'premium'] as const
export const PACKAGE_LABELS: Record<(typeof PACKAGE_SLUGS)[number], string> = {
  basic: 'Basic – Express Shine',
  value: 'Value – Complete Care',
  premium: 'Premium – Ultimate Protection',
}
export const BOOKING_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const
export const EMPLOYEE_ROLES = ['owner', 'employee'] as const
export const PAYMENT_TYPES = ['deposit', 'full', 'balance'] as const
// Must match TIME_SLOTS in src/app/(customer)/book-service/page.tsx
export const DROPOFF_TIME_SLOTS = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM'] as const

// ---------------------------------------------------------------------------
// Parsing helper: reads + validates a JSON body against a schema.
// Returns either the parsed data, or a ready-to-return 400 NextResponse.
// ---------------------------------------------------------------------------
export async function parseBody<T>(
  req: NextRequest,
  schema: ZodType<T>
): Promise<{ data: T; error?: undefined } | { data?: undefined; error: NextResponse }> {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return { error: NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }) }
  }

  const result = schema.safeParse(json)
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'Invalid request.'
    return { error: NextResponse.json({ error: message }, { status: 400 }) }
  }
  return { data: result.data }
}

// ---------------------------------------------------------------------------
// Primitive building blocks
// ---------------------------------------------------------------------------
const nonEmptyString = (field: string, max: number) =>
  z.string().trim().min(1, `${field} is required.`).max(max, `${field} is too long.`)

const optionalString = (max: number) =>
  z.string().trim().max(max, 'That value is too long.').optional()

const money = (field: string) =>
  z.coerce.number().finite(`Enter a valid ${field}.`).min(0, `${field} must be 0 or more.`)

// ---------------------------------------------------------------------------
// Auth / customer profile
// ---------------------------------------------------------------------------
export const customerCreateSchema = z.object({
  id: z.uuid('Invalid user id.'),
  first_name: nonEmptyString('First name', 80),
  last_name: nonEmptyString('Last name', 80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(255),
  phone: optionalString(30),
})

export const customerUpdateSchema = z
  .object({
    first_name: nonEmptyString('First name', 80).optional(),
    last_name: nonEmptyString('Last name', 80).optional(),
    phone: optionalString(30),
    current_password: z.string().max(200).optional(),
    new_password: z.string().min(8, 'New password must be at least 8 characters.').max(200).optional(),
  })
  .refine(data => !data.new_password || data.current_password, {
    message: 'Current password is required to set a new password.',
    path: ['current_password'],
  })

// ---------------------------------------------------------------------------
// Employee / owner login
// ---------------------------------------------------------------------------
export const employeeLoginSchema = z.object({
  username: z.string().trim().min(1, 'Username and password required.').max(100),
  password: z.string().min(1, 'Username and password required.').max(200),
  portal: z.enum(['owner', 'employee']).optional(),
})

export const employeeCreateSchema = z.object({
  username: nonEmptyString('Username', 50),
  first_name: nonEmptyString('First name', 80),
  last_name: nonEmptyString('Last name', 80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
  role: z.enum(EMPLOYEE_ROLES, { error: 'Invalid role.' }),
})

export const employeeUpdateSchema = z.object({
  is_active: z.boolean().optional(),
  role: z.enum(EMPLOYEE_ROLES, { error: 'Invalid role.' }).optional(),
})

export const employeeProfileUpdateSchema = z
  .object({
    first_name: nonEmptyString('First name', 80).optional(),
    last_name: nonEmptyString('Last name', 80).optional(),
    current_password: z.string().max(200).optional(),
    new_password: z.string().min(8, 'New password must be at least 8 characters.').max(200).optional(),
  })
  .refine(data => !data.new_password || data.current_password, {
    message: 'Current password is required to set a new password.',
    path: ['current_password'],
  })

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------
const vehicleYear = z.coerce
  .number()
  .int('Enter a valid vehicle year.')
  .min(1900, 'Enter a valid vehicle year.')
  .max(new Date().getFullYear() + 1, 'Enter a valid vehicle year.')
  // stored as text (matches the existing `year: string` column/type), just validated as a number
  .transform(n => String(n))

export const vehicleCreateSchema = z.object({
  make: nonEmptyString('Make', 60),
  model: nonEmptyString('Model', 60),
  year: vehicleYear,
  color: optionalString(40),
  vehicle_type: z.enum(VEHICLE_TYPES, { error: 'Choose a valid vehicle type.' }),
})

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------
export const bookingCreateSchema = z.object({
  vehicle_id: z.uuid('Missing required fields.'),
  package_slug: z.enum(PACKAGE_SLUGS, { error: 'Choose a valid package.' }),
  service_date: z.iso.date('Enter a valid service date.'),
  dropoff_time: z.enum(DROPOFF_TIME_SLOTS, { error: 'Choose a valid drop-off time.' }),
  special_notes: optionalString(2000),
  addon_ids: z.array(z.uuid()).max(20).optional(),
})

export const bookingStatusUpdateSchema = z.object({
  booking_status: z.enum(BOOKING_STATUSES, { error: 'Invalid status.' }).optional(),
  employee_id: z.uuid().nullable().optional(),
})

export const employeeBookingUpdateSchema = z.object({
  booking_status: z.enum(BOOKING_STATUSES, { error: 'Invalid status.' }).optional(),
  final_price: money('final price').optional(),
})

// ---------------------------------------------------------------------------
// Pricing / packages (owner)
// ---------------------------------------------------------------------------
export const pricingUpdateSchema = z.object({
  packages: z
    .array(
      z.object({
        slug: nonEmptyString('Package slug', 40),
        description: nonEmptyString('Description', 2000),
      })
    )
    .max(20)
    .optional()
    .default([]),
  pricing: z
    .array(
      z.object({
        id: z.uuid(),
        price: money('price'),
        duration_hours: nonEmptyString('Duration', 20),
      })
    )
    .max(100)
    .optional()
    .default([]),
})

// ---------------------------------------------------------------------------
// Add-ons (owner)
// ---------------------------------------------------------------------------
export const addonSchema = z.object({
  name: nonEmptyString('Name', 100),
  description: optionalString(1000),
  price: money('price'),
})

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export const reviewCreateSchema = z.object({
  booking_id: z.uuid('Missing booking.'),
  rating: z.int('Rating must be between 1 and 5.').min(1).max(5),
  title: optionalString(100),
  comment: z
    .string()
    .trim()
    .min(10, 'Review must be between 10 and 1000 characters.')
    .max(1000, 'Review must be between 10 and 1000 characters.'),
})

export const ownerReviewCreateSchema = z.object({
  reviewer_name: nonEmptyString('Name', 100),
  rating: z.int('Rating must be between 1 and 5.').min(1).max(5),
  title: optionalString(100),
  comment: z
    .string()
    .trim()
    .min(10, 'Review must be between 10 and 1000 characters.')
    .max(1000, 'Review must be between 10 and 1000 characters.'),
})

export const reviewVisibilitySchema = z.object({
  is_visible: z.boolean({ error: 'is_visible must be true or false.' }),
})

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------
export const checkoutSchema = z.object({
  booking_id: z.uuid('Invalid request.'),
  type: z.enum(PAYMENT_TYPES, { error: 'Invalid request.' }),
})

// Escapes text before it's interpolated into the HTML confirmation email
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
