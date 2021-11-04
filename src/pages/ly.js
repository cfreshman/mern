/* eslint-disable react/prop-types */
import React, { useState, useRef, Fragment } from 'react';
import api from '../lib/api';
import { randAlphanum } from '../lib/util';
import styled from 'styled-components';
import { useE, useF, useAuth } from '../lib/hooks';
import { InfoStyles, InfoBody, InfoSection, InfoUser, InfoLine, InfoLabel } from '../components/base/Info'
import { copy } from '../lib/copy'


const tiny = (window.location.hostname === 'localhost')
  ? window.location.origin : 'https://f8n.co'
const short = (window.location.hostname === 'localhost')
  ? window.location.origin : 'https://cyfr.dev'
const long = (window.location.hostname === 'localhost')
  ? window.location.origin : 'https://freshman.dev'

export default () => {
  let auth = useAuth()
  let [error, setError] = useState('')
  let [hash, setHash] = useState(location.hash.slice(2) || '')
  let [ly, setLy] = useState({
    hash,
    links: []
  })
  let [lys, setLys] = useState(undefined)
  let [edit, setEdit] = useState(false);

  useF(auth.user, () => {
    ly.hash && handle.load();
    handle.loadAll();
  })
  useF(ly, () => {
    window.history.replaceState(null, '/ly', '/ly' + (ly.hash
      ? `/#/${ly.hash}`
      : ''))
  })
  useF(edit, () => edit && setHash(ly.hash))
  const handle = {
    setLy,
    setEdit,
    loadAll: () => {
      if (auth.user) {
        api.get('/ly').then(data => {
          setError('')
          setLys(data.list)
        }).catch(e => setError(e.error))
      } else {
        setLys([])
      }
    },
    load: () => {
      ly.hash && api.get(`/ly/${ly.hash}`).then(data => {
        setError('')
        if (data.ly) {
          setLy(data.ly);
        } else {
          // setError(`/ly/${ly.hash} does not exist`)
          setEdit(true)
        }
      }).catch(e => setError(e.error))
    },
    save: () => {
      ly.links = ly.links.filter(l => l)
      api.post(`/ly/${ly.hash}`, ly).then(data => {
        setError('')
        if (data.ly) {
          setLy(data.ly);
          setEdit(false);
          handle.loadAll();
        } else {
          // setError(`${ly.hash} does not exist`)
          setEdit(true)
        }
      }).catch(e => {
        setError(e.error)
        setEdit(true)
      })
    },
    new: () => {
      setEdit(true)
      setLy({
        hash: randAlphanum(7),
        links: [],
        isNew: true,
      })
    },
    delete: () => {
      api.delete(`/ly/${ly.hash}`).then(data => {
        handle.setLy({ hash: '' })
        handle.loadAll()
      })
    },
    cancel: () => {
      setEdit(false)
      setError('')
      if (ly.isNew) {
        handle.menu()
      } else {
        setLy(lys.find(l => l.hash === hash))
      }
    },
    menu: () => {
      setEdit(false)
      setError('')
      setLy({
        hash: '',
        links: [],
      })
    },
  };

  return (
  <Style>
    <InfoBody>
      {!error ? ''
      : <div className='error' style={{color: 'red', minHeight: '0'}}>{error}</div>}
      {ly.hash && !edit
      ? <LinkView handle={handle} ly={ly} />
      : auth.user !== 'cyrus'
      ? `you aren't an admin, sorry :/`
      : ly.hash
      ? <LinkEdit handle={handle} ly={ly} />
      : <LinkMenu handle={handle} lys={lys} />}
    </InfoBody>
  </Style>
  )
}

