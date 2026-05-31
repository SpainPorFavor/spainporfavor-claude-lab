# Portal Cockpit Redesign Spec (from user pasted_content_7.txt)

## Summary
Full redesign of /portal into a route-specific Application Cockpit.

## Key Requirements
1. Route-specific document checklists (EU Registration vs DNV vs Generic)
2. No route-mismatched documents
3. Privacy acknowledgement: one-time, required checkbox + optional AI checkbox
4. Next-best-action card (dynamic based on priority: rejected > required missing > incomplete > optional)
5. Progress summary: approved / under review / missing / needs action
6. Document cards with tags, status badges, expand/collapse
7. Upload modal per document type
8. Mobile sticky CTA
9. Error states
10. Ask Laura contextual support

## Already Implemented
- portalCockpitConfig.ts: route configs for DNV, EU Reg, Generic
- documentChecklists.ts: backend slot templates per visa type
- portalRouter.ts: acknowledgePrivacy, uploadDocument, getMyCase, claimCase
- DocumentUploadModal.tsx: reusable upload modal (needs customization)

## This is Phase 2 work - first fix the immediate post-payment flow
