/**
 * Maps raw backend role strings to human-readable display labels.
 * Use this everywhere a role needs to be shown in the UI.
 */
export const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  employee: 'Team Member',
  team_member: 'Team Member',
  intern: 'Intern',
  consultant: 'Consultant',
  reporting_manager: 'Reporting Manager',
};

/**
 * Returns the human-readable label for a given role string.
 * Falls back to the raw role value if not found.
 */
export function formatRole(role: string | undefined | null): string {
  if (!role) return '—';
  return ROLE_LABELS[role] ?? role;
}
