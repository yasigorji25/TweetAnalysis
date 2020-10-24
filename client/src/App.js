import React from 'react';
import './App.css';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import pie from "./chart.js"
// import WordCloud from "./wordCloud.js"

// Handel routing for whole pages of the app.
function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/" component={pie}></Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;

