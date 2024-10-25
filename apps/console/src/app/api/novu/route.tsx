import { NextResponse } from 'next/server'
import { Novu } from '@novu/node'
import { auth } from '@/lib/auth/auth'

const novu = new Novu(process.env.NOVU_API_KEY!)

export async function GET() {
  const session = await auth()
  const name = session?.user.name.split(' ')

  const subscriber = await novu.subscribers.identify(session?.user.userId, {
    email: session?.user.email,
    firstName: name[0],
    lastName: name[1],
  })

  const response = await novu.trigger('subscriber-added', {
    to: [
      {
        subscriberId: subscriber.data.subscriberId,
      },
    ],
    payload: {},
  })

  return NextResponse.json(response.data)
}
