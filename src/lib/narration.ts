import { NarrationData } from './types'

const dawnVariants: Record<string, string[]> = {
  en: [
    'As dawn cracks over the village, the roosters scream and so does everyone else.',
    'The sun claws its way over the hills. Another beautiful day to betray your friends.',
    'Morning. The coffee is cold, the bodies are colder.',
    'Dawn breaks like a cheap promise. The village stirs, blinking and suspicious.',
  ],
  id: [
    'Saat fajar menyingsing di atas desa, ayam berkokok dan semua orang ikut menjerit.',
    'Matahari merangkak naik di atas bukit. Hari yang indah untuk mengkhianati teman.',
    'Pagi hari. Kopinya dingin, mayatnya lebih dingin lagi.',
    'Fajar pecah seperti janji murahan. Desa bergoncang, melotot dan penuh curiga.',
  ],
}

const peacefulVariants: Record<string, string[]> = {
  en: [
    'A quiet night. Too quiet. The wolves held their breath, or someone blocked them.',
    'Nobody died. The werewolves must have argued about who to eat.',
    'Peaceful. Suspiciously peaceful. Someone survived the night.',
    'The village wakes up intact. Miraculously, nobody is missing. Yet.',
  ],
  id: [
    'Malam yang sunyi. Terlalu sunyi. Serigala menahan napas, atau ada yang menghalangi.',
    'Tak ada yang mati. Werewolf pasti berdebat tentang siapa yang dimakan.',
    'Tenang. Mencurigakan tenangnya. Ada yang selamat malam ini.',
    'Desa terbangun utuh. Ajaibnya, tak ada yang hilang. Untuk sekarang.',
  ],
}

const nightDeathVariants: Record<string, string[]> = {
  en: [
    ':name did not survive the night.',
    'The wolves found :name. They were thorough.',
    'Somewhere in the dark, :name was not so lucky.',
    'A scream. Then silence. :name is gone.',
  ],
  id: [
    ':name tidak selamat malam ini.',
    'Serigala menemukan :name. Mereka teliti.',
    'Di suatu tempat dalam kegelapan, :name tidak seberuntung itu.',
    'Jeritan. Lalu sunyi. :name telah pergi.',
  ],
}

const nightDeathRoleVariants: Record<string, string[]> = {
  en: [
    ':name (:role) is dead. The village just lost someone important.',
    'The wolves got :name. Their role was: :role.',
    ':name, the :role, has fallen. The night was cruel.',
    'Morning reveals :name dead. The villagers whisper: they were a :role.',
  ],
  id: [
    ':name (:role) mati. Desa baru saja kehilangan seseorang yang penting.',
    'Serigala mendapat :name. Perannya: :role.',
    ':name, sang :role, telah gugur. Malam ini kejam.',
    'Pagi menunjukkan :name tewas. Warga berbisik: dia seorang :role.',
  ],
}

const multiDeathVariants: Record<string, string[]> = {
  en: [
    ':names. The wolves were busy tonight.',
    'Multiple bodies. :names did not wake up.',
    'It was a massacre. :names all fell to the darkness.',
    'The village mourns. :names are gone.',
  ],
  id: [
    ':names. Serigala sibuk malam ini.',
    'Banyak mayat. :names tidak terbangun.',
    'Ini pembantaian. :names semua jatuh ke kegelapan.',
    'Desa berkabung. :names telah pergi.',
  ],
}

const execVariants: Record<string, string[]> = {
  en: [
    'The village turns on :name. The ropes are ready.',
    'Fingers point, voices rise. :name is chosen.',
    'The mob speaks: :name must go.',
    'Justice or paranoia? :name is dragged to the square.',
  ],
  id: [
    'Desa berbalik pada :name. Tali sudah siap.',
    'Jari menuduh, suara meninggi. :name terpilih.',
    'Massa berteriak: :name harus pergi.',
    'Keadilan atau paranoia? :name diseret ke lapangan.',
  ],
}

const execRoleVariants: Record<string, string[]> = {
  en: [
    ':name (:role) is executed. The village gasps.',
    'The rope falls. :name, a :role, swings.',
    'After the dust settles: :name was a :role.',
    'The village celebrates or regrets. :name, the :role, is gone.',
  ],
  id: [
    ':name (:role) dieksekusi. Desa terkesiap.',
    'Tali jatuh. :name, seorang :role, tergantung.',
    'Setelah debu mereda: :name adalah seorang :role.',
    'Desa merayakan atau menyesal. :name, sang :role, telah pergi.',
  ],
}

