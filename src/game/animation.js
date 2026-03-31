import { delayFrame } from "../utilsjs";

export class Animation {
    requested = null;

    async request(itemData, animData, time, interval) {
        // Attendre que l'animation précédente soit terminée si waitRequest est vrai
        if (this.requested) {
            await new Promise(resolve => {
                const check = () => {
                    if (this.requested === null) {
                        resolve();
                    } else {
                        requestAnimationFrame(check);
                    }
                };
                check();
            });
        }

        this.requested = { itemData, animData, time, interval };
        await this.doRequest(itemData, animData, time, interval);
        this.requested = null; // Marquer comme terminé
    }

    async doRequest(itemData, animData, time, interval) {
        const tick = Math.ceil(time / interval);

        for (let i = 1; i <= tick; i++) {
            // Mettre à jour les coordonnées
            itemData.x += animData.x / tick;
            itemData.y += animData.y / tick;

            // Attendre le prochain frame
            await delayFrame(interval);
        }
    }
}