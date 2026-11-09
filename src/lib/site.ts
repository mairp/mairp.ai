// Site-wide constants for the consulting practice.
export const SITE = {
  name: 'Marlon Paz',
  practice: 'Network & AI Systems Consulting',
  url: 'https://mairp.ai',
  title: 'Marlon Paz — Infrastructure that verifies itself',
  description:
    'Independent consulting by Marlon Paz: multivendor network automation, agentic NetOps/CloudOps (intent-to-fabric with verified-on-device change), and sovereign local inference on your own GPUs. Every claim on this site links to public evidence.',
  tagline: 'Infrastructure that verifies itself.',
  caption: 'AI you can run on your own GPUs.',
  email: 'marlon.paz@ieee.org',
  cv: '/cv-MARLON-PAZ-CONSULTANT-PROFILE.pdf',
  github: 'https://github.com/mairp',
  linkedin: 'https://www.linkedin.com/in/marlon-paz-62b02366/',
  credly: 'https://www.credly.com/users/marlon-de-paz',
  location: 'Abu Dhabi, UAE',
  languages: ['EN', 'ES', 'PT'],
  copyright: 'Marlon Paz',
} as const;

export const NAV = [
  { href: '/#services', label: 'Services' },
  { href: '/#proof', label: 'Proof' },
  { href: '/#open-source', label: 'Open source' },
  { href: '/about/', label: 'About' },
] as const;

/** Vendor fluency band: CV-backed, shown as text — never as logo soup. */
export const VENDORS = [
  'Cisco (IOS-XR, NX-OS)',
  'Nokia (SR Linux, SR OS)',
  'Juniper',
  'SONiC',
  'loadbalancer.org (application delivery)',
  'NVIDIA (GPU / AI infrastructure)',
  'Red Hat (Ansible, RHEL)',
] as const;

export const CERTS = [
  'CCIE',
  'Certified Kubernetes Administrator (CKA)',
  'CCNP Automation',
  'CCNP Data Center',
  'NVIDIA-Certified Professional: Agentic AI',
  'NVIDIA AI Infrastructure and Operations',
  'Nokia DCFP',
  'Isovalent Lab Champion',
  'CCNA Automation',
  'CCNA',
] as const;

/** The badge wall: each links to its public verification page (Credly or NVIDIA). */
export const BADGES = [
  { name: 'NVIDIA-Certified Professional: Agentic AI', issuer: 'NVIDIA', year: 2026, img: 'nvidia-ncp-agentic-ai', url: 'https://credential.nvidia.com/261533bc-e7df-43a6-bf8c-9150e73cd1d6' },
  { name: 'NVIDIA-Certified Associate: AI Infrastructure and Operations', issuer: 'NVIDIA', year: 2025, img: 'nvidia-nca-aiio', url: 'https://www.credly.com/badges/0a453125-9c86-44fe-9fd2-0465961b7061' },
  { name: 'CCIE Service Provider', issuer: 'Cisco', year: 2019, img: 'cisco-ccie-sp', url: 'https://www.credly.com/badges/7cecdec8-a72b-4f3d-ae91-2e17ca8ef0ef' },
  { name: 'CCNP Automation', issuer: 'Cisco', year: 2025, img: 'cisco-ccnp-automation', url: 'https://www.credly.com/badges/690633fa-bf4d-4c7e-90b0-b93adba6d136' },
  { name: 'Certified Kubernetes Administrator', issuer: 'Linux Foundation', year: 2024, img: 'lf-cka', url: 'https://www.credly.com/badges/a4a9b6e6-2420-4311-ae34-eba871f76b2e' },
  { name: 'CCNP Data Center', issuer: 'Cisco', year: 2025, img: 'cisco-ccnp-data-center', url: 'https://www.credly.com/badges/28bd7c0e-60a1-4f49-a26c-a62e2edca4a2' },
  { name: 'Specialist: Data Center Networking Automation', issuer: 'Cisco', year: 2025, img: 'cisco-specialist-dc-networking-automation', url: 'https://www.credly.com/badges/02cb52e8-f5f5-4238-9379-492b78fe23b9' },
  { name: 'Lab Champion: 20 labs', issuer: 'Isovalent', year: 2024, img: 'isovalent-lab-champion-20', url: 'https://www.credly.com/badges/e82c6c9d-f227-4e92-bae9-a39687ec5d50' },
  { name: 'Lab Champion: 10 labs', issuer: 'Isovalent', year: 2024, img: 'isovalent-lab-champion-10', url: 'https://www.credly.com/badges/ad08e82f-b6eb-46ac-884d-5f0dd3dcfd26' },
  { name: 'CCNP Enterprise', issuer: 'Cisco', year: 2015, img: 'cisco-ccnp-enterprise', url: 'https://www.credly.com/badges/d17d82a9-f9c3-42ee-9e60-c9c5fdf48f90' },
  { name: 'Specialist: Automation Core', issuer: 'Cisco', year: 2022, img: 'cisco-specialist-automation-core', url: 'https://www.credly.com/badges/4dce67a3-b29c-43a6-a42c-0ac1e35b4aed' },
  { name: 'Data Center Fabric Professional', issuer: 'Nokia', year: 2021, img: 'nokia-ncp-dcf', url: 'https://www.credly.com/badges/e253b0fa-0e58-457c-8980-17ebde694ffc' },
  { name: 'CCNA Automation', issuer: 'Cisco', year: 2020, img: 'cisco-ccna-automation', url: 'https://www.credly.com/badges/2903c928-7a06-4b8e-9f3d-ea3b59ff6d4d' },
  { name: 'CCNA', issuer: 'Cisco', year: 2013, img: 'cisco-ccna', url: 'https://www.credly.com/badges/13b7ecae-86ba-4866-850e-9f1c83154431' },
  { name: 'DevNet Class of 2020', issuer: 'Cisco', year: 2020, img: 'cisco-devnet-class-2020', url: 'https://www.credly.com/badges/645712e4-d2c6-449b-aa76-c63bfe85c782' },
] as const;

