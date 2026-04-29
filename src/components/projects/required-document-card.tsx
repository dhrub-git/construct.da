"use client";

import { PutBlobResult } from "@vercel/blob";
import { CheckCircle2Icon, Trash2Icon } from "lucide-react";
import { RequiredDocumentDefinition } from "@/components/projects/required-documents";
import { ProjectFileUploader } from "@/components/projects/project-file-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export type DocumentUploadDraft = {
  id: string;
  blob: PutBlobResult;
  file: File;
  fileType: string;
  documentId: string;
};

type RequiredDocumentCardProps = {
  document: RequiredDocumentDefinition;
  uploads: DocumentUploadDraft[];
  disabled?: boolean;
  onUploaded: (document: RequiredDocumentDefinition, blob: PutBlobResult, file: File) => void;
  onRemoveUpload: (uploadId: string) => void;
};

function toBadgeVariant(badge: RequiredDocumentDefinition["badge"]): "default" | "secondary" | "outline" {
  if (badge === "COMMON") {
    return "default";
  }

  if (badge === "RECOMMENDED") {
    return "secondary";
  }

  return "outline";
}

export function RequiredDocumentCard({
  document,
  uploads,
  disabled,
  onUploaded,
  onRemoveUpload,
}: RequiredDocumentCardProps) {
  const Icon = document.Icon;
  const hasUploads = uploads.length > 0;

  return (
    <Card size="sm" className="h-full bg-secondary/55">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="rounded-[12px] border border-border bg-secondary/80 p-2 text-primary">
            <Icon className="size-4" />
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={toBadgeVariant(document.badge)}>{document.badge.toLowerCase()}</Badge>
            {hasUploads ? (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2Icon className="size-3.5" />
                uploaded {uploads.length}
              </Badge>
            ) : null}
          </div>
        </div>
        <CardTitle>{document.name}</CardTitle>
        <CardDescription>{document.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {hasUploads ? (
          <ul className="flex max-h-28 flex-col gap-1 overflow-y-auto rounded-[12px] border border-border bg-secondary/35 p-2">
            {uploads.map((uploadItem) => (
              <li key={uploadItem.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-muted-foreground">{uploadItem.file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onRemoveUpload(uploadItem.id)}
                >
                  <Trash2Icon data-icon="inline-start" />
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[12px] border border-dashed border-border bg-secondary/35 px-3 py-2 text-xs text-muted-foreground">
            No files uploaded for this category yet.
          </div>
        )}
      </CardContent>

      <CardFooter className="mt-auto flex-col items-stretch gap-2">
        <ProjectFileUploader
          label={hasUploads && !document.allowMultiple ? "Replace file" : "Upload file"}
          accept={document.accept ?? "*"}
          disabled={disabled}
          onUploaded={(blob, file) => onUploaded(document, blob, file)}
        />
        {document.allowMultiple ? (
          <p className="text-xs text-muted-foreground">Multiple files allowed for this category.</p>
        ) : null}
      </CardFooter>
    </Card>
  );
}
