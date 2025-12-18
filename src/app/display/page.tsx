import { Suspense } from "react";
import DisplayClient from "./DisplayClient";

export default function DisplayPage() {
  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        <DisplayClient />
      </Suspense>
    </main>
  );
}
