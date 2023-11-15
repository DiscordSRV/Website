import hljs from "highlight.js/lib/common";
import 'highlight.js/styles/atom-one-dark.css'
import {useEffect, useState} from "react";

export default function Highlight({content}) {
    const [rendered, setRendered] = useState(null);

    useEffect(() => {
        setRendered(hljs.highlightAuto(content).value);
    }, [content]);

    return (
        <pre style={{margin: "0 0 0.5rem 0"}}>
            <code dangerouslySetInnerHTML={{__html: rendered != null ? rendered : "<div/>"}}/>
        </pre>
    )
}
