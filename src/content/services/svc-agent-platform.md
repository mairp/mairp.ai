---
name: Agent-Fleet Platform — Memory, Routing, Observability
order: 3
status: available
oneLine: A governed multi-agent platform with shared memory, model routing, and full token/cost/trace telemetry — so fleets are operable, not just demoed.
summary: 'Teams deploying more than one agent inherit the three problems that kill them at scale: memory, routing, and knowing what anything costs. You get a shared MCP gateway and GPU-accelerated RAG memory tier, a programmable mixture-of-models routing layer, and complete token/cost/trace observability wired into Prometheus/Grafana-grade tooling with budget alerts. The result is a control plane your ops and finance teams can both live with.'
duration: 8–12 weeks
deliverables:
  - 'Agent-fleet reference architecture: orchestration, memory (RAG), routing, and observability layers'
  - Shared MCP gateway and 3-tier RAG memory implementation over GGUF embeddings
  - Token/cost/trace telemetry stack (LiteLLM + OpenTelemetry to Prometheus, Loki, Tempo, Grafana; tracing via Arize Phoenix)
  - Budget alerting and cost-per-workflow reporting
evidence:
  - qmd-memory-stack — local GPU-accelerated 3-tier RAG memory, ~19× query speedup (Intel Arc iGPU, Vulkan)
  - qmd-gateway — shared, warm, writable MCP memory gateway for a multi-agent fleet
  - agent-observability-stack — LiteLLM + OTel → Prometheus/Loki/Tempo/Grafana/Phoenix; video walkthrough public
  - semantic-router — mixture-of-models routing
  - Multi-agent fleet orchestration at scale, delivered (anonymized capability category)
  - Guarded, agent-operated control planes with GitOps DR (anonymized capability category)
vendors: [NVIDIA, Intel, Red Hat, Grafana/OpenTelemetry ecosystem]
related: [svc-local-inference, svc-agent-delivery]
links:
  - label: agent-observability-stack on GitHub
    href: https://github.com/mairp/agent-observability-stack
  - label: qmd-memory-stack on GitHub
    href: https://github.com/mairp/qmd-memory-stack
---

The observability stack is self-hostable end to end and GPU-aware (Intel iGPU/NPU plus
NVIDIA RTX 3090 eGPU), with dynamic onboarding and Telegram budget alerts. The memory
tier fails open: if recall degrades, queries still answer. The routing layer treats
models as a portfolio — policy decides who serves what, and telemetry proves the
policy right or wrong on dated numbers.
