import React, { useState, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { useRouteMatch, useHistory } from 'react-router-dom';
import api from '../lib/api';
import { useF, useAuth } from '../lib/hooks';
import { useUserSocket } from '../lib/io';
import { InfoStyles, InfoBody, InfoLinks, InfoFuncs, InfoSearch, InfoSection, InfoLine, InfoLoginBlock } from '../components/base/Info'

export const UserList = ({labels, users}: {labels, users}) => {
  const history = useHistory()
  return <InfoFuncs {...{
    // entries: users.map(u => ({ text: u, data: `/u/${u}` })),
    entries: users,
    entryFunc: user => history.push(`/u/${user}`),
    labels,
  }}/>
}

export default () => {
  const auth = useAuth();
  const history = useHistory();
  const user = (useRouteMatch('/:page/:user')?.params as any).user || (() => {
    auth.user && history.replace(`/u/${auth.user}`);
    return auth.user;
  })();
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState(undefined);
  let [info, setInfo]: [{ [key: string]: any }, any] = useState({});
  const searchRef = useRef();
  const [similar, setSimilar] = useState(undefined)

  const bioInput = useRef();

  const [unread, setUnread] = useState({})
  const socket = useUserSocket('', {
    'chat:unread': unread => {
      setUnread(unread)
    }
  }, socket => socket.emit('chat:unread'))

  useF(user, auth.user, () => {
    if (user && auth.user) {
      handle.load()
    }
  })
  const handle = {
    load: () => {
      api.get(`/profile/${user}`).then(handle.parse)
    },
    follow: () => api.post(`/profile/${user}/follow`, {}).then(handle.parse),
    unfollow: () => api.post(`/profile/${user}/unfollow`, {}).then(handle.parse),
    bio: bio => api.post(`/profile/bio`, { bio }).then(handle.parse),
    parse: data => {
      // console.log(data)
      setLoaded(true);
      setProfile(data.profile)
      if (data.profile) {
        const { friends, followers } = data.profile;
        info = {};
        if (auth.user) {
          info.isUser = user === auth.user;
          const friendSet = new Set(friends);
          const followerSet = new Set(followers);
          if (info.isUser) {
            info.requests = followers.filter(f => !friendSet.has(f));
          } else {
            // if (friends) {
            //   info.isFriend = friendSet.has(auth.user);
            //   info.isFollower = friendSet.has(auth.user); // just 'cyrus'
            //   info.canFollow = !followerSet.has(auth.user);
            //   info.canUnfollow = followerSet.has(auth.user);
            // } else if (data.viewer) {
            //   info.isFriend = false
            //   info.isFollower = data.viewer.follows.includes(user)
            //   info.canUnfollow = data.viewer.follows.includes(user)
            //   info.canFollow = !info.canUnfollow
            // }
            info.isFriend = friends && friendSet.has(auth.user);
            info.isFollower = data.viewer.followers.includes(user)
            info.canUnfollow = data.viewer.follows.includes(user)
            info.canFollow = !info.canUnfollow
          }
        }
        setInfo(info);
        setSimilar(undefined)
      } else if (data.similar) {
        setSimilar(data.similar)
        setInfo(undefined);
      }
    },
    search: () => {
      const current = searchRef.current;
      if (current) {
        const search = (current as HTMLInputElement).value
        search && history.push(`/u/${search}`)
      }
    },
  }

  const showChat = info?.isFriend
    ? `/chat/#/${profile.user}`
    : (user === auth.user && !!profile?.friends?.length) ? '/chat' : ''
  const unreadCount = showChat && unread && Object.keys(unread).length
  const [bio, setBio] = useState(undefined)
  const [bioEdit, setBioEdit] = useState(false)
  const bioLength = 120
  useF(profile, () => setBio(profile?.bio))
  return <InfoStyles>
    <InfoSearch {...{searchRef, placeholder: 'find a user', search: handle.search}}/>
    {profile ?
    <InfoBody>
      <InfoSection label='user'>
        <InfoLine labels={[
          info.canFollow ? { text: 'follow', func: handle.follow } : '',
          info.canUnfollow ? { text: 'unfollow', func: handle.unfollow } : '',
          info.isFriend ? 'friend!' : (info.isFollower ? 'follows you!' : '')
        ]}>
          {profile.user}
        </InfoLine>
      </InfoSection>
      {info.isUser
      ?
      bioEdit
      ?
      <InfoSection className='edit-container' style={{ width: '100%' }} labels={[
        'bio',
        { text: 'cancel', func: () => {
          setBioEdit(false)
          handle.load()
        } },
        { text: 'save', func: () => {
          setBioEdit(false)
          handle.bio(bio)
        } },
        `${bio.length} / ${bioLength}`,
        ]}>
        <textarea ref={bioInput}
          className='input' spellCheck='false'
          rows={Math.max(3, profile.bio?.split('\n').length)}
          value={bio || ''}
          onChange={e => {
            if (bioInput.current) {
              const newBio = (bioInput.current as any).value
                .replace(/\n{3,}/g, '\n\n')
                .split('\n')
                .slice(0, 3)
                .join('\n')
                .slice(0, bioLength)
              setBio(newBio)
            }
          }} />
      </InfoSection>
      :
      bio ? <InfoSection
        labels={['bio', { text: 'edit', func: () => setBioEdit(true) }]}
        style={{ whiteSpace: 'pre-wrap' }}>
        {convertLinks(profile.bio)}
          {/* {profile.bio} */}
      </InfoSection> : ''
      :
      profile.bio ? <InfoSection label='bio' style={{ whiteSpace: 'pre-wrap' }}>
        {convertLinks(profile.bio)}
          {/* {profile.bio} */}
      </InfoSection> : ''
      }

      {/* {profile.recents ? <InfoLinks labels={['recents']} entries={profile.recents} /> : ''} */}
      {profile.recents ? <InfoFuncs labels={['recents']} entries={profile.recents} entryFunc={history.push} /> : ''}
      {profile.friends ?
      <UserList labels={[
        'friends',
        showChat ? { text: 'chat', func: () => history.push(showChat) } : '',
        showChat ? { text: 'graffiti', func: () => history.push(`/graffiti/#/${user}`) } : '',
        // showChat && !info.isFriend && unreadCount ? { text: unreadCount, func: () => history.push('/chat') } : '',
        // showChat && unread ? `${unread}` : ''
        ]} users={profile.friends} />
      : ''}
      {info.isUser
      ? <UserList labels={['requests']} users={info.requests} />
      : ''}
      {!bio && info.isUser && !bioEdit
      ? <InfoSection labels={['bio', { text: 'add', func: () => setBioEdit(true) }]} />
      : ''}
    </InfoBody>
    : loaded
    ? <InfoBody>
      <InfoSection label='user'>
        <InfoLine>{`'${user}' does not exist`}</InfoLine>
      </InfoSection>
      {similar ? <UserList labels={['similar']} users={similar} /> : ''}
    </InfoBody>
    : auth.user ? '' : <InfoBody><InfoLoginBlock to={user ? 'view user' : 'view your profile'} /></InfoBody>}
  </InfoStyles>
}

// const linkRegex = /(?:(?:ht|f)tp(?:s?)\:\/\/|~\/|\/)?(?:\w+:\w+@)?((?:(?:[-\w\d{1-3}]+\.)+(?:dev|com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|edu|co\.uk|ac\.uk|it|fr|tv|museum|asia|local|travel|[a-z]{2}))|((\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)(\.(\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)){3}))(?::[\d]{1,5})?(?:(?:(?:\/(?:[-\w~!$+|.,=]|%[a-f\d]{2})+)+|\/)+|\?|#)?(?:(?:\?(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)(?:&(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)*)*(?:#(?:[-\w~!$ |\/.,*:;=]|%[a-f\d]{2})*)?/gi
// const convertLinks = str => {
//   return str.split(linkRegex).filter(part => part).map(part => {
//     if (linkRegex.test(part)) {
//       return <span dangerouslySetInnerHTML={{__html: part
//         .replace(linkRegex, `<a href="https://$&">$&</a>`)
//         .replace(/href="https:\/\/((?:ht|f)tp(?:s?)\:\/\/|~\/|\/)/i, `href="$1`)}}/>
//     } else {
//       return <span>{part}</span>
//     }
//   })
// }

const linkRegex = /(?:https?:\/\/)?((?:\w+\.)+[\w/#\+]{2,})/gi
const convertLinks = str => {
  // console.log(str.split(linkRegex).filter(part => part))
  return str.split(linkRegex).filter(part => part).map((part, i) => {
    if (linkRegex.test(part)) {
      return <span key={i} dangerouslySetInnerHTML={{__html: part
        .replace(linkRegex, `<a href="https://$1">$&</a>`)
        .replace(/href="https:\/\/((?:ht|f)tp(?:s?)\:\/\/|~\/|\/)/i, `href="$1`)}}/>
    } else {
      return <span key={i}>{part}</span>
    }
  })
}
