export interface NavbarIntroState {
  readonly homeIntroReady: boolean;
}

export type NavbarIntroAction =
  | { readonly type: "route-change" }
  | { readonly type: "intro-ready" };

export const INITIAL_NAVBAR_INTRO_STATE: NavbarIntroState = {
  homeIntroReady: false,
};

export function navbarIntroReducer(
  state: NavbarIntroState,
  action: NavbarIntroAction,
): NavbarIntroState {
  if (action.type === "route-change") {
    return state.homeIntroReady ? INITIAL_NAVBAR_INTRO_STATE : state;
  }

  return state.homeIntroReady ? state : { homeIntroReady: true };
}

export function isNavbarIntroCollapsed(
  pathname: string,
  state: NavbarIntroState,
): boolean {
  return pathname === "/" && !state.homeIntroReady;
}
