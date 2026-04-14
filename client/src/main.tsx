import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
});

// Stub fetch — returns empty tRPC responses immediately so queries resolve fast
// Components fall back to localStorage via `data ?? []` / `data ?? null`
const stubFetch: typeof fetch = async (_input, init) => {
  let items: unknown[] = [];
  try {
    const body = JSON.parse((init?.body as string) ?? "[]");
    items = Array.isArray(body) ? body : [body];
  } catch {
    items = [{}];
  }
  const batchData = items.map(() => ({
    result: { data: { json: null } },
  }));
  return new Response(JSON.stringify(batchData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch: stubFetch,
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
