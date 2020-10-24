import React from 'react';
import './App.css';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import pie from "./chart.js";
import Line from "./lineChart.js"

// Handel routing for whole pages of the app.
function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route exact path="/" component={pie}></Route>
          <Route path="/linechart" component={Line}></Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;

