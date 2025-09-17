import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";

export default function Editor({
  file,
  onSave,
}: {
  file: { path: string; content: string } | null;
  onSave: (newContent: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: "//start your code here",
      extensions: [basicSetup, javascript()],
    });
    viewRef.current = new EditorView({ state: startState, parent: editorRef.current });

    return () => viewRef.current?.destroy();
  }, []);

  useEffect(() => {
    if (file && viewRef.current) {
      const state = EditorState.create({
        doc: file.content,
        extensions: [basicSetup, javascript()],
      });
      viewRef.current.setState(state);
    }
  }, [file]);

  return (
    <div className="h-2/3 w-full flex flex-col bg-primary-sidebar">
      <div className="flex justify-between text-neutral-300 px-2 py-1 text-xs">
        <span>{file?.path.split('\\').pop() ?? "No file"}</span>
        {file && (
          <button
            onClick={() => {
              const newContent = viewRef.current?.state.doc.toString() ?? "";
              onSave(newContent);
            }}
          >
            Save
          </button>
        )}
      </div>
      <div ref={editorRef} className="flex-1 overflow-auto" />
    </div>
  );
}
