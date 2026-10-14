import { color } from './tokens/shared'

/**
 * Accent colour of a ticket, by position (role id): outline and ticks, the
 * strip, the role name and the age badge. Colours are oklch throughout.
 * Tickets without a role (cinema, break) and roles not listed here are black.
 */
export const ROLE_TONES: Record<string, string> = {
  admin: 'oklch(0.4887 0.0598 165.68)', // Admin  · 3D6B58
  'ticket-seller': 'oklch(0.6117 0.1534 16.34)', // Piletimüüja  · CF5663
  checker: 'oklch(0.6951 0.0959 229.97)', // Kontrollija  · 57A8CD
  viewer: 'oklch(0.6653 0.1189 250.7)', // Vaataja  · 5898DA
  'black-carpet': 'oklch(0.5761 0 0)', // Black Carpet  · 797979
  projectionist: 'oklch(0 0 0)', // Projektsionist  · 000000
  'screening-manager': 'oklch(0.6826 0.121 175.16)', // Seansikorraldaja  · 24B195
  gate: 'oklch(0.4725 0.0815 223.47)', // Värav  · 15657D
  'gate-admin': 'oklch(0.3756 0.0673 220.52)', // Väravaadmin  · 03495A
}

export const toneOf = (roleId: string | undefined): string => (roleId !== undefined && Object.hasOwn(ROLE_TONES, roleId) ? ROLE_TONES[roleId] : color.ink)
