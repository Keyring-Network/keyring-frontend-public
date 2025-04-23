import { useState } from 'react';

interface NewUserFormProps {
  userData: {
    firstName: string;
    lastName: string;
    email: string;
  };
  setUserData: (userData: {
    firstName: string;
    lastName: string;
    email: string;
  }) => void;
  isPending: boolean;
  createUser: () => void;
}

export const NewUserForm = ({
  userData,
  setUserData,
  isPending,
  createUser,
}: NewUserFormProps) => {
  const [showNewUserForm, setShowNewUserForm] = useState(false);

  const handleCreateUser = () => {
    createUser();
    setShowNewUserForm(false);
  };

  return (
    <>
      <button
        className="bg-blue-500 text-white p-2 rounded w-full"
        onClick={() => setShowNewUserForm(!showNewUserForm)}
      >
        {showNewUserForm ? 'Hide New User Form' : 'Create New User'}
      </button>

      {showNewUserForm && (
        <div className="space-y-2 p-4 mt-4 border rounded">
          <h3 className="font-medium">New User Details</h3>
          <input
            type="text"
            value={userData.firstName}
            onChange={(e) =>
              setUserData({ ...userData, firstName: e.target.value })
            }
            placeholder="First Name"
            className="p-2 border rounded w-full"
          />
          <input
            type="text"
            value={userData.lastName}
            onChange={(e) =>
              setUserData({ ...userData, lastName: e.target.value })
            }
            placeholder="Last Name"
            className="p-2 border rounded w-full"
          />
          <input
            type="email"
            value={userData.email}
            onChange={(e) =>
              setUserData({ ...userData, email: e.target.value })
            }
            placeholder="Email"
            className="p-2 border rounded w-full"
          />
          <button
            className="bg-green-500 text-white p-2 rounded w-full"
            onClick={handleCreateUser}
            disabled={isPending}
          >
            Create User
          </button>
        </div>
      )}
    </>
  );
};
