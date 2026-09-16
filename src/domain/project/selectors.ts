import type { InlineButton, Project, Screen } from "./types";

export type DerivedFlowEdge = {
  id: string;
  source: string;
  target: string;
  buttonId: string;
  label: string;
};

export function getScreen(project: Project, screenId: string): Screen | undefined {
  return project.screens.find((screen) => screen.id === screenId);
}

export function getButton(
  project: Project,
  screenId: string,
  rowId: string,
  buttonId: string,
): InlineButton | undefined {
  return getScreen(project, screenId)
    ?.keyboard.find((row) => row.id === rowId)
    ?.buttons.find((button) => button.id === buttonId);
}

export function deriveFlowEdges(project: Project): DerivedFlowEdge[] {
  return project.screens.flatMap((screen) =>
    screen.keyboard.flatMap((row) =>
      row.buttons.flatMap((button) =>
        button.action.type === "screen"
          ? [
              {
                id: `button:${button.id}`,
                source: screen.id,
                target: button.action.screenId,
                buttonId: button.id,
                label: button.text,
              },
            ]
          : [],
      ),
    ),
  );
}
