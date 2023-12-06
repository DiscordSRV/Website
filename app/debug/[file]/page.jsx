import DebugClient from "./client";

export const metadata = {
    title: "DiscordSRV | Debug report"
}

export default function Page({ params }) {
    return <DebugClient params={params}/>
}