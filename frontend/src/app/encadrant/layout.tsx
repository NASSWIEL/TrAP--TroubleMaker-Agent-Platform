import { AppSidebar } from "@/components/app-sidebar";

export default function EncadrantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*<div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="pl-64">
        {children}
      </div>
    </div>*/
    children
  );
}
