import { redirect } from 'next/navigation'
import { savedReportHref } from '@/lib/report/saved-report'

type TPageProps = {
  params: Promise<{ id: string }>
}

const Page = async ({ params }: TPageProps) => {
  const { id } = await params

  redirect(savedReportHref(id))
}

export default Page
