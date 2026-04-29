"use client";

import { useMemo } from "react";
import { ExternalLinkIcon, FilePenLineIcon, Trash2Icon } from "lucide-react";
import { PutBlobResult } from "@vercel/blob";

import { EmptyState } from "@/components/feedback/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectFileDropzone } from "@/components/projects/project-file-dropzone";
import { StatusBadge } from "@/components/projects/status-badge";
import { formatBytes, ProjectWorkspaceState } from "@/lib/project-workspace";

type ProjectFilesTabProps = {
  workspace: ProjectWorkspaceState;
  replacementTargetId: string | null;
  onStartReplace: (fileId: string) => void;
  onCancelReplace: () => void;
  onDeleteFile: (fileId: string) => void;
  onUploaded: (blob: PutBlobResult, file: File) => void;
  uploadDisabled?: boolean;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export function ProjectFilesTab({
  workspace,
  replacementTargetId,
  onStartReplace,
  onCancelReplace,
  onDeleteFile,
  onUploaded,
  uploadDisabled = false,
}: ProjectFilesTabProps) {
  const uploadNotice = useMemo(() => {
    if (!workspace.needsRerun) {
      return null;
    }

    return "New files detected. Re-run processing to update report.";
  }, [workspace.needsRerun]);

  return (
    <div className="flex flex-col gap-6">
      {uploadNotice ? (
        <Alert className="border-primary/20 bg-primary/8">
          <FilePenLineIcon />
          <AlertTitle>Processing needs a refresh</AlertTitle>
          <AlertDescription>{uploadNotice}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Upload files</CardTitle>
          <CardDescription>
            Upload project documents directly from the workspace. Drag and drop is supported.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ProjectFileDropzone
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/png,image/jpeg,image/webp"
            disabled={uploadDisabled}
            onUploaded={onUploaded}
          />

          {replacementTargetId ? (
            <Alert className="border-primary/20 bg-primary/8">
              <FilePenLineIcon />
              <AlertTitle>Replacement mode active</AlertTitle>
              <AlertDescription>
                Upload a new file to replace the selected document. Cancel when you are done.
              </AlertDescription>
              <div className="mt-3">
                <Button type="button" variant="outline" size="sm" onClick={onCancelReplace}>
                  Cancel replace
                </Button>
              </div>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
          <CardDescription>
            Review each uploaded document, replace outdated files, or remove documents that are no longer needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workspace.fileRows.length === 0 ? (
            <EmptyState variant="noFiles" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded at</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Included in report?</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspace.fileRows.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="max-w-64 truncate font-semibold text-white">{file.name}</TableCell>
                    <TableCell className="text-muted-foreground">{file.type}</TableCell>
                    <TableCell className="text-muted-foreground">{formatBytes(file.size)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(file.uploadedAt)}</TableCell>
                    <TableCell><StatusBadge status={file.status} /></TableCell>
                    <TableCell>
                      <Badge variant={file.includedInReport ? "default" : "secondary"}>
                        {file.includedInReport ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => onStartReplace(file.id)}>
                          <FilePenLineIcon data-icon="inline-start" />
                          Replace
                        </Button>
                        <Button type="button" variant="destructive" size="sm" onClick={() => onDeleteFile(file.id)}>
                          <Trash2Icon data-icon="inline-start" />
                          Delete
                        </Button>
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => window.open(file.url, "_blank", "noopener,noreferrer")}>
                          <ExternalLinkIcon />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}