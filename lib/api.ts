import { Effect, pipe } from "effect";

export const fetchApi = <T>(url: string, options?: RequestInit) =>
  pipe(
    Effect.tryPromise({
      try: () => fetch(url, options),
      catch: (error) => new Error(`Failed to fetch ${url}: ${error}`),
    }),
    Effect.flatMap((response) =>
      Effect.tryPromise({
        try: () => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json() as Promise<T>;
        },
        catch: (error) => new Error(`Failed to parse response: ${error}`),
      })
    ),
    Effect.catchAll((error) =>
      Effect.succeed({ error: true, message: String(error) } as T)
    )
  );

export const postApi = <T>(url: string, data: unknown) =>
  fetchApi<T>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

export const patchApi = <T>(url: string, data: unknown) =>
  fetchApi<T>(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
