/**
 * PÖFF positions and their colours. The hex codes are the ones used on the
 * shift tickets; here they are converted to oklch (the only colour notation
 * in this project). Grace hours are dummy values.
 */
import type { ScheduleDto } from './dto';

type TeamDto = ScheduleDto['teams'][number];

const position = (id: string, et: string, en: string, ru: string, color: string, graceHours: number): TeamDto => ({
  id,
  names: { et, en, ru },
  color,
  graceHours,
});

export const POSITIONS: Record<string, TeamDto> = {
  admin: position('admin', 'Admin', 'Admin', 'Админ', 'oklch(0.489 0.06 165.7)', 48), // hex 3D6B58
  ticket: position('ticket', 'Piletimüüja', 'Ticket seller', 'Продавец билетов', 'oklch(0.612 0.153 16.3)', 24), // hex CF5663
  checker: position('checker', 'Kontrollija', 'Ticket checker', 'Контролёр', 'oklch(0.695 0.096 230)', 24), // hex 57A8CD
  viewer: position('viewer', 'Vaataja', 'Viewer', 'Зритель', 'oklch(0.665 0.119 250.7)', 12), // hex 5898DA
  carpet: position('carpet', 'Black Carpet', 'Black Carpet', 'Black Carpet', 'oklch(0.576 0 89.9)', 36), // hex 797979
  projectionist: position('projectionist', 'Projektsionist', 'Projectionist', 'Киномеханик', 'oklch(0 0 0)', 72), // hex 000000
  screening: position('screening', 'Seansikorraldaja', 'Screening host', 'Организатор сеанса', 'oklch(0.683 0.121 175.2)', 36), // hex 24B195
  gate: position('gate', 'Värav', 'Gate', 'Ворота', 'oklch(0.472 0.081 223.5)', 24), // hex 15657D
  gateAdmin: position('gateAdmin', 'Väravaadmin', 'Gate admin', 'Админ ворот', 'oklch(0.376 0.067 220.5)', 48), // hex 03495A
};
