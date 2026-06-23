export type Faction = 'village' | 'werewolf' | 'neutral'

export type RoomStatus = 'lobby' | 'assigning' | 'playing' | 'over'
export type Phase = 'day' | 'night'
export type PlayerStatus = 'alive' | 'dead'
export type ActionType = 'none' | 'kill' | 'protect' | 'investigate' | 'custom'

export interface Role {
  id: number
  roleKey: string
  nameEn: string
  nameId: string
  faction: Faction
  descriptionEn: string | null
  descriptionId: string | null
  actionType: ActionType
  actsAtNight: boolean
  cardImage: string | null
  isActive: boolean
  sortOrder: number
}

export interface Room {
  id: number
  code: string
  hostUserId: string | null
  status: RoomStatus
  phase: Phase
  dayNumber: number
  locale: string
  settings: RoomSettings
  votingOpen: boolean
  stateVersion: number
  winner: 'village' | 'werewolf' | 'tanner' | null
  createdAt: string
  updatedAt: string
}

export interface RoomSettings {
  narr?: NarrationData
  resolvedDay?: number
  nightResolved?: boolean
  doctorUsed?: boolean
  witchHealUsed?: boolean
  witchPoisonUsed?: boolean
  lovers?: [number, number] | null
}

export interface NarrationData {
  kind: 'night' | 'execution' | 'game_over'
  seed: number
  dead?: Array<{ name: string; roleEn: string; roleId: number }>
  winner?: 'village' | 'werewolf' | 'tanner' | null
}

export interface RoomPlayer {
  id: number
  roomId: number
  userId: string | null
  guestToken: string | null
  displayName: string
  seatNo: number | null
  roleId: number | null
  isAlive: boolean
  isProtected: boolean
  markedForDeath: boolean
  revealed: boolean
  votedForId: number | null
  createdAt: string
  updatedAt: string
  role?: Role | null
}

export interface RoomRole {
  roomId: number
  roleId: number
  qty: number
}

export interface SerializedPlayer {
  id: number
  displayName: string
  seatNo: number | null
  status: PlayerStatus
  isSelf: boolean
  isTableView?: boolean
  role?: {
    name: string
    nameEn: string
    faction: string
    team: string
    cardImage: string
    descriptionEn: string | null
    descriptionId: string | null
    actsNight: boolean
  } | null
  votes: number
  myVote: boolean
  markedKill?: boolean
  markedProtect?: boolean
  isAlive: boolean
}

export interface SerializedRoomRole {
  id: number
  name: string
  count: number
  description: string
  faction: string
}

export interface NightTools {
  doctorUsed: boolean
  witchHealUsed: boolean
  witchPoisonUsed: boolean
  lovers: [number, number] | null
  hasDoctorAlive: boolean
  hasWitchAlive: boolean
  hasCupidAlive: boolean
  doctorLastSave: number | null
}

export interface SerializedRoom {
  id: number
  code: string
  status: RoomStatus
  phase: Phase
  dayNumber: number
  locale: string
  isHost: boolean
  selfPlayerId: number | null
  isTableView: boolean
  settings: {
    nightResolved: boolean
    votingOpen: boolean
    narration: string | null
  }
  players: SerializedPlayer[]
  roles: SerializedRoomRole[] | null
  winner?: 'village' | 'werewolf' | 'tanner' | null
  stateVersion: number
  playerCount: number
  aliveCount: number
  nightTools: NightTools | null
}

export interface ApiResponse<T> {
  ok: boolean
  data: T
  error?: string
}
