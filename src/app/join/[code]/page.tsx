import { JoinForm } from './JoinForm'

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const roomCode = code.toUpperCase()
  return {
    title: `Join ${roomCode} — WE'RE WOLF`,
    description: `You've been invited to play Werewolf. Enter your name to join room ${roomCode}. No account needed.`,
    openGraph: {
      title: `Join ${roomCode} — WE'RE WOLF`,
      description: `Join room ${roomCode} — no account needed.`,
    },
  }
}

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return <JoinForm code={code.toUpperCase()} />
}
