/** Role ke hisaab se sahi login page ka path. */
export const getLoginPathForRole = (role?: string | null) => {
  switch (role) {
    case "super_admin":
      return "/superAdmin/login";
    case "admin":
      return "/admin/login";
    case "client":
      return "/client/login";
    case "manager":
      return "/login?role=manager";
    default:
      return "/login";
  }
};

/** localStorage me saved user ka role padhkar login path (logout ke time use hota hai). */
export const getLoginPathFromStorage = () => {
  try {
    return getLoginPathForRole(JSON.parse(localStorage.getItem("user") || "null")?.role);
  } catch {
    return "/login";
  }
};
