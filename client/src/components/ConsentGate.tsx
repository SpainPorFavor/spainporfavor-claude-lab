/**
 * ConsentGate — blocks document upload until required GDPR consents are granted.
 * Shows a modal with consent texts and checkboxes.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, FileCheck, Users, ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface ConsentGateProps {
  caseId: number;
  onConsented: () => void;
}

const CONSENT_ICONS: Record<string, React.ReactNode> = {
  data_processing: <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />,
  ai_validation: <FileCheck className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />,
  third_party_sharing: <Users className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />,
};

const CONSENT_TITLES: Record<string, string> = {
  data_processing: "Document Processing",
  ai_validation: "AI-Powered Validation",
  third_party_sharing: "Gestor Access",
};

export function ConsentGate({ caseId, onConsented }: ConsentGateProps) {
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const { data: consentTexts, isLoading: textsLoading } = trpc.consent.getConsentTexts.useQuery();
  const grantAll = trpc.consent.grantAllRequired.useMutation();

  const allAccepted = consentTexts?.required.every((c) => accepted[c.type]) ?? false;

  const handleSubmit = async () => {
    if (!allAccepted) return;
    setSubmitting(true);
    try {
      await grantAll.mutateAsync({ caseId });
      onConsented();
    } catch (err) {
      console.error("Failed to grant consent:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (textsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-[#1A2332]">Before You Upload Documents</h2>
        <p className="text-gray-600 mt-2 text-sm">
          We take your privacy seriously. Please review and accept the following to proceed with document uploads.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {consentTexts?.required.map((consent) => (
          <div
            key={consent.type}
            className={`border rounded-lg p-4 transition-colors ${
              accepted[consent.type] ? "border-green-200 bg-green-50/30" : "border-gray-200"
            }`}
          >
            <div className="flex gap-3">
              {CONSENT_ICONS[consent.type]}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    id={consent.type}
                    checked={accepted[consent.type] || false}
                    onCheckedChange={(checked) =>
                      setAccepted((prev) => ({ ...prev, [consent.type]: checked === true }))
                    }
                  />
                  <label
                    htmlFor={consent.type}
                    className="font-medium text-[#1A2332] cursor-pointer text-sm"
                  >
                    {CONSENT_TITLES[consent.type] || consent.type}
                  </label>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed ml-6">{consent.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Link href="/privacy" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          <ExternalLink className="w-3 h-3" />
          Full Privacy Policy
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={!allAccepted || submitting}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          {submitting ? "Saving..." : "I Agree — Continue"}
        </Button>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        You can revoke these consents at any time from your portal settings.
      </p>
    </div>
  );
}
