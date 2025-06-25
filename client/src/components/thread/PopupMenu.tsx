import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PopupMenuProps {
  isOpen: boolean;
  onCopyLink: () => void;
  onShareOnX: () => void;
  onEdit?: () => void;
  canEditThread?: boolean;
  canDeleteThread?: boolean;
  onClickDelete?: () => void;
  onClose: () => void;
  createdAt: Date | string | number;
  handleDeleteMutation: () => void;
}

const PopupMenu: React.FC<PopupMenuProps> = ({
  isOpen,
  onCopyLink,
  onShareOnX,
  onEdit,
  canEditThread,
  canDeleteThread,
  onClickDelete,
  onClose,
  createdAt,
  handleDeleteMutation,
}) => {
  if (!isOpen) return null;

  // Convert createdAt to a Date object if it's not already
  const createdAtDate =
    createdAt instanceof Date ? createdAt : new Date(createdAt);

  // Check if more than an hour has passed since creation
  const oneHourInMs = 60 * 60 * 1000;
  const isMoreThanOneHourOld =
    Date.now() - createdAtDate.getTime() > oneHourInMs;
  const canEdit = canEditThread && !isMoreThanOneHourOld;

  return (
    <TooltipProvider>
      <div className='absolute bottom-full right-0 z-[100] mb-2 w-40 rounded-md bg-gray-800 shadow-lg ring-1 ring-gray-700 ring-opacity-5'>
        <div className='py-1' role='menu' aria-orientation='vertical'>
          <button
            onClick={() => {
              onCopyLink();
              onClose();
            }}
            className='flex w-full items-center px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-700'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='mr-2 h-4 w-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3'
              />
            </svg>
            Copy Link
          </button>
          <button
            onClick={() => {
              onShareOnX();
              onClose();
            }}
            className='flex w-full items-center px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-700'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='mr-2 h-4 w-4'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
            </svg>
            Share on X
          </button>
          {canEditThread && onEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    if (canEdit) {
                      onEdit();
                      onClose();
                    }
                  }}
                  disabled={!canEdit}
                  className={`flex w-full items-center px-4 py-2 text-sm transition-colors ${
                    canEdit
                      ? "text-gray-200 hover:bg-gray-700"
                      : "cursor-not-allowed text-gray-500"
                  }`}
                  role='menuitem'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='mr-2 h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                    />
                  </svg>
                  Edit
                </button>
              </TooltipTrigger>
              {!canEdit && (
                <TooltipContent>
                  <p>
                    Posts can only be edited within the first 1 hour after
                    they're published
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          )}
          {/* Add delete button if user is author or has permission */}
          {canDeleteThread && (
            <button
              onClick={onClickDelete}
              disabled={!canDeleteThread}
              className='flex w-full items-center px-4 py-2 text-sm text-red-500 transition-colors hover:bg-gray-700 hover:text-red-500'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='mr-2 h-4 w-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                />
              </svg>
              Delete
            </button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PopupMenu;
