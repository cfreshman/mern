import React, { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import { Link, useRouteMatch, useLocation, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { embedded } from './Contents';
import { useAuth, useE, useF, useIcon, useIconHref, useInterval } from '../../lib/hooks';
import { login, signup, logout } from '../../lib/auth';
import api from '../../lib/api';
import { useUserSocket } from '../../lib/io';

const User = () => {
  let auth = useAuth();
  let [dropdown, setDropdown] = useState(false);
  let [error, setError] = useState('');
  let userRef = useRef();
  let passRef = useRef();
  let history = useHistory();
  let [verify, setVerify] = useState(false);
  let verifyRef = useRef();
  let emailRef = useRef();
  let [profile, setProfile] = useState(undefined)

  let [unread, setUnread] = useState({})
  let socket = useUserSocket('', {
    'chat:unread': unread => {
      setUnread(unread)
    }
  }, socket => socket.emit('chat:unread'))

  const handle = {
    signin: (func) => {
      if (!userRef.current.value) return setError('enter username')
      if (!passRef.current.value) return setError('enter password')
      const email = emailRef.current?.value
      func(userRef.current.value, passRef.current.value)
        .then(auth => {
          email && setTimeout(() => api.post('/notify/email', { email }), 1000)
          setDropdown(false)
          setVerify(false)
        })
        .catch(e => {
          setError(e.error || 'error')
        })
    },
    signup: () => {
      if (verify) {
        emailRef.current?.blur()
        if (verifyRef.current?.value === passRef.current?.value) {
          handle.signin(signup)
        } else {
          setError('passwords mismatch')
        }
      } else {
        setVerify(true)
        setError(false)
        setTimeout(() => verifyRef.current?.focus())
      }
    },
    logout: () => {
      setDropdown(false)
      logout()
    },
    nav: path => {
      setDropdown(false);
      path && history.push(path);
    },
    reset: () => {
      setError('check email for link')
      api.post('reset/request', {
        user: userRef.current.value
      })
    },
    loadProfile: () => {
      if (auth.user) {
        api.get(`/profile/${auth.user}`).then(data => {
          // console.log('header', data)
          setProfile(data.profile)
        })
      }
    }
  }
  useF(auth, () => setDropdown(auth.dropdown))
  useF(dropdown, () => {
    if (!dropdown) {
      setError('')
      setVerify(false)
    } else {
      setTimeout(() => userRef.current?.focus())
    }
  })

  const location = useLocation();
  useF(auth?.user, location, () => {
    handle.loadProfile()
    setTimeout(handle.loadProfile, 500)
  })

  const isMe = auth.user === 'cyrus'
  const loggedIn = (
    <div className='dropdown in'>
      <Link to={`/u/${auth.user}`} className='item' onClick={() => handle.nav()}>profile</Link>
      {/* <Link to='/search' className='item' onClick={() => handle.nav()}>search</Link> */}
      {isMe
      ? <Link to='/settings' className='item' onClick={() => handle.nav()}>settings</Link>
      : <Link to='/settings' className='item' onClick={() => handle.nav()}>settings</Link>}
      {profile ? <Fragment>
        <hr />
        {(profile.recents || []).map(recent =>
        <Link key={recent} to={recent} className='item' onClick={() => handle.nav()}>{recent}</Link>)}
        {profile.recents ? <hr /> : ''}
      </Fragment> : ''}
      <div className='item' onClick={() => { handle.logout() }}>logout</div>
    </div>
  )

  const loggedOut = (
    <form className={'dropdown out' + (error ? ' error' : '')} title={error || ''}>
      <div className='item'>
        <input ref={userRef} type='text' maxLength='8' placeholder='username'
          autoComplete="username"
          autoCorrect='off' autoCapitalize='off'
          onKeyDown={e => e.key === 'Enter' &&
            passRef.current?.focus()}/>
      </div>
      <div className='item'>
        <input ref={passRef} type='password' placeholder='password'
          autoComplete={verify ? "new-password" : "current-password"}
          onKeyDown={e => e.key === 'Enter' && handle.signin(login)}/>
      </div>
      {verify ? <Fragment>
        <div className='item info'>
          <input ref={verifyRef} type='password' placeholder='confirm password'
            autoComplete="new-password"
            onKeyDown={e => e.key === 'Enter' && emailRef.current?.focus()}/>
        </div>
        <div className='item info' style={{whiteSpace:'pre'}}>
          {'game notifications:\nsent in single thread'}
        </div>
        <div className='item info'>
          <input ref={emailRef} type='email' placeholder='optional email'
            onKeyDown={e => e.key === 'Enter' && handle.signup()}/>
        </div>
        {/* <div className='item info' style={{whiteSpace:'pre'}}>
          {'sent in single thread'}
        </div> */}
      </Fragment> : ''}
      {!error?'': <div className='item info' style={{
          color: 'red'}}>
        {error}</div>}
      {error !== 'incorrect password' ?'': <div className='item'
        onClick={handle.reset}>
        reset password?</div>}
      <div className='item info signin'>
        <span onClick={() => handle.signup()}>sign up</span>
        {' / '}
        <span onClick={() => handle.signin(login)}>log in</span>
      </div>
      {/* {error ? <div className='error-msg'>{error}</div> : ''} */}
    </form>
  )

  let unreadCount = unread && Object.values(unread).length
  return (
    <div className={dropdown ? 'user active' : 'user'}>
      {unreadCount ? <Link className='unread' to='/chat'>{unreadCount} unread</Link> : ''}
      <div className='display'>
        <span onClick={() => setDropdown(!dropdown)}>
          [ <span className='name'>{auth.user ? auth.user : 'log in'}</span> ]
        </span>
        {!dropdown ? '' : ( auth.user ? loggedIn : loggedOut )}
      </div>
    </div>
  )
}

export const Header = () => {
  let match = useRouteMatch();
  let location = useLocation();
  let [url, setUrl] = useState(match.url.replace(/^\/$/, '/'))
  // let [url, setUrl] = useState(location.pathname)

  const crumbs = useMemo(() => {
    let total = '';
    let crumbs = [];
    url.split('/').filter(p => p).forEach(part => {
      total += '/' + part;
      crumbs.push(total);
    });
    return crumbs;
  }, [url]);
  useInterval(() => {
    if (url !== match.url.replace(/^\/$/, '/')) {
      setUrl(match.url.replace(/^\/$/, '/'))
    }
  }, 50)
  // useF(url, () => {
  //   console.log(url, match.url, subdomain)
  // })

  const isEmbeddedProject = useMemo(() => {
    let project = url.split('/').filter(p => p && p !== 'projects')[0];
    return embedded.includes(project);
  }, [url]);

  const iconHref = useIconHref()
  const profileIcon = iconHref.includes('/icon.png')
  return (
    <Style id="header">
      <div className='nav'>
        <Link to="/">
          <img className={`home profile-${profileIcon}`} alt="profile"
          src={profileIcon
            ? '/profile.jpeg'
            : iconHref}/>
        </Link>
        {crumbs.map(crumb => <Link to={crumb} key={crumb}>/{crumb.split('/').pop().replace(/\+/g, ' ')}</Link>)}
        {isEmbeddedProject && <a className='raw-link' href={`/raw${crumbs[0]}${location.hash}`}>view raw</a>}
      </div>
      <User />
    </Style>
  )
}

const Style = styled.div`
  width: 100%;
  // height: max(24px, 4vh);
  height: 2rem;
  // height: min(2.5rem, 4vh);
  height: max(1.6rem, 4vh);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  // padding-left: .25rem;
  // padding-top: .25rem;
  // padding-bottom: .25rem;
  position: relative;
  background: #131125;
  border-top-left-radius: .2rem;
  border-top-right-radius: .2rem;
  // font-size: max(12px, 2vh);
  // font-size: min(1rem, 3vh);
  font-size: max(.8rem, 2vh);

  // background-clip: padding-box;
  // border-bottom: .2rem solid transparent;
  // border-radius: .2rem;
  // margin-bottom: .6rem;

  > div {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
  }

  .nav {
    user-select: none;
    .home {
      height: calc(2rem - .4rem);
      height: calc(max(24px, 4vh) - .4rem);
      // height: calc(min(2rem, 6vh) - .4rem);
      height: calc(max(1.6rem, 4vh) - .4rem);
      width: calc(max(1.6rem, 4vh) - .4rem);
      &.profile-true {
        border-radius: 50%;
      }
      // border: 1px solid var(--light);
      // box-shadow: 1px 2px 4px #00000020;
      // box-shadow: 0px 0px 0px 1px #ffffff88;
      image-rendering: pixelated;
    }
    a, a:hover {
      color: var(--light);
      text-shadow: 1px 2px 4px #00000020;
      // padding-left: .25rem;
      &:first-child { padding: 0 .25rem; }
    }
  }

  // & .wiki-link, & .raw-link {
  //   font-size: 0.8rem;
  //   opacity: .9;
  //   margin-right: .5rem;
  // }

  .raw-link {
    opacity: .5;
    margin-left: .75rem;
    background: #ffffff44;
    padding: 0 .25rem;
    border-radius: .15rem;
    font-size: .7em;
  }

  .user {
    // text-decoration: underline;
    cursor: pointer;
    user-select: none;
    font-size: 0.9em;
    color: var(--light);
    margin-right: .5rem;
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .unread {
      color: inherit;
      opacity: .5;
      margin-right: .75rem;
      background: #ffffff44;
      padding: 0 .25rem;
      border-radius: .15rem;
      font-size: .77em;
    }
    .display {
      opacity: .8;
      &:hover .name { text-decoration: underline; }
      height: 100%;
      display: flex;
      align-items: center;
      position: relative;
    }
    &.active .display {
      opacity: 1;
    }
    .dropdown {
      position: absolute;
      top: 100%;
      right: -.5rem;
      min-width: calc(100% + 1rem);
      padding: 0 .5rem 0 .5rem;
      padding-bottom: .25rem;
      border-bottom-left-radius: .2rem;
      border-bottom-right-radius: .2rem;
      z-index: 10000;
      background: #131125;
      &.out { font-size: max(16px, 1em); }
      cursor: default;

      .item {
        padding: .15rem 0;
        display: block;
        color: white;
        input {
          border-color: black;
          min-width: 100%;
        }
        &:not(.info):hover { text-decoration: underline; cursor: pointer; }
        &.signin {
          display: flex;
          justify-content: space-between;
          span:hover { text-decoration: underline; cursor: pointer; }
        }
      }
      hr {
        margin: .25rem 0;
        border: .01rem solid white;
      }

      &.error {
        input {
          // border-color: #ff0000dd;
          // border-radius: .2rem;
          // background: #ff0000;
          // background: #ffdbdb;
        }
      }

      .error-msg {
        height: 0;
        line-height: 2rem;
        color: black;
        font-size: .8em;
      }
    }
  }
`