import { FilesStrict } from "@models/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/projects/status-badge";

type FilesTableProps = {
  files: FilesStrict[];
  onDelete: (fileId: string) => void;
  onReplace: (fileId: string) => void;
};

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesTable({ files, onDelete, onReplace }: FilesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Filename</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <TableRow key={file.id}>
            <TableCell className="max-w-72 truncate font-semibold text-foreground">{file.name}</TableCell>
            <TableCell className="text-muted-foreground">{file.metadata.fileType || file.metadata.mimeType}</TableCell>
            <TableCell className="text-muted-foreground">{formatBytes(file.metadata.size)}</TableCell>
            <TableCell className="text-muted-foreground">{new Date(file.createdAt).toLocaleString()}</TableCell>
            <TableCell>
              <StatusBadge status={file.status} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onReplace(file.id)}>
                Replace
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onDelete(file.id)}>
                Delete
              </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
