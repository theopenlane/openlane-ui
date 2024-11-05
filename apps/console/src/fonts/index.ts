import localFont from 'next/font/local'

export const outfit = localFont({
  src: [
    {
      path: './Outfit-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '/Outfit-Medium.ttf',
      weight: '500',
      style: 'medium',
    },
    {
      path: '/Outfit-SemiBold.ttf',
      weight: '700',
      style: 'bold',
    },
    {
      path: '/Outfit-ExtraBold.ttf',
      weight: '800',
      style: 'extrabold',
    },
  ],
  variable: '--font-outfit',
})

export const mincho = localFont({
  src: [
    {
      path: './BIZUDPMincho-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './BIZUDPMincho-Bold.ttf',
      weight: '500',
      style: 'medium',
    },
  ],
  variable: '--font-mincho',
})

export const jetBrainsMono = localFont({
  src: [
    {
      path: './JetBrainsMono-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './JetBrainsMono-Medium.ttf',
      weight: '500',
      style: 'medium',
    },
    {
      path: './JetBrainsMono-Bold.ttf',
      weight: '700',
      style: 'bold',
    },
  ],
  variable: '--font-mono',
})