const discussionVariants: Record<string, string[]> = {
  en: [
    'The village argues. The wolves hide. The clock ticks.',
    'Talk. Point. Suspect. Repeat. Who survives today?',
    'Accusations fly. Alibis crumble. The village deliberates.',
    'Every word a weapon. Every glance a clue. Discuss.',
  ],
  id: [
    'Desa berdebat. Serigala bersembunyi. Jam berdetak.',
    'Bicara. Tuduh. Curiga. Ulangi. Siapa yang selamat hari ini?',
    'Tuduhan berterbangan. Alibi runtuh. Desa bermusyawarah.',
    'Setiap kata senjata. Setiap tatapan petunjuk. Berdiskusi.',
  ],
}

const winVillageVariants: Record<string, string[]> = {
  en: [
    'The wolves are dead. The village survives. Barely.',
    'Victory for the village. The sun sets on a safer tomorrow.',
    'The pack is broken. The villagers can sleep again. Maybe.',
  ],
  id: [
    'Serigala telah mati. Desa selamat. Hampir saja.',
    'Kemenangan untuk desa. Matahari terbenam untuk esok yang lebih aman.',
    'Kawanan hancur. Warga bisa tidur lagi. Mungkin.',
  ],
}

const winWerewolfVariants: Record<string, string[]> = {
  en: [
    'The wolves outnumber the village. It is over.',
    'Darkness wins. The pack howls in triumph.',
    'The village falls. The wolves rule now.',
  ],
  id: [
    'Serigala outnumber desa. Tamat.',
    'Kegelapan menang. Kawanan melolong triumphant.',
    'Desa jatuh. Serigala berkuasa sekarang.',
  ],
}

const winTannerVariants: Record<string, string[]> = {
  en: [
    'The Tanner wins. They wanted this all along.',
    'Tricked the village into lynching the Tanner. Game over.',
    'The Tanner laughs from the gallows. They got exactly what they wanted.',
  ],
  id: [
    'Tanner menang. Memang ini yang dia mau dari awal.',
    'Menipu desa hingga menggantung Tanner. Permainan selesai.',
    'Tanner tertawa dari tiang gantungan. Dia dapat persis yang dia mau.',
  ],
}

function pick(variants: string[], seed: number): string {
  return variants[seed % variants.length]
}

export function renderNarration(data: NarrationData, locale: 'en' | 'id' = 'en'): string | null {
  if (!data.kind) return null

  switch (data.kind) {
    case 'night': {
      if (!data.dead || data.dead.length === 0) {
        return pick(peacefulVariants[locale], data.seed)
      }
      if (data.dead.length === 1) {
        const d = data.dead[0]
        const template = d.roleEn
          ? pick(nightDeathRoleVariants[locale], data.seed)
          : pick(nightDeathVariants[locale], data.seed)
        return template
          .replace(':name', d.name)
          .replace(':role', d.roleEn)
      }
      const names = data.dead.map(d => d.name).join(', ')
      return pick(multiDeathVariants[locale], data.seed).replace(':names', names)
    }
    case 'execution': {
      if (!data.dead || data.dead.length === 0) return null
      const d = data.dead[0]
      const template = d.roleEn
        ? pick(execRoleVariants[locale], data.seed)
        : pick(execVariants[locale], data.seed)
      return template
        .replace(':name', d.name)
        .replace(':role', d.roleEn)
    }
    case 'game_over': {
      switch (data.winner) {
        case 'village':
          return pick(winVillageVariants[locale], data.seed)
        case 'werewolf':
          return pick(winWerewolfVariants[locale], data.seed)
        case 'tanner':
          return pick(winTannerVariants[locale], data.seed)
        default:
          return null
      }
    }
    default:
      return null
  }
}

export function pickNarrationVariant(key: string, seed: number, locale: 'en' | 'id'): string | null {
  const map: Record<string, Record<string, string[]>> = {
    dawn: dawnVariants,
    discussion: discussionVariants,
  }
  const variants = map[key]?.[locale]
  if (!variants) return null
  return pick(variants, seed)
}
