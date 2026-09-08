
import { fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: "include",
});

let refreshPromise: Promise<unknown> | null = null;
let isRedirecting = false;

const redirectToLogin = () => {
  if (isRedirecting) return;

  isRedirecting = true;

  // Role pehle padho, tabhi pata chalega client ko kahan bhejna hai
  let role: string | undefined;
  try {
    role = JSON.parse(localStorage.getItem("user") || "null")?.role;
  } catch {
    role = undefined;
  }

  localStorage.removeItem("user");

  if (["/login", "/admin/login", "/superAdmin/login", "/client/login"].includes(window.location.pathname)) {
    return;
  }

  window.location.replace(role === "client" ? "/client/login" : "/login");
};

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {

  const result = await baseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  const requestUrl = typeof args === "string" ? args : args.url;

  if (
    requestUrl === "/api/session/token/refresh-token" ||
    requestUrl.includes("/auth/login")
  ) {
    if (requestUrl === "/api/session/token/refresh-token") {
      redirectToLogin();
    }
    return result;
  }

  if (refreshPromise) {
    try {
      await refreshPromise;
      return await baseQuery(args,api,extraOptions);
    } catch {
      redirectToLogin();
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
      extraOptions
    )
  ).then((refreshResult) => {
    if (refreshResult.error) {
      throw refreshResult.error;
    }
  });

  try {
    await refreshPromise;
    return await baseQuery(args, api, extraOptions);
  } catch {
    redirectToLogin();
    return result;
  } finally {
    refreshPromise = null;
  }
};
