import { signOutAction } from "@/app/api/auth/sign-out";

export default function useSignOut() {
  // NOTE: In the future once CSS is hooked up add error handling logic to present toast message or whatever
  const signOutHandler = async () => signOutAction()
  return { signOutHandler }
}