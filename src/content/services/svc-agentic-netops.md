---
name: Agentic Network Operations — Intent-to-Fabric
order: 1
status: available
oneLine: Plain-language network intent becomes verified, on-device configuration changes with a closed telemetry loop — and zero unverified success reports.
summary: You stop pushing change windows through hand-crafted CLI and start declaring the fabric you want. Multi-agent intent tiers translate business and engineer language into validated changes, Kubernetes-native controllers reconcile them onto live EVPN/VXLAN fabrics (SONiC and Nokia SR Linux), and gNMI telemetry closes the loop so nothing is reported done until the device proves it. Drift is detected and repaired automatically, which converts audit anxiety into a demonstrable verification trail.
duration: 8–12 weeks (PoC 4–6 weeks)
deliverables:
  - Fabric intent model and multi-agent orchestration design (AGNTCY/LangGraph patterns)
  - Reference implementation reconciling declarative state onto a containerlab-plus-Kubernetes EVPN/VXLAN fabric
  - gNMI closed-loop verification and drift-repair pipeline with a published verification policy
  - Demo recording and convergence metrics on your representative topology
evidence:
  - agentic-netops (github.com/mairp) — 4/4 constructs converge; 0 unverified success reports; 6½-min demo
  - agentic-netops-srl — the Nokia SR Linux variant
  - srl-sros-telemetry-lab — interactive streaming telemetry
  - IEEE paper — decentralized zero-touch provisioning of leaf-spine EVPN data centers
vendors: [Cisco (SONiC, IOS-XR, NX-OS), Nokia (SR Linux, SR OS), Juniper, loadbalancer.org (ADC), NVIDIA, Red Hat (Ansible/RHEL)]
related: [svc-aiops-cloudops, svc-critical-fabric, svc-agent-platform]
links:
  - label: agentic-netops on GitHub
    href: https://github.com/mairp/agentic-netops
  - label: Watch the intent-tier demo
    href: https://github.com/mairp/agentic-netops#readme
---

The reference build runs a 2-spine / 2-leaf / 4-client SONiC EVPN/VXLAN fabric in
containerlab next to a kind cluster. A LangGraph supervisor with mapper, allocator and
deployer agents (AGNTCY patterns, A2A/SLIM) turns requests like *"stretch this mac-vrf
across both leaves"* into declarative resources; Go controllers reconcile them with
server-side dry-run and deterministic apply; per-node verification gates mark services
Ready only after the device confirms. Converged services are re-verified every five
minutes — drift is repaired, and said so.

Adoption is staged: start with one construct class on a lab fabric, expand at your pace.
Every phase defines its verification bar up front, and you see the evidence on your own
fabric before sign-off.
