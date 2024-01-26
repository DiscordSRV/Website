import DebugClient from "../../debug/[file]/client";

export const metadata = {
    title: "DiscordSRV | Bin"
}

export default function Page({ params }) {
    return <DebugClient params={params} legacy={true}/>
}