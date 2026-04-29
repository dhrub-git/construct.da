"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircleIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { PutBlobResult } from "@vercel/blob";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type ProjectFileDropzoneProps = {
  accept: string;
  disabled?: boolean;
  onUploaded: (blob: PutBlobResult, file: File) => void;
};

type UploadState = "idle" | "dragging" | "uploading" | "error";

export function ProjectFileDropzone({ accept, disabled, onUploaded }: ProjectFileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = () => {
    setState("idle");
    setProgress(0);
    setErrorMessage(null);
  };

  const handleUpload = async (file: File) => {
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    setState("uploading");
    setProgress(0);
    setErrorMessage(null);

    try {
      const blob = await upload(file.name, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
        abortSignal: controller.signal,
        onUploadProgress: (event) => {
          setProgress(event.percentage);
        },
      });

      setProgress(100);
      setState("idle");
      onUploaded(blob, file);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (uploadError) {
      setState("error");
      setErrorMessage(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    }
  };

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[20px] border-2 border-dashed p-5 transition-colors",
        state === "dragging" && "border-primary bg-primary/8",
        state === "uploading" && "border-border bg-secondary/55",
        state === "error" && "border-destructive bg-destructive/8",
        state === "idle" && "border-border bg-secondary/40 hover:border-border",
        disabled && "pointer-events-none opacity-60",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled && state === "idle") {
          setState("dragging");
        }
      }}
      onDragLeave={() => {
        if (state === "dragging") {
          setState("idle");
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (disabled) {
          return;
        }

        setState("idle");
        const file = event.dataTransfer.files?.[0];
        if (file) {
          void handleUpload(file);
        }
      }}
    >
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
        }}
      />

      <div className="flex flex-col gap-2 text-center md:text-left">
        <p className="text-sm font-semibold text-foreground">
          {state === "dragging" ? "Drop to upload" : "Upload a new file"}
        </p>
        <p className="text-sm text-muted-foreground">
          Drag and drop a document or browse to upload it to this project.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={disabled || state === "uploading"}>
          {state === "uploading" ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <UploadIcon data-icon="inline-start" />}
          Browse files
        </Button>
        {state === "uploading" ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => {
            abortRef.current?.abort();
            abortRef.current = null;
            reset();
          }}>
            <XIcon data-icon="inline-start" />
            Cancel
          </Button>
        ) : null}
      </div>

      {state === "uploading" ? (
        <div className="flex flex-col gap-2">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground tabular-nums">{Math.round(progress)}% uploaded</p>
        </div>
      ) : null}

      {state === "error" && errorMessage ? (
        <p className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircleIcon />
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
