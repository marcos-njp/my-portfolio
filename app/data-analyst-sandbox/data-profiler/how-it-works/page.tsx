// app/data-analyst-sandbox/data-profiler/how-it-works/page.tsx
//
// The profiler's explanation, on its own route.
//
// It used to be the ninth and longest section of the profiler page. That page is
// now a workspace: a toolbar, a chart canvas and an inspector rail, with as
// little standing prose as the content allows. A 322-line document does not
// belong inside a tool, so it moved here, where `DocPageLayout` and `DocSection`
// are the right primitives because this genuinely is a document.
//
// `ProfilerExplainer` is rendered unchanged. It takes no props and reads its
// numbers from `lib/data-profiler/constants.ts`, so it needs no profile and
// works as a standalone page with nothing loaded.

import type { Metadata } from "next";

import { DocPageLayout } from "@/components/docs/common";
import { ProfilerExplainer } from "@/components/data-analyst-sandbox/data-profiler/profiler-explainer";

export const metadata: Metadata = {
  title: "How the CSV Data Profiler works | Data Analyst Sandbox",
  description:
    "The type-inference thresholds, the interquartile outlier rule, the quality score weights, and exactly what leaves the page.",
};

export default function HowItWorksPage() {
  return (
    // The sandbox `<main>` carries no max-width, because the workspace wants
    // every pixel. This page is prose, so it caps itself at the same `max-w-3xl`
    // measure the docs hub uses rather than running 1200px lines. Centered with
    // `mx-auto` so the content sits comfortably within the wider workspace, and
    // padded at the bottom so the last section does not sit flush with the footer.
    <div className="mx-auto max-w-3xl pb-12">
      <DocPageLayout
        eyebrow="data analyst sandbox"
        index="01"
        title="How it works"
        subtitle="The type inference thresholds, the outlier rule, the score weights, and what leaves the page."
      >
        <ProfilerExplainer />
      </DocPageLayout>
    </div>
  );
}