/** The methodology name (from the research synthesis): the practice's signature. */
export const METHOD = 'The Verified Fabric' as const;

/**
 * The Verified Fabric loop steps (mairp-owned copy from the homepage method
 * section). Single source for the flat page markup and the 3D room payloads.
 */
export const METHOD_STEPS = [
  'Intent — plain language + constraints, captured, scoped, verified against policy',
  'Agents & controllers — plan, reconcile, dry-run; declarative resources applied deterministically with rollback',
  'Verified on device — gNMI proves it, or it did not happen; drift re-verified and repaired automatically',
] as const;

/** Trajectory rail (home variant, with the per-stop de-risk note). */
export const TRAJECTORY_HOME = [
  { yr: '2024 — now', ttl: 'Network, Automation & Observability Architect', org: 'Core42 · Abu Dhabi', derisk: 'Sovereign inference, cloud networking, DCI' },
  { yr: '2019 — 2024', ttl: 'IP/MPLS Network Architect', org: 'Nokia · Portugal', derisk: 'Critical-infrastructure assessment — smart-grid, railway, DTaaS, Secure ZTP' },
  { yr: '2018 — 2019', ttl: 'Network Consulting Engineer', org: 'Cisco (blue badge) · Honduras', derisk: 'Cisco-estate consulting discipline' },
  { yr: '2016 — 2018', ttl: 'Network & Security Specialist', org: 'Citi · San Salvador', derisk: 'Financial-services change rigor' },
  { yr: '2014 — 2016', ttl: 'Telecommunications Engineer', org: 'Tigo · San Salvador', derisk: 'Carrier operations ground truth' },
];

/** Trajectory timeline (about variant, full postings). */
export const TRAJECTORY_ABOUT = [
  { yr: '2024 — present', ttl: 'Network, Automation and Observability Architect', org: 'Core42 · Abu Dhabi, UAE · DCI and cloud networking, sovereign AI programs' },
  { yr: '2019 — 2024', ttl: 'IP/MPLS Network Architect', org: 'Nokia · Amadora, Portugal — DTaaS (Digital Twin as a Service), Secure ZTP, smart-grid & railway critical infrastructure' },
  { yr: '2018 — 2019', ttl: 'Network Consulting Engineer', org: 'Layer2 Consulting (Cisco) · Honduras' },
  { yr: '2016 — 2018', ttl: 'Network & Security Specialist', org: 'Citi (contract) · San Salvador' },
  { yr: '2014 — 2016', ttl: 'Telecommunications Engineer', org: 'Tigo (contract) · San Salvador' },
  { yr: '2009', ttl: 'B.Sc. Electrical Engineering', org: 'Universidad Centroamericana (UCA) · San Salvador' },
];

/** Peer-reviewed, co-authored publications (home + about). */
export const PAPERS = [
  {
    name: 'Decentralized & Dynamic Zero-Touch Provisioning of Leaf-Spine EVPN Data Centers',
    venue: 'IEEE',
    href: 'https://ieeexplore.ieee.org/document/11080420/',
    note: 'Autonomous agents provision AI infrastructure and networks with zero-touch — inferring roles from topology and self-healing across the fabric.',
  },
  {
    name: 'Kubernetes-Aware Load Balancing for Leaf-Spine EVPN Data Centers',
    venue: 'Springer · Journal of Cloud Computing',
    href: 'https://link.springer.com/article/10.1186/s13677-025-00814-0',
    note: 'Distributed agents at leaf routers feed live Kubernetes pod data into the fabric, dynamically tuning ECMP weights via EVPN/BGP extended communities so routing aligns with pod placement.',
  },
];

/** Working stack (about page). */
export const SKILLS = {
  Networks: 'IP/MPLS, SR, BGP/EVPN, VXLAN, Cisco IOS-XR and NX-OS, Nokia SR Linux and SR OS, SONiC, containerlab',
  Platforms: 'Kubernetes, Cilium/eBPF, Go operators, Python, gNMI, Prometheus, OpenTelemetry, Grafana',
  Agents: 'LangGraph, AGNTCY (A2A, SLIM), MCP, LiteLLM, Claude Code',
};
