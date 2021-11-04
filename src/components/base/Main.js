import React, { useRef } from 'react';
import { Route, Switch, Redirect, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useEventListener, useF, useTimeout } from '../../lib/hooks';

import { embedded, EmbeddedRoute, Page, Missing  } from './Contents';


const Style = styled.div`
    width: 100%;
    // background: none;
    background: #ffffff44;
    color: var(--light);
    height: 0;
    flex-grow: 1;
    // margin: .5rem auto;
    // max-width: calc(100% - 1rem);
    margin-top: 0;
    position: relative;
    // border-radius: .2rem;
    // overflow: hidden;
    border-bottom-left-radius: .2rem;
    border-bottom-right-radius: .2rem;

    & > * {
        // border-radius: 3px;
        border-bottom-left-radius: .2rem;
        border-bottom-right-radius: .2rem;
        overflow: hidden;
        // box-shadow: 1px 2px 6px #00000020;
        &.seamless {
            box-shadow: none;
        }
    }
`

const redirects = [
    ['/profile', '/u'],
].map(pair => (
    <Route path={pair[0]} key={pair.join()} render={routeProps =>
        <Redirect to={
            routeProps.location.pathname.replace(...pair) + routeProps.location.hash
        }/>
    }/>
));

export const Main = () => {
    return (
    <Style id='main'>
        <Switch>
            <Route path='/raw' render={() => window.location.reload()} />
            {redirects}
            {embedded.map(name => EmbeddedRoute({name, implicit: true}))}
            <Route path='/:id' component={Page} />
            <Route path='*' component={Missing} />
        </Switch>
    </Style>
    )
}
