import { useEffect, useState } from 'react'
import { onConnectionChanged, readConnection, readDisconnectReason, type TConnection } from '../../lib/connection'

type TConnectionState = { status: 'loading' } | { status: 'disconnected'; notice?: string } | { status: 'connected'; connection: TConnection }

const readConnectionState = async (): Promise<TConnectionState> => {
  const connection = await readConnection()
  return connection ? { status: 'connected', connection } : { status: 'disconnected', notice: await readDisconnectReason() }
}

export const useConnection = () => {
  const [state, setState] = useState<TConnectionState>({ status: 'loading' })

  useEffect(() => {
    let latestRead = 0
    const refresh = () => {
      const read = ++latestRead
      readConnectionState().then(
        (next) => read === latestRead && setState(next),
        () => read === latestRead && setState({ status: 'disconnected', notice: 'The saved Openlane connection could not be read.' }),
      )
    }
    refresh()
    return onConnectionChanged(refresh)
  }, [])

  return state
}
