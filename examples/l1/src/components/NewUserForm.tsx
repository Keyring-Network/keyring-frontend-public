import { useState } from "react";

/**
 * Props for the NewUserForm component
 *
 * Note: In a production application, this form would ideally be generated
 * dynamically based on the schema from /api/onboarding-schema.
 * For this demo, we're using a simplified hardcoded form with the
 * minimum required fields.
 */
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
        className="bg-blue-500 text-white p-2 rounded w-full cursor-pointer"
        onClick={() => setShowNewUserForm(!showNewUserForm)}
      >
        {showNewUserForm ? "Hide New User Form" : "Create New User"}
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
            className="bg-green-500 text-white p-2 rounded w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCreateUser}
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Create User"}
          </button>
        </div>
      )}
    </>
  );
};
