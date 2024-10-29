import type { Config } from "tailwindcss"
import sharedConfig from "@repo/tailwind-config"

const config = {
  content: [
    "./src/stories/**/*.{ts,tsx,mdx}",
    "../../packages/ui/components/**/*.{ts,tsx}",
  ],
  presets: [sharedConfig],
} satisfies Config

export default config
