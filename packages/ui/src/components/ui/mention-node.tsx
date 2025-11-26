'use client'

import * as React from 'react'

import type { TComboboxInputElement, TMentionElement } from 'platejs'
import type { PlateElementProps } from 'platejs/react'

import { getMentionOnSelectItem } from '@platejs/mention'
import { IS_APPLE, KEYS } from 'platejs'
import { PlateElement, useFocused, useReadOnly, useSelected } from 'platejs/react'

import { cn } from '@repo/ui/lib/utils'

import { InlineCombobox, InlineComboboxContent, InlineComboboxEmpty, InlineComboboxGroup, InlineComboboxInput, InlineComboboxItem } from './inline-combobox'
import { useMounted } from '../../../hooks/use-mounted.ts'
import { useGetSingleOrganizationMembers } from 'console/src/lib/graphql-hooks/organization.ts'
import { useSession } from 'next-auth/react'

export function MentionElement(
  props: PlateElementProps<TMentionElement> & {
    prefix?: string
  },
) {
  const element = props.element

  const selected = useSelected()
  const focused = useFocused()
  const mounted = useMounted()
  const readOnly = useReadOnly()

  return (
    <PlateElement
      {...props}
      className={cn(
        'inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm font-medium',
        !readOnly && 'cursor-pointer',
        selected && focused && 'ring-2 ring-ring',
        element.children[0][KEYS.bold] === true && 'font-bold',
        element.children[0][KEYS.italic] === true && 'italic',
        element.children[0][KEYS.underline] === true && 'underline',
      )}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        'data-slate-value': element.value,
        draggable: true,
      }}
    >
      {mounted && IS_APPLE ? (
        // Mac OS IME https://github.com/ianstormtaylor/slate/issues/3490
        <React.Fragment>
          {props.children}
          {props.prefix}
          {element.value}
        </React.Fragment>
      ) : (
        // Others like Android https://github.com/ianstormtaylor/slate/pull/5360
        <React.Fragment>
          {props.prefix}
          {element.value}
          {props.children}
        </React.Fragment>
      )}
    </PlateElement>
  )
}

const onSelectItem = getMentionOnSelectItem()

export function MentionInputElement(props: PlateElementProps<TComboboxInputElement>) {
  const { editor, element } = props
  const [search, setSearch] = React.useState('')
  const { data: session } = useSession()
  const activeOrgId = (session?.user as { activeOrganizationId?: string })?.activeOrganizationId
  const { data: membersData } = useGetSingleOrganizationMembers({ organizationId: activeOrgId })
  const members = membersData?.organization?.members?.edges?.map((item) => {
    return {
      key: item!.node!.id,
      text: item!.node!.user!.displayName,
    }
  })

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox value={search} element={element} setValue={setSearch} showTrigger={false} trigger="@">
        <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm ring-ring focus-within:ring-2">
          <InlineComboboxInput />
        </span>

        <InlineComboboxContent className="my-1.5">
          <InlineComboboxEmpty>No results</InlineComboboxEmpty>

          <InlineComboboxGroup>
            {(members || []).map((item) => (
              <InlineComboboxItem key={item.key} value={item.text} onClick={() => onSelectItem(editor, item, search)}>
                {item.text}
              </InlineComboboxItem>
            ))}
          </InlineComboboxGroup>
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  )
}
