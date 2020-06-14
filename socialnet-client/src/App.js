import React from 'react';
import {BrowserRouter as Router, Route, Switch } from 'react-router-dom';


import './App.css';
import home from './pages/home';
import login from './pages/login';
import signup from './pages/signup'; 

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route path='/' component={home}/>
          <Route path='/login' component={login}/>
          <Route path='/signup' component={signup}/>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
