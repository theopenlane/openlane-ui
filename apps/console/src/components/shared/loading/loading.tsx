import { loadingStyles } from './loading.styles'

export const Loading = () => {
  const { loader } = loadingStyles()
  return <section className={loader()} />
}
