import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useClerk } from "@clerk/clerk-react";
import { useMemoizedUser } from "@/hooks/useMemoizedUser";
import { ChevronsUpDown, LogOut, Trash2, User as UserIcon } from "lucide-react";
import { formatUsername } from "@/lib/utils";

interface UserMenuProps {
  handleDeleteAccount: () => void;
}

export function UserMenu({ handleDeleteAccount }: UserMenuProps) {
  const { user } = useMemoizedUser();
  const { signOut, openUserProfile } = useClerk();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const deleteAccount = async () => {
    await handleDeleteAccount();
    setShowDeleteModal(false);
    await signOut();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className='flex items-center space-x-2 text-sm font-medium text-white outline-none'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user.imageUrl} alt={user.username ?? ""} />
            <AvatarFallback>
              {user.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='bg-ufc-black w-56 border-gray-700 text-white'
          align='end'
        >
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm font-medium leading-none'>
                {user.fullName}
              </p>
              <p className='text-xs leading-none text-gray-400'>
                @{user.username}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className='bg-gray-700' />
          <DropdownMenuItem
            onClick={() => openUserProfile()}
            className='cursor-pointer focus:bg-gray-700 focus:text-white'
          >
            <UserIcon className='mr-2 h-4 w-4' />
            <span>Manage Account</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className='bg-gray-700' />
          <DropdownMenuItem
            onClick={handleSignOut}
            className='cursor-pointer focus:bg-gray-700 focus:text-white'
          >
            <LogOut className='mr-2 h-4 w-4' />
            <span>Sign Out</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className='bg-gray-700' />
          <DropdownMenuItem
            onClick={() => setShowDeleteModal(true)}
            className='cursor-pointer text-red-400 hover:text-red-300 focus:bg-red-700 focus:text-white'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            <span>Delete Account</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* @TODO: Fix the content in this modal */}
      {showDeleteModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='bg-ufc-black mx-4 w-full max-w-md rounded-lg border border-gray-700 p-6'>
            <div className='mb-4 flex items-center space-x-3'>
              <Trash2 className='h-6 w-6 text-red-500' />
              <h2 className='text-xl font-semibold text-white'>
                Delete Account
              </h2>
            </div>

            <div className='mb-4 rounded-lg border border-red-800 bg-red-900/20 p-4'>
              <p className='text-sm text-red-300'>
                This action cannot be undone. This will permanently disable your
                account and remove all your content from the platform.
              </p>
            </div>

            <div className='mb-6 space-y-4'>
              <p className='text-sm text-gray-400'>
                Before you delete your account, please consider:
              </p>
              <ul className='list-disc space-y-2 pl-5 text-sm text-gray-400'>
                <li>
                  All your posts, comments, & rankings will be permanently
                  removed
                </li>
                <li>You will lose access to any premium features</li>
                <li>This action cannot be reversed</li>
              </ul>
            </div>

            <div className='flex space-x-3'>
              <button
                onClick={() => setShowDeleteModal(false)}
                className='flex-1 rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700'
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                className='flex-1 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700'
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
