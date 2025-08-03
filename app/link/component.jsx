import {redirect} from "next/navigation";

const optionalServices = [
    {service: 'twitch', char: 't'},
    {service: 'google' /* youtube */, char: 'y'},
    {service: 'glimpse', char: 'g'},
    {service: 'patreon', char: 'p'}
];

export function LinkPage({ command, services }) {
    let scopes = "minecraft discord";
    if (services) {
        const extraServices = services.split('');
        for (let i = 0; i < extraServices.length; i++) {
            let extraService = extraServices[i];
            for (let j = 0; j < optionalServices.length; j++) {
                let service = optionalServices[j];
                if (scopes.indexOf(service.service) !== -1) {
                    continue;
                }

                if (extraService === service.char) {
                    scopes += " " + service.service;
                }
            }
        }
    }

    let host = "https://minecraftauth.me";
    let application = encodeURIComponent("oed3dcGDezjxUqAG");
    let redirectUrl = encodeURIComponent("https://discordsrv.vankka.dev/linking-success");
    scopes = encodeURIComponent(scopes);

    redirect(host + "/grant?app=" + application + "&redirectUrl=" + redirectUrl + "&scopes=" + scopes + "&state=" + (command ? command : "join"));
}