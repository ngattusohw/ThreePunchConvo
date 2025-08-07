import React from "react";
import { useAdminView } from "@/api/hooks/useAdminView";

export default function EditUsers() {
    const { users, isLoading, error } = useAdminView();

    console.log(users);
    return (
        <div>
            <h1>Edit User</h1>
            {users?.map((user) => (
                <div key={user.id}>
                    <h2>{user.username}</h2>
                </div>
            ))}
        </div>
    )
}
