import React, { useState, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { Link, useHistory } from 'react-router-dom';
import api from '../lib/api'
import { useF, useAuth } from '../lib/hooks'
import { sub, unsub } from '../lib/notify'
import { InfoStyles, InfoBody, InfoSection, InfoLine, InfoLoginBlock } from '../components/base/Info'


const notifyProjects = ''.split(' ').filter(s=>s)

const NotifyEntry = ({page, enabled, toggle}) => {
  return <InfoLine labels={[{
    text: enabled ? 'unsubscribe' : 'subscribe',
    func: toggle,
  }]}>
    <Link className='entry title' to={`/${page}`}>{`/${page}`}</Link>
  </InfoLine>
}

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  let auth = useAuth();
  let [token, setToken] = useState(window.location.hash?.slice(1) || '');
  let [notify, setNotify] = useState(undefined);
  let emailRef = useRef();
  let [emailEdit, setEmailEdit] = useState(false)

  useF(auth.user, () => auth.user && !token && handle.load())
  useF(token, () => {
    if (token) {
      window.history.replaceState(null, '/notify', '/notify')
      api.post('notify/verify', { token }).then(data => {
        handle.load()
        // if (data.notify && !data.notify.verify) {
        //   setNotify(data.notify)
        // } else {
        //   handle.load();
        // }
      })
      setToken('');
    }
  })
  useF(emailEdit, () => {
    if (notify && emailRef?.current) {
      if ((emailRef.current as HTMLInputElement).value !== notify.email || '')
        (emailRef.current as HTMLInputElement).value = notify.email || ''
      !emailEdit && (emailRef.current as HTMLInputElement).blur()
    }
  })
  useF(notify, () => {
    if (notify && emailRef?.current) {
      (emailRef.current as HTMLInputElement).value = notify.email || ''
    }
  })

  const handle = {
    load: () => {
      api.get('notify').then(({notify}) => setNotify(notify));
    },
    email: () => {
      if (emailEdit) {
        let email = (emailRef.current as HTMLInputElement).value
        api.post('notify/email', { email, source: location.host }).then(res => {
          handle.load()
        })
        notify.email = email;
        notify.waiting = true;
      } else {
        setTimeout(() => {
          // (emailRef.current as HTMLInputElement).focus()
        })
      }
      setEmailEdit(!emailEdit)
    },
    sub: (page: string, doSub: boolean) => {
      (doSub ? sub : unsub)(page).then(handle.load)
    },
  }

  return <Style>
    <InfoBody>
    {!auth.user ? <InfoLoginBlock to='manage notifications'/> : !notify ? '' : <Fragment>
      <InfoSection label='user'>{auth.user}</InfoSection>
      <InfoSection className='email edit-container' labels={[
        'email',
        // !emailEdit && { text: 'edit', func: handle.email },
        emailEdit && { text: 'cancel', func: () => setEmailEdit(false) },
        emailEdit && { text: 'save', func: handle.email },
        (emailEdit || !notify.email || notify.waiting) ? '' : notify.verify
        ? `unverified – check email for link`
        : 'verified',
      ].filter(l => l)}>
        <input ref={emailRef} type='email' placeholder='add email for notifications'
          autoCorrect='off' autoCapitalize='off' //readOnly={!emailEdit}
          // onClick={handle.email}
          onClick={() => setEmailEdit(true)}
          onBlur={() => (emailRef.current as HTMLInputElement).value == notify.email && setEmailEdit(false)}
          onKeyDown={e => ({
            'Enter': handle.email,
            'Escape': () => setEmailEdit(false),
            }[e.key] || (() => {}))()}/>
        <p style={{fontSize:'.8rem', opacity:'.5'}}>notifications are sent in a single thread</p>
      </InfoSection>
      <InfoSection labels={[
        'notifications',
        // notify.email ? 'enabled' : 'disabled'//'disabled - add email'
        ]}>
        {notifyProjects.map(page => {
          let enabled = !(notify.unsub || []).includes(page)
          return <NotifyEntry key={page} page={page}
            enabled={enabled} toggle={() =>
              handle.sub(page, !enabled)}/>})}
      </InfoSection>
    </Fragment>}
    </InfoBody>
  </Style>
}

const Style = styled(InfoStyles)`
  .email {
    width: 100%;
    input {
      max-width: 22rem;
      // cursor: pointer;
    }
    .text {
      // display: flex;
      // flex-direction: row;
      // align-items: center;
      // span, input {
      //   color: black;
      //   // flex-grow: 1;
      //   border: 2px solid transparent;
      //   line-height: 1rem;
      //   height: 2.0rem;
      //   display: flex; align-items: center;
      // }
      // span {
      //   cursor: pointer;
      //   padding: 0;
      // }
      // input {
      //   // min-width: 71.5%;
      //   min-width: 17.6rem;
      //   padding: 0 .5rem;
      //   border-color: #00000022;
      //   border-radius: .2rem;
      //   box-shadow: none;
      //   -webkit-appearance: none;
      // }
    }
    // .button {
    //   display: flex; align-items: center; justify-content: center;
    //   margin-left: .75rem;
    // }
  }
`