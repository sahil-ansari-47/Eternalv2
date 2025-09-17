import { joinPath } from "./fsfunc";
const handleNewFile = (basePath: string) => {
  const name = window.prompt("New file name:");
  if (name) {
    window.electronAPI.newFile(joinPath(basePath, name));
  }
};

const handleNewFolder = (basePath: string) => {
  const name = window.prompt("New folder name:");
  if (name) {
    window.electronAPI.newFolder(joinPath(basePath, name));
  }
};

const handleRename = (basePath: string) => {
  const baseName = basePath.split(/[\\/]/).pop() || "";
  const dirName = basePath.substring(0, basePath.length - baseName.length).replace(/[\\/]+$/, "");
  const newName = window.prompt("Rename folder:", baseName);
  if (newName) {
    const newPath = dirName ? `${dirName}/${newName}` : newName;
    window.electronAPI.rename(basePath, newPath);
  }
};

const handleDelete = (basePath: string) => {
  if (window.confirm(`Delete ${basePath}?`)) {
    window.electronAPI.delete(basePath);
  }
};

export { handleNewFile, handleNewFolder, handleRename, handleDelete };
