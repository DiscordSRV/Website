export function politics_summary(files) {
    const cyrillic = /[А-Яа-я]/g

    return [
        {
            name: "Cyrillic",
            files: files.map(file => {
                return {
                    name: file.name,
                    count: countMatches(cyrillic, file.content)
                }
            })
        }
    ]
}

function countMatches(regex, content) {
    return ((content || "").match(regex) || []).length
}