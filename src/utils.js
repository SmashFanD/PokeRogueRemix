export function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

export function getIndexKeyByValue(object, value) {
    const objects = Object.keys(object)
    return objects.indexOf(getKeyByValue(object, value));
}

export function recoverObjectFromKeys(object, value) {
    const objects = Object.keys(object)
    const recoverFrom = getIndexKeyByValue(object, value)
    return object[objects[recoverFrom]]
}