import { getUserAction } from "@/app/api/auth/get-user";
import { defaultUserState } from "@/lib/store/auth-store";
import { User } from "@/lib/schemas";
import { useState, useEffect } from "react";

export const useGetUser = () => {
  const [initialUser, setInitialUser] = useState<User | null | undefined>()

  useEffect(() => {
    const getInitialUser = async () => {
      const userActionState: Awaited<ReturnType<typeof getUserAction>> = await getUserAction();
      const user: User = userActionState.user ?? defaultUserState;

      setInitialUser(user);
    }

    getInitialUser();
  })

  return initialUser
}