import { SignOutButton } from "@clerk/clerk-react";
const MenuBar = () => {
  return (
    <div
      className="flex items-center justify-between bg-primary/30 text-gray-200 h-8 px-1 select-none border-b border-primary" // makes bar draggable
    >
      {/* Left: App Menu */}
      <div className="flex space-x-2 text-sm text-primary">
        <button className="hover:bg-primary/40 px-2 py-1 rounded-lg">File</button>
        <button className="hover:bg-primary/40 px-2 py-1 rounded-lg">Edit</button>
        <button className="hover:bg-primary/40 px-2 py-1 rounded-lg">View</button>
        <button className="hover:bg-primary/40 px-2 py-1 rounded-lg">Help</button>
        <SignOutButton className="hover:bg-primary/40 px-2 py-1 rounded-lg">Sign Out</SignOutButton>
        <button className="hover:bg-primary/40 px-2 py-1 rounded-lg" onClick={() => window.electronAPI.newWindow()}>New Window</button>
      </div>

      {/* Center: App name */}
      <div className="text-xs text-gray-400">Eternal</div>

      {/* Right: Window controls */}
      <div className="flex">
        <button
          className="w-10 h-8 flex items-center justify-center hover:bg-gray-700"
          onClick={() => window.electronAPI.minimize()}
        >
          &#x2013;
        </button>
        <button
          className="w-10 h-8 flex items-center justify-center hover:bg-gray-700"
          onClick={() => window.electronAPI.maximize()}
        >
          ☐
        </button>
        <button
          className="w-10 h-8 flex items-center justify-center hover:bg-red-600"
          onClick={() => window.electronAPI.close()}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default MenuBar;
