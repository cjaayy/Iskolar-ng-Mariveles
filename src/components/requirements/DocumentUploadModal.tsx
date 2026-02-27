/* ================================================================
   DOCUMENT UPLOAD MODAL
   Drag-and-drop upload with preview, progress, and success animation
   ================================================================ */

"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, Image as ImageIcon, File } from "lucide-react";
import { Button, Select, Textarea, ProgressBar } from "@/components/ui";
import { SuccessIllustration } from "@/components/illustrations";
import { useToast } from "@/components/providers/ToastProvider";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirementName?: string;
}

const documentTypes = [
  { label: "Certificate", value: "certificate" },
  { label: "Transcript / Grades", value: "transcript" },
  { label: "Government ID", value: "gov-id" },
  { label: "Tax Document", value: "tax" },
  { label: "Barangay Document", value: "barangay" },
  { label: "Other", value: "other" },
];

export function DocumentUploadModal({
  isOpen,
  onClose,
  requirementName,
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [docType, setDocType] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleFile = useCallback((f: File) => {
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile],
  );

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    // Simulate upload with progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((r) => setTimeout(r, 80));
      setProgress(i);
    }

    setUploading(false);
    setSuccess(true);
    addToast("Document uploaded successfully!", "success");

    setTimeout(() => {
      resetAndClose();
    }, 2000);
  };

  const resetAndClose = () => {
    setFile(null);
    setPreview(null);
    setDocType("");
    setNotes("");
    setProgress(0);
    setSuccess(false);
    setUploading(false);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/"))
      return <ImageIcon className="w-5 h-5 text-peach-400" />;
    if (type.includes("pdf"))
      return <FileText className="w-5 h-5 text-coral-400" />;
    return <File className="w-5 h-5 text-ocean-400" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) =>
            e.target === e.currentTarget && !uploading && resetAndClose()
          }
          role="dialog"
          aria-modal="true"
          aria-label="Upload document"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-card-bg border border-card-border rounded-2xl shadow-soft-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-card-border">
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Upload Document
                </h2>
                {requirementName && (
                  <p className="text-sm font-body text-muted-fg mt-0.5">
                    for {requirementName}
                  </p>
                )}
              </div>
              <button
                onClick={resetAndClose}
                disabled={uploading}
                className="p-1.5 rounded-lg text-muted-fg hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <AnimatePresence mode="wait">
                {success ? (
                  /* Success State */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8"
                  >
                    <SuccessIllustration className="mx-auto mb-4" />
                    <h3 className="font-heading text-xl font-bold text-foreground mb-1">
                      Upload Complete!
                    </h3>
                    <p className="font-body text-sm text-muted-fg">
                      Your document has been submitted for review.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* Drop Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`
                        relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
                        transition-all duration-200
                        ${
                          isDragging
                            ? "border-ocean-400 bg-ocean-50/50 dark:bg-ocean-400/5 scale-[1.02]"
                            : "border-card-border hover:border-ocean-300 hover:bg-muted/50"
                        }
                      `}
                      role="button"
                      tabIndex={0}
                      aria-label="Drop zone for file upload"
                      onKeyDown={(e) =>
                        e.key === "Enter" && fileInputRef.current?.click()
                      }
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        onChange={(e) =>
                          e.target.files?.[0] && handleFile(e.target.files[0])
                        }
                      />
                      <div
                        className={`
                        w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center
                        transition-colors duration-200
                        ${isDragging ? "bg-ocean-100 dark:bg-ocean-400/20" : "bg-muted"}
                      `}
                      >
                        <Upload
                          className={`w-6 h-6 transition-colors ${isDragging ? "text-ocean-400" : "text-muted-fg"}`}
                        />
                      </div>
                      <p className="font-body text-sm font-medium text-foreground mb-1">
                        {isDragging
                          ? "Drop your file here!"
                          : "Drag & drop your file here"}
                      </p>
                      <p className="font-body text-xs text-muted-fg">
                        PDF, PNG, JPG, or DOCX • Max 10MB
                      </p>
                    </div>

                    {/* File Preview */}
                    {file && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-3"
                      >
                        {/* Image preview */}
                        {preview && (
                          <div className="relative rounded-xl overflow-hidden border border-card-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={preview}
                              alt="Preview of uploaded document"
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        )}

                        {/* File info pill */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                          {getFileIcon(file.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-body font-medium text-foreground truncate">
                              {file.name}
                            </p>
                            <p className="text-xs font-body text-muted-fg">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                              setPreview(null);
                            }}
                            className="text-muted-fg hover:text-coral-400 transition-colors"
                            aria-label="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Document Type */}
                    <Select
                      label="Document Type"
                      options={documentTypes}
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                    />

                    {/* Notes */}
                    <Textarea
                      label="Additional Notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />

                    {/* Upload Progress */}
                    {uploading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <ProgressBar
                          value={progress}
                          label="Uploading..."
                          color="ocean"
                          size="md"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {!success && (
              <div className="flex items-center justify-end gap-3 p-6 pt-0">
                <Button
                  variant="ghost"
                  onClick={resetAndClose}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!file || !docType || uploading}
                  isLoading={uploading}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Upload Document
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
