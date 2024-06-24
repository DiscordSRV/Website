export async function GET(request, { params }) {
    let response = await fetch(`https://bin.scarsz.me/v1/${params.file}.json`);
    if (response.status !== 200) {
        return new Response(response.body, {status: response.status});
    }
    let data = await response.json();
    return Response.json(data);
}