import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import InviteFighterModal from "./InviteFighterModal";

export default function FighterInviteManagement() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold text-white'>
            Fighter Invite Management
          </h2>
          <p className='mt-1 text-sm text-gray-400'>
            Manage fighter invitations and view invitation status
          </p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)}>
          Invite Fighter
        </Button>
      </div>

      {/* Future content will go here - pending invites, accepted invites, etc. */}
      <div className='rounded-lg bg-gray-800 p-6'>
        <p className='text-center text-gray-400'>
          Pending invitations and management features coming soon...
        </p>
      </div>

      <InviteFighterModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}
