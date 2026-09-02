
import { fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError} from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: "include",
});

let refreshPromise: Promise<any> | null = null;

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {

  let result = await baseQuery(args,api,extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  const requestUrl = typeof args === "string" ? args : args.url;

  if (
    requestUrl ==="/api/session/token/refresh-token"
  ) {
    window.location.href = "/login";
    return result;
  }

  if (refreshPromise) {
    try {
      await refreshPromise;
      return await baseQuery(args,api,extraOptions);
    } catch {
      window.location.href = "/login";
      return result;
    }
  }

  refreshPromise = Promise.resolve(
    baseQuery(
      {
        url: "/api/session/token/refresh-token",
        method: "POST",
      },
      api,
      extraOptions));

  try {
    const refreshResult = await refreshPromise;

    if (refreshResult.error) {
      window.location.href = "/login";
      return result;
    }

    result = await baseQuery(
      args,
      api,
      extraOptions
    );
    return result;
  } finally {
    refreshPromise = null;
  }
};
