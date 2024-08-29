import { restUrl } from '../index.ts'

export interface LoginUser {
  username: string
  password: string
}

export interface RegisterUser {
  username: string
  password: string
  confirmedPassword?: string
}

export async function registerUser(arg: RegisterUser) {
  const fData = await fetch(`${restUrl}/v1/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg),
  })

  if (fData.ok) {
    return await fData.json()
  }

  if (!fData.ok) {
    return {
      message: await fData.text(),
    }
  }
}

export async function verifyUser(token: string) {
  const fData = await fetch(`${restUrl}/v1/verify?${token}`)

  if (fData.ok) {
    return await fData.json()
  }

  if (!fData.ok) {
    return {
      message: await fData.text(),
    }
  }
}
