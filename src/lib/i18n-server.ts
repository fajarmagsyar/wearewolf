import { cookies } from 'next/headers'
import { Locale } from './i18n'

export async function getLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies()
    const locale = cookieStore.get('locale')?.value
    if (locale === 'id') return 'id'
    return 'en'
  } catch {
    return 'en'
  }
}
