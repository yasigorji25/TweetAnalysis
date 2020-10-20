import React from 'react';

import './App.css';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Example from "./Analysis";
import pie from "./chart.js"
// import WordCloud from "./wordCloud.js"

// Handel routing for whole pages of the app.
function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route exact path="/" component={Example}></Route>
          <Route path="/sentiment/:hashtag" component={pie}></Route>
          {/* <Route path="/sentiment/insight" component={WordCloud}></Route> */}
        </Switch>
      </div>
    </Router>
  );
}

export default App;

