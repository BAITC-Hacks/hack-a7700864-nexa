export type HomeAction = "business" | "student";
export type HomeDestination = { role: "business" | "student"; view: "create" | "market" };
export type RoleDestination = { role: "business" | "student"; view: "mytasks" | "market" };

export const homeDestinations: Record<HomeAction, HomeDestination> = {
  business: { role: "business", view: "create" },
  student: { role: "student", view: "market" },
};

export function getHomeDestination(action: HomeAction): HomeDestination {
  return homeDestinations[action];
}

export const roleDestinations: Record<HomeAction, RoleDestination> = {
  business: { role: "business", view: "mytasks" },
  student: { role: "student", view: "market" },
};

export function getRoleDestination(role: HomeAction): RoleDestination {
  return roleDestinations[role];
}
