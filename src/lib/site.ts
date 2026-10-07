// Site-wide constants for the consulting practice.
export const SITE = {
  name: 'Marlon Paz',
  practice: 'Network & AI Systems Consulting',
  url: 'https://mairp.ai',
  title: 'Marlon Paz — Networks that verify themselves',
  description:
    'Independent consulting by Marlon Paz: multivendor network automation, agentic NetOps/CloudOps (intent-to-fabric with verified-on-device change), and sovereign local inference on your own GPUs. Every claim on this site links to public evidence.',
  tagline: 'Networks that verify themselves.',
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
  'NVIDIA (GPU / AI infrastructure)',
  'Red Hat (Ansible, RHEL)',
] as const;

export const CERTS = [
  'CCIE',
  'Certified Kubernetes Administrator (CKA)',
  'Cisco DevNet Professional',
  'CCNP Data Center',
  'Nokia DCFP',
  'NVIDIA AI Infrastructure and Operations',
  'Isovalent Lab Champion',
] as const;

/** The methodology name (from the research synthesis): the practice's signature. */
export const METHOD = 'The Verified Fabric' as const;
