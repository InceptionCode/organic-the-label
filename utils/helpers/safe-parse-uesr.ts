import { User } from "@/lib/schemas";
import { useAuthStore } from "@/store/auth-context";

export default function safeParseUser(initialUser: User) {
  let user;

  try {
    user = useAuthStore((state) => state.user);
  } catch (e) {
    user = initialUser;
  }

  return user
}