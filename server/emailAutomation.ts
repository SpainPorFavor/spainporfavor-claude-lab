/**
 * Email Automation Kill Switch
 *
 * When the env var EMAIL_AUTOMATION_PAUSED equals "true", the two scheduled
 * email jobs skip sending entirely:
 *   - Lead drip scan (leadDripEmails.ts — Day 1/3/7 nurture emails)
 *   - Proactive outreach scanners (proactiveOutreach.ts — expiry warnings,
 *     inactivity nudges, milestone celebrations)
 *
 * One-off transactional emails (welcome, document revision, password reset)
 * do NOT check this flag and keep working.
 *
 * The flag is read at call time (not at boot) so each scheduled run picks up
 * the current value.
 */
export function isEmailAutomationPaused(): boolean {
  return process.env.EMAIL_AUTOMATION_PAUSED === "true";
}
