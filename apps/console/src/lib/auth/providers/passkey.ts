// import { User } from 'next-auth'
// import Credentials from 'next-auth/providers/credentials'

// // Passkey credentials provider
// export const passKeyProvider = Credentials({
//   id: 'passkey',
//   name: 'passkey',
//   credentials: {
//     accessToken: {},
//     refreshToken: {},
//     email: {},
//     name: {},
//     session: {},
//   },
//   async authorize({ accessToken, refreshToken, email, name, session }): Promise<User | null> {
//     return {
//       id: email as string,
//       name: name as string,
//       email: email as string,
//       accessToken: accessToken as string,
//       refreshToken: refreshToken as string,
//       session: session as string,
//       isTfaEnabled: isTfaEnabled as boolean
//     }
//   },
// })
