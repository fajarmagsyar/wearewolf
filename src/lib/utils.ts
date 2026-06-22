import { createClient } from '@/lib/supabase/server'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export async function generateUniqueCode(): Promise<string> {
  const supabase = await createClient()
  let code: string
  let exists = true

  while (exists) {
    code = ''
    for (let i = 0; i < 6; i++) {
      code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    }
    const { data } = await supabase
      .from('rooms')
      .select('id')
      .eq('code', code)
      .single()
    exists = !!data
  }

  return code!
}

export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
