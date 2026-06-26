import { api } from '../wrapper'

export type BlogPost = {
  id: string | number
  title: string
  slug: string
  excerpt?: string
  content?: string
  category?: string
  author?: string
  read_time?: number
  published_at?: string
  image?: string
}

export const blogsApi = {
  list: () => api.get<BlogPost[]>('/blogs'),
  get: (slug: string) => api.get<BlogPost>(`/blogs/${slug}`),
}
