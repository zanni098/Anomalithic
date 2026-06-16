import { render } from "ink";
import { createElement } from "react";
import { App, type TuiProps } from "./app.js";

/** Renders the full-screen TUI and resolves when the user exits. */
export async function runTui(props: TuiProps): Promise<void> {
  const instance = render(createElement(App, props));
  await instance.waitUntilExit();
}
