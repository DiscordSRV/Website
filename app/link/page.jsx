import {redirect} from "next/navigation";

export default function Page({ searchParams }) {
    let { method } = searchParams;

    let host = "https://minecraftauth.me";
    let application = encodeURIComponent("HIKzPIRfgil7qAnA");
    let redirectUrl = encodeURIComponent("https://discordsrv.vankka.dev/linking-success");
    let scopes = encodeURIComponent("minecraft discord");

    redirect(host + "/grant?app=" + application + "&redirectUrl=" + redirectUrl + "&scopes=" + scopes + "&state=" + (method ? method : "join"));
}