const LinkMenu = ({handle, lys}) => {
  let auth = useAuth()
  let [copied, setCopied] = useState(-1)
  let [copyOff, setCopyOff] = useState(-1)

  useF(copied, () => {
    if (copied > -1) {
      clearTimeout(copyOff)
      setCopyOff(setTimeout(() => setCopied(-1), 3000))
    }
  })
  return auth.user && lys
  ? <Fragment>
    <InfoLine><InfoLabel labels={[
      { text: 'new', func: handle.new }
    ]} /></InfoLine>
    <InfoSection className='lys'
    labels={['your links']}>
      {lys.length
      ? lys.map((ly, i) =>
        <InfoLine key={i} labels={[
            { text: 'edit', func: () => handle.setLy(ly) },
            ly.links[0] + (ly.links.length === 1 ? '' : ` + ${ly.links.length - 1}`)
          ]}>
          <div className={copied === i ? 'entry' : 'entry link'} onClick={() => {
            copy(`${short}/ly/${ly.hash}`)
            setCopied(i)
            }}>
            {copied === i ? 'copied!' : `/ly/${ly.hash}`}</div>
        </InfoLine>)
      : <div>no links</div>}
    </InfoSection>
  </Fragment>
  : <InfoSection label='your links'>
    {lys ? 'sign in to create & edit links' : ''}
  </InfoSection>
}

const LinkEdit = ({handle, ly}) => {
  const auth = useAuth()
  const hashInput = useRef();
  const linksInput = useRef();
  useE(ly, () => {
    // hashInput.current.value = ly.hash;
    // linksInput.current.value = ly.links.join('\n');
  });
  return <Fragment>
    <InfoLine><InfoLabel labels={[
      { text: 'menu', func: () => handle.menu() },
      { text: 'cancel', func: () => handle.cancel() },
      ly.links.some(l=>l) ? { text: 'save', func: () => handle.save(ly) } : ''
    ]} /></InfoLine>
    <InfoSection className='edit-container' labels={[
      'name',
    ]} >
      <input ref={hashInput}
          className='input' type='text' spellCheck='false'
          value={ly.hash}
          onChange={e => handle.setLy({...ly, hash: hashInput.current.value})} />
    </InfoSection>

    <InfoSection label='author'>
      {ly.user || auth.user}
    </InfoSection>

    <InfoSection className='edit-container' label='links'>
      <textarea ref={linksInput}
        className='input' spellCheck='false'
        rows={Math.max(5, ly.links.length + 1)}
        value={ly.links.join('\n')}
        onChange={e => {
          let newLinks = linksInput.current.value
            .replace(/\n{3,}/g, '\n\n')
            .split('\n')
            .map(l => l.trim())
          handle.setLy({ ...ly, links: newLinks})}} />
    </InfoSection>
  </Fragment>
}

const LinkView = ({handle, ly}) => {
  let auth = useAuth()
  let [copied, setCopied] = useState(false)
  let [confirm, setConfirm] = useState(false)

  let isUser = auth.user === ly.user;
  let isMe = auth.user === 'cyrus';
  return <Fragment>
    {!isMe ? '' : <InfoLine><InfoLabel labels={[
      { text: 'menu', func: () => handle.menu() },
      isUser ? { text: 'edit', func: () => handle.setEdit(true) } : '',
      (isUser && !confirm) ? { text: 'delete', func: () => setConfirm(true) } : '',
      (isUser && confirm) ? { text: 'cancel', func: () => setConfirm(false) } : '',
      (isUser && confirm) ? { text: 'really delete', func: handle.delete } : '',
    ]} /></InfoLine>}
    <InfoSection labels={[
      'name',
    ]}>
      <div className={copied ? '' : 'entry link'} onClick={() => {
        // copy(`${window.location.origin}/ly/${ly.hash}`);
        copy(`${short}/ly/${ly.hash}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
        }}>
        {/* {copied ? 'copied!' : `${window.location.host}/ly/${ly.hash}`}</div> */}
        {/* {copied ? 'copied!' : `${tiny.replace(/https?:\/\//, '')}/ly/${ly.hash}`}</div> */}
        {copied ? 'copied!' : `cyfr.dev/ly/${ly.hash}`}</div>
    </InfoSection>

    {!isMe ? '' : <InfoUser labels={['author']} user={ly.user || auth.user || ''} />}

    <InfoSection label='links'>
      {ly.links.map((link, i) =>
      <div className='entry' key={i}>
        <a href={'https://' + link.replace(/https?:\/\//, '')}>
          {link}
        </a>
      </div>)}
    </InfoSection>
  </Fragment>
}


const Style = styled(InfoStyles)`
  .lys {
    .entry {
      min-width: 8rem;
    }
  }
`