import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { SignOutButton, SignedIn } from "@clerk/clerk-react";
import { Minus, Square, Copy, X } from "lucide-react";
import { useEffect, useState } from "react";

const menuItemStyle =
  "hover:bg-gray-700 px-2 py-1 rounded-lg cursor-default text-sm";

const Dropdown = ({
  label,
  items,
}: {
  label: string;
  items: { label: string; onClick?: () => void }[];
}) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <button className={`${menuItemStyle}`}>{label}</button>
    </DropdownMenu.Trigger>

    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={4}
        className="min-w-[140px] bg-gray-800 text-gray-200 rounded-md shadow-lg p-1 border border-gray-700"
      >
        {items.map((item, idx) => (
          <DropdownMenu.Item
            key={idx}
            className="px-2 py-1 text-sm rounded hover:bg-gray-700 cursor-pointer select-none"
            onClick={item.onClick}
          >
            {item.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
);

export default function MenuBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let cleanupMax: (() => void) | null = null;
    let cleanupUnmax: (() => void) | null = null;

    const init = async () => {
      const maximized = await window.electronAPI.isMaximized();
      setIsMaximized(maximized);

      cleanupMax = window.electronAPI.onMaximize(() => setIsMaximized(true));
      cleanupUnmax = window.electronAPI.onUnmaximize(() =>
        setIsMaximized(false)
      );
    };
    init();

    return () => {
      cleanupMax?.();
      cleanupUnmax?.();
    };
  }, []);

  return (
    <div
      className="flex items-center justify-between bg-primary-sidebar text-neutral-300 h-8 px-1 select-none border-b border-primary"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* Left: Menus */}
      <div
        className="flex space-x-1 text-sm"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <Dropdown
          label="File"
          items={[
            { label: "New File", onClick: () => console.log("New clicked") },
            { label: "New Folder", onClick: () => console.log("New clicked") },
            {
              label: "New Window",
              onClick: () => window.electronAPI.newWindow(),
            },
            {
              label: "Open Folder",
              onClick: () => console.log("Open clicked"),
            },
            { label: "Save", onClick: () => console.log("Save clicked") },
            { label: "Save As", onClick: () => console.log("Save As clicked") },
            {
              label: "Close Editor",
              onClick: () => console.log("Close Editor"),
            },
            {
              label: "Close Workspace",
              onClick: () => console.log("Close Workspace"),
            },
            {
              label: "Exit",
              onClick: () => window.electronAPI.close(),
            },
          ]}
        />
        <Dropdown
          label="Edit"
          items={[
            { label: "Undo" },
            { label: "Redo" },
            { label: "Cut" },
            { label: "Copy" },
            { label: "Paste" },
            { label: "Find" },
            { label: "Replace" },
            { label: "Find in Workspace" },
            { label: "Replace in Workspace" },
          ]}
        />
        <Dropdown
          label="View"
          items={[
            { label: "Reload", onClick: () => window.location.reload() },
            { label: "Zoom In" },
            { label: "Zoom Out" },
          ]}
        />
        <Dropdown
          label="Git"
          items={[
            { label: "Clone" },
            { label: "Commit" },
            { label: "Push" },
            { label: "Pull" },
            { label: "Checkout Branch..." },
          ]}
        />
        <Dropdown
          label="Help"
          items={[
            { label: "Documentation" },
            { label: "About", onClick: () => console.log("About clicked") },
          ]}
        />
        <SignedIn>
          <SignOutButton>
            <button className={`${menuItemStyle}`}>Sign Out</button>
          </SignOutButton>
        </SignedIn>
      </div>
      {/* Center: App Name */}
      <div className="text-xs">Eternal</div>
      {/* Right: Window Controls */}
      <div
        className="flex"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <button
          className="w-10 h-8 flex items-center justify-center hover:bg-gray-700"
          onClick={() => window.electronAPI.minimize()}
          aria-label="Minimize window"
        >
          <Minus size={14} />
        </button>
        {isMaximized ? (
          <button
            className="w-10 h-8 flex items-center justify-center hover:bg-gray-700"
            onClick={() => window.electronAPI.unmaximize()}
            aria-label="Restore window"
          >
            <Copy size={14} />
          </button>
        ) : (
          <button
            className="w-10 h-8 flex items-center justify-center hover:bg-gray-700"
            onClick={() => window.electronAPI.maximize()}
            aria-label="Maximize window"
          >
            <Square size={14} />
          </button>
        )}
        <button
          className="w-10 h-8 flex items-center justify-center hover:bg-red-600"
          onClick={() => window.electronAPI.close()}
          aria-label="Close window"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
