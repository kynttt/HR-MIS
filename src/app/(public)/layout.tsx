import { type ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#f6f9fc]"><div className="page-enter">{children}</div></div>;
}

