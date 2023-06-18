import React from "react";
import firebase, { firebaseConfig } from "./init-firebase";
import oldfirebase from "firebase/compat/app";
import "firebase/compat/firestore";
import * as geofirestore from "geofirestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  endBefore,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  startAfter,
  where
} from "firebase/firestore";
const firestore = getFirestore(firebase);
export const standardCatch = (err, title) =>
  console.log(title || "err-msg:", err.message);
export const specialFormatting = (x, numbersOk) =>
  x
    .toLowerCase()
    //replace or regex a-z or A-Z includes space whitespace
    .replace(!numbersOk ? /[^a-zA-Z,']+/g : /[^a-zA-Z0-9,']+/g, " ")
    .split(" '")
    .map((word) => {
      var end = word.substring(1);
      var resword = word.charAt(0).toUpperCase() + end;
      return resword;
    })
    .join(" '")
    .split(" ")
    .map((word) => {
      var end = word.substring(1);
      var resword = word.charAt(0).toUpperCase() + end;
      resword.replaceAll("Of", "of");
      resword.replaceAll("And", "and");
      resword.replaceAll("The", "the");
      return resword;
    })
    .join(" ");
const reverst = (foo, oldCollection, geo) =>
  geo
    ? geo
        .firestore()
        .collection(foo.collection)
        //.doc(foo.id)
        .add(foo)
        .then(() => {
          console.log("document moved");
          geo
            .firestore()
            .collection(oldCollection)
            .doc(foo.id)
            .delete()
            .then(() =>
              console.log(
                `docum moved to ${foo.collection} collection ` + foo.id
              )
            )
            .catch(standardCatch);
        })
        .catch(standardCatch)
    : addDoc(collection(firestore, foo.collection), foo)
        .then(() => {
          console.log("doc moved " + oldCollection);
          deleteDoc(doc(firestore, oldCollection, foo.id))
            .then(() =>
              console.log(`doc moved to ${foo.collection} collection ` + foo.id)
            )
            .catch(standardCatch);
        })
        .catch(standardCatch);
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { housings: [], predictions: [], searching: "" };
    this.GeoFirestore = geofirestore.initializeApp(
      oldfirebase.initializeApp(firebaseConfig).firestore()
    );
  }
  componentDidMount = async () => {
    await signInAnonymously(getAuth()).catch(standardCatch);
    const params = this.props.pathname
      .split("/")
      .filter((x) => x !== "")
      .map((x) => x.replaceAll("%20", " "));
    var newCityToQuery = params[0];
    const letterEntered = /^[\W\D]/;
    if (!newCityToQuery || !letterEntered.test(newCityToQuery)) return null;
    if (!newCityToQuery.includes(",")) return null;
    newCityToQuery = specialFormatting(newCityToQuery).replace(/_/g, " ");
    //if (newCityToQuery !== this.props.city)
    console.log(newCityToQuery);
    await fetch(
      //`https://atlas.microsoft.com/search/address/json?subscription-key={sxQptNsgPsKENxW6a4jyWDWpg6hOQGyP1hSOLig4MpQ}&api-version=1.0&query=${enteredValue}&typeahead={typeahead}&limit={5}&language=en-US`
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${newCityToQuery}.json?limit=2&types=place&access_token=pk.eyJ1Ijoibmlja2NhcmR1Y2NpIiwiYSI6ImNrMWhyZ3ZqajBhcm8zY3BoMnVnbW02dXQifQ.aw4gJV_fsZ1GKDjaWPxemQ`
    )
      .then(async (response) => await response.json())
      .then((body) => {
        var city = body.features[0].place_name;
        if (city) {
          console.log("found " + city);

          const center = body.features[0].center;
          const query = this.GeoFirestore.collection("housing")
            .where("collection", "==", "housing")
            .near({
              center: new oldfirebase.firestore.GeoPoint(center[1], center[0]),
              radius: this.state.distance
            });
          // Get query (as Promise)
          query
            //.get()
            .onSnapshot((value) => {
              const housings = value.docs
                .map((doc) => {
                  var foo = doc.data();
                  /**
                   * EDIT DATE COLLECTION
                   */
                  const isChanged =
                    (foo.collection === "oldEvent" &&
                      new Date(foo.date.seconds * 1000) > new Date()) ||
                    (foo.collection === "event" &&
                      new Date(foo.date.seconds * 1000) < new Date());
                  console.log("isChanged", isChanged);
                  const newCollection =
                    foo.collection === "oldEvent" ? "event" : "oldEvent";
                  foo.collection = isChanged ? newCollection : foo.collection;
                  isChanged &&
                    reverst(
                      {
                        ...foo,
                        collection: foo.collection
                      },
                      newCollection,
                      this.GeoFirestore
                    );
                  return doc.exists && { ...foo, id: doc.id };
                })
                .filter((x) => x);
              console.log("success", housings);
              this.setState({ housings, city });
            });
        }
      });
  };
  componentDidUpdate = () => {
    if (this.state.selectedCommunity !== this.state.lastselectedCommunity) {
      this.setState(
        { lastselectedCommunity: this.state.selectedCommunity },
        () => {
          if (this.state.selectedCommunity === "") return null;
          var citytype;
          if (this.state.selectedCommunity.includes(",")) {
            citytype = where("city", "==", this.state.selectedCommunity);
          } else
            citytype = where("communityId", "==", this.state.selectedCommunity);
          getDocs(
            query(
              collection(firestore, "event"),
              citytype,
              where("collection", "==", "housing"),
              orderBy("date", "desc"),
              limit(10)
            )
          )
            .then((querySnapshot) => {
              this.setState({
                first: querySnapshot.docs[0],
                last: querySnapshot.docs[querySnapshot.docs.length - 1],
                housings: querySnapshot.docs
                  .map((doc) => {
                    return doc.exists() && { ...doc.data(), id: doc.id };
                  })
                  .filter((x) => x)
              });
            })
            .catch((e) => console.log(e));
        }
      );
    }
  };
  paginate = (key) => {
    var citytype;
    if (this.state.selectedCommunity.includes(",")) {
      citytype = where("city", "==", this.state.selectedCommunity);
    } else citytype = where("communityId", "==", this.state.selectedCommunity);
    getDocs(
      query(
        collection(firestore, "forum"),
        citytype,
        where("commtype", "==", "housing"),
        orderBy("date", "desc"),
        key === "first"
          ? endBefore(this.state.first)
          : startAfter(this.state.last),
        limit(10)
      )
    ).then((querySnapshot) => {
      this.setState({
        first: querySnapshot.docs[0],
        last: querySnapshot.docs[querySnapshot.docs.length - 1],
        housings: querySnapshot.docs
          .map((doc) => {
            return doc.exists() && { ...doc.data(), id: doc.id };
          })
          .filter((x) => x)
      });
    });
  };
  onSearcher = async (lastSearching) => {
    const { typesA = ["(address)"] } = this.props;
    //const { typesE = ["(establishment)"] } = this.props;

    //const numberEntered = /^[\d]/;
    const letterEntered = /^[\W\D]/;
    if (this.state.lastSearching !== lastSearching) {
      this.setState({ lastSearching, typesA }, async () => {
        if (lastSearching && letterEntered.test(lastSearching)) {
          await fetch(
            //`https://atlas.microsoft.com/search/address/json?subscription-key={sxQptNsgPsKENxW6a4jyWDWpg6hOQGyP1hSOLig4MpQ}&api-version=1.0&query=${enteredValue}&typeahead={typeahead}&limit={5}&language=en-US`
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lastSearching}.json?limit=2&types=place&access_token=pk.eyJ1Ijoibmlja2NhcmR1Y2NpIiwiYSI6ImNrMWhyZ3ZqajBhcm8zY3BoMnVnbW02dXQifQ.aw4gJV_fsZ1GKDjaWPxemQ`
          )
            .then(async (response) => await response.json())
            .then(
              (body) =>
                body.features &&
                body.features.constructor === Array &&
                body.features.length > 0 &&
                this.setState(
                  {
                    predictions: [...this.state.predictions, ...body.features],
                    lastPredictions: body.features
                  },
                  () => {}
                ),
              (err) => console.log(err)
            )
            .catch((err) => {
              console.log(err);
              alert("please try another city name");
            });
        }
      });
    } else {
      this.setState({ predictions: this.state.lastPredictions });
    }
  };
  render() {
    console.log(this.state.housings);
    return (
      <div>
        <div style={{ height: "56px", width: "100%" }}>
          <form
            style={{ display: "flex" }}
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <input
              placeholder="Communities"
              style={{
                paddingLeft: "10px",
                margin: "10px",
                height: "36px",
                backgroundColor: "transparent",
                border: "none",
                borderBottom: "1px solid black"
              }}
              value={this.state.searching}
              onChange={(e) => {
                var va = e.target.value;
                this.setState(
                  {
                    searching: specialFormatting(va)
                  },
                  () => {
                    clearTimeout(this.closer);
                    this.closer = setTimeout(() => {
                      this.onSearcher(this.state.searching);
                      getDocs(
                        query(
                          collection(firestore, "communities"),
                          where(
                            "messageAsArray",
                            "array-contains",
                            this.state.searching
                          )
                        )
                      ).then((querySnapshot) => {
                        this.setState({
                          communities: querySnapshot.docs
                            .map((doc) => {
                              return (
                                doc.exists() && {
                                  ...doc.data(),
                                  id: doc.id,
                                  isCommunity: true
                                }
                              );
                            })
                            .filter((x) => x)
                        });
                      });
                    }, 2000);
                  }
                );
              }}
            />
            {this.state.searching !== "" && (
              <div
                onClick={() => this.setState({ searching: "" })}
                style={{
                  color: "black",
                  backgroundColor: "white",
                  borderRadius: "10px",
                  padding: "0px 4px",
                  height: "min-content"
                }}
              >
                &times;
              </div>
            )}
          </form>
        </div>
        {this.state.communities && (
          <select
            onChange={(e) =>
              this.setState({ selectedCommunity: e.target.value })
            }
          >
            {["", ...this.state.communities, ...this.state.predictions].map(
              (x, i) => {
                const title = x.isCommunity ? x.message : x.place_name;
                return (
                  <option key={i} value={x.isCommunity ? x.id : x.place_name}>
                    {title}
                  </option>
                );
              }
            )}
          </select>
        )}
        {this.state.housings.map((housing, i) => (
          <div key={i}>
            {housing.title}:
            {new Date(housing.date.seconds * 1000).toLocaleDateString()}
          </div>
        ))}
        <div
          style={{
            display: this.state.housings.length > 0 ? "flex" : "none",
            justifyContent: "space-around",
            width: "100%"
          }}
        >
          <div onClick={() => this.state.first && this.paginate("first")}>
            {"<"}
          </div>
          {this.state.housings.length > 0 &&
            `Jobs expiring ${
              this.state.housings.length > 0 &&
              new Date(
                this.state.housings[0].date.seconds * 1000
              ).toLocaleDateString()
            }`}
          <div onClick={() => this.state.last && this.paginate("last")}>
            {">"}
          </div>
        </div>
      </div>
    );
  }
}
export default App;
