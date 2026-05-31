import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { X, Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";

interface DocumentUploadModalProps {
  slotId: number;
  slotLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export default function DocumentUploadModal({
  slotId,
  slotLabel,
  onClose,
  onSuccess,
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.portal.uploadDocument.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => onSuccess(), 1500);
    },
    onError: (err) => {
      setError(err.message);
      setUploading(false);
    },
  });

  const validateAndSetFile = (selected: File) => {
    setError("");

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Please upload a PDF, JPG, PNG, or WEBP file.");
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError("File size exceeds 10MB. Please compress or use a smaller file.");
      return;
    }

    setFile(selected);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    validateAndSetFile(selected);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      uploadMutation.mutate({
        slotId,
        fileName: file.name,
        fileData: base64,
        mimeType: file.type,
        fileSize: file.size,
      });
    } catch (err) {
      setError("Failed to read file. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={uploading}
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Successful!</h3>
            <p className="text-sm text-gray-600">
              Your document is being validated. This usually takes 30-60 seconds.
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload Document</h3>
            <p className="text-sm text-gray-600 mb-6">{slotLabel}</p>

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-amber-500 bg-amber-100"
                  : file
                    ? "border-amber-300 bg-amber-50"
                    : "border-gray-300 hover:border-amber-400 hover:bg-amber-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-amber-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className={`h-8 w-8 mx-auto mb-3 ${isDragging ? "text-amber-500" : "text-gray-400"}`} />
                  <p className="text-sm font-medium text-gray-700">
                    {isDragging ? "Drop your file here" : "Drag & drop or click to select"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, JPG, PNG, or WEBP — max 10MB
                  </p>
                </>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 mt-3">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={uploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Validate
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-400 mt-4 text-center">
              Your document will be automatically validated by our AI system. Results typically appear within 60 seconds.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
