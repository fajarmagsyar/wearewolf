# WE'RE WOLF

<img src="https://raw.githubusercontent.com/fajarmagsyar/wearewolf/main/public/favicon.svg" width="80" alt="WE'RE WOLF icon" />

A Werewolf companion app. Yes, the name's a pun ha ha.

===

Built this on a sunday cause I was bored and remembered the last time i played Werewolf offline... it was a mess. Someone always peeks at cards they shouldn't, the narrator forgets who's dead, half the group argues about the rules. So I made this instead.

The host creates a room, everyone joins on their own phone, cards get dealt digitally, and the app handles the night/day cycle with narration. No physical cards needed, no one cheating by opening their eyes early.

## What it does

- Host creates a room, gets a shareable code
- Players join with the code + a display name (no account needed)
- Host deals roles, each player sees their own card on their device
- Night and day phases with narration
- Werewolf, Seer, Doctor, Tanner, the usual roles
- Vote to eliminate during day phase
- Works in Indonesian too (we needed it)

## Stack

- Next.js (App Router)
- Supabase (auth + realtime)
- Deployed on Vercel

## Run locally

```bash
npm install
npm run dev
```

You'll need a Supabase project and these env vars:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Then open [localhost:3000](http://localhost:3000).

===

Made out of spite so I don’t have to write everything down when i’m the narrator
