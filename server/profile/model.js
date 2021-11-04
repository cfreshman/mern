const db = require('../db');
const { entryMap, remove } = require('../util');
const login = require('../login').model;
const notify = require('../notify/model.js');

const names = {
    profile: 'profile',
        // user: string
        // bio: string
        // friends: string[]
        // follows: string[]
        // followers: string[]
        // unfollowers: string[]
}
const C = entryMap(names, name => () => db.collection(name));

async function privileged(user) {
    let cyrus = await C.profile().findOne({ user: 'cyrus' })
    let isPrivileged = user === 'cyrus' || cyrus.friends.includes(user)
    console.log(`[PRIVILEGED] ${user} ${isPrivileged}`)
    return isPrivileged;
}

async function _get(user) {
    let profile = await C.profile().findOne({ user });
    // console.log(user, profile)
    if (!profile) {
        if (await login.get(user)) {
            profile = { user, bio: '', friends: [], follows: [], followers: [] };
            C.profile().insertOne(profile);
        }
    }
    return profile
}
async function _getUser(user) {
    if (!user) throw 'user not signed in';
    return await _get(user);
}
async function get(user, other) {
    let viewer = await _getUser(user);
    other = other ?? user
    let profile = await _get(other)
    if (profile) {
        if (![other, 'cyrus', ...profile.follows].includes(user)) {
            delete profile.friends
            delete profile.follows
            delete profile.followers
        }
        return { viewer, profile }
    } else if (await privileged(user)) {
        let similar = (await C.profile().find({
            user: {
                $regex: `${other}`,
                $options: 'i',
            }
        }).toArray()).map(entry => entry.user).sort()
        return { viewer, similar }
    } else {
        return { viewer }
    }
}
async function update(user, props) {
    let profile = await _get(user);
    Object.assign(profile, props);
    C.profile().updateOne({ user }, { $set: profile });
    return { profile };
}

async function follow(user, other) {
    let viewer = await _getUser(user);
    let profile = await _get(other);
    if (!viewer.follows.includes(other)) {
        let userUpdate = { follows: [other].concat(viewer.follows) }
        let otherUpdate = { followers: [user].concat(profile.followers) }
        let isFriend = profile.follows.includes(user);
        if (isFriend) {
            userUpdate.friends = [other].concat(viewer.friends);
            otherUpdate.friends = [user].concat(profile.friends);
        }
        viewer = (await update(user, userUpdate)).profile
        profile = (await update(other, otherUpdate)).profile
        if (!(profile.unfollowers || []).includes(user)) {
            notify.send(other, 'profile', `@${user} followed you`, `freshman.dev/u/${user}`)
        }
    }
    if (profile) {
        if (![other, 'cyrus', ...profile.follows].includes(user)) {
            delete profile.friends
            delete profile.follows
            delete profile.followers
        }
    }
    return {
        viewer,
        profile
    }
}
async function unfollow(user, other) {
    let viewer = await _getUser(user);
    let profile = await _get(other);
    if (viewer.follows.includes(other)) {
        let userUpdate = { follows: remove(viewer.follows, other) }
        let otherUpdate = {
            followers: remove(profile.followers, user),
            unfollowers: [user].concat(
                remove(profile.unfollowers || [], user))
        }
        let isFriend = profile.follows.includes(user);
        if (isFriend) {
            userUpdate.friends = remove(viewer.friends, other);
            otherUpdate.friends = remove(profile.friends, user);
        }
        viewer = (await update(user, userUpdate)).profile
        profile = (await update(other, otherUpdate)).profile
    }
    if (profile) {
        if (![other, 'cyrus', ...profile.follows].includes(user)) {
            delete profile.friends
            delete profile.follows
            delete profile.followers
        }
    }
    return {
        viewer,
        profile
    }
}

async function bio(user, bio) {
    return await update(user, { bio })
}

async function checkin(user, path) {
    let viewer = await _getUser(user);
    let recents = [path].concat(remove(viewer.recents || [], path)).slice(0, 3);
    let profile = await update(user, { recents });
    return { profile }
}

module.exports = {
    names,
    get,
    follow,
    unfollow,
    checkin,
    privileged,
    bio,
}