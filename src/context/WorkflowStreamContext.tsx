"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  GenerateProjectReportStatus,
  ProcessingProjectFileStatus,
} from "@models/data";

/**
 * ------------------------------------------------------------
 * TYPES
 * ------------------------------------------------------------
 */

type WorkflowStreamState = {
  runId: string | null;
  connected: boolean;
  loading: boolean;
  error: string | null;

  fileStatus: ProcessingProjectFileStatus | null;
  reportStatus: GenerateProjectReportStatus | null;

  startListening: (runId: string) => void;
  stopListening: () => void;
  reset: () => void;
};

const WorkflowStreamContext = createContext<WorkflowStreamState | null>(null);

/**
 * ------------------------------------------------------------
 * DEFAULTS
 * ------------------------------------------------------------
 */

const defaultFileStatus: ProcessingProjectFileStatus = {
  completed: 0,
  total: 0,
  failed: 0,
  completedFiles: [],
  failedFiles: [],
  processingFiles: [],
  processingComplete: false,
  nextRunId: null,
};

/**
 * ------------------------------------------------------------
 * WORKFLOW STREAM PROVIDER
 * ------------------------------------------------------------
 *
 * Manages connection to a workflow stream, including file processing and report generation steps.
 * Provides real-time updates on processing status and handles automatic chaining between steps.
 * Designed to be used in the project details page to show live progress of report generation.
 * ------------------------------------------------------------
 */

export function WorkflowStreamProvider({
  initialRunId = null,
  children,
}: {
  initialRunId: string | null;
  children: React.ReactNode;
}) {
  const [runId, setRunId] = useState<string | null>(initialRunId);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fileStatus, setFileStatus] =
    useState<ProcessingProjectFileStatus | null>(null);

  const [reportStatus, setReportStatus] =
    useState<GenerateProjectReportStatus | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const startIndexRef = useRef(0);

  /**
   * ------------------------------------------------------------
   * TYPE GUARDS
   * ------------------------------------------------------------
   */

  const isFileStatus = (
    payload: unknown,
  ): payload is ProcessingProjectFileStatus => {
    const record = payload as Partial<ProcessingProjectFileStatus> | null;
    return (
      typeof record?.completed === "number" && typeof record?.total === "number"
    );
  };

  const isReportStatus = (
    payload: unknown,
  ): payload is GenerateProjectReportStatus => {
    const record = payload as Partial<GenerateProjectReportStatus> | null;
    return (
      typeof record?.status === "string" && typeof record?.progress === "number"
    );
  };

  /**
   * ------------------------------------------------------------
   * RESET
   * ------------------------------------------------------------
   */

  const reset = useCallback(() => {
    setConnected(false);
    setLoading(false);
    setError(null);
    setRunId(null);
    setFileStatus(null);
    setReportStatus(null);
    startIndexRef.current = 0;

    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  /**
   * ------------------------------------------------------------
   * STOP
   * ------------------------------------------------------------
   */

  const stopListening = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setConnected(false);
    setLoading(false);
  }, []);

  /**
   * ------------------------------------------------------------
   * STREAM READER
   * ------------------------------------------------------------
   */

  const connectToRun = useCallback(async (id: string) => {
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setRunId(id);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/resume-stream/${id}?startIndex=${startIndexRef.current}`,
        {
          method: "GET",
          signal: controller.signal,
        },
      );

      if (!res.ok || !res.body) {
        throw new Error("Unable to connect to workflow stream.");
      }

      setConnected(true);
      setLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        /**
         * assumes each chunk is newline-delimited json
         */
        const parts = buffer.split("\n");
        buffer = parts.pop() || "";

        for (const line of parts) {
          if (!line.trim()) continue;

          startIndexRef.current += 1;

          try {
            const payload = JSON.parse(line);

            if (isFileStatus(payload)) {
              setFileStatus(payload);

              if (payload.nextRunId) {
                setRunId(payload.nextRunId);
              }
            }

            if (isReportStatus(payload)) {
              setReportStatus(payload);
            }
          } catch {
            console.error("Invalid stream payload:", line);
          }
        }
      }

      setConnected(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Stream connection failed.";
      if (error instanceof DOMException && error.name === "AbortError") return;

      setError(message);
      setConnected(false);
      setLoading(false);
    }
  }, []);

  /**
   * ------------------------------------------------------------
   * PUBLIC START
   * ------------------------------------------------------------
   */

  const startListening = useCallback(
    (id: string) => {
      connectToRun(id);
    },
    [connectToRun],
  );

  /**
   * ------------------------------------------------------------
   * AUTO CHAIN NEXT RUN
   * If file processing completes and gives nextRunId,
   * automatically connect to report generation stream
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (
      fileStatus?.processingComplete &&
      fileStatus?.nextRunId &&
      fileStatus.nextRunId !== runId
    ) {
      startIndexRef.current = 0;

      queueMicrotask(() => {
        connectToRun(fileStatus.nextRunId!);
      });
    }
  }, [fileStatus, runId, connectToRun]);

  /**
   * ------------------------------------------------------------
   * CLEANUP & INITIALIZATION
   * ------------------------------------------------------------
   * If initialRunId is provided, connect on mount. Clean up on unmount.
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (initialRunId) {
      queueMicrotask(() => {
        connectToRun(initialRunId);
      });
    }

    return () => {
      abortRef.current?.abort();
    };
  }, [initialRunId, connectToRun]);

  const value = useMemo(
    () => ({
      runId,
      connected,
      loading,
      error,
      fileStatus: fileStatus ?? defaultFileStatus,
      reportStatus,
      startListening,
      stopListening,
      reset,
    }),
    [
      runId,
      connected,
      loading,
      error,
      fileStatus,
      reportStatus,
      startListening,
      stopListening,
      reset,
    ],
  );

  return (
    <WorkflowStreamContext.Provider value={value}>
      {children}
    </WorkflowStreamContext.Provider>
  );
}

/**
 * ------------------------------------------------------------
 * HOOK
 * ------------------------------------------------------------
 */

export function useWorkflowStream() {
  const context = useContext(WorkflowStreamContext);

  if (!context) {
    throw new Error(
      "useWorkflowStream must be used inside WorkflowStreamProvider",
    );
  }

  return context;
}
