/**
 * Analytics tracking utility for SpainPorFavor funnel events.
 * Uses gtag if available, otherwise logs to console in development.
 * Can be connected to any analytics backend later.
 */

type TrackingEvent =
  | "payment_success_page_viewed"
  | "case_activation_cta_clicked"
  | "step_3_upload_clicked"
  | "upload_modal_opened"
  | "first_document_upload_started"
  | "first_document_uploaded"
  | "portal_opened"
  | "kickoff_call_clicked"
  | "kickoff_call_booked"
  | "portal_link_resend_clicked"
  | "receipt_download_clicked"
  | "sms_whatsapp_optin_checked"
  | "addon_section_viewed"
  | "addon_card_clicked"
  | "support_clicked"
  | "sticky_cta_clicked"
  | "success_page_error_state_viewed";

export function trackEvent(event: TrackingEvent, params?: Record<string, string | number | boolean>) {
  // Google Analytics / gtag
  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("event", event, params);
  }

  // Development logging
  if (import.meta.env.DEV) {
    console.log(`[Track] ${event}`, params || "");
  }
}
