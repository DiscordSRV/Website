"use client";

import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
    const [isLoggedIn, setLoggedIn] = useState<boolean | undefined>(undefined);
    const [data, setData] = useState<undefined | any>(undefined);
    
    const [tags, setTags] = useState<undefined | string[]>(undefined);
    const [tagEntry, setTagEntry] = useState<string>("");
    const [tagLoading, setTagLoading] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            const isLoggedIn = await (await fetch("/api/loggedin")).json();
            console.log("is logged", isLoggedIn);
            setLoggedIn(isLoggedIn as boolean);
        })();
    }, []);

    useEffect(() => {
        if (!isLoggedIn) {
            return;
        }

        (async () => {
            setData(await (await fetch("/api/faq/all")).json());
            setTags(await (await fetch("/api/faq/tags")).json());
        })();
    }, [isLoggedIn]);

    async function alterTags(tagAlterer) {
        const newTags = [...tags];
        tagAlterer(newTags);
        newTags.sort();

        setTagLoading(true);
        const response = await fetch("/api/faq/tags", {method: "PUT", body: JSON.stringify(newTags)});
        if (!response.ok) {
            alert("Failed to update tags: " + JSON.stringify(await response.json()));
            setTagLoading(false);
            return;
        }

        setTags(await (await fetch("/api/faq/tags")).json());
        setTagLoading(false);
    }

    if (isLoggedIn === false) {
        redirect('/api/auth');
    }
    
    if (isLoggedIn === undefined || data === undefined || tags === undefined) {
        return (<h1>Loading...</h1>)
    }
    
    return (
        <div style={{margin: "1rem"}}>
            <h1>FAQ Management</h1>
            <div>
                <h2>Tags</h2>
                <ul>
                {tags.map((tag, index) => <li key={tag}>{tag} <button disabled={tagLoading} onClick={() => alterTags(tags => tags.splice(index, 1))}>Remove</button></li>)}
                </ul>
                <form onSubmit={event => {
                    event.preventDefault();
                    alterTags(tags => tags.push(tagEntry));
                }}>
                    <label>
                        Add tag: <input type="text" value={tagEntry} onChange={event => setTagEntry(event.target.value)} pattern="[a-zA-Z0-9_-]*" maxLength={50} />
                    </label>
                    <button type="submit" disabled={tagLoading || tagEntry.length === 0 || tagEntry === "list" || tagEntry === "tags" || tagEntry === "all"}>Add</button>
                </form>
                {tagLoading && <span>Tags loading...</span>}
            </div>
            {Object.keys(data).map(key => {
                const question = data[key];
                return (
                    <div key={key}>
                        {key}
                        =
                        {JSON.stringify(question)}
                    </div>
                )
            })}
        </div>
    );
}