import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import InviteFighterModal from "./InviteFighterModal";
import FighterInvitationsTable from "./FighterInvitationsTable";

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

      {/* Fighter Invitations Table */}
      <FighterInvitationsTable />

      <InviteFighterModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}
