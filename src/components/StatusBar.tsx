const StatusBar = ({
  file,
}: {
  file: { path: string; content: string } | null;
}) => {
  return (
    <div className="text-xs bg-primary-sidebar text-neutral-300 px-2 py-1">{file?.path ?? "No file open"}</div>
  );
};

export default StatusBar;
