export type HomeAction = "business" | "student";
export type HomeDestination = { role: "business" | "student"; view: "create" | "market" };

export const homeDestinations: Record<HomeAction, HomeDestination> = {
  business: { role: "business", view: "create" },
  student: { role: "student", view: "market" },
};

export function getHomeDestination(action: HomeAction): HomeDestination {
  return homeDestinations[action];
}
