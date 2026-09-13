export type VehicleType = 'Sedan' | 'SUV' | 'Truck' | 'Van' | 'Convertible'
export type PackageSlug = 'basic' | 'value' | 'premium'
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
export type EmployeeRole = 'owner' | 'employee'

export interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  created_at: string
}

export interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  role: EmployeeRole
  is_active: boolean
  created_at: string
}

export interface Vehicle {
  id: string
  customer_id: string
  make: string
  model: string
  year: string
  color?: string
  vehicle_type: VehicleType
  created_at: string
}

export interface ServicePricing {
  id: string
  package_slug: PackageSlug
  vehicle_type: VehicleType
  price: number
  duration_hours: string
}

export interface Booking {
  id: string
  customer_id: string
  vehicle_id: string
  employee_id?: string
  package_slug: PackageSlug
  package_label: string
  service_date: string
  dropoff_time: string
  duration_hours?: string
  quoted_price?: number
  final_price?: number
  special_notes?: string
  booking_status: BookingStatus
  email_sent: boolean
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  customer?: Customer
  employee?: Employee
}