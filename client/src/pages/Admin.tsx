import EditUsers from "@/components/admin/EditUserTable";

export default function Admin() {
  return (
    <div className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
      <h1 className='text-2xl font-bold text-white'>Admin View</h1>
      <EditUsers />
    </div>
  );
}
