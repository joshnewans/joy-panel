import { ExtensionContext } from "@foxglove/studio";
import { initJoyPanel } from "./JoyPanel";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "joy-panel", initPanel: initJoyPanel });
}
