import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ColdEmailRoiCalculatorPage } from "@/pages/ColdEmailRoiCalculatorPage";
import { PAGE_PATH, SITE_URL } from "@/pages/seo";

/** Standalone build only: other site links point at pages that live on myntmore.com. */
function ExternalSitePage() {
  const { pathname } = useLocation();
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-lg font-bold">This link points to a page on myntmore.com.</p>
      <a className="font-semibold underline decoration-primary decoration-2 underline-offset-4" href={`${SITE_URL}${pathname}`}>
        Open {SITE_URL.replace("https://", "")}
        {pathname}
      </a>
      <a className="text-sm text-muted-foreground underline" href={PAGE_PATH}>
        Back to the calculator
      </a>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={PAGE_PATH} replace />} />
        <Route path={PAGE_PATH} element={<ColdEmailRoiCalculatorPage />} />
        <Route path="*" element={<ExternalSitePage />} />
      </Routes>
    </BrowserRouter>
  );
}
