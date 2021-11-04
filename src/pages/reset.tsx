import React, { useState, useRef, Fragment } from 'react';
import styled from 'styled-components';
import { useRouteMatch } from 'react-router-dom';
import api from '../lib/api'
import { useF, useAuth } from '../lib/hooks'
import { handleAuth, sha256 } from '../lib/auth';
import { InfoStyles, InfoBody, InfoSection, InfoLoginBlock } from '../components/base/Info'


// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  let auth = useAuth();
  let match = useRouteMatch('/reset/:user') as any;
  let user = auth.user || match?.params.user;
  let token = window.location.hash?.slice(1);
  let passRef = useRef();
  let [sent, setSent] = useState(false);

  useF(user, () => {
    if (auth.user) {
      window.history.replaceState(null, '/reset', `/reset/${auth.user}`)
    }
  })
  const handle = {
    reset: () => {
      let pass = (passRef.current as HTMLInputElement).value
      if (pass) {
        setSent(true)
        sha256(pass).then(hash => {
          if (auth.user) {
            api.post('reset/user', { pass: hash }).then(handleAuth)
          } else {
            api.post('reset/token', { user, token, pass: hash }).then(handleAuth)
          }
        })
      }
    },
  }

  return <InfoStyles>
    <InfoBody>
    {!user ? <InfoLoginBlock to='change password' /> : <Fragment>
      <InfoSection label='user'>{user}</InfoSection>
      <InfoSection label='new password' className='edit-container'>
        <input ref={passRef} type='password' placeholder='password'
            readOnly={sent}
            onKeyDown={e => e.key === 'Enter' && handle.reset()}/>
          {sent?'': <span className='button' onClick={handle.reset}>update</span>}
      </InfoSection>
    </Fragment>}
    </InfoBody>
  </InfoStyles>
}