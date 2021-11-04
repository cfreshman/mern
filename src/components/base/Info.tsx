import React, { Fragment } from 'react';
import { useHistory, Link } from 'react-router-dom';
import styled from 'styled-components';
import { openLogin } from '../../lib/auth';

export type InfoLabelType = (string | {
  text?: string,
  func?: () => any,
  dot?: string | true,
  style?: React.CSSProperties,
})
export type InfoEntryType = (string | {text: string, data: any})
export type InfoLineType = (any | {content: any, labels: InfoLabelType[]})

const _InfoBadge = ({label}: {label: InfoLabelType}) =>
  typeof label === 'object'
  ? label.dot
  ? <div className='label dot inline'
      style={{backgroundColor: (label.dot || 'black') as string}}
      onClick={label.func}></div>
  : <div className='button button-badge inline'
      onClick={label.func} style={label.style}>{label.text}</div>
  : <div className='label inline'>{label}</div>

export const InfoBadges = ({labels, inline}: {
  labels: InfoLabelType[], inline?: boolean
}) => {
  inline = inline ?? true
  return labels.length ? <Fragment>
    <div className={`badges ${inline ? 'inline' : ''}`}>
      {labels.filter(l => l).map((l, i) => <_InfoBadge key={i} label={l} />)}
    </div>
  </Fragment> : <Fragment></Fragment>
}

export const InfoLabel = ({labels}: {
  labels: InfoLabelType[]
}) => {
  return <Fragment>
    <InfoBadges {...{ labels, inline: false }}/>
    <br/>
  </Fragment>
}

export const InfoUser = ({user, labels, userLabels}: {
  user: string,
  labels?: InfoLabelType[],
  userLabels?: InfoLabelType[],
}) => {
  const history = useHistory()
  labels = labels || ['user']
  userLabels = userLabels || []

  return <InfoLinks {...{
    labels,
    entries: [user],
    entryFunc: () => history.push(`/u/${user}`),
    entryLabels: [userLabels]
  }}/>
}

export const InfoSection = (props: {
  [key: string]: any,
  label?: InfoLabelType,
  labels?: InfoLabelType[],
}) => {
  const labels = props.label ? [props.label] : props.labels || []
  return <div {...props}>
    {labels.length ? <InfoLabel {...{ labels }} /> : ''}
    {props.children}
  </div>
}
export const InfoLine = (props: {
  [key: string]: any,
  labels?: InfoLabelType[],
}) => {
  const labels = props.label ? [props.label] : props.labels || []
  return <div {...props} className={`entry-line ${props.className || ''}`}>
    {props.children}
    {labels
    ? <InfoBadges {...{ labels }} />
    : ''}
  </div>
}
export const InfoLines = (props: {
  [key: string]: any,
  labels?: InfoLabelType[],
  lines: InfoLineType[],
  classes?: string[],
}) => {
  const {labels, lines, classes=[]} = props
  return <InfoSection labels={labels} {...props}>
    {lines.map((line, i) => (
      <InfoLine key={i} labels={line.labels} className={classes[i]}>
        {line.content || line}
      </InfoLine>
    ))}
  </InfoSection>
}

export const InfoEntry = (props: {
  [key: string]: any,
}) => {
  return <div className='entry' {...props}>
    {props.children}
  </div>
}
export const InfoLink = (props: {
  [key: string]: any,
  to?: string,
  text?: string,
  local?: string,
}) => {
  let { to, text, local } = props
  if (local) {
    text = text ?? local
    to = `${window.origin}${local}`
  }
  return (!to ?
  <div className='entry link' {...props}>
    {props.children || text}
  </div>
  : to.match(`^${window.origin}`) ?
  <Link className='entry link' {...props} to={to.replace(`${window.origin}`, '')} >
    {props.children || text || to}
  </Link>
  :
  <a className='entry link' href={to} {...props}>
    {props.children || text || to}
  </a>
  )
}

export const InfoList = (props: {
  entries: InfoEntryType[],
  labels?: InfoLabelType[],
  entryLabels?: InfoLabelType[][],
  classes?: string[],
}) => {
  const {entries, labels, entryLabels=[], classes} = props
  return <InfoLines {...props} {...{
    labels, classes, lines: entries.map((entry, i) => ({
      labels: entryLabels[i],
      content: (
      <InfoEntry>
        {typeof entry === 'object' ? entry.text : entry}
      </InfoEntry>),
    }))
  }} />
}
export const InfoLinks = (props: {
  entries: InfoEntryType[],
  labels?: InfoLabelType[],
  entryLabels?: InfoLabelType[][],
  classes?: string[],
}) => {
  const {entries, labels, entryLabels=[], classes} = props
  return <InfoLines {...props} {...{
    labels, classes, lines: entries.map((entry, i) => ({
      labels: entryLabels[i],
      content: (
      <InfoLink to={typeof entry === 'object' ? entry.data : entry}>
        {typeof entry === 'object' ? entry.text : entry}
      </InfoLink>),
    }))
  }} />
}
export const InfoFuncs = (props: {
  entries: InfoEntryType[],
  entryFunc: (entry: InfoEntryType) => any,
  labels?: InfoLabelType[],
  entryLabels?: InfoLabelType[][],
  classes?: string[],
}) => {
  const {entries, entryFunc, labels, entryLabels=[], classes} = props
  return <InfoLines {...props} {...{
    labels, classes, lines: entries.map((entry, i) => ({
      labels: entryLabels[i],
      content: (
      <InfoLink onClick={() => entryFunc(typeof entry === 'object' ? entry.data : entry)}>
        {typeof entry === 'object' ? entry.text : entry}
      </InfoLink>),
    }))
  }} />
}

