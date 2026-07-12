import { supabase, WHATSAPP_NUMBER } from './supabase'
import type { Category, Flower, FlowerImage, Comment, Profile } from './types'

async function attachProfilesToComments<T extends Comment>(comments: T[]): Promise<T[]> {
  const userIds = [...new Set(comments.map(comment => comment.user_id).filter(Boolean))]
  if (userIds.length === 0) return comments

  const { data: profilesData, error } = await supabase.from('profiles').select('*').in('id', userIds)
  if (error) throw error

  const profilesById = new Map((profilesData || []).map((profile: Profile) => [profile.id, profile]))
  return comments.map(comment => ({ ...comment, profiles: profilesById.get(comment.user_id) ?? null }))
}

async function attachImagesToFlowers<T extends Flower>(flowers: T[]): Promise<T[]> {
  if (!flowers.length) return flowers

  const flowerIds = [...new Set(flowers.map(flower => flower.id).filter(Boolean))]
  const { data: imagesData, error } = await supabase
    .from('flower_images')
    .select('*')
    .in('flower_id', flowerIds)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  const imagesByFlowerId = new Map<string, FlowerImage[]>()
  for (const image of imagesData || []) {
    const current = imagesByFlowerId.get(image.flower_id) || []
    current.push(image)
    imagesByFlowerId.set(image.flower_id, current)
  }

  return flowers.map(flower => ({ ...flower, images: imagesByFlowerId.get(flower.id) || [] }))
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}
export async function createCategory(cat: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert(cat).select().single()
  if (error) throw error
  return data
}
export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function fetchFlowers(opts?: { categorySlug?: string; sort?: 'newest' | 'liked'; limit?: number; offset?: number; includeHidden?: boolean }): Promise<Flower[]> {
  let query = supabase.from('flowers').select('*, category:categories(*)')
  if (opts?.sort === 'liked') {
    query = query.order('like_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }
  if (!opts?.includeHidden) query = query.eq('hidden', false)
  if (opts?.categorySlug && opts.categorySlug !== 'all') {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', opts.categorySlug).maybeSingle()
    if (cat) query = query.eq('category_id', cat.id)
  }
  if (opts?.limit) query = query.range(opts.offset || 0, (opts.offset || 0) + opts.limit - 1)
  const { data, error } = await query
  if (error) throw error
  return attachImagesToFlowers((data || []) as Flower[])
}

export async function fetchFlowerBySlug(slug: string): Promise<Flower | null> {
  const { data, error } = await supabase.from('flowers').select('*, category:categories(*)').eq('slug', slug).maybeSingle()
  if (error) throw error
  if (!data) return null
  const [flowerWithImages] = await attachImagesToFlowers([data as Flower])
  return flowerWithImages
}

export async function fetchFlowerById(id: string): Promise<Flower | null> {
  const { data, error } = await supabase.from('flowers').select('*, category:categories(*)').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  const [flowerWithImages] = await attachImagesToFlowers([data as Flower])
  return flowerWithImages
}

export async function fetchFlowerImages(flowerId: string): Promise<FlowerImage[]> {
  const { data, error } = await supabase.from('flower_images').select('*').eq('flower_id', flowerId).order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function fetchRelatedFlowers(flower: Flower, limit = 4): Promise<Flower[]> {
  if (!flower.category_id) return []
  const { data, error } = await supabase.from('flowers').select('*, category:categories(*)').eq('category_id', flower.category_id).neq('id', flower.id).eq('hidden', false).order('like_count', { ascending: false }).limit(limit)
  if (error) throw error
  return attachImagesToFlowers((data || []) as Flower[])
}

export async function createFlower(flower: Partial<Flower>): Promise<Flower> {
  const { data, error } = await supabase.from('flowers').insert(flower).select().single()
  if (error) throw error
  return data
}
export async function updateFlower(id: string, updates: Partial<Flower>): Promise<Flower> {
  // Clean up the updates object to remove undefined values
  const processedUpdates: any = {}
  
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      if (key === 'price' && value !== null) {
        processedUpdates[key] = parseFloat(String(value))
      } else if (key === 'hidden') {
        // Ensure hidden is explicitly a boolean
        processedUpdates[key] = value === true || value === 'true'
      } else {
        processedUpdates[key] = value
      }
    }
  }
  
  console.log('===== UPDATE FLOWER START =====')
  console.log('Flower ID:', id)
  console.log('Updates to apply:', JSON.stringify(processedUpdates, null, 2))
  
  // Build the update query
  let query = supabase.from('flowers').update(processedUpdates).eq('id', id)
  
  console.log('Sending request to Supabase...')
  
  // Perform the update
  const { data, error: updateError, status } = await query
  
  console.log('Response received:')
  console.log('Status:', status)
  console.log('Data:', data)
  console.log('Error:', updateError)
  
  if (updateError) {
    console.error('=== UPDATE FAILED ===')
    console.error('Message:', updateError.message)
    console.error('Code:', updateError.code)
    console.error('Details:', updateError.details)
    throw new Error(updateError.message)
  }
  
  if (!data) {
    console.warn('Warning: No data returned from update (this might mean nothing was updated)')
  }
  
  console.log('===== UPDATE FLOWER SUCCESS =====')
  
  // Return the reconstructed object with the updates we just made
  return { id, ...processedUpdates } as any
}
export async function deleteFlower(id: string): Promise<void> {
  const { error } = await supabase.from('flowers').delete().eq('id', id)
  if (error) throw error
}
export async function incrementFlowerView(flowerId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_flower_view', { flower_id: flowerId })
    if (error) throw error
  } catch (error) {
    const { data: currentFlower, error: fetchError } = await supabase.from('flowers').select('view_count').eq('id', flowerId).maybeSingle()
    if (!fetchError && currentFlower) {
      await supabase.from('flowers').update({ view_count: (currentFlower.view_count || 0) + 1 }).eq('id', flowerId)
    }
  }
}

