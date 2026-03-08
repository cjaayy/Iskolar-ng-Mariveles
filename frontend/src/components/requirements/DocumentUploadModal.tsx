"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  File,
  Minimize2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button, Textarea, ProgressBar } from "@/components/ui";
import { SuccessIllustration } from "@/components/illustrations";
import { useToast } from "@/components/providers/ToastProvider";
import {
  compressFile,
  MIN_FILE_SIZE,
  MAX_FILE_SIZE,
  formatBytes,
  type CompressionResult,
} from "@/lib/compressFile";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirementName?: string;
  requirementKey?: string;
  applicantId?: number;
  onSuccess?: () => void;
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  requirementName,
  requirementKey,
  applicantId,
  onSuccess,
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{
    compressed: boolean;
    originalSize: number;
    finalSize: number;
  } | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const isImageType = (type: string) =>
    type === "image/jpeg" || type === "image/png" || type === "image/jpg";

  const handleFile = useCallback(
    async (f: File) => {
      setSizeError(null);
      setCompressionInfo(null);

      const isImage = isImageType(f.type);
      const needsCompression =
        isImage && (f.size > MAX_FILE_SIZE || f.size < MIN_FILE_SIZE);
      const tooLarge = f.size > MAX_FILE_SIZE && !isImage;
      const tooSmall = f.size < MIN_FILE_SIZE && !isImage;

      if (tooLarge) {
        setSizeError(
          `File is ${formatBytes(f.size)}. Maximum allowed is 3 MB. Please compress this file externally before uploading.`,
        );
        setFile(f);
        setPreview(null);
        return;
      }

      if (tooSmall) {
        setSizeError(
          `File is too small (${formatBytes(f.size)}). Minimum size is 500 KB — please upload a higher-quality file.`,
        );
        setFile(f);
        setPreview(null);
        return;
      }

      if (needsCompression) {
        setCompressing(true);
        setFile(f);
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(f);

        try {
          const result: CompressionResult = await compressFile(f);

          if (result.error) {
            setSizeError(result.error);
            setCompressing(false);
            return;
          }

          setFile(result.file);
          setCompressionInfo({
            compressed: result.compressed,
            originalSize: result.originalSize,
            finalSize: result.finalSize,
          });

          if (result.file.type.startsWith("image/")) {
            const compReader = new FileReader();
            compReader.onload = (e) => setPreview(e.target?.result as string);
            compReader.readAsDataURL(result.file);
          }

          addToast(
            `File compressed: ${formatBytes(result.originalSize)} → ${formatBytes(result.finalSize)}`,
            "success",
          );
        } catch {
          setSizeError(
            "Failed to compress the image. Please try a smaller file.",
          );
        } finally {
          setCompressing(false);
        }
        return;
      }

      setFile(f);
      if (f.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(f);
      } else {
        setPreview(null);
      }
    },
    [addToast],
  );

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
    if (!file || sizeError) return;
    setUploading(true);
    setProgress(0);

    const tick = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 10 : p));
    }, 120);

    try {
      if (requirementKey && applicantId) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("requirementKey", requirementKey);
        formData.append("applicantId", String(applicantId));

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.error ?? "File upload failed");
        }

        const uploadData = await uploadRes.json();

        const res = await fetch("/api/me/requirements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-applicant-id": String(applicantId),
          },
          body: JSON.stringify({
            requirementKey,
            fileName: file.name,
            fileUrl: uploadData.fileUrl,
            notes: notes || null,
          }),
        });
        clearInterval(tick);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Upload failed");
        }
      } else {
        clearInterval(tick);
        await new Promise((r) => setTimeout(r, 800));
      }

      setProgress(100);
      setUploading(false);
      setSuccess(true);
      addToast("Document uploaded successfully!", "success");

      setTimeout(() => {
        onSuccess?.();
        resetAndClose();
      }, 2000);
    } catch (err) {
      clearInterval(tick);
      setUploading(false);
      setProgress(0);
      const msg =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      addToast(msg, "error");
    }
  };

  const resetAndClose = () => {
    setFile(null);
    setPreview(null);
    setNotes("");
    setProgress(0);
    setSuccess(false);
    setUploading(false);
    setCompressing(false);
    setCompressionInfo(null);
    setSizeError(null);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/"))
      return <ImageIcon className="w-5 h-5 text-muted-fg" />;
    if (type.includes("pdf"))
      return <FileText className="w-5 h-5 text-muted-fg" />;
    return <File className="w-5 h-5 text-muted-fg" />;
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
            e.target === e.currentTarget &&
            !uploading &&
            !compressing &&
            resetAndClose()
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
                disabled={uploading || compressing}
                className="p-1.5 rounded-lg text-muted-fg hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <AnimatePresence mode="wait">
                {success ? (
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
                          className={`w-6 h-6 transition-colors text-muted-fg`}
                        />
                      </div>
                      <p className="font-body text-sm font-medium text-foreground mb-1">
                        {isDragging
                          ? "Drop your file here!"
                          : "Drag & drop your file here"}
                      </p>
                      <p className="font-body text-xs text-muted-fg">
                        PDF, PNG, JPG, or DOCX &bull; 500 KB – 3 MB
                      </p>
                      <p className="font-body text-xs text-muted-fg mt-0.5">
                        Images are auto-adjusted to fit the size range
                      </p>
                    </div>

                    {compressing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-ocean-50 dark:bg-ocean-400/10 border border-ocean-200 dark:border-ocean-400/20"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 1,
                            ease: "linear",
                          }}
                        >
                          <Minimize2 className="w-4 h-4 text-ocean-500" />
                        </motion.div>
                        <p className="text-sm font-body text-ocean-700 dark:text-ocean-300">
                          Compressing file…
                        </p>
                      </motion.div>
                    )}

                    {sizeError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex items-start gap-3 p-3 rounded-xl bg-coral-50 dark:bg-coral-400/10 border border-coral-200 dark:border-coral-400/20"
                      >
                        <AlertTriangle className="w-4 h-4 text-coral-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-body text-coral-700 dark:text-coral-300">
                          {sizeError}
                        </p>
                      </motion.div>
                    )}

                    {compressionInfo?.compressed && !sizeError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/20"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <p className="text-sm font-body text-emerald-700 dark:text-emerald-300">
                          Compressed:{" "}
                          {formatBytes(compressionInfo.originalSize)} →{" "}
                          {formatBytes(compressionInfo.finalSize)}
                        </p>
                      </motion.div>
                    )}

                    {file && !compressing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-3"
                      >
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
                              setCompressionInfo(null);
                              setSizeError(null);
                            }}
                            className="text-muted-fg hover:text-coral-400 transition-colors"
                            aria-label="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    <Textarea
                      label="Additional Notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />

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

            {!success && (
              <div className="flex items-center justify-end gap-3 p-6 pt-0">
                <Button
                  variant="ghost"
                  onClick={resetAndClose}
                  disabled={uploading || compressing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading || compressing || !!sizeError}
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
