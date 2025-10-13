import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydrateRoot } from "react-router/dom";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydrateRoot />
    </StrictMode>
  );
});
