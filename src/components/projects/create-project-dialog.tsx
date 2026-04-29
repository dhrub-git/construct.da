"use client";

import { CreateProjectPayload, FileSpecs, ProjectType } from "@models/data";
import { PutBlobResult } from "@vercel/blob";
import { useMemo, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, UploadIcon } from "lucide-react";

import { createProjectThunk, createRossStreetMasterViewProjectThunk } from "@/redux/dashboardSlice";
import { useAppDispatch } from "@/redux/useDispatch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressSearchInput } from "@/components/projects/address-search-input";
import { getProjectTypeLabel } from "@/lib/project-presentation";
import { DocumentUploadDraft } from "@/components/projects/required-document-card";
import {
  RequiredDocumentDefinition,
  requiredDocumentDefinitions,
} from "@/components/projects/required-documents";
import { RequiredDocumentsGrid } from "@/components/projects/required-documents-grid";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

type CreateProjectDialogProps = {
  userId: string;
  onCreated: (projectId: string) => void;
  triggerLabel?: string;
};

type WizardData = {
  projectName: string;
  description: string;
  address: string;
  council: string;
  projectType: ProjectType;
};

const defaultData: WizardData = {
  projectName: "",
  description: "",
  address: "",
  council: "",
  projectType: ProjectType.NEW_DWELLING,
};

const steps = ["Basic info", "Property info", "Classification", "File upload"];

function canProceed(
  step: number,
  data: WizardData,
  uploadedFiles: DocumentUploadDraft[],
): boolean {
  if (step === 0) {
    return data.projectName.trim().length > 0;
  }

  if (step === 1) {
    return data.address.trim().length > 0 && data.council.trim().length > 0;
  }

  if (step === 2) {
    return Boolean(data.projectType);
  }

  return uploadedFiles.length > 0;
}

