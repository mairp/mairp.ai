---
name: Critical-Network Security & Telemetry Assessment
order: 4
status: available
oneLine: Your utility, railway, ISP or data-center fabric gets a quantum-safe segmentation and streaming-telemetry readiness review — hands-on, not a checklist.
summary: Operators of critical infrastructure in energy, rail and telecom face security requirements (ANYsec/MACsec-class protection, real-time visibility) that generic consultants treat theoretically. You get working lab-based validation on the actual router-OS class you run, an interactive telemetry baseline, and a prioritized roadmap. Where automation gaps surface, they feed directly into the Agentic NetOps service.
duration: 3–6 weeks
deliverables:
  - Security and segmentation assessment of the target fabric (quantum-safe ANYsec/MACsec readiness)
  - Streaming-telemetry baseline and interactive lab replicating your vendor mix
  - Prioritized remediation roadmap with vendor-specific configuration guidance
  - Optional automation follow-on scoped into Agentic Network Operations
evidence:
  - sros-anysec-lab — quantum-safe ANYsec encryption demo on containerlab with Nokia SROS FP5 vSIMs
  - sros-anysec-macsec-lab — ANYsec + MACsec lab environment
  - srl-sros-telemetry-lab — interactive streaming telemetry lab, Nokia SR Linux + SR OS
  - vrnetlab — contributed Nokia vr-sros ISA-MS card support
  - ISP subscriber assurance automation on carrier router OS (anonymized capability category)
vendors: [Nokia (SR OS, SR Linux), Cisco (IOS-XR), Juniper]
related: [svc-agentic-netops]
links:
  - label: sros-anysec-lab on GitHub
    href: https://github.com/mairp/sros-anysec-lab
  - label: srl-sros-telemetry-lab on GitHub
    href: https://github.com/mairp/srl-sros-telemetry-lab
---

The assessment's pedigree is a decade of critical-infrastructure networking: Nokia
IP/MPLS architecture for smart-grid and railway networks (2019–2024), telecom and
financial-services operations before that, and peer-reviewed work on zero-touch EVPN
fabrics. The labs run on containerlab with the vendor's own vSIMs, so findings are
demonstrated, not asserted.
