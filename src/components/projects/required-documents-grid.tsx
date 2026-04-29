"use client";

import { PutBlobResult } from "@vercel/blob";
import { ProjectType } from "@models/data";
import {
  RequiredDocumentDefinition,
  getOrderedRequiredDocuments,
} from "@/components/projects/required-documents";
import { DocumentUploadDraft, RequiredDocumentCard } from "@/components/projects/required-document-card";

type RequiredDocumentsGridProps = {
  projectType: ProjectType;
  uploads: DocumentUploadDraft[];
  disabled?: boolean;
  onUploaded: (document: RequiredDocumentDefinition, blob: PutBlobResult, file: File) => void;
  onRemoveUpload: (uploadId: string) => void;
};

export function RequiredDocumentsGrid({
  projectType,
  uploads,
  disabled,
  onUploaded,
  onRemoveUpload,
}: RequiredDocumentsGridProps) {
  const orderedDocuments = getOrderedRequiredDocuments(projectType);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {orderedDocuments.map((document) => (
        <RequiredDocumentCard
          key={document.id}
          document={document}
          uploads={uploads.filter((uploadItem) => uploadItem.documentId === document.id)}
          disabled={disabled}
          onUploaded={onUploaded}
          onRemoveUpload={onRemoveUpload}
        />
      ))}
    </div>
  );
}