export function CreateProjectDialog({
  userId,
  onCreated,
  triggerLabel = "Create project",
}: CreateProjectDialogProps) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [creatingMasterViewDemo, setCreatingMasterViewDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WizardData>(defaultData);
  const [uploadedFiles, setUploadedFiles] = useState<DocumentUploadDraft[]>([]);

  const projectTypeOptions = useMemo(
    () =>
      Object.values(ProjectType).map((value) => ({
        value,
        label: getProjectTypeLabel(value),
      })),
    [],
  );

  const resetDialog = () => {
    setStep(0);
    setData(defaultData);
    setUploadedFiles([]);
    setError(null);
    setSubmitting(false);
    setCreatingMasterViewDemo(false);
  };

  const closeDialog = () => {
    setOpen(false);
    resetDialog();
  };

  const handleCreateMasterViewDemo = async () => {
    setCreatingMasterViewDemo(true);
    setError(null);

    try {
      const createdProject = await dispatch(
        createRossStreetMasterViewProjectThunk(),
      ).unwrap();

      closeDialog();
      onCreated(createdProject.id);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create the North Sydney MasterView demo project.",
      );
    } finally {
      setCreatingMasterViewDemo(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    const filesPayload: Omit<FileSpecs, "projectId">[] = uploadedFiles.map(
      ({ blob, file, fileType }) => ({
        filename: file.name,
        mimetype: file.type,
        size: file.size,
        userId,
        url: blob.url,
        fileType,
      }),
    );

    const payload: CreateProjectPayload = {
      projectName: data.projectName,
      description: data.description || undefined,
      address: data.address,
      council: data.council,
      projectType: data.projectType,
      userId,
      files: filesPayload,
    };

    try {
      const createdProject = await dispatch(
        createProjectThunk({
          project: {
            name: payload.projectName,
            description: payload.description,
            address: payload.address,
            council: payload.council,
            type: payload.projectType,
            userId: payload.userId,
            files: payload.files,
          },
        }),
      ).unwrap();

      closeDialog();
      onCreated(createdProject.id);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create project.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentUpload = (
    document: RequiredDocumentDefinition,
    blob: PutBlobResult,
    file: File,
  ) => {
    setUploadedFiles((previous) => {
      const persisted = document.allowMultiple
        ? previous
        : previous.filter((item) => item.documentId !== document.id);

      return [
        ...persisted,
        {
          id: `${document.id}-${blob.pathname}-${Date.now()}`,
          blob,
          file,
          documentId: document.id,
          fileType: document.fileType,
        },
      ];
    });
  };

  const handleRemoveUpload = (uploadId: string) => {
    setUploadedFiles((previous) =>
      previous.filter((item) => item.id !== uploadId),
    );
  };

  const uploadedDocumentCount = useMemo(() => {
    return new Set(uploadedFiles.map((item) => item.documentId)).size;
  }, [uploadedFiles]);

  const totalDocumentDefinitions = useMemo(
    () => requiredDocumentDefinitions.length,
    [],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetDialog();
        }
      }}
    >
      <DialogTrigger render={<Button size="lg" />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {steps.length}: {steps[step]}
          </DialogDescription>
        </DialogHeader>

        <ol
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          aria-label="Create project steps"
        >
          {steps.map((stepLabel, index) => {
            const active = index === step;
            const complete = index < step;

            return (
              <li key={stepLabel} className="flex">
                <Badge
                  variant="outline"
                  className={cn(
                    "w-full justify-center rounded-xl px-3 py-2 text-xs font-semibold tracking-[0.02em] transition-all duration-200 ease-out",
                    active &&
                      "border-primary bg-primary/10 text-primary shadow-sm",
                    complete &&
                      !active &&
                      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                    !active &&
                      !complete &&
                      "border-border/60 bg-muted/40 text-muted-foreground",
                  )}
                >
                  <span className="mr-1 opacity-80">{index + 1}.</span>
                  {stepLabel}
                </Badge>
              </li>
            );
          })}
        </ol>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">North Sydney MasterView demo DA</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Instantly create DA172/2026 for 15A Ross Street with the real document checklist,
                R2 / 8.5 m control facts, heritage-adjacent referral, and no cl. 4.6 trigger.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleCreateMasterViewDemo}
              disabled={submitting || creatingMasterViewDemo}
              className="shrink-0"
            >
              {creatingMasterViewDemo ? "Creating…" : "Load MasterView DA"}
            </Button>
          </div>
        </div>

        <FieldGroup>
          {step === 0 ? (
            <>
              <Field>
                <FieldLabel htmlFor="project-name">Project name</FieldLabel>
                <FieldContent>
                  <Input
                    id="project-name"
                    value={data.projectName}
                    onChange={(event) =>
                      setData((prev) => ({
                        ...prev,
                        projectName: event.target.value,
                      }))
                    }
                    aria-invalid={data.projectName.trim().length === 0}
                  />
                  <FieldDescription>
                    Required. Keep this name client friendly and specific.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="project-description">
                  Description
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    id="project-description"
                    value={data.description}
                    onChange={(event) =>
                      setData((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Optional scope notes"
                  />
                </FieldContent>
              </Field>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Field>
                <FieldLabel htmlFor="project-address">Address</FieldLabel>
                <FieldContent>
                  <AddressSearchInput
                    value={data.address}
                    onChange={(value) =>
                      setData((prev) => ({ ...prev, address: value }))
                    }
                    onSelect={(suggestion) => {
                      setData((prev) => ({
                        ...prev,
                        address: suggestion.address,
                        council: suggestion.council,
                      }));
                    }}
                  />
                  <FieldDescription>
                    Australian addresses only. Council is inferred from the
                    selected address.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="project-council">Council</FieldLabel>
                <FieldContent>
                  <Input
                    id="project-council"
                    value={data.council}
                    onChange={(event) =>
                      setData((prev) => ({
                        ...prev,
                        council: event.target.value,
                      }))
                    }
                    aria-invalid={data.council.trim().length === 0}
                  />
                </FieldContent>
              </Field>
            </>
          ) : null}

          {step === 2 ? (
            <Field>
              <FieldLabel>Project type</FieldLabel>
              <FieldContent>
                <Select
                  value={data.projectType}
                  onValueChange={(nextValue) => {
                    setData((prev) => ({
                      ...prev,
                      projectType: nextValue as ProjectType,
                    }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {projectTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-3 max-h-[65vh] overflow-y-auto">
              <div className="rounded-[14px] border border-border bg-secondary/55 p-4 text-sm">
                <p className="font-semibold text-foreground">
                  DA submission checklist
                </p>
                <p className="text-xs leading-6 text-muted-foreground">
                  Upload through a document card to auto-map the correct file
                  type. Use “Other Supporting Documents” for anything outside
                  the standard set.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {uploadedFiles.length} file
                  {uploadedFiles.length === 1 ? "" : "s"} uploaded across{" "}
                  {uploadedDocumentCount} / {totalDocumentDefinitions}{" "}
                  categories.
                </p>
              </div>

              <RequiredDocumentsGrid
                projectType={data.projectType}
                uploads={uploadedFiles}
                disabled={submitting || creatingMasterViewDemo}
                onUploaded={handleDocumentUpload}
                onRemoveUpload={handleRemoveUpload}
              />

              {uploadedFiles.length === 0 ? (
                <div className="rounded-[14px] border border-dashed border-border bg-secondary/35 p-4 text-sm text-muted-foreground">
                  Start by uploading at least one core document such as Site
                  Plan, Floor Plans, or SEE.
                </div>
              ) : null}
            </div>
          ) : null}
        </FieldGroup>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            disabled={step === 0 || submitting}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back
          </Button>

          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep((current) => current + 1)}
              disabled={!canProceed(step, data, uploadedFiles) || submitting}
            >
              Next
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed(step, data, uploadedFiles) || submitting}
            >
              <UploadIcon data-icon="inline-start" />
              {submitting ? "Creating..." : "Create project"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
