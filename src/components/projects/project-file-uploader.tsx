"use client";

import { upload } from "@vercel/blob/client";
import { PutBlobResult } from "@vercel/blob";
import { useEffect, useRef, useState } from "react";
import { AlertCircleIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type UploadMode = "idle" | "uploading" | "error";

type ProjectFileUploaderProps = {
  label: string;
  accept: string;
  disabled?: boolean;
  onUploaded: (blob: PutBlobResult, file: File) => void;
};

export function ProjectFileUploader({
  label,
  accept,
  disabled,
  onUploaded,
}: ProjectFileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [mode, setMode] = useState<UploadMode>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = () => {
    setMode("idle");
    setProgress(0);
    setErrorMessage(null);
  };

  const cancelUpload = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    resetState();
  };

  const handleUpload = async (file: File) => {
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    setMode("uploading");
    setProgress(0);
    setErrorMessage(null);

    try {
      const blob = await upload(file.name, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
        abortSignal: controller.signal,
        onUploadProgress: (progress) => {
          setProgress(progress.percentage);
        },
      });
      setProgress(100);
      setMode("idle");
      onUploaded(blob, file);
    } catch (uploadError) {
      setMode("error");
      setErrorMessage(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
    }
  };

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }

          void handleUpload(file);
          event.target.value = "";
        }}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || mode === "uploading"}
          onClick={() => inputRef.current?.click()}
        >
          {mode === "uploading" ? (
            <Loader2Icon data-icon="inline-start" className="animate-spin" />
          ) : (
            <UploadIcon data-icon="inline-start" />
          )}
          {mode === "uploading" ? "Uploading..." : label}
        </Button>

        {mode === "uploading" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cancelUpload}
          >
            <XIcon data-icon="inline-start" />
            Cancel
          </Button>
        )}
      </div>

      {mode === "uploading" ? (
        <div className="flex flex-col gap-1">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>
      ) : null}

      {mode === "error" && errorMessage ? (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircleIcon className="size-3.5" />
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
