const WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua']

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

export const loremSentence = () => {
  const words = Array.from({ length: randomInt(4, 9) }, () => WORDS[randomInt(0, WORDS.length - 1)]).join(' ')
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}.`
}
