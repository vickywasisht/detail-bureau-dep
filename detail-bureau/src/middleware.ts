import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // ── Customer route protection
  const customerRoutes = ['/dashboard', '/vehicles', '/book-service', '/booking-pricing', '/booking-confirm', '/write-review']
  const isCustomerRoute = customerRoutes.some(r => path.startsWith(r))
  if (isCustomerRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Employee route protection (JWT cookie check)
if (path.startsWith('/employee') && !path.startsWith('/employee-login')) {
  const employeeToken = request.cookies.get('employee_token')
  if (!employeeToken) {
    return NextResponse.redirect(new URL('/employee-login', request.url))
  }
}
  // ── Owner route protection (JWT cookie check)
const isOwnerRoute = path === '/owner' || path.startsWith('/owner/')
if (isOwnerRoute && !request.cookies.get('employee_token')) {
  return NextResponse.redirect(new URL('/owner-login', request.url))
}

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}