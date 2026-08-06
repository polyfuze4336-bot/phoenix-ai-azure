import { HcpLayoutClient } from './_components/hcp-layout-client';

export default function HcpLayout({ children }: { children: React.ReactNode }) {
  return <HcpLayoutClient>{children}</HcpLayoutClient>;
}
