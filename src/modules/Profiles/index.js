export function hasAccess(roles, userProfiles = []) {
    let canAccess = false;
    roles.forEach((currentRole) => {
        canAccess = userProfiles.some(({ permissions = {} }) => permissions[currentRole])
            ? true
            : canAccess;
    });
    return canAccess;
}

export function flatPermissions(userProfiles = []) {
    let flat = {};
    userProfiles.forEach(({ permissions = {} }) => {
        flat = {
            ...flat,
            ...permissions
        }
    });
    return flat;
}
