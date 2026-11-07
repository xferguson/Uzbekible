export interface EditHookInput {
  tool_name?: string;
  tool_input?: {
    file_path?: string;
    content?: string;
    old_string?: string;
    new_string?: string;
    replace_all?: boolean;
  };
  cwd?: string;
}
export function decideEdit(
  input: EditHookInput,
  readCurrent: (path: string) => string | null,
): { block: false } | { block: true; reason: string };
