import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Upload,
  Camera,
  FileText,
  Shield,
  Lock,
  ArrowLeft,
  ArrowRight,
  Circle,
  HelpCircle,
  RotateCcw,
  X,
  Check,
  Plus,
  Trash2,
  MessageCircle,
  ExternalLink,
  Download,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSearch } from "wouter";
import {
  DOCUMENT_REQUIREMENTS,
  getDocumentCopy,
  getJourneySteps,
  getStickyCTAText,
  isIdentityDocumentType,
  resolveProductType,
  resolveDocumentType,
  type ProductType,
  type DocumentType,
  type DocumentRequirement,
  type RouteDocumentCopy,
} from "./documentRequirementConfig";
import { getIntakeRouteConfig, type DocumentTypeOption, type IntakeRouteConfig } from "./documentIntakeConfig";

// ── Constants ──
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp"];

// ── Analytics stub ──
function track(event: string, params?: Record<string, string | number | boolean>) {
  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("event", event, params);
  }
  if (import.meta.env.DEV) {
    console.log(`[Track] ${event}`, params || "");
  }
}

// ── Flow states ──
type FlowState =
  | "select_type"
  | "capture"
  | "capture_back" // EU ID back side
  | "preview"
  | "preview_back"
  | "uploading"
  | "success";

// ── File item for multi-file support ──
interface FileItem {
  id: string;
  file: File;
  previewUrl: string | null;
  side?: "front" | "back";
}

