import type { ThemeKey } from 'claude-code'
import type { Role } from '../hooks/vendor/lovely-mermaid.js'

export const ROLE_STYLE: Record<Role, { color?: ThemeKey; bold?: true }> = {
  border: { color: 'subtle' },
  text: { color: 'text' },
  edge: { color: 'suggestion' },
  edgeLabel: { color: 'inactive' },
  title: { color: 'suggestion', bold: true },
  none: {},
}

export const WARNING_COLOR: ThemeKey = 'warning'
