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
