"use client"

import styles from './error.module.css'
import React from "react";

export const manifest = {
    title: "DiscordSRV | GlobalError"
}

export default function GlobalError({ error, reset }) {
    return (
        <>
            <div className={styles.error}>
                <h2>Client Error</h2>
                <p>Uh oh, looks like something went wrong. Please try again later</p>
                <button onClick={() => reset()}>Reset</button>
            </div>
        </>
    )
}
