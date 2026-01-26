'use client'

import { Button } from '@repo/ui/button'
import { FileTextIcon, X, Eye } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { GITHUB_API_BASE, POLICY_DIRECTORIES, POLICY_HUB_REPO_URL, POLICY_REPO } from '@/constants/templates'
import { formatFileName } from './naming'
import Link from 'next/link'
import { CancelButton } from '../cancel-button.tsx/cancel-button'

type GitHubItem = {
  name: string
  path: string
  type: 'file' | 'dir'
  download_url?: string
  size?: number
}

type PolicyTemplateBrowserProps = {
  isOpen: boolean
  onClose: () => void
  onFileSelect: (file: TUploadedFile) => void
}

export const PolicyTemplateBrowser = ({ isOpen, onClose, onFileSelect }: PolicyTemplateBrowserProps) => {
  const [items, setItems] = useState<GitHubItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Preview state
  const [previewItem, setPreviewItem] = useState<GitHubItem | null>(null)
  const [previewContent, setPreviewContent] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchAllTemplates()
    }
  }, [isOpen])

  const fetchAllTemplates = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch all files from all policy directories in parallel
      const allFiles: GitHubItem[] = []
      await Promise.all(
        POLICY_DIRECTORIES.map(async (dir) => {
          const response = await fetch(`${GITHUB_API_BASE}/${POLICY_REPO}/contents/${dir.path}?ref=feat-dongatotemplates`)
          if (!response.ok) {
            // just log the error and continue
            console.error('Failed to fetch templates from GitHub:', response.statusText)
            return
          }
          const data: GitHubItem[] = await response.json()
          // Only add files, not directories
          allFiles.push(...data.filter((item) => item.type === 'file'))
        }),
      )
      // Sort alphabetically
      allFiles.sort((a, b) => a.name.localeCompare(b.name))
      setItems(allFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async (item: GitHubItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!item.download_url) return

    setPreviewItem(item)
    setLoadingPreview(true)

    try {
      const response = await fetch(item.download_url)
      const content = await response.text()
      setPreviewContent(content.slice(0, 1000) + (content.length > 1000 ? '...' : ''))
    } catch (err) {
      console.error('Failed to load preview:', err)
      setPreviewContent('Failed to load preview')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleFileSelect = async (item: GitHubItem) => {
    if (!item.download_url) return

    setLoading(true)
    try {
      const response = await fetch(item.download_url)
      const blob = await response.blob()

      const file = new File([blob], item.name, {
        type: blob.type || 'text/markdown',
      })

      const uploadedFile: TUploadedFile = {
        file,
        name: item.name,
        size: item.size || blob.size,
        type: 'link',
      }

      onClose()
      onFileSelect(uploadedFile)
    } catch (err) {
      console.error('Failed to download file:', err)
      setError('Failed to download file')
    } finally {
      setLoading(false)
    }
  }

  // Filter items by search (case-insensitive substring match)
  const filteredItems = items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-secondary rounded-xl border shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold">Browse Policy Templates</h3>
            <p className="text-sm mt-1">
              Select a template to import or browse our template repo on{' '}
              <Link href={POLICY_HUB_REPO_URL} target="_blank" className="ml-1 text-(--color-info) underline underline-offset-4 hover:opacity-80">
                GitHub
              </Link>
            </p>
          </div>
          <Button type="button" variant="icon" onClick={onClose} className="text-gray-400 hover:text-gray-300 transition-colors">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search Box */}
        <div className="px-6 pt-4 pb-2 border-b">
          <input
            type="text"
            placeholder="Search templates by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded border bg-gray-100 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-primary-500 transition"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          )}

          {error && <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">{error}</div>}

          {!loading && !error && filteredItems.length === 0 && <div className="text-center py-12">No templates found</div>}

          {!loading && !error && filteredItems.length > 0 && (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div key={item.path} className="w-full rounded-lg bg-gray-200/20 hover:bg-gray-300/40 dark:bg-gray-700/20 dark:hover:bg-gray-700/40 group transition-colors">
                  <div className="w-full flex items-center gap-4 p-3">
                    <button type="button" onClick={() => handleFileSelect(item)} className="flex items-center gap-4 flex-1">
                      <FileTextIcon className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-left">{formatFileName(item.name)}</span>
                    </button>
                    <Button
                      type="button"
                      variant="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePreview(item, e)
                      }}
                      className="p-1.5 rounded transition-colors"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2">
          <CancelButton onClick={onClose} className="w-full"></CancelButton>
        </div>
      </div>

      {/* Preview Modal */}
      {previewItem &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-60 p-4">
            <div className="bg-secondary rounded-xl border shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
              {/* Preview Header */}
              <div className="flex items-center justify-between px-8 py-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold">{formatFileName(previewItem.name)}</h3>
                  <p className="text-sm opacity-70 mt-1">Preview</p>
                </div>
                <button type="button" onClick={() => setPreviewItem(null)} className="transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingPreview ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : (
                  <pre className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-300/50 dark:bg-gray-900/50 p-4 rounded-lg">{previewContent}</pre>
                )}
              </div>

              {/* Preview Footer */}
              <div className="p-2 flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setPreviewItem(null)} className="flex-1">
                  Close
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={async () => {
                    setPreviewItem(null)
                    await handleFileSelect(previewItem)
                  }}
                  className="flex-1"
                >
                  Use This Template
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>,
    document.body,
  )
}
