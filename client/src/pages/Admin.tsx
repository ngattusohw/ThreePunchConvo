import React from "react";
import EditUsers from "@/components/admin/EditUserTable";
import FighterInviteManagement from "@/components/admin/FighterInviteManagement";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Admin() {
  return (
    <div className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white'>Admin View</h1>
      </div>

      <Tabs defaultValue='users' className='w-full'>
        <TabsList className='grid w-full grid-cols-2 bg-gray-800 text-gray-400'>
          <TabsTrigger
            value='users'
            className='hover:text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white'
          >
            View All Users
          </TabsTrigger>
          <TabsTrigger
            value='fighter-invite'
            className='hover:text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white'
          >
            Fighter Invite Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value='users' className='mt-6'>
          <EditUsers />
        </TabsContent>

        <TabsContent value='fighter-invite' className='mt-6'>
          <FighterInviteManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
