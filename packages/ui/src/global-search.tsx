'use client'

import Image from 'next/image'
import SimpleForm from './simple-form'
import searchIcon from './assets/search-outline-white.svg'

export const GlobalSearch = () => {
  return (
    <SimpleForm
      classNames="relative flex items-center ml-auto mr-11"
      action="#"
      method="GET"
      onSubmit={(e: any) => console.log(e)}
    >
      <label htmlFor="search-field" className="sr-only">
        Search
      </label>
      <div className="!flex !items-center !w-56 !px-4 !py-2 !border !rounded !border-white">
        <Image
          alt="search icon"
          src={searchIcon}
          className="!w-5 !h-5 !mr-2.5"
        />
        <input
          id="search-field"
          className="!block !h-full !w-full !border-0 !py-0 !pl-0 !pr-0 placeholder:!text-white
					focus:!border-0 focus:!ring-0 !text-sm !bg-transparent !text-white !rounded border-[#D5D1DC]"
          placeholder="Global search"
          type="search"
          name="search"
        />
      </div>
    </SimpleForm>
  )
}

export default GlobalSearch
