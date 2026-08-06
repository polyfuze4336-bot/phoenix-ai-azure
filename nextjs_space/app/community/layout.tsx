import { CommunityLayoutClient } from './_components/community-layout-client';

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <CommunityLayoutClient>{children}</CommunityLayoutClient>;
}
