import { useState, useEffect } from "react";
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
import {
  LogOut,
  Trash2,
  User as UserIcon,
  CreditCard,
  Crown,
} from "lucide-react";
import { useUserProfile } from "@/api/hooks/useUserProfile";
import { useStripePlans } from "@/api/hooks/useStripePlans";
import { SubscriptionModal } from "@/components/ui/subscription-modal";
import { DeleteAccountModal } from "@/components/ui/delete-account-modal";

interface UserMenuProps {
  handleDeleteAccount: () => void;
}

export function UserMenu({ handleDeleteAccount }: UserMenuProps) {
  const { user } = useMemoizedUser();
  const { signOut, openUserProfile } = useClerk();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { user: currentUser } = useUserProfile(user?.username);

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

  const hasSubscription = currentUser?.planType !== "FREE";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center space-x-2 text-sm font-medium text-white outline-none">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.imageUrl} alt={user.username ?? ""} />
            <AvatarFallback>
              {user.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="bg-ufc-black w-56 border-gray-700 text-white"
          align="end"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.fullName}
              </p>
              <p className="text-xs leading-none text-gray-400">
                @{user.username}
              </p>
              {hasSubscription && (
                <div className="flex items-center space-x-1">
                  <Crown className="h-3 w-3 text-yellow-400" />
                  <p className="text-xs font-medium text-yellow-400">
                    {currentUser?.planType} Plan
                  </p>
                </div>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem
            onClick={() => openUserProfile()}
            className="cursor-pointer focus:bg-gray-700 focus:text-white"
          >
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Manage Account</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="cursor-pointer focus:bg-gray-700 focus:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem
            onClick={() => setShowSubscriptionModal(true)}
            className="cursor-pointer focus:bg-gray-700 focus:text-white"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Manage Subscription</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem
            onClick={() => setShowDeleteModal(true)}
            className="cursor-pointer text-red-400 hover:text-red-300 focus:bg-red-700 focus:text-white"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Account</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteAccount}
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        username={user.username}
      />
    </>
  );
}
