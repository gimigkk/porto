export interface NavbarIntroState {
  readonly routeResolved: boolean;
  readonly homeIntroReady: boolean;
}

export type NavbarIntroAction =
  | { readonly type: "route-change"; readonly pathname: string | null }
  | { readonly type: "intro-ready" };

export const INITIAL_NAVBAR_INTRO_STATE: NavbarIntroState = {
  routeResolved: false,
  homeIntroReady: false,
};

export function navbarIntroReducer(
  state: NavbarIntroState,
  action: NavbarIntroAction,
): NavbarIntroState {
  if (action.type === "route-change") {
    if (action.pathname === null) return INITIAL_NAVBAR_INTRO_STATE;

    return {
      routeResolved: true,
      homeIntroReady: false,
    };
  }

  return state.homeIntroReady ? state : { ...state, homeIntroReady: true };
}

export function isNavbarIntroCollapsed(
  pathname: string | null,
  state: NavbarIntroState,
): boolean {
  if (!state.routeResolved) return true;

  return pathname === "/" && !state.homeIntroReady;
}
