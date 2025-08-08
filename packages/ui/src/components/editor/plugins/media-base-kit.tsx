import { BaseCaptionPlugin } from '@platejs/caption'
import { BaseAudioPlugin, BaseFilePlugin, BaseImagePlugin, BaseMediaEmbedPlugin, BasePlaceholderPlugin, BaseVideoPlugin } from '@platejs/media'
import { KEYS } from 'platejs'

import { AudioElementStatic } from '@repo/ui/components/ui/media-audio-node-static.tsx'
import { FileElementStatic } from '@repo/ui/components/ui/media-file-node-static.tsx'
import { ImageElementStatic } from '@repo/ui/components/ui/media-image-node-static.tsx'
import { VideoElementStatic } from '@repo/ui/components/ui/media-video-node-static.tsx'

export const BaseMediaKit = [
  BaseImagePlugin.withComponent(ImageElementStatic),
  BaseVideoPlugin.withComponent(VideoElementStatic),
  BaseAudioPlugin.withComponent(AudioElementStatic),
  BaseFilePlugin.withComponent(FileElementStatic),
  BaseCaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
  BaseMediaEmbedPlugin,
  BasePlaceholderPlugin,
]
