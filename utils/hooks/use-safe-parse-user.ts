import { User } from "@/lib/schemas";
import { useAuthStore } from "@/store/auth-context";

export default function useSafeParseUser(initialUser: User) {
  const user = useAuthStore((state) => state.user);
  return user ?? initialUser;
}