export default function DocumentIntake() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const caseIdParam = params.get("case");
  const productParam = params.get("product");
  const sessionIdParam = params.get("session_id");
  const preselectedDocType = params.get("doc_type");
  const { user, loading: authLoading } = useAuth();

  // ── PUBLIC PATH: Fetch case data by session_id (no auth needed) ──
  const { data: sessionCaseData, isLoading: sessionCaseLoading } = trpc.checkout.getCaseBySession.useQuery(
    { sessionId: sessionIdParam || "" },
    { enabled: !!sessionIdParam, retry: 2, staleTime: 30_000 }
  );

  // ── PUBLIC PATH: Fetch document slots by session_id ──
  const { data: sessionSlotData, isLoading: sessionSlotLoading, refetch: refetchSessionSlots } = trpc.checkout.getSlotsBySession.useQuery(
    { sessionId: sessionIdParam || "" },
    { enabled: !!sessionIdParam && !!sessionCaseData, retry: 2, staleTime: 30_000 }
  );

  // ── AUTHENTICATED PATH: Fetch case data by user (fallback when no session_id) ──
  const { data: authCaseData, isLoading: authCaseLoading, refetch: refetchCase } = trpc.portal.getMyCase.useQuery(
    undefined,
    { enabled: !!user && !sessionIdParam, retry: 2, staleTime: 30_000 }
  );

  // ── Auto-claim case if user is logged in but case not linked (auth path only) ──
  const claimMutation = trpc.portal.claimCase.useMutation({
    onSuccess: () => { refetchCase(); },
  });

  useEffect(() => {
    if (!sessionIdParam && user && !authCaseData && !authCaseLoading && user.email && !claimMutation.isPending && !claimMutation.isSuccess) {
      if (!claimMutation.isError) {
        claimMutation.mutate({ email: user.email });
      }
    }
  }, [user, authCaseData, authCaseLoading, sessionIdParam]);

  useEffect(() => {
    if (claimMutation.isError && !authCaseData) { refetchCase(); }
  }, [claimMutation.isError]);

  // ── Unified case data ──
  const caseData = sessionIdParam ? sessionCaseData : authCaseData;
  const caseLoading = sessionIdParam ? (sessionCaseLoading || sessionSlotLoading) : authCaseLoading;
  const isPublicPath = !!sessionIdParam;

  // ── Resolve productType from case data ──
  const productType: ProductType = useMemo(() => {
    const raw = productParam || caseData?.visaType || null;
    return resolveProductType(raw);
  }, [productParam, caseData]);

  // ── Old route config (for fallback/selection screen) ──
  const productId = productParam || caseData?.visaType || null;
  const legacyConfig = getIntakeRouteConfig(productId);

  // ── State ──
  const [flowState, setFlowState] = useState<FlowState>("select_type");
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied" | "unavailable">("prompt");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturingSide, setCapturingSide] = useState<"front" | "back">("front");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Derived config from new requirement system ──
  const docReq: DocumentRequirement | null = selectedDocumentType ? DOCUMENT_REQUIREMENTS[selectedDocumentType] : null;
  const docCopy: RouteDocumentCopy | null = selectedDocumentType ? getDocumentCopy(productType, selectedDocumentType) : null;
  const journeyConfig = useMemo(() => {
    return getJourneySteps(productType, selectedDocumentType ? isIdentityDocumentType(selectedDocumentType) : true);
  }, [productType, selectedDocumentType]);

  // ── Auto-select document type from URL param or slot ──
  useEffect(() => {
    if (preselectedDocType && !selectedDocumentType) {
      const resolved = resolveDocumentType(preselectedDocType);
      if (resolved) {
        setSelectedDocumentType(resolved);
        setFlowState("capture");
        track("document_upload_page_viewed", {
          product_type: productType,
          document_type: resolved,
          source: "preselected",
        });
      }
    }
  }, [preselectedDocType, selectedDocumentType, productType]);

  // ── Track page view ──
  useEffect(() => {
    if (caseData || productParam) {
      track("document_upload_page_viewed", {
        product_type: productType,
        case_id: caseData?.id?.toString() || "",
      });
    }
  }, [caseData, productParam, productType]);

  // ── Sticky CTA ──
  useEffect(() => {
    const handleScroll = () => setShowStickyCta(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Secure upload mutations ──
  const initUploadMutation = trpc.secureDocuments.initUpload.useMutation();
  const completeUploadMutation = trpc.secureDocuments.completeUpload.useMutation();

  // ── Legacy base64 upload (auth path fallback) ──
  const legacyUploadMutation = trpc.portal.uploadDocument.useMutation({
    onSuccess: () => {
      setUploadProgress("Document uploaded successfully.");
      track("document_upload_completed", {
        product_type: productType,
        document_type: selectedDocumentType || "",
        upload_method: "legacy",
      });
      setFlowState("success");
    },
    onError: (err) => {
      setError(err.message || "Upload failed. Please try again.");
      setFlowState("preview");
    },
  });

  // ── Public upload mutation (session-based) ──
  const publicUploadMutation = trpc.checkout.uploadDocumentBySession.useMutation({
    onSuccess: () => {
      setUploadProgress("Document uploaded successfully.");
      track("document_upload_completed", {
        product_type: productType,
        document_type: selectedDocumentType || "",
        upload_method: "public_session",
      });
      setFlowState("success");
      if (sessionIdParam) refetchSessionSlots();
    },
    onError: (err) => {
      setError(err.message || "Upload failed. Please try again.");
      setFlowState("preview");
    },
  });

  // ── Camera functions ──
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setCameraStream(stream);
      setCameraPermission("granted");
      track("camera_scan_started", { product_type: productType, document_type: selectedDocumentType || "" });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraPermission("denied");
        track("camera_permission_denied", { product_type: productType, document_type: selectedDocumentType || "" });
      } else {
        setCameraPermission("unavailable");
      }
    }
  }, [productType, selectedDocumentType]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const side = capturingSide;
        const file = new File([blob], `${selectedDocumentType || "document"}-${side}-${Date.now()}.jpg`, { type: "image/jpeg" });
        const fileItem: FileItem = {
          id: `${Date.now()}-${side}`,
          file,
          previewUrl: URL.createObjectURL(file),
          side: docReq?.requiresFrontBack ? side : undefined,
        };

        if (docReq?.requiresFrontBack && side === "front") {
          setFiles((prev) => [...prev.filter((f) => f.side !== "front"), fileItem]);
          setCapturingSide("back");
          setFlowState("capture_back");
        } else if (docReq?.requiresFrontBack && side === "back") {
          setFiles((prev) => [...prev.filter((f) => f.side !== "back"), fileItem]);
          setFlowState("preview");
        } else {
          setFiles((prev) => [...prev.filter((f) => !f.side), fileItem]);
          setFlowState("preview");
        }
        stopCamera();
      },
      "image/jpeg",
      0.92
    );
  }, [capturingSide, selectedDocumentType, docReq, stopCamera]);

  // ── File upload handler ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    setError("");

    const newFiles: FileItem[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("This file type is not supported. Please upload PDF, JPG, or PNG.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("This file is too large. Maximum file size is 20MB.");
        return;
      }
      newFiles.push({
        id: `${Date.now()}-${i}`,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      });
    }

    track("file_selected", {
      product_type: productType,
      document_type: selectedDocumentType || "",
      file_count: newFiles.length,
    });

    if (docReq?.allowsMultipleFiles) {
      setFiles((prev) => [...prev, ...newFiles]);
    } else {
      setFiles(newFiles.slice(0, 1));
    }
    setFlowState("preview");

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Remove a file from the list ──
  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // ── Upload to server ──
  const doUpload = async () => {
    if (files.length === 0) return;

    setFlowState("uploading");
    setUploadProgress("Preparing upload…");
    setError("");

    const docType = selectedDocumentType || "passport";

    // ── PUBLIC PATH ──
    if (isPublicPath && sessionIdParam && sessionSlotData) {
      try {
        const slots = sessionSlotData.slots || [];
        const targetSlot = slots.find((s: any) => {
          const resolved = resolveDocumentType(s.documentType);
          return resolved === selectedDocumentType;
        }) || slots.find((s: any) => {
          if (isIdentityDocumentType(docType)) {
            return s.documentType === "passport" || s.documentType === "identity" || s.documentType === "eu_national_id";
          }
          return false;
        });

        if (!targetSlot) {
          setError("Could not find the document slot for your case. Please contact support.");
          setFlowState("preview");
          return;
        }

        // Upload each file
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          setUploadProgress(`Uploading${files.length > 1 ? ` file ${i + 1} of ${files.length}` : ""}…`);
          const buffer = await fileItem.file.arrayBuffer();
          const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ""));

          await publicUploadMutation.mutateAsync({
            sessionId: sessionIdParam,
            slotId: targetSlot.id,
            fileName: fileItem.file.name,
            fileData: base64,
            mimeType: fileItem.file.type,
            fileSize: fileItem.file.size,
          });
        }

        setUploadProgress("Document uploaded successfully.");
        setFlowState("success");
        refetchSessionSlots();
      } catch (err: any) {
        setError(err.message || "Your upload did not complete. Please try again.");
        setFlowState("preview");
      }
      return;
    }

    // ── AUTHENTICATED PATH ──
    let activeCaseData = caseData;
    if (!activeCaseData) {
      const { data: freshCase } = await refetchCase();
      if (!freshCase) {
        setError("Your case is still being set up. Please refresh the page in a moment.");
        setFlowState("preview");
        return;
      }
      activeCaseData = freshCase;
    }

    try {
      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        setUploadProgress(`Uploading${files.length > 1 ? ` file ${i + 1} of ${files.length}` : " securely"}…`);

        const initResult = await initUploadMutation.mutateAsync({
          caseId: (activeCaseData as any).id,
          documentType: docType as any,
          documentSide: (fileItem.side || "single") as any,
          fileName: fileItem.file.name,
          mimeType: fileItem.file.type,
          fileSize: fileItem.file.size,
          productType: productId || undefined,
        });

        const uploadResponse = await fetch(initResult.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": fileItem.file.type },
          body: fileItem.file,
        });

        if (!uploadResponse.ok) throw new Error(`Upload failed with status ${uploadResponse.status}`);

        await completeUploadMutation.mutateAsync({ documentId: initResult.documentId });
      }

      setUploadProgress("Document uploaded successfully.");
      track("document_upload_completed", { product_type: productType, document_type: docType });
      setFlowState("success");
    } catch (presignedErr: any) {
      // Fallback to legacy upload for first file
      console.warn("[DocumentIntake] Presigned upload failed, falling back to legacy:", presignedErr.message);
      try {
        const slots = (activeCaseData as any).slots || [];
        const targetSlot = slots.find((s: any) => {
          const resolved = resolveDocumentType(s.documentType);
          return resolved === selectedDocumentType;
        }) || slots.find((s: any) => s.documentType === "passport" || s.documentType === "identity");

        if (!targetSlot) {
          setError("Could not find the document slot. Please contact support.");
          setFlowState("preview");
          return;
        }

        const buffer = await files[0].file.arrayBuffer();
        const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ""));

        legacyUploadMutation.mutate({
          slotId: targetSlot.id,
          fileName: files[0].file.name,
          fileData: base64,
          mimeType: files[0].file.type,
          fileSize: files[0].file.size,
        });
      } catch (legacyErr) {
        setError("Your upload did not complete. Please try again.");
        setFlowState("preview");
      }
    }
  };

  // ── Cleanup camera on unmount ──
  useEffect(() => {
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    };
  }, [cameraStream]);

  // ── Navigate back to checklist ──
  const goBackToChecklist = () => {
    track("back_to_checklist_clicked", { product_type: productType, document_type: selectedDocumentType || "" });
    if (isPublicPath && sessionIdParam) {
      window.location.href = `/application-success?session_id=${sessionIdParam}`;
    } else {
      window.location.href = "/portal";
    }
  };

  // ── Select a document type from the list ──
  const handleSelectDocType = (docType: DocumentType) => {
    setSelectedDocumentType(docType);
    setFiles([]);
    setError("");
    setCapturingSide("front");
    setFlowState("capture");
    track("document_upload_primary_cta_clicked", { product_type: productType, document_type: docType });
  };

  // ── Loading states ──
  if (caseLoading || (!isPublicPath && authLoading)) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-[#1A2332] font-medium text-lg">Loading your secure upload…</p>
          <p className="text-muted-foreground text-sm mt-2">Setting up your document intake…</p>
        </div>
      </div>
    );
  }

  // ── Error: no user (auth path only) ──
  if (!isPublicPath && !user && !authLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-3 text-[#1A2332]">Please log in to continue.</h1>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to upload documents. If you just completed payment, please log in with the same email you used at checkout.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => (window.location.href = "/portal")} size="lg">Log In</Button>
            <a href="mailto:support@spainporfavor.com" className="text-sm text-muted-foreground underline">Contact support</a>
          </div>
        </div>
      </div>
    );
  }

  // ── Claiming in progress ──
  if (!isPublicPath && claimMutation.isPending) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-[#1A2332] font-medium text-lg">Linking your case…</p>
        </div>
      </div>
    );
  }

  // ── Public path: no case found ──
  if (isPublicPath && !caseData && !caseLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-3 text-[#1A2332]">We could not load your case details.</h1>
          <p className="text-muted-foreground mb-6">
            Your payment may still be processing. Please wait a moment and refresh, or contact support if this persists.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} size="lg" variant="outline">Refresh Page</Button>
            <a href="mailto:support@spainporfavor.com" className="text-sm text-muted-foreground underline">Contact support</a>
          </div>
        </div>
      </div>
    );
  }

  // ── Auth path: no case found after claim ──
  if (!isPublicPath && !caseData && !productParam && (claimMutation.isError || claimMutation.isSuccess)) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-3 text-[#1A2332]">We could not load your case details.</h1>
          <p className="text-muted-foreground mb-6">
            Please make sure you are logged in with the same email you used at checkout.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} size="lg" variant="outline">Refresh Page</Button>
            <Button onClick={() => (window.location.href = "/portal")} size="lg">Open Client Portal</Button>
            <a href="mailto:support@spainporfavor.com" className="text-sm text-muted-foreground underline">Contact support</a>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // SUCCESS STATE
  // ══════════════════════════════════════════════════════════════
  if (flowState === "success") {
    const liveSlots = isPublicPath && sessionSlotData?.slots ? sessionSlotData.slots : null;
    const uploadedCount = liveSlots ? liveSlots.filter((s: any) => s.hasUpload).length : 1;
    const totalSlots = liveSlots ? liveSlots.length : 5;
    const requiredSlots = liveSlots ? liveSlots.filter((s: any) => s.isRequired) : [];
    const missingRequired = requiredSlots.filter((s: any) => !s.hasUpload);
    const nextRequiredSlot = missingRequired.length > 0 ? missingRequired[0] : null;
    const allRequiredDone = missingRequired.length === 0;

    const docTitle = docReq?.title || "document";

    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <IntakeHeader caseId={caseData?.id} onBack={goBackToChecklist} />
        <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
          {/* Success hero */}
          <section className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#1A2332] mb-3">
              {allRequiredDone && isPublicPath
                ? "All documents uploaded — you're all set!"
                : "Document uploaded — we'll review it next"}
            </h1>
            <p className="text-muted-foreground text-base max-w-lg mx-auto">
              {allRequiredDone && isPublicPath
                ? "We have everything we need. Your assigned Gestor will begin reviewing your documents. We'll email you with next steps."
                : `Your ${docTitle} has been added to your case. Our team will check it and let you know if anything needs fixing.`}
            </p>
            <span className="inline-block mt-3 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
              Status: Under review
            </span>
          </section>

          {/* Progress bar */}
          {isPublicPath && liveSlots && (
            <section className="mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[#1A2332]">
                    {uploadedCount} of {totalSlots} documents uploaded
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {allRequiredDone ? "All required done ✓" : `${missingRequired.length} required remaining`}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((uploadedCount / totalSlots) * 100)}%` }}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Document checklist */}
          {isPublicPath && liveSlots && (
            <section className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-display text-base font-bold text-[#1A2332] mb-3">Your document checklist</h3>
                <ul className="space-y-3 text-sm text-[#1A2332]">
                  {liveSlots
                    .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map((slot: any) => (
                      <li key={slot.id} className="flex items-start gap-2.5">
                        {slot.hasUpload ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : slot.isRequired ? (
                          <Circle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className={slot.hasUpload ? "line-through text-muted-foreground" : ""}>
                            {slot.label}
                          </span>
                          {slot.isRequired && !slot.hasUpload && (
                            <span className="ml-2 text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">Required</span>
                          )}
                          {slot.hasUpload && (
                            <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Under review</span>
                          )}
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            </section>
          )}

          {/* CTAs */}
          <section className="text-center space-y-3">
            <Button
              size="lg"
              className={`${allRequiredDone ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"} text-white font-semibold text-base px-8 py-6 rounded-lg shadow-md`}
              onClick={() => {
                if (allRequiredDone) {
                  goBackToChecklist();
                } else if (nextRequiredSlot) {
                  const resolved = resolveDocumentType(nextRequiredSlot.documentType);
                  if (resolved) {
                    setSelectedDocumentType(resolved);
                    setFiles([]);
                    setError("");
                    setCapturingSide("front");
                    setFlowState("capture");
                  } else {
                    setSelectedDocumentType(null);
                    setFlowState("select_type");
                  }
                } else {
                  setSelectedDocumentType(null);
                  setFlowState("select_type");
                }
              }}
            >
              {allRequiredDone
                ? "Back to document checklist"
                : nextRequiredSlot
                  ? `Upload ${nextRequiredSlot.label}`
                  : "Upload another document"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            {!allRequiredDone && (
              <Button variant="ghost" onClick={goBackToChecklist}>
                I'll finish later
              </Button>
            )}
          </section>
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // MAIN INTAKE FLOW
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <IntakeHeader caseId={caseData?.id} onBack={goBackToChecklist} />

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        {/* Compact stepper */}
        <section className="mb-6">
          <CompactStepper
            title={journeyConfig.title}
            steps={journeyConfig.steps.map((label, i) => ({
              label,
              status: i < 2 ? "complete" : i === 2 ? "current" : "upcoming",
            }))}
          />
        </section>

        {/* ── Document type selection ── */}
        {flowState === "select_type" && (
          <DocumentTypeSelection
            productType={productType}
            legacyConfig={legacyConfig}
            sessionSlotData={sessionSlotData}
            onSelect={handleSelectDocType}
          />
        )}

        {/* ── Capture / Preview / Uploading ── */}
        {flowState !== "select_type" && selectedDocumentType && docReq && docCopy && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left column: Requirements + Help */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              {/* Hero badge + headline (mobile only — desktop shows inline) */}
              <div className="lg:hidden mb-6">
                <DocumentHero docCopy={docCopy} docReq={docReq} />
              </div>

              {/* Requirement checklist card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
                <h3 className="text-sm font-semibold text-[#1A2332] mb-3">{docCopy.requirementsTitle}</h3>
                <ul className="space-y-2">
                  {docCopy.requirementsChecklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#1A2332]">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {docCopy.additionalNotes && docCopy.additionalNotes.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    {docCopy.additionalNotes.map((note, i) => (
                      <p key={i} className="text-xs text-muted-foreground mb-2 last:mb-0">{note}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Contextual help */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-4">
                <p className="text-xs font-semibold text-[#1A2332] mb-2">Not sure if this is the right document?</p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      track("ask_laura_document_clicked", { product_type: productType, document_type: selectedDocumentType });
                      // Open Laura chat with context
                      const lauraUrl = `/portal?chat=laura&context=${encodeURIComponent(JSON.stringify({
                        case_id: caseData?.id,
                        productType,
                        documentType: selectedDocumentType,
                        documentTitle: docReq.title,
                      }))}`;
                      window.open(lauraUrl, "_blank");
                    }}
                    className="flex items-center gap-2 text-xs text-amber-700 hover:text-amber-800 font-medium"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Ask Laura about this document
                  </button>
                  {selectedDocumentType === "employment_contract" && productType === "digital-nomad-visa" && (
                    <button
                      onClick={() => track("template_downloaded", { document_type: selectedDocumentType })}
                      className="flex items-center gap-2 text-xs text-amber-700 hover:text-amber-800 font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download employer letter template
                    </button>
                  )}
                </div>
              </div>

              {/* Trust note */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-white border border-gray-100">
                <Shield className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your document is uploaded securely and used only for your SpainPorFavor case. Only authorised case staff can access it.
                </p>
              </div>
            </div>

            {/* Right column: Upload card */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              {/* Hero badge + headline (desktop only) */}
              <div className="hidden lg:block mb-5">
                <DocumentHero docCopy={docCopy} docReq={docReq} />
              </div>

              {/* Upload / Capture / Preview / Uploading */}
              {(flowState === "capture" || flowState === "capture_back") && (
                <UploadCaptureCard
                  docReq={docReq}
                  flowState={flowState}
                  cameraPermission={cameraPermission}
                  cameraStream={cameraStream}
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  fileInputRef={fileInputRef}
                  error={error}
                  productType={productType}
                  selectedDocumentType={selectedDocumentType}
                  onStartCamera={startCamera}
                  onCapture={capturePhoto}
                  onFileSelect={handleFileSelect}
                  onBack={() => {
                    stopCamera();
                    setSelectedDocumentType(null);
                    setFiles([]);
                    setFlowState("select_type");
                    setError("");
                  }}
                />
              )}

              {(flowState === "preview" || flowState === "preview_back") && (
                <PreviewCard
                  files={files}
                  docReq={docReq}
                  docCopy={docCopy}
                  error={error}
                  allowsMultiple={docReq.allowsMultipleFiles}
                  fileInputRef={fileInputRef}
                  onRemoveFile={removeFile}
                  onAddMore={() => fileInputRef.current?.click()}
                  onSubmit={() => {
                    track("document_submit_for_review_clicked", { product_type: productType, document_type: selectedDocumentType || "" });
                    doUpload();
                  }}
                  onReplace={() => {
                    setFiles([]);
                    setFlowState("capture");
                  }}
                  onFileSelect={handleFileSelect}
                />
              )}

              {flowState === "uploading" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-4" />
                  <p className="text-[#1A2332] font-medium text-lg">{uploadProgress}</p>
                  <p className="text-muted-foreground text-sm mt-2">Please don't close this page.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Sticky mobile CTA ── */}
      {showStickyCta && (flowState === "capture" || flowState === "select_type") && !cameraStream && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3 z-50 md:hidden safe-area-inset-bottom">
          <Button
            size="lg"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm py-5 rounded-lg"
            onClick={() => {
              track("document_upload_primary_cta_clicked", { product_type: productType, document_type: selectedDocumentType || "" });
              if (flowState === "select_type") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else if (docReq && isIdentityDocumentType(selectedDocumentType || "")) {
                startCamera();
              } else {
                fileInputRef.current?.click();
              }
            }}
          >
            {selectedDocumentType ? getStickyCTAText(selectedDocumentType) : "Upload document"}
            <Upload className="ml-2 w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Hidden canvas for camera capture */}
      <canvas ref={canvasRef} className="hidden" />
      {/* Hidden file input (for multi-file) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        multiple={docReq?.allowsMultipleFiles || false}
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload document file"
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Sub-components
// ══════════════════════════════════════════════════════════════

function IntakeHeader({ caseId, onBack }: { caseId?: number; onBack: () => void }) {
  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#1A2332] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to document checklist</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2">
            <span className="font-display text-lg font-bold text-[#1A2332]">
              Spain<span className="text-amber-500">Por</span>Favor
            </span>
          </a>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {caseId && <span className="hidden sm:inline">Case SPF-{String(caseId).padStart(5, "0")}</span>}
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3" /> Secure upload
          </span>
        </div>
      </div>
    </header>
  );
}

function DocumentHero({ docCopy, docReq }: { docCopy: RouteDocumentCopy; docReq: DocumentRequirement }) {
  return (
    <div>
      <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 mb-3">
        {docCopy.badge}
      </span>
      <h1 className="font-display text-xl md:text-2xl font-bold text-[#1A2332] mb-2 leading-tight">
        {docCopy.headline}
      </h1>
      <p className="text-sm text-muted-foreground">
        {docCopy.subheadline}
      </p>
    </div>
  );
}

function CompactStepper({ steps, title }: { steps: { label: string; status: string }[]; title: string }) {
  return (
    <div>
      <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-center mb-2">
        {title}
      </h2>
      {/* Desktop horizontal */}
      <div className="hidden md:flex items-center justify-between relative">
        <div className="absolute top-3 left-[10%] right-[10%] h-0.5 bg-gray-200 z-0" />
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center text-center w-1/5 relative z-10">
            <StepDot status={step.status} index={i} />
            <p className="text-[10px] font-medium text-[#1A2332] mt-1 leading-tight max-w-[90px]">{step.label}</p>
          </div>
        ))}
      </div>
      {/* Mobile compact */}
      <div className="md:hidden flex items-center gap-1.5 justify-center">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <StepDot status={step.status} index={i} size="sm" />
            {i < steps.length - 1 && (
              <div className={`w-4 h-0.5 ${step.status === "complete" ? "bg-emerald-300" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="md:hidden text-center mt-1.5">
        <p className="text-[11px] font-medium text-amber-700">
          {steps.find((s) => s.status === "current")?.label}
        </p>
      </div>
    </div>
  );
}

function StepDot({ status, index, size = "md" }: { status: string; index: number; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  if (status === "complete") {
    return (
      <div className={`${sizeClass} rounded-full bg-emerald-100 flex items-center justify-center`}>
        <CheckCircle2 className={`${iconSize} text-emerald-600`} />
      </div>
    );
  }
  if (status === "current") {
    return (
      <div className={`${sizeClass} rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center`} aria-current="step">
        <span className="text-[9px] font-bold text-amber-700">{index + 1}</span>
      </div>
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gray-100 flex items-center justify-center`}>
      <Circle className={`${size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} text-gray-400`} />
    </div>
  );
}

// ── Document type selection screen ──
function DocumentTypeSelection({
  productType,
  legacyConfig,
  sessionSlotData,
  onSelect,
}: {
  productType: ProductType;
  legacyConfig: IntakeRouteConfig;
  sessionSlotData: any;
  onSelect: (docType: DocumentType) => void;
}) {
  // Build document options from live slots if available, else from legacy config
  const slots = sessionSlotData?.slots || [];
  const hasLiveSlots = slots.length > 0;

  return (
    <section className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="font-display text-xl md:text-2xl font-bold text-[#1A2332] mb-2">
          Which document would you like to upload?
        </h1>
        <p className="text-sm text-muted-foreground">
          Select a document from your checklist to get started.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {hasLiveSlots ? (
          slots
            .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map((slot: any) => {
              const resolved = resolveDocumentType(slot.documentType);
              const isUploaded = slot.hasUpload;
              return (
                <button
                  key={slot.id}
                  onClick={() => {
                    if (resolved) onSelect(resolved);
                  }}
                  disabled={!resolved}
                  className={`text-left bg-white rounded-xl border p-4 transition-all ${
                    isUploaded
                      ? "border-emerald-200 opacity-70"
                      : "border-gray-200 hover:border-amber-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#1A2332] mb-0.5">{slot.label}</p>
                      {slot.description && <p className="text-xs text-muted-foreground">{slot.description}</p>}
                    </div>
                    <div className="shrink-0 ml-3">
                      {isUploaded ? (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Under review</span>
                      ) : slot.isRequired ? (
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">Required</span>
                      ) : (
                        <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-medium">Optional</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
        ) : (
          legacyConfig.documentTypes.map((docType) => {
            const resolved = resolveDocumentType(docType.id);
            return (
              <button
                key={docType.id}
                onClick={() => {
                  if (resolved) onSelect(resolved);
                }}
                className="text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-amber-300 hover:shadow-sm transition-all"
              >
                <p className="text-sm font-semibold text-[#1A2332] mb-0.5">{docType.label}</p>
                <p className="text-xs text-muted-foreground">{docType.body}</p>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

// ── Upload / Capture card ──
function UploadCaptureCard({
  docReq,
  flowState,
  cameraPermission,
  cameraStream,
  videoRef,
  canvasRef,
  fileInputRef,
  error,
  productType,
  selectedDocumentType,
  onStartCamera,
  onCapture,
  onFileSelect,
  onBack,
}: {
  docReq: DocumentRequirement;
  flowState: FlowState;
  cameraPermission: string;
  cameraStream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  error: string;
  productType: ProductType;
  selectedDocumentType: DocumentType;
  onStartCamera: () => void;
  onCapture: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
}) {
  const isBack = flowState === "capture_back";
  const isCameraPrimary = docReq.uploadMode === "camera_primary";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-display text-base font-bold text-[#1A2332] mb-1">
        {docReq.uploadCardTitle}
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        {isBack ? "Now capture the back of your ID card." : docReq.uploadCardBody}
      </p>

      {/* Camera view (active) */}
      {cameraStream && (
        <div className="relative rounded-lg overflow-hidden mb-4 bg-black aspect-[4/3] max-h-[360px]">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute inset-4 border-2 border-white/60 rounded-lg pointer-events-none" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <Button
              size="lg"
              className="bg-white text-[#1A2332] font-semibold px-8 py-5 rounded-full shadow-lg hover:bg-gray-100"
              onClick={onCapture}
            >
              <Camera className="w-5 h-5 mr-2" />
              {isBack ? "Capture Back" : "Capture"}
            </Button>
          </div>
        </div>
      )}

      {/* Camera not started — show CTAs based on upload mode */}
      {!cameraStream && cameraPermission !== "denied" && cameraPermission !== "unavailable" && (
        <div className="space-y-3">
          {isCameraPrimary ? (
            <>
              {/* Camera primary */}
              <Button
                size="lg"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-base py-6 rounded-lg shadow-md"
                onClick={() => {
                  track("document_upload_primary_cta_clicked", { product_type: productType, document_type: selectedDocumentType });
                  onStartCamera();
                }}
              >
                <Camera className="w-5 h-5 mr-2" />
                {docReq.primaryCta}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  track("document_upload_secondary_cta_clicked", { product_type: productType, document_type: selectedDocumentType });
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                {docReq.secondaryCta}
              </Button>
            </>
          ) : (
            <>
              {/* File primary */}
              <Button
                size="lg"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-base py-6 rounded-lg shadow-md"
                onClick={() => {
                  track("document_upload_primary_cta_clicked", { product_type: productType, document_type: selectedDocumentType });
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="w-5 h-5 mr-2" />
                {docReq.primaryCta}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  track("document_upload_secondary_cta_clicked", { product_type: productType, document_type: selectedDocumentType });
                  onStartCamera();
                }}
              >
                <Camera className="w-4 h-4 mr-2" />
                {docReq.secondaryCta}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Camera denied */}
      {cameraPermission === "denied" && (
        <div className="text-center py-5 bg-amber-50 rounded-lg mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
          <p className="text-sm text-[#1A2332] font-medium mb-1">Camera access was blocked.</p>
          <p className="text-xs text-muted-foreground mb-3">You can still upload a file instead.</p>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> Upload a file instead
          </Button>
        </div>
      )}

      {/* Camera unavailable */}
      {cameraPermission === "unavailable" && (
        <div className="text-center py-5 bg-gray-50 rounded-lg mb-4">
          <p className="text-sm text-[#1A2332] font-medium mb-1">We couldn't detect a camera on this device.</p>
          <p className="text-xs text-muted-foreground mb-3">Please upload a file instead.</p>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> Upload a file
          </Button>
        </div>
      )}

      {/* Accepted formats */}
      <p className="text-[11px] text-muted-foreground text-center mt-4">
        Accepted: {docReq.acceptedFileTypes.join(", ")} — max {docReq.maxFileSizeMB}MB
        {docReq.allowsMultipleFiles && " · Multiple files allowed"}
      </p>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
          <p className="text-sm text-red-700 mb-2">{error}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
              Upload a different file
            </Button>
            <a href="mailto:support@spainporfavor.com" className="text-xs text-red-600 underline self-center">
              Contact support
            </a>
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="text-center mt-5 pt-4 border-t border-gray-100">
        <button onClick={onBack} className="text-xs text-muted-foreground hover:text-[#1A2332] transition-colors">
          ← Back to document checklist
        </button>
      </div>
    </div>
  );
}

// ── Preview / Confirmation card ──
function PreviewCard({
  files,
  docReq,
  docCopy,
  error,
  allowsMultiple,
  fileInputRef,
  onRemoveFile,
  onAddMore,
  onSubmit,
  onReplace,
  onFileSelect,
}: {
  files: FileItem[];
  docReq: DocumentRequirement;
  docCopy: RouteDocumentCopy;
  error: string;
  allowsMultiple: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onRemoveFile: (id: string) => void;
  onAddMore: () => void;
  onSubmit: () => void;
  onReplace: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-display text-base font-bold text-[#1A2332] mb-1">Review before uploading</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Check that your {files.length > 1 ? "files look" : "file looks"} correct before submitting.
      </p>

      {/* File list */}
      <div className="space-y-3 mb-4">
        {files.map((fileItem) => (
          <div key={fileItem.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            {/* Preview thumbnail */}
            {fileItem.previewUrl ? (
              <img src={fileItem.previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded border border-gray-200" />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A2332] truncate">{fileItem.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {fileItem.file.type.split("/")[1]?.toUpperCase() || "FILE"} · {(fileItem.file.size / 1024).toFixed(0)} KB
                {fileItem.side && ` · ${fileItem.side === "front" ? "Front" : "Back"}`}
              </p>
            </div>
            <button
              onClick={() => onRemoveFile(fileItem.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add more files (multi-file) */}
      {allowsMultiple && (
        <button
          onClick={onAddMore}
          className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800 font-medium mb-4"
        >
          <Plus className="w-4 h-4" />
          Add another file
        </button>
      )}

      {/* Requirement checklist reminder */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-xs font-semibold text-[#1A2332] mb-1.5">Quick check:</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {docCopy.requirementsChecklist.slice(0, 4).map((item, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
          onClick={onSubmit}
          disabled={files.length === 0}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {files.length > 1 ? "Submit files for review" : "Submit for review"}
        </Button>
        <Button variant="outline" className="w-full" onClick={onReplace}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Replace file{files.length > 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
