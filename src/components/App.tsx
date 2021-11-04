import React, { Fragment } from 'react';
import styled from 'styled-components';
import { BrowserRouter as Router, Route, Redirect, Switch, useHistory, useLocation } from 'react-router-dom'
import api from '../lib/api';
import { useAuth, useF } from '../lib/hooks';
import { useIo } from '../lib/io';
import { useNotify } from '../lib/notify';
import { Base } from './base/Base';
import { Header } from './base/Header';
import { Main } from './base/Main';


const Style = styled.div`
  display: flex;
  flex-direction: column;
  width: calc(100% - 1.2rem);
  height: calc(100% - 1.2rem);
  margin: 0.3rem 0.9rem 0.9rem 0.3rem;
  position: relative;
  border-radius: .2rem;
  z-index: 1;

  &::before {
    position: absolute;
    content: "";
    width: 100%;
    height: 100%;
    background: inherit;
    border-radius: inherit;
    z-index: -1;
  }
  &::after {
    position: absolute;
    top: -0.3rem; left: -0.3rem;
    content: "";
    width: calc(100% + 1.2rem);
    height: calc(100% + 1.2rem);
    background: linear-gradient(15deg,#609e98,#e2d291) fixed;
    z-index: -2;
  }

  &.shrink {
    transition: .5s;
    margin-left: auto;
    margin-right: auto;
    &::after {
      border-radius: .2rem;
    }
  }

  @media (max-width: 30.01rem) {
    width: calc(100% - 0.6rem);
    height: calc(100% - 0.6rem);
    margin-top: 0.3rem;
    &.standalone {
      height: calc(100% - 4.2rem);
    }
  }
`

const Util = () => {
  useNotify(useHistory());
  useIo()
  return <Fragment></Fragment>
}

function App() {
  return (
  <Router>
    <Util />
    <Switch>
      <Route exact path='/' component={Base} />
      <Route path='*'>
        <Style id='index' className={(window.navigator as any).standalone ? 'standalone' : ''}>
          <Header />
          <Main />
        </Style>
      </Route>
    </Switch>
  </Router>
  );
}

export default App;
