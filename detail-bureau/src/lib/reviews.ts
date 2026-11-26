import { adminClient } from '@/lib/supabase/admin'

export interface PublicReview {
  id: string
  reviewer_name: string
  rating: number
  title: string | null
  comment: string
  created_at: string
}

export interface ReviewSummary {
  count: number
  average: number
  distribution: { star: number; count: number }[]
}

// Average + count + how many reviews per star (visible reviews only)
export async function getReviewSummary(): Promise<ReviewSummary> {
  const { data, error } = await adminClient.from('reviews').select('rating').eq('is_visible', true)
  if (error) throw error
  const ratings = (data ?? []).map(r => r.rating as number)
  const count = ratings.length
  return {
    count,
    average: count ? ratings.reduce((n, r) => n + r, 0) / count : 0,
    distribution: [5, 4, 3, 2, 1].map(star => ({ star, count: ratings.filter(r => r === star).length })),
  }
}

// Newest visible reviews. minRating: 5 => "recent five-star reviews" (story #15)
export async function getReviews({ minRating = 1, limit = 50 }: { minRating?: number; limit?: number } = {}) {
  const { data, error } = await adminClient
    .from('reviews')
    .select('id, reviewer_name, rating, title, comment, created_at')
    .eq('is_visible', true)
    .gte('rating', minRating)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as PublicReview[]
}