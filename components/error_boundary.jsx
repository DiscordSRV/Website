import styles from '../styles/error.module.css'
import Head from "next/head";
import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.log({ error, errorInfo })
    }

    render() {
        if (this.state.hasError) {
            return (
                <>
                    <Head>
                        <title>DiscordSRV | Error</title>
                    </Head>
                    <div className={styles.error}>
                        <h2>Client Error</h2>
                        <p>Uh oh, looks like something went wrong. Please try again later</p>
                    </div>
                </>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
