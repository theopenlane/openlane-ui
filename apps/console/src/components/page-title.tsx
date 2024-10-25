interface PageTitleProps {
  title: string | React.ReactNode
  description?: string | React.ReactNode
  centered?: boolean
}

const PageTitle = ({
  title,
  description,
  centered = false,
}: PageTitleProps) => {
  return (
    <div className={centered ? 'text-center' : undefined}>
      <h4>{title}</h4>
      {description ? (
        <p className="text-2xl mt-4 leading-5 font-thin font-sans">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export default PageTitle
