import { StarCard, DocPageLayout } from "@/components/docs/common";

export function ProfileDataSection() {
  return (
    <DocPageLayout
      title="Profile Data & STAR Methodology"
      subtitle="How my background is structured in the knowledge base, using the STAR format (Situation, Task, Action, Result)."
    >
      {/* STAR overview */}
      <section>
        <div className="rounded-md border border-border bg-card p-6">
          <h2 className="text-xl font-medium tracking-tight mb-3">What STAR means</h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Each experience is written as four parts so the AI can answer with specifics instead of vague filler.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border rounded-md overflow-hidden">
            {[
              { k: "S", t: "Situation", d: "The context or problem" },
              { k: "T", t: "Task", d: "What needed to happen" },
              { k: "A", t: "Action", d: "What I actually did" },
              { k: "R", t: "Result", d: "How it turned out" },
            ].map((x) => (
              <div key={x.k} className="bg-card p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="nm-display text-primary text-sm leading-none">{x.k}</span>
                  <p className="font-medium text-sm">{x.t}</p>
                </div>
                <p className="text-xs text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capstone */}
      <section>
        <h2 className="text-xl font-medium tracking-tight mb-4">Capstone: Academic Information System</h2>
        <div className="rounded-md border border-border bg-card p-6 space-y-4">
          <StarCard letter="S" title="Situation">
            <p>The Junior High School department at St. Paul University Philippines needed a cleaner way to manage and read student academic data.</p>
          </StarCard>
          <StarCard letter="T" title="Task">
            <p>Build a streamlined academic information system with analytics that surface useful insights, not just raw records.</p>
          </StarCard>
          <StarCard letter="A" title="Action">
            <p>Designing the data model and the web app end to end, with a focus on a clear interface and analytics that the staff can actually use.</p>
          </StarCard>
          <StarCard letter="R" title="Result">
            <p>Still in progress as my capstone. It is teaching me how to scope a real system for real users and keep it maintainable.</p>
          </StarCard>
        </div>
      </section>

      {/* Agentic AI */}
      <section>
        <h2 className="text-xl font-medium tracking-tight mb-4">Building with agentic AI</h2>
        <div className="rounded-md border border-border bg-card p-6 space-y-4">
          <StarCard letter="S" title="Situation">
            <p>Most people use AI tools off the shelf. I wanted more control over how the work gets done.</p>
          </StarCard>
          <StarCard letter="T" title="Task">
            <p>Set up a workflow where I build and orchestrate my own agents instead of relying on a single chat box.</p>
          </StarCard>
          <StarCard letter="A" title="Action">
            <p>I build custom agents and subagents and split work by model: Claude for structuring and building, GPT for gathering context, and Gemini for design evaluation.</p>
          </StarCard>
          <StarCard letter="R" title="Result">
            <p>I move faster on real projects while keeping the judgment and the details in my hands.</p>
          </StarCard>
        </div>
      </section>

      {/* Digital twin */}
      <section>
        <h2 className="text-xl font-medium tracking-tight mb-4">This portfolio and its AI twin</h2>
        <div className="rounded-md border border-border bg-card p-6 space-y-4">
          <StarCard letter="S" title="Situation">
            <p>A static portfolio does not really show how someone thinks or works.</p>
          </StarCard>
          <StarCard letter="T" title="Task">
            <p>Build a portfolio with an AI digital twin that can answer questions about my background in a natural way.</p>
          </StarCard>
          <StarCard letter="A" title="Action">
            <p>Built it with Next.js, a RAG pipeline on Upstash Vector, Groq for the model, and an MCP server so AI agents can query it too.</p>
          </StarCard>
          <StarCard letter="R" title="Result">
            <p>The twin you are talking to. Building it taught me RAG, embeddings, and prompt design hands on.</p>
          </StarCard>
        </div>
      </section>

      {/* Data source */}
      <section>
        <div className="rounded-md border border-border bg-card p-6">
          <h3 className="font-medium mb-3">Where this comes from</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            These examples live as semantic chunks in an Upstash Vector index, embedded from{" "}
            <code className="text-xs bg-secondary border border-border px-1 py-0.5 rounded font-mono">data/digitaltwin.json</code>.
            The RAG pipeline retrieves the most relevant ones for each question so answers stay specific and grounded.
          </p>
        </div>
      </section>
    </DocPageLayout>
  );
}
