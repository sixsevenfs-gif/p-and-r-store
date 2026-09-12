import { phoneLogin } from "../../_lib/phone-login";
export async function POST(request: Request) { return phoneLogin(request, "admin"); }
