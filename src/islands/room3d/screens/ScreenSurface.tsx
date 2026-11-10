/**
 * ScreenSurface.tsx — content dispatcher for in-world screens (feature
 * 001-whole-site-3d, T045–T054). Renders ONLY payload data per
 * contracts/room-payload.schema.md rule 6 (provenance): every string comes
 * from the Room Payload built from mairp content collections, site.ts CV/bio
 * data or the generated repos.yaml. The island's own copy is limited to
 * micro-UI labels.
 */
import type { RoomPayload } from '../../../lib/room-payload';
import { useRoom3D } from '../context';
import type { ScreenPlacement } from '../../room3d/rooms/screenPlacements';
import { ServiceScreen } from './content/ServiceScreen';
import { ServicesGridScreen } from './content/ServicesGridScreen';
import { ProofScreen } from './content/ProofScreen';
import { ReposScreen } from './content/ReposScreen';
import { MethodScreen } from './content/MethodScreen';
import { FaqScreen } from './content/FaqScreen';
import { AboutScreen } from './content/AboutScreen';
import { EngagementsScreen } from './content/EngagementsScreen';
import { ContactScreen } from './content/ContactScreen';
import { FocusScreen } from './content/FocusScreen';

export function ScreenSurface({
  placement,
  payload,
  reader = false,
}: {
  placement: ScreenPlacement;
  payload: RoomPayload;
  /** Flat copy in the phone reader sheet (MobileReader), not an in-world screen. */
  reader?: boolean;
}) {
  const { openScreenId } = useRoom3D();
  const open = openScreenId === placement.id;

  let content: React.ReactNode = null;
  switch (placement.contentKey) {
    case 'hero':
      content = <FocusScreen title={payload.about.tagline} lede={payload.about.caption} meta={payload.about.practice} />;
      break;
    case 'servicesGrid':
      content = <ServicesGridScreen />;
      break;
    case 'serviceDetail':
      content = <ServiceScreen mode="detail" />;
      break;
    case 'serviceEvidence':
      content = <ServiceScreen mode="evidence" />;
      break;
    case 'related':
      content = <ServicesGridScreen relatedTo={payload.serviceId} />;
      break;
    case 'proof':
      content = <ProofScreen />;
      break;
    case 'method':
      content = <MethodScreen />;
      break;
    case 'work':
      content = <EngagementsScreen />;
      break;
    case 'repos':
      content = <ReposScreen />;
      break;
    case 'trajectory':
      content = <AboutScreen section="trajectory" />;
      break;
    case 'background':
      content = <AboutScreen section="background" />;
      break;
    case 'faq':
      content = <FaqScreen />;
      break;
    case 'contact':
      content = <ContactScreen />;
      break;
    case 'aboutBio':
      content = <AboutScreen section="bio" />;
      break;
    case 'aboutJourney':
      content = <AboutScreen section="trajectory" />;
      break;
    case 'aboutCredentials':
      content = <AboutScreen section="credentials" />;
      break;
  }

  return (
    <div
      className={reader ? 'rs rs-screen rs-reader' : `rs rs-screen${open ? ' rs-open' : ''}`}
      data-screen-id={reader ? undefined : placement.id}
      data-reader={reader ? placement.id : undefined}
      data-content={placement.contentKey}
      tabIndex={-1}
      aria-label={open && !reader ? 'Screen expanded' : undefined}
    >
      {content}
    </div>
  );
}
