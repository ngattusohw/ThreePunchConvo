import React from "react";

interface PopupMenuProps {
  isOpen: boolean;
  onCopyLink: () => void;
  onShareOnX: () => void;
  onEdit?: () => void;
  canEditThread?: boolean;
  onClose: () => void;
}

const PopupMenu: React.FC<PopupMenuProps> = ({
  isOpen,
  onCopyLink,
  onShareOnX,
  onEdit,
  canEditThread,
  onClose,
}) => {
  if (!isOpen) return null;
  return (
    <div className="absolute bottom-full right-0 mb-2 w-40 rounded-md shadow-lg bg-gray-800 ring-1 ring-gray-700 ring-opacity-5 z-[100]">
      <div className="py-1" role="menu" aria-orientation="vertical">
        <button
          onClick={() => {
            onCopyLink();
            onClose();
          }}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
          Copy Link
        </button>
        <button
          onClick={() => {
            onShareOnX();
            onClose();
          }}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Share on X
        </button>
        {canEditThread && onEdit && (
          <button
            onClick={() => {
              onEdit();
              onClose();
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
            role="menuitem"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default PopupMenu; 