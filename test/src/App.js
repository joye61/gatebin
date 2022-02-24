import { GatewayConfig } from "@";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { Login } from "./pages/Login";
import { Images } from "./pages/Images";
import { Api } from "./pages/Api";

import { LoginT } from "./LoginT";
GatewayConfig({
  debug: true,
  entry: "//10.10.33.70:9003/do",
});

export default function App() {
  return (
    <>
      <Router>
        <div>
          <nav>
            <ul>
              <li>
                <Link to="/login">车轮登录测试</Link>
              </li>
              <li>
                <Link to="/images">图片加载测试</Link>
              </li>
              <li>
                <Link to="/api">接口请求测试</Link>
              </li>
            </ul>
          </nav>
          <Switch>
            <Route path="/login">
              <Login />
            </Route>
            <Route path="/images">
              <Images />
            </Route>
            <Route path="/api">
              <Api />
            </Route>
          </Switch>
        </div>
      </Router>
      <LoginT />
    </>
  );
}
