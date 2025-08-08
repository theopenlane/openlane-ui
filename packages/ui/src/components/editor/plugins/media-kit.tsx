'use client'

import { CaptionPlugin } from '@platejs/caption/react'
import { AudioPlugin, FilePlugin, ImagePlugin, MediaEmbedPlugin, PlaceholderPlugin, VideoPlugin } from '@platejs/media/react'
import { KEYS } from 'platejs'

import { AudioElement } from '@repo/ui/components/ui/media-audio-node.tsx'
import { MediaEmbedElement } from '@repo/ui/components/ui/media-embed-node.tsx'
import { FileElement } from '@repo/ui/components/ui/media-file-node.tsx'
import { ImageElement } from '@repo/ui/components/ui/media-image-node.tsx'
import { PlaceholderElement } from '@repo/ui/components/ui/media-placeholder-node.tsx'
import { MediaPreviewDialog } from '@repo/ui/components/ui/media-preview-dialog.tsx'
import { MediaUploadToast } from '@repo/ui/components/ui/media-upload-toast.tsx'
import { VideoElement } from '@repo/ui/components/ui/media-video-node.tsx'

export const MediaKit = [
  ImagePlugin.configure({
    options: { disableUploadInsert: true },
    render: { afterEditable: MediaPreviewDialog, node: ImageElement },
  }),
  MediaEmbedPlugin.withComponent(MediaEmbedElement),
  VideoPlugin.withComponent(VideoElement),
  AudioPlugin.withComponent(AudioElement),
  FilePlugin.withComponent(FileElement),
  PlaceholderPlugin.configure({
    options: { disableEmptyPlaceholder: true },
    render: { afterEditable: MediaUploadToast, node: PlaceholderElement },
  }),
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
]
