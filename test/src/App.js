import { GatewayConfig } from "@";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { Api } from "./pages/Api";

GatewayConfig({
  debug: true,
  entry: "//10.10.33.70:9003/do",
});

export default function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/api">接口请求测试</Link>
            </li>
          </ul>
        </nav>
        <Switch>
          <Route path="/api">
            <Api />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}
