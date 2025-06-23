import { Trash2 } from "lucide-react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-ufc-black mx-4 w-full max-w-md rounded-lg border border-gray-700 p-6">
        <div className="mb-4 flex items-center space-x-3">
          <Trash2 className="h-6 w-6 text-red-500" />
          <h2 className="text-xl font-semibold text-white">Delete Account</h2>
        </div>

        <div className="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-4">
          <p className="text-sm text-red-300">
            This action cannot be undone. This will permanently disable your
            account and remove all your content from the platform.
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <p className="text-sm text-gray-400">
            Before you delete your account, please consider:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-400">
            <li>
              All your posts, comments, & rankings will be permanently removed
            </li>
            <li>You will lose access to any premium features</li>
            <li>This action cannot be reversed</li>
          </ul>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
