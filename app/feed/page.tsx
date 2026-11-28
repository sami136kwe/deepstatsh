import { redirect } from "next/navigation";

/** The card feed was replaced by the library: Home is the new entry point. */
export default function FeedPage() {
  redirect("/home");
}
