import FileSystem from "./FileSystem";
import { useState } from "react";
const LeftPanel = ({
  content,
  onOpenFile,
}: {
  content: "files" | "search" | "git" | "db" | null;
  onOpenFile: (path: string, content: string) => void;
}) => {
  const [_, setOpenFile] = useState<{
    path: string;
    content: string;
  } | null>(null);
  switch (content) {
    case "files":
      return (
        <FileSystem
          onOpenFile={onOpenFile}
        />
      );
    case "search":
      return <div className="h-[calc(100vh-52px)] w-1/3">Search</div>;
    case "git":
      return <div className="h-[calc(100vh-52px)] w-1/3">Git</div>;
    case "db":
      return <div className="h-[calc(100vh-52px)] w-1/3">Database</div>;
    default:
      return null;
  }
};

export default LeftPanel;
