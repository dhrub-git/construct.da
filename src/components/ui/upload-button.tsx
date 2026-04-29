"use client";

import { type PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileUp,
  XIcon,
} from "lucide-react";
import { Button } from "./button";

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

interface FileUploadButtonProps {
  accept?: string;
  label?: string;
  onSuccess?: (blob: PutBlobResult, file: File) => void;
  onError?: (error: Error) => void;
}

export default function FileUploadButton({
  accept,
  label = "Upload File",
  onSuccess,
  onError,
}: FileUploadButtonProps) {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = () => {
    setState("idle");
    setProgress(0);
    setErrorMessage(null);
  };

  const cancelUpload = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    resetState();
  };

  const handleUpload = useCallback(
    async (file: File) => {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;
      setState("uploading");
      setProgress(0);
      setErrorMessage(null);

      try {
        const uploadedBlob = await upload(file.name, file, {
          access: "private",
          handleUploadUrl: "/api/upload",
          abortSignal: controller.signal,
          onUploadProgress: (progress) => {
            setProgress(progress.percentage);
          },
        });

        setProgress(100);
        setState("success");
        onSuccess?.(uploadedBlob, file);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setState("error");
        setErrorMessage(error.message);
        onError?.(error);
      }
    },
    [onSuccess, onError],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      handleUpload(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setState("idle");
      const file = e.dataTransfer.files?.[0];
      if (file) {
        setFileName(file.name);
        handleUpload(file);
      }
    },
    [handleUpload],
  );

  const reset = () => {
    setState("idle");
    setFileName(null);
    setProgress(0);
    setErrorMessage(null);
    if (inputFileRef.current) inputFileRef.current.value = "";
  };

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const zoneVariant: Record<UploadState, string> = {
    idle: "border-zinc-700 bg-zinc-900 hover:border-violet-500 hover:bg-zinc-800/80 cursor-pointer",
    dragging:
      "border-violet-500 bg-violet-500/5 shadow-[0_0_0_4px_rgba(139,92,246,0.15)] cursor-copy",
    uploading: "border-zinc-700 bg-zinc-900 cursor-default",
    success:
      "border-emerald-500 border-solid bg-zinc-900 shadow-[0_0_0_4px_rgba(16,185,129,0.1)] cursor-default",
    error:
      "border-rose-500 border-solid bg-zinc-900 shadow-[0_0_0_4px_rgba(244,63,94,0.1)] cursor-default",
  };

  const iconWrapVariant: Record<UploadState, string> = {
    idle: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    dragging: "bg-violet-500/20 border-violet-500/40 text-violet-300",
    uploading: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    success: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
    error: "bg-rose-500/10 border-rose-500/25 text-rose-400",
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm">
      <div
        className={`relative w-full rounded-2xl border-2 border-dashed px-6 py-10 flex flex-col items-center gap-4 transition-all duration-200 select-none ${zoneVariant[state]}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (state === "idle") setState("dragging");
        }}
        onDragLeave={() => {
          if (state === "dragging") setState("idle");
        }}
        onClick={() =>
          (state === "idle" || state === "dragging") &&
          inputFileRef.current?.click()
        }
      >
        <input
          ref={inputFileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Icon container */}
        <div
          className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-200 ${iconWrapVariant[state]}`}
        >
          {state === "uploading" && (
            <Loader2 size={22} className="animate-spin" />
          )}
          {state === "success" && <CheckCircle2 size={22} />}
          {state === "error" && <AlertCircle size={22} />}
          {state === "dragging" && <FileUp size={22} />}
          {state === "idle" && <Upload size={22} />}
        </div>

        {/* Idle */}
        {(state === "idle" || state === "dragging") && (
          <>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-100 tracking-wide">
                {state === "dragging" ? "Drop to upload" : label}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Drag & drop or click to browse
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputFileRef.current?.click();
              }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-xs font-semibold tracking-wide transition-all duration-150 shadow-lg shadow-violet-900/30 hover:-translate-y-px"
            >
              <Upload size={13} />
              Choose File
            </button>
          </>
        )}

        {/* Uploading */}
        {state === "uploading" && (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-100">Uploading…</p>
              {fileName && (
                <p className="text-xs text-zinc-500 mt-0.5 font-mono truncate max-w-55 mx-auto">
                  {fileName}
                </p>
              )}
            </div>
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-violet-500 to-fuchsia-400 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 tabular-nums">
              {Math.round(progress)}%
            </p>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelUpload}
            >
              <XIcon data-icon="inline-start" />
              Cancel
            </Button>
          </div>
        )}

        {/* Success */}
        {state === "success" && (
          <div className="text-center">
            <p className="text-sm font-semibold text-zinc-100">
              Upload complete
            </p>
            {fileName && (
              <p className="text-xs text-emerald-400 mt-0.5 font-mono truncate max-w-55 mx-auto">
                {fileName}
              </p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
            >
              Upload another
            </button>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="text-center">
            <p className="text-sm font-semibold text-zinc-100">Upload failed</p>
            {errorMessage && (
              <p className="text-xs text-rose-400 mt-0.5 font-mono">
                {errorMessage}
              </p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
