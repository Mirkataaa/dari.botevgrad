import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

const Layout = ({ children }: { children: ReactNode }) => {
  useRealtimeSync("campaigns", [["campaigns"], ["campaign"], ["campaign-stats"]]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
