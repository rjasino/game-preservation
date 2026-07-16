---
description: Run a simple gaming industry workflow that researches an issue first and then stress-tests the proposed direction through debate.
handoffs:
  - label: Research Only
    agent: research-agent
    prompt: Research this gaming industry issue and propose solution options
    send: true
  - label: Debate Only
    agent: debate-agent
    prompt: Stress-test this gaming industry proposal across stakeholder perspectives
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding.

## Workflow Goal

Run a simple two-stage workflow for gaming industry analysis:

1. Use `research-agent` to investigate the issue and form a recommended direction.
2. Use `debate-agent` to challenge that direction across stakeholder perspectives.
3. Consolidate both outputs into a refined final recommendation.

## Execution Rules

- Start with `research-agent`.
- Pass the original user problem to `research-agent` with enough context to identify the relevant focus areas: digital ownership, fair pricing, and game preservation.
- After the research stage completes, pass its recommendation, options, assumptions, and evidence gaps into `debate-agent`.
- Treat the debate stage as a stress test of the research outcome, not as a disconnected second answer.
- If the debate uncovers a major flaw, revise the final recommendation accordingly.
- If evidence is too weak for a firm recommendation, say so clearly and state the next research step.
- Save all workflow artifacts under `.asd/research`.
- Use `.asd/research/research.md` for the research stage, `.asd/research/debate.md` for the debate stage, and `.asd/research/industry-analysis.md` for the consolidated workflow result unless the user requests different filenames.

## Stage 1: Research

Invoke `research-agent` to produce:

- Problem framing
- Key findings
- Stakeholder analysis
- Solution options
- Recommended approach
- Risks and open questions

## Stage 2: Debate

Invoke `debate-agent` using the research output to produce:

- Proposal summary
- Stakeholder positions
- Strongest arguments for
- Strongest arguments against
- Critical tradeoffs
- Final judgment
- Evidence still needed

## Final Output

Return one combined response with these sections:

- Issue summary
- Research findings
- Debate findings
- Refined recommendation
- Key risks
- Evidence gaps
- Next step

Save the combined workflow artifact to `.asd/research/industry-analysis.md` unless the user requests a different filename.

## Constraints

- Keep the workflow focused on gaming industry analysis.
- Use the two agents in sequence rather than merging their roles into one generic answer.
- Preserve disagreement when it matters instead of forcing false consensus.
- Prefer concise decision-ready synthesis over long repetitive summaries.
- Do not place research workflow artifacts in `.asd/artifacts`; reserve `.asd/research` for this workflow.
