import { User } from "@/lib/schemas";
import { useUser } from "@/store/auth-context";

export default function useSafeParseUser(initialUser: User) {
  const user = useUser();
  return user ?? initialUser;
}