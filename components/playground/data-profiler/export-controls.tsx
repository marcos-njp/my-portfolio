'use client';

// components/playground/data-profiler/export-controls.tsx
//
// The Markdown and JSON export controls. Both delegate to `onExport(format)`;
// the hook owns serialization, the export clock and `triggerDownload`, so this
// component holds no report-building logic and reads no `Date`.
//
// Requirement 7.5 holds trivially here: nothing in this path talks to the
// network. The document is built and handed to the browser's download machinery
// in the same tick, in the page.
//
// _Requirements: 7.1, 7.2, 7.5, 7.7, 7.8, 7.9_

import { useState } from 'react';
import { Download } from 'lucide-react';
import { AlertBox } from '@/components/docs/common';
import { Button } from '@/components/ui/button';
import type { ReportFormat } from '@/lib/data-profiler/report-exporter';

const FORMATS: Array<{ format: ReportFormat; label: string; extension: string }> = [
  { format: 'markdown', label: 'Export Markdown', extension: '.md' },
  { format: 'json', label: 'Export JSON', extension: '.json' },
];

export interface ExportControlsProps {
  /** Requirement 7.7: false whenever no Data_Profile is available. */
  canExport: boolean;
  /**
   * May be synchronous — `exportReport` in the hook is — in which case the
   * pending state simply spans that tick. Awaited so an async parent still gets
   * a pending state for the whole operation (Requirement 7.9).
   */
  onExport: (format: ReportFormat) => void | Promise<void>;
  /** Requirement 7.8 message, composed by the parent that knows what failed. */
  errorMessage?: string | null;
  className?: string;
}

export function ExportControls({
  canExport,
  onExport,
  errorMessage = null,
  className = '',
}: ExportControlsProps) {
  const [pendingFormat, setPendingFormat] = useState<ReportFormat | null>(null);

  const handleExport = async (format: ReportFormat) => {
    setPendingFormat(format);
    try {
      await onExport(format);
    } finally {
      // Requirement 7.8: the control returns to its enabled state whether the
      // download started or the parent recorded a failure.
      setPendingFormat(null);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        {FORMATS.map(({ format, label, extension }) => {
          const pending = pendingFormat === format;
          return (
            <Button
              key={format}
              type="button"
              variant="outline"
              onClick={() => void handleExport(format)}
              // Requirement 7.7: the native `disabled` attribute removes the
              // button from the tab order and rejects pointer and keyboard
              // activation alike — no click-guard needed.
              disabled={!canExport || pending}
              aria-busy={pending}
              // Requirement 9.5: 44x44 minimum target at the base breakpoint.
              className="min-h-11 min-w-11"
            >
              <Download aria-hidden="true" />
              {pending ? `Preparing ${extension}…` : label}
            </Button>
          );
        })}
      </div>

      {!canExport ? (
        <p className="text-xs text-muted-foreground">
          Profile a dataset first — exports are generated from a completed profile.
        </p>
      ) : null}

      {errorMessage ? (
        <AlertBox type="error" title="Export failed">
          {errorMessage}
        </AlertBox>
      ) : null}
    </div>
  );
}
