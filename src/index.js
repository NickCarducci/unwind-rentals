import React /*, { useEffect, useRef }*/ from "react";
import { UAParser } from "ua-parser-js";
import {
  Route,
  BrowserRouter,
  Routes,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
import { createRoot } from "react-dom/client";
import InitApp from "./App";
//import Filament from "./ifilament.js";
import "./styles.css";

class Authentication extends React.Component {
  constructor(props) {
    super(props); //"everyone in order to be for the people that use it. who decides?"
    var parser = new UAParser();
    const name = parser.getBrowser().name;
    const device = parser.getDevice().type;
    const width =
      /* name.includes("Safari")
      ? window.screen.availWidth
      : */ window.innerWidth;
    /*const height = name.includes("Safari")
      ? window.screen.availHeight
      : window.innerHeight;*/
    this.state = {
      device,
      lastWidth: width,
      width,
      availableHeight: name
        ? window.screen.availHeight - 20
        : window.innerHeight,
      sudo: true,
      browser: name,
      ios: name.includes("Safari"),
      auth: undefined,
      user: undefined,
      meAuth: {},
      //storedAuth: undefined,
      storableAuth: []
    };
    this.anarchy = React.createRef();
    this.taxes = React.createRef();
  }
  handleScroll = (e) => {
    if (!this.state.offScroll) {
      const scrollTop = window.scrollY;
      this.setState(
        {
          scrolling: true,
          scrollTop
        },
        () => {
          clearTimeout(this.scrollTimeout);
          this.scrollTimeout = setTimeout(() => {
            this.setState({
              scrolling: false
            });
          }, 2000);
        } //will LP go anti-bank or is it Saver party grounds
      ); //can I get a 1 for third party donee beneficiary
    }
  };
  refresh = (event, first) => {
    const width =
      (this.state.ios ? window.screen.availWidth : window.innerWidth) - 20;
    //console.log(width);
    if (first || Math.abs(this.state.lastWidth - width) > 0) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.setState({
          lastWidth: width,
          width,
          availableHeight: this.state.ios
            ? window.screen.availHeight - 20
            : window.innerHeight
        });
      }, 1500);
    }
  };
  componentDidMount = () => {
    this.setState({
      ios: this.state.browser.includes("Safari"),
      iosNoPhoto: this.state.browser.includes("Safari")
    });
    this.checkInstall(true);
    window.FontAwesomeConfig = { autoReplaceSvg: "nest" };
    this.handleScroll();
    window.addEventListener("resize", this.refresh);
    window.addEventListener("scroll", this.handleScroll);
    this.refresh(null, true);
  };
  componentWillUnmount = () => {
    window.removeEventListener("beforeinstallprompt", this.beforeinstallprompt);
    window.removeEventListener("appinstalled", this.afterinstallation);
    this.matchMedia &&
      this.matchMedia.removeEventListener("change", this.installChange);
    clearTimeout(this.scrollTimeout);
    clearTimeout(this.resizeTimer);
    window.removeEventListener("resize", this.refresh);
    window.removeEventListener("scroll", this.handleScroll);
  };
  beforeinstallprompt = (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    this.setState({ showPWAprompt: true }, () => (this.deferredPrompt = e));
    // Optionally, send analytics event that PWA install promo was shown.
    console.log(`'beforeinstallprompt' event was fired.`);
  };
  afterinstallation = () => {
    this.setState({ showPWAprompt: false }, () => (this.deferredPrompt = null));
    console.log("PWA was installed");
  };
  installChange = (evt) => this.setState({ showPWAprompt: !evt.matches });

  checkInstall = (addListers) => {
    if (
      navigator.standalone ||
      window.matchMedia("(display-mode: standalone)").matches ||
      document.referrer.startsWith("android-app://")
    ) {
      console.log("PWA");
      /*window.alert(
        `wow, thanks for adding us to your homescreen, please re-add ` +
          `if any bugs pop up and email nick@thumbprint.us with any complaints! ` +
          `STAGE: Work-In-Progress Beta (a.k.a. Alpha)`
      );*/
    } else {
      const ios = () => {
        return (
          [
            "iPad Simulator",
            "iPhone Simulator",
            "iPod Simulator",
            "iPad",
            "iPhone",
            "iPod"
          ].includes(navigator.platform) ||
          // iPad on iOS 13 detection
          (navigator.userAgent.includes("iOS") && "ontouchend" in document)
        );
      };
      //!/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
      if (ios()) {
        if (addListers) {
          this.matchMedia = window.matchMedia("(display-mode: standalone)");
          this.matchMedia.addEventListener("change", this.installChange);

          console.log("PWA query");
          window.addEventListener(
            "beforeinstallprompt",
            this.beforeinstallprompt
          );
          window.addEventListener("appinstalled", this.afterinstallation);
          this.refresh();
        }
      } else
        this.setState({ showPWAprompt: true }, () =>
          console.log("PWA query on iOS")
        );
    }
  }; //cut progressive truncated wholesale tax deficit
  //cut tax deficit
  render() {
    const { pathname, location, navigate } = this.props,
      sp =
        location.state &&
        location.state.statePathname &&
        location.state.statePathname;
    const { availableHeight, showPWAprompt, width } = this.state;
    return !width ? null : (
      <InitApp
        rediret={this.props.rediret}
        navigate={navigate}
        pathname={pathname}
        statePathname={sp}
        location={location}
        unmountFirebase={this.state.unmountFirebase}
        showPWAprompt={this.state.device === "mobile" && showPWAprompt}
        apple={!this.matchMedia}
        appHeight={availableHeight}
        width={width}
        //history={history}
        closeWebAppPrompt={() => this.setState({ showPWAprompt: false })}
        addToHomescreen={async () => {
          this.setState({ showPWAprompt: false });
          if (!this.deferredPrompt) {
            window.alert(
              "for iOS, you must use their browser option, 'add to homescreen' " +
                "instead of providing web-developers beforeinstallprompt appinstalled"
            );
          } else {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(outcome);
            // the prompt can't be used again so, throw it away
            this.deferredPrompt = null;
          }
        }}
      />
    );
  }
}

const ClassHook = () => {
  return (
    <Authentication
      pathname={"/" + useParams()["*"]}
      location={useLocation()}
      navigate={useNavigate()}
    />
  );
}; // "cannot be called inside a callback" <Hook/>
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route
        //exact
        path="/*"
        //children,render
        element={<ClassHook />} //Initelement
      />
    </Routes>
  </BrowserRouter>
);
//don't use the stupidunusedrouter.js

/*const rootElement = document.getElementById("root");
ReactDOM.render(
  <BrowserRouter>
    <Routes>
      <Route
        //exact
        path="/*"
        //children,render
        element={<ClassHook />}
      />
    </Routes>
  </BrowserRouter>,
  rootElement
);*/
