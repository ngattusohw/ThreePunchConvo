import React, { useState } from "react";
import EditUsers from "@/components/admin/EditUserTable";
import InviteFighterModal from "@/components/admin/InviteFighterModal";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <div className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
      <div className="flex justify-between items-center mb-6">
        <h1 className='text-2xl font-bold text-white'>Admin View</h1>
        <Button onClick={() => setIsInviteModalOpen(true)}>
          Invite Fighter
        </Button>
      </div>
      
      <EditUsers />
      
      <InviteFighterModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
      />
    </div>
  );
}