export async function addFlowerImage(flowerId: string, imageUrl: string, sortOrder: number): Promise<FlowerImage> {
  const { data, error } = await supabase.from('flower_images').insert({ flower_id: flowerId, image_url: imageUrl, sort_order: sortOrder }).select().single()
  if (error) throw error
  return data
}
export async function updateFlowerImageOrder(id: string, sortOrder: number): Promise<void> {
  const { error } = await supabase.from('flower_images').update({ sort_order: sortOrder }).eq('id', id)
  if (error) throw error
}
export async function deleteFlowerImage(id: string): Promise<void> {
  const { error } = await supabase.from('flower_images').delete().eq('id', id)
  if (error) throw error
}
export async function uploadFlowerImage(file: File, flowerId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `${flowerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('flower-images').upload(fileName, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('flower-images').getPublicUrl(fileName)
  return data.publicUrl
}

export async function fetchComments(flowerId: string, opts?: { sort?: 'newest' | 'liked'; limit?: number; offset?: number }): Promise<Comment[]> {
  let query = supabase.from('comments').select('*').eq('flower_id', flowerId).eq('is_hidden', false)
  if (opts?.sort === 'liked') query = query.order('like_count', { ascending: false })
  else query = query.order('created_at', { ascending: false })
  if (opts?.limit) query = query.range(opts.offset || 0, (opts.offset || 0) + opts.limit - 1)
  const { data, error } = await query
  if (error) throw error
  return attachProfilesToComments((data || []) as Comment[])
}

export async function fetchAllComments(opts?: { limit?: number; offset?: number; flowerId?: string }): Promise<Comment[]> {
  const { data, error } = await supabase.rpc('get_admin_comments', {
    limit_count: opts?.limit ?? 200,
    flower_filter: opts?.flowerId ?? null,
  })
  if (error) throw error
  return attachProfilesToComments((data || []) as Comment[])
}

export async function createComment(flowerId: string, userId: string, text: string): Promise<Comment> {
  const { data: authUser } = await supabase.auth.getUser()
  const effectiveUserId = authUser?.user?.id || userId

  if (!authUser?.user?.id) {
    throw new Error('Please sign in before commenting.')
  }

  const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', effectiveUserId).maybeSingle()
  if (!existingProfile) {
    const { error: insertProfileError } = await supabase.from('profiles').insert({ id: effectiveUserId, display_name: 'User' })
    if (insertProfileError) throw insertProfileError
  }

  const { data, error } = await supabase.from('comments').insert({ flower_id: flowerId, user_id: effectiveUserId, text }).select('*').single()
  if (error) throw error
  const [commentWithProfile] = await attachProfilesToComments([data as Comment])
  return commentWithProfile
}
export async function toggleCommentHidden(commentId: string, hidden: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_comment_visibility', { comment_id: commentId, hidden })
  if (error) throw error
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_comment', { comment_id: commentId })
  if (error) throw error
}

export async function hasUserLikedFlower(flowerId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase.from('flower_likes').select('id').eq('flower_id', flowerId).eq('user_id', userId).maybeSingle()
  if (error) return false
  return !!data
}
export async function toggleFlowerLike(flowerId: string, userId: string, liked: boolean): Promise<void> {
  const { data: authUser } = await supabase.auth.getUser()
  const effectiveUserId = authUser?.user?.id || userId

  if (!authUser?.user?.id) {
    throw new Error('Please sign in before liking.')
  }

  const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', effectiveUserId).maybeSingle()
  if (!existingProfile) {
    const { error: insertProfileError } = await supabase.from('profiles').insert({ id: effectiveUserId, display_name: 'User' })
    if (insertProfileError) throw insertProfileError
  }

  if (liked) {
    const { error } = await supabase.from('flower_likes').insert({ flower_id: flowerId, user_id: effectiveUserId })
    if (error) throw error
  } else {
    const { error } = await supabase.from('flower_likes').delete().eq('flower_id', flowerId).eq('user_id', userId)
    if (error) throw error
  }
}
export async function hasUserLikedComment(commentId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase.from('comment_likes').select('id').eq('comment_id', commentId).eq('user_id', userId).maybeSingle()
  if (error) return false
  return !!data
}
export async function toggleCommentLike(commentId: string, userId: string, liked: boolean): Promise<void> {
  const { data: authUser } = await supabase.auth.getUser()
  const effectiveUserId = authUser?.user?.id || userId

  if (!authUser?.user?.id) {
    throw new Error('Please sign in before liking comments.')
  }

  const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', effectiveUserId).maybeSingle()
  if (!existingProfile) {
    const { error: insertProfileError } = await supabase.from('profiles').insert({ id: effectiveUserId, display_name: 'User' })
    if (insertProfileError) throw insertProfileError
  }

  if (liked) {
    const { error } = await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: effectiveUserId })
    if (error) throw error
  } else {
    const { error } = await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId)
    if (error) throw error
  }
}

export async function fetchDashboardStats() {
  const [cats, flowers, comments, flowerLikes, commentLikes, views, users] = await Promise.all([
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('flowers').select('id', { count: 'exact', head: true }),
    supabase.from('comments').select('id', { count: 'exact', head: true }),
    supabase.from('flower_likes').select('id', { count: 'exact', head: true }),
    supabase.from('comment_likes').select('id', { count: 'exact', head: true }),
    supabase.from('flowers').select('view_count'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ])
  const totalViews = views.data?.reduce((sum, f) => sum + (f.view_count || 0), 0) || 0
  return { categories: cats.count || 0, flowers: flowers.count || 0, comments: comments.count || 0, likes: (flowerLikes.count || 0) + (commentLikes.count || 0), views: totalViews, users: users.count || 0 }
}

export async function fetchRecentPublicComments(limit = 4): Promise<Comment[]> {
  const { data, error } = await supabase.from('comments').select('*').eq('is_hidden', false).order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return attachProfilesToComments((data || []) as Comment[])
}

export async function fetchSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase.from('settings').select('value').eq('key', key).maybeSingle()
  if (error) throw error
  return data?.value || null
}

export async function updateSetting(key: string, value: string | null): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value }, { onConflict: 'key' })
    .select()
    .single()
  if (error) throw error
}
