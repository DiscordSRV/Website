import hljs from "highlight.js/lib/common";
import 'highlight.js/styles/atom-one-dark.css'

export default function Highlight({content}) {
    return (
        <pre style={{margin: "0 0 0.5rem 0"}}>
            <code dangerouslySetInnerHTML={{__html: hljs.highlightAuto(content).value}}/>
        </pre>
    )
}