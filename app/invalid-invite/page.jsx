import styles from '../styles/card.module.css'

export const metadata = {
    title: "DiscordSRV | Invalid invite"
}

export default function Page() {
    return (
        <div style={{display: "flex", justifyContent: "center"}}>
            <div className={styles.card}>
                <h1>Invalid invite</h1>
                <h3>For players</h3>
                <p>Please ask an server administrator to check this page</p>
                <h3>For Server Administrators</h3>
                <p>Please check and configure the <code>invite</code> section in the DiscordSRV <code>config.yaml</code> file</p>
            </div>
        </div>
    )
}