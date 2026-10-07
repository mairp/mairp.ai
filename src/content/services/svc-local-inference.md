---
name: Sovereign Inference & GPU Economics
order: 3
status: available
oneLine: Production-grade LLM serving on your own NVIDIA GPUs, with a dated, benchmarked answer to "local or frontier?" per workload.
summary: You get a working on-prem serving stack (vLLM, llama.cpp, ik_llama) tuned for your hardware and data-residency constraints, not a slide deck. Every model choice is backed by a benchmark of local 30B-class models versus hosted frontier models on real operational tasks, plus token/cost telemetry so GPU spend is a managed number. This is the sovereign-AI layer for organizations that cannot ship data to a public API.
duration: 6–10 weeks
deliverables:
  - Inference architecture and model-routing/policy design with residency and compliance guardrails
  - Engine selection and tuning on your GPU fleet (single- and multi-card configurations)
  - Local-vs-frontier benchmark on your representative tasks, with methodology and dated results
  - Token/cost telemetry and budget alerting wired into your observability stack
evidence:
  - club-3090 — multi-engine serving recipes for RTX 3090/4090/5090 (vLLM, llama.cpp, ik_llama)
  - agentic-ops-bench — local 30B-class on one RTX 3090 vs hosted frontier models, real ops tasks
  - semantic-router — programmable mixture-of-models routing for heterogeneous inference
  - gpu_rtx_3090 — eGPU operations
  - Sovereign inference routing and policy delivered for a Gulf AI holding (anonymized capability category)
vendors: [NVIDIA, Red Hat (RHEL ecosystem), Intel (iGPU/NPU edge cases)]
related: [svc-agent-platform, svc-aiops-cloudops, svc-agentic-netops]
links:
  - label: club-3090 on GitHub
    href: https://github.com/mairp/club-3090
  - label: agentic-ops-bench on GitHub
    href: https://github.com/mairp/agentic-ops-bench
---

Sovereign competence is demonstrated with what is public: serving recipes that ship
(`club-3090` carries working configs for Qwen3.6-27B/35B and Gemma4-26B/31B on one and
two cards), an honest benchmark method (`agentic-ops-bench`), model routing
(`semantic-router`), and cost telemetry (`agent-observability-stack`). Client-specific
sovereign programs are referenced only as anonymized capability categories — never as
names, topologies, or details.
