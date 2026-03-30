export class Animation {
    requested = [] //array of requested animation
    //some anim need to wait for update to continue
    //if waitRequest true the game will wait for the anim to complete to continue
    request(itemData, animData, time, waitRequest = false) {
        this.requested.push({ itemData, animData, time, waitRequest });
    }
    doRequest() {
        //do the animation using this.animationData
        if (this.requested.length === 0) return
        for (const request of this.requested) {
            request.itemData.x += request.animData.x
            request.itemData.y += request.animData.y
            request.animData.time -= 1
            if (request.animData.time <= 0) {
                this.requested = this.requested.filter(r => r !== request)
            }
        }
    }
}