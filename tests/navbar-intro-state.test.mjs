import assert from "node:assert/strict";
import test from "node:test";

import {
  INITIAL_NAVBAR_INTRO_STATE,
  isNavbarIntroCollapsed,
  navbarIntroReducer,
} from "../components/layout/navbarIntroState.ts";

test("TestV6_NavbarHiddenUntilCurrentIntroReady", () => {
  let state = INITIAL_NAVBAR_INTRO_STATE;

  assert.equal(isNavbarIntroCollapsed("/", state), true);

  state = navbarIntroReducer(state, { type: "route-change", pathname: "/" });
  assert.equal(isNavbarIntroCollapsed("/", state), true);

  state = navbarIntroReducer(state, { type: "intro-ready" });
  assert.equal(isNavbarIntroCollapsed("/", state), false);

  state = navbarIntroReducer(state, {
    type: "route-change",
    pathname: "/projects",
  });
  assert.equal(isNavbarIntroCollapsed("/projects", state), false);

  state = navbarIntroReducer(state, { type: "route-change", pathname: "/" });
  assert.equal(isNavbarIntroCollapsed("/", state), true);
});

test("TestV7_UnresolvedPathFailsClosed", () => {
  let state = INITIAL_NAVBAR_INTRO_STATE;

  assert.equal(isNavbarIntroCollapsed(null, state), true);

  state = navbarIntroReducer(state, { type: "route-change", pathname: null });
  assert.equal(isNavbarIntroCollapsed(null, state), true);
});