export const InfoSearch = ({searchRef, placeholder, search}: {
  searchRef: any, // Ref
  placeholder: string,
  search: () => any,
}) => {

  return <div className='search'>
    <input ref={searchRef} type='text' placeholder={placeholder}
      autoCorrect='off' autoCapitalize='off'
      onKeyDown={e => e.key === 'Enter' && search()}/>
    <span className='submit' onClick={search}>[ <span>go</span> ]</span>
  </div>
}
export const InfoAutoSearch = ({searchRef, placeholder, term, search, go, tab}: {
  searchRef: any, // Ref
  placeholder: string,
  term: string,
  search: () => any,
  go: () => any,
  tab?: (dir: number) => any,
}) => {

  return <div className='search'>
    <input ref={searchRef} type='text' placeholder={placeholder}
        autoCorrect='off' autoCapitalize='off'
        value={term} onChange={search}
        onKeyDown={e => {
          if (e.key === 'Enter') go()
          if (tab && e.key === 'Tab') {
            tab(e.shiftKey ? -1 : 1)
            e.preventDefault()
          }
        }}/>
    <span className='submit' onClick={go}>[ <span>go</span> ]</span>
  </div>
}

export const InfoBody = (props: any) => {
  return (
  <div {...props} className={`body ${props.className || ''}`}>
    {props.children}
  </div>)
}

export const InfoLoginBlock = (props: {
  to?: string,
  text?: string,
  inline?: boolean,
}) => {
  return (props.inline)
  ? <InfoLink className='login-block entry link' onClick={openLogin}>
    {props.text || `log in to ${props.to || 'view page'}`}
  </InfoLink>
  : <InfoLine className='login-block' onClick={openLogin}>
    <InfoLink>{props.text || `log in to ${props.to || 'view page'}`}</InfoLink>
  </InfoLine>
}

const background = 'white'; //'rgb(251 250 247)'
export const InfoStyles = styled.div`
height: 100%; width: 100%;
background: ${background};
color: black;
display: flex; flex-direction: column;
.body {
  flex-grow: 1;
  overflow-y: auto;
  padding: .8rem 1rem;

  .badges {
    display: inline-flex;
    // align-items: center;
    align-items: flex-end;
    justify-content: flex-start;
    flex-wrap: wrap;
    margin-top: -.5rem;
    margin-left: -.5rem;
    > * {
      margin-top: .5rem;
      margin-left: .5rem;
      &.label { margin-top: calc(2px + .5rem); }
    }
    &.inline {
      margin-left: 0;
      > * {
        // margin-bottom: 0;
        // &.label { margin-bottom: 2px; }
      }
    }
  }
  .label, .lil-badge, .button-badge {
    display: block;
    &.inline { display: inline-block; }
    width: fit-content;
    font-size: .8rem;
    padding: 0 .3rem;
    border-radius: .3rem;
  }
  .label, .lil-badge {
    opacity: .5;
    background: #00000022;
    // line up with button 2px border
    // border: 2px solid ${background};
    margin-top: 2px; margin-bottom: 2px;
    border-left: none;
    border-right: none;
  }
  .lil-badge {
    margin-left: .5rem;
  }
  .label.dot {
    opacity: 1;
    padding: 0;
    height: .35rem;
    width: .35rem;
    border-radius: 50%;
    background-color: black;
  }

  > * {
    margin-bottom: .5rem;
    // min-height: 3rem;
  }
  .entry-line {
    min-height: 3rem;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    min-height: 0; // overrides 3rem above
    padding-top: 1px;
  }
  .entry-line > *:not(.button), .entry {
    margin-right: .25rem;
    color: black;
    &.link, a {
      cursor: pointer;
      user-select: all;
      color: black;
      :hover { text-decoration: underline; }
    }
  }

  .button {
    display: inline-block;
    // margin-left: .5rem;
  }
}
.button {
  cursor: pointer; user-select: none;
  display: inline-block;
  width: fit-content;
  font-size: .8rem;
  border: .15rem solid black;
  padding: 0 .3rem;
  border-radius: .3rem;
}
.edit-container {
  // width: 66%;
  width: 17.6rem;
  input {
    height: 2.0rem;
    line-height: 1rem;
  }
  input, textarea {
    width: 100%;
    color: black;
    border: .15rem solid transparent;
    padding: 0 .25rem;
    border-color: #00000022;
    border-radius: .2rem;
    box-shadow: none;
    margin: .25rem 0;
    -webkit-appearance: none;
    &:read-only {
      border-color: transparent;
      background: #00000011;
    }
  }
  .button {
    float: right;
  }
}
.search {
  padding: .3rem .3rem;
  background: black;
  // background: #a2ddff;
  display: flex;
  input {
    width: 8rem;
    // font-size: .8rem;
    font-size: max(16px, .8rem);
    &::placeholder { font-size: .8rem; }
    background: white;
    border: white;
    color: black;
    padding: 0 .3rem;
    border-radius: .3rem;
    min-width: 42%;
  }
  .submit {
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: white;
    padding: 0 .3rem;
    border-radius: .3rem;
    margin-left: .3rem;
    white-space: pre;
    font-size: .9rem;
    &:hover span { text-decoration: underline; }
  }
}

.login-block .entry, .login-block {
  user-select: none !important;
}
`