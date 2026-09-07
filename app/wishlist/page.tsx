import { redirect } from "next/navigation";
import Storefront from "../page";
import { getAuthSession } from "../auth";

export const dynamic = "force-dynamic";

export default async function WishlistRoute() {
  if (!(await getAuthSession())?.user) redirect("/login?next=%2Fwishlist");
  return <Storefront />;
}
