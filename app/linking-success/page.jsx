import styles from './linking-success.module.css'

export const metadata = {
    title: "DiscordSRV | Linking Success"
}

export default function Page({ searchParams }) {
    let { state } = searchParams;

    const isDiscord = state === "discord";
    const isLink = state === "link";

    return (
        <>
            <div style={{display: "flex", justifyContent: "center"}}>
                <div className={styles.linkingSuccess}>
                    <h1>You are now successfully linked</h1>
                    {!isDiscord && !isLink
                        ? <span>Rejoin the game </span>
                        : <span>Return to the game and run the <code>{"/" + (isDiscord ? "discord " : "") + "link"}</code> command again, </span>
                    }
                    <span>and you will be linked. You may close this tab</span>
                </div>
            </div>
        </>
    )
}