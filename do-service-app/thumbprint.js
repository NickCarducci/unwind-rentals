require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET); //("sk_test_4eC39HqLyjWDarjtT1zdp7dc");

var FIREBASEADMIN = null;
try {
  const finishedParsing = JSON.parse(process.env.FIREBASE_KEY),
    { initializeApp: initApp, cert } = require("firebase-admin/app");
  FIREBASEADMIN = initApp({
    credential: cert(finishedParsing),
    databaseURL: "https://vaumoney.firebaseio.com"
  });
} catch {}
const { getAuth, deleteUser } = require("firebase-admin/auth"),
  port = 8080,
  allowedOrigins = ["https://tpt.net.co", "https://onytp.csb.app"], //Origin: <scheme>://<hostname>:<port>
  RESSEND = (res, e) => {
    res.send(e);
    //res.end();
  },
  refererOrigin = (req, res) => {
    var origin = req.query.origin;
    if (!origin) {
      origin = req.headers.origin;
      //"no newaccount made body",  //...printObject(req) //: origin + " " + (storeId ? "storeId" : "")
    }
    return origin;
  },
  allowOriginType = (origin, res) => {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", ["POST", "OPTIONS", "GET"]);
    res.setHeader("Access-Control-Allow-Headers", [
      "Content-Type",
      "Access-Control-Request-Method",
      "Access-Control-Request-Methods",
      "Access-Control-Request-Headers"
    ]);
    //if (res.secure) return null;
    //allowedOrigins[allowedOrigins.indexOf(origin)]
    res.setHeader("Allow", ["POST", "OPTIONS", "GET"]);
    res.setHeader("Content-Type", "Application/JSON");
    var goAhead = true;
    if (!goAhead) return true;
    //if (!res.secure) return true;
    //https://stackoverflow.com/questions/12027187/difference-between-allow-and-access-control-allow-methods-in-http-response-h
  },
  preflight = (req, res) => {
    const origin = req.headers.origin;
    app.use(cors({ origin })); //https://stackoverflow.com/questions/36554375/getting-the-req-origin-in-express
    if (
      [...allowedOrigins, req.body.payingDomains].indexOf(
        req.headers.origin
      ) === -1
    )
      return RESSEND(res, {
        statusCode: 401,
        error: "no access for this origin- " + req.headers.origin
      });
    if (allowOriginType(req.headers.origin, res))
      return RESSEND(res, {
        statusCode,
        statusText: "not a secure origin-referer-to-host protocol"
      });
    //"Cannot setHeader headers after they are sent to the client"

    res.statusCode = 204;
    RESSEND(res); //res.sendStatus(200);
  },
  //const printObject = (o) => Object.keys(o).map((x) => {return {[x]: !o[x] ? {} : o[x].constructor === Object ? printObject(o[x]) : o[x] };});
  standardCatch = (res, e, extra, name) => {
    RESSEND(res, {
      statusCode: 402,
      statusText: "no caught",
      name,
      error: e,
      extra
    });
  },
  timeout = require("connect-timeout"),
  //fetch = require("node-fetch"),
  express = require("express"),
  app = express(),
  attach = express.Router(),
  cors = require("cors");
//FIREBASEADMIN = FIREBASEADMIN.toSource(); //https://dashboard.stripe.com/account/apikeys

app.use(timeout("5s"));
//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));
// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
//https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
//http://johnzhang.io/options-req-in-express
//var origin = req.get('origin');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

var statusCode = 200,
  statusText = "ok";
//https://support.stripe.com/questions/know-your-customer-(kyc)-requirements-for-connected-accounts

const nonbody = express
  .Router()
  .get("/", (req, res) => res.status(200).send("shove it"))
  .options("/*", preflight);
attach
  .post("/transfer", async (req, res) => {
    var origin = refererOrigin(req, res);
    if (!req.body || allowOriginType(origin, res))
      return RESSEND(res, {
        statusCode,
        statusText,
        progress: "yet to surname factor digit counts.."
      });

    const paymentIntent = await stripe.paymentIntents.create({
      customer: req.body.customerId,
      amount: req.body.total,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      transfer_data: {
        destination: req.body.stripeId
      }
    });
    if (!paymentIntent.id)
      return RESSEND(res, {
        statusCode,
        statusText,
        error: "no go paymentIntent create",
        paymentIntent
      });
    RESSEND(res, {
      statusCode,
      statusText,
      list: paymentIntent.id
    });
  })
  .post("/list", async (req, res) => {
    var origin = refererOrigin(req, res);
    if (!req.body || allowOriginType(origin, res))
      return RESSEND(res, {
        statusCode,
        statusText,
        progress: "yet to surname factor digit counts.."
      });

    const list = await stripe.paymentMethods
      .list({
        customer: req.body.customerId
      })
      .catch((e) =>
        standardCatch(res, e, { body: req.body }, "customer (list callback)")
      );

    if (!list.data)
      return RESSEND(res, {
        statusCode,
        statusText,
        error: "no data setupIntents list",
        list
      });
    RESSEND(res, {
      statusCode,
      statusText,
      list: list.data
    });
  })
  .post("/add", async (req, res) => {
    var origin = refererOrigin(req, res),
      declarePaymentMethod = async (req, res, newStore, cb) =>
        await stripe.paymentMethods
          .create(newStore)
          .then(async (method) => {
            if (!req.body.customerId) {
              cb(method.id);
            } else
              await stripe.paymentMethods
                .attach(method.id, {
                  customer: req.body.customerId
                })
                .then(async (same) => {
                  cb(method.id);
                })
                .catch((e) =>
                  standardCatch(res, e, { newStore, method }, "attach card")
                );
          })
          .catch((e) => standardCatch(res, e, newStore, "create card")),
      optionsPayments = (req) => {
        return {
          type: req.body.type, //"customer_balance"//"us_bank_account" "card"
          ...(req.body.type === "card"
            ? {
                card: {
                  number: req.body.primary, //16-digit primary,
                  exp_month: req.body.exp_month, //no zero-digit padding
                  exp_year: req.body.exp_year,
                  cvc: req.body.security
                }
              } //newCard
            : {
                us_bank_account: {
                  account_holder_type: req.body.company, //"individual"
                  account_number: req.body.account,
                  account_type: req.body.savings, //"savings"
                  routing_number: req.body.routing
                }
              }), //newBank
          billing_details: {
            address: req.body.address,
            email: req.body.email,
            phone: req.body.phone,
            name: req.body.name
          }
        };
      };
    if (!req.body || allowOriginType(origin, res))
      return RESSEND(res, {
        statusCode,
        statusText,
        progress: "yet to surname factor digit counts.."
      });
    if (!req.body.bankcard)
      return await declarePaymentMethod(
        req,
        res,
        optionsPayments(req),
        (cardId) => setupIntent((req, cardId), res, "add")
      );
    var newMethod = {
      //confirm: true,
      payment_method_types: [req.body.bankcard]
    };

    if (false && req.body.bankcard === "us_bank_account")
      newMethod.payment_method_options = {
        us_bank_account: {
          financial_connections: {
            permissions: ["payment_method"]
          }
        }
      };
    const setupIntent = await stripe.setupIntents
      .create(newMethod)
      .catch((e) =>
        standardCatch(res, e, {}, "setup intents (create callback)")
      );

    if (!setupIntent.id)
      return RESSEND(res, {
        statusCode,
        statusText,
        error: "no go setupIntent create"
      });
    RESSEND(res, {
      statusCode,
      statusText,
      setupIntent
    });
  })
  .post("/beneficiary", async (req, res) => {
    var origin = refererOrigin(req, res);
    //RESSEND(res, { statusCode, statusText, data: "ok without headers" });
    if (!req.body || allowOriginType(origin, res))
      return RESSEND(res, {
        statusCode,
        statusText,
        progress: "yet to surname factor digit counts.."
      });
    const person_ = await stripe.accounts
      .createPerson(req.body.accountId, {
        first_name: req.body.first,
        last_name: req.body.last,
        person_token: req.body.person.account_token
      })
      .catch((e) => standardCatch(res, e, {}, "person (create callback)"));

    if (!person_.id) {
      const error = "person";
      return RESSEND(res, { statusCode, statusText, error });
    }
    var acct_ = await stripe.accounts
      .update(req.body.accountId, {
        account_token: req.body.companyAccount.account_token
      })
      .catch((e) =>
        standardCatch(res, e, { person_ }, "account (update callback)")
      );

    if (!acct_.id) {
      const error = "update";
      return RESSEND(res, { statusCode, statusText, error });
    }
    const obj = {
        [req.body.type === "custom" ? "stripecustom" : "stripe"]: acct_.id,
        mcc: req.body.mcc
      },
      obj1 = { ...obj, redo: "true" };
    const accLink = await stripe.accountLinks
      .create({
        account: acct_.id, //: 'acct_1032D82eZvKYlo2C',
        return_url:
          origin +
          "?" +
          String(
            Object.keys(obj).map(
              (key, i) =>
                key +
                "=" +
                obj[key] +
                (i !== Object.keys(obj).length - 1 ? "&" : "")
            )
          ).replaceAll(",", ""),
        refresh_url:
          origin +
          "?" +
          String(
            Object.keys(obj1).map(
              (key, i) =>
                key +
                "=" +
                obj[key] +
                (i !== Object.keys(obj1).length - 1 ? "&" : "")
            )
          ).replaceAll(",", ""),
        type: "account_onboarding"
      })
      .catch((e) =>
        standardCatch(res, e, { acct_ }, "accountLink (create callback)")
      );
    if (!accLink.url) {
      const error = "accountLink";
      return RESSEND(res, { statusCode, statusText, error });
    }
    RESSEND(res, {
      statusCode,
      statusText: "successful accountLink",
      account: { id: acct_.id, accountLink: accLink, person: person_ }
    });
  })
  .post("/purchase", async (req, res) => {
    var origin = refererOrigin(req, res);
    if (!req.body || allowOriginType(origin, res))
      return RESSEND(res, {
        statusCode,
        statusText,
        progress: "yet to surname factor digit counts.."
      });

    if (!req.body.newAccount)
      return RESSEND(res, {
        statusCode,
        statusText,
        error: "no newAccount",
        body: req.body
      });
    const acct = await stripe.accounts
      .create({
        type: req.body.type,
        country: req.body.country,
        ...req.body.newAccount
      })
      .catch((e) =>
        standardCatch(res, e, { body: req.body }, "account (create callback)")
      );

    if (!acct.id)
      return RESSEND(res, {
        statusCode,
        statusText,
        error: "no account",
        account: acct
      });
    RESSEND(res, {
      statusCode,
      statusText,
      account: acct
    });
  })
  .post("/deleteemail", async (req, res) => {
    if (allowOriginType(req.headers.origin, res))
      return RESSEND(res, {
        statusCode,
        statusText: "not a secure origin-referer-to-host protocol"
      });
    var auth = req.body;
    await deleteUser(auth)
      .then(async () => {
        var email = auth.email;
        delete auth.email;
        delete auth.emailVerified;
        delete auth.password;
        await getAuth(FIREBASEADMIN)
          .createUser(auth)
          .then((w) =>
            RESSEND(res, {
              statusCode,
              statusText,
              message: `user ${auth.uid} successfully removed ${email} from firebase and firestore`,
              data: w // resp
            })
          )
          .catch((err) => standardCatch(res, err, { email }, "createUser"));
      })
      .catch((err) => standardCatch(res, err, { auth }, "deleteUser"));
  })
  .post("/customer", async (req, res) => {
    var origin = refererOrigin(req, res);
    if (!req.body || allowOriginType(origin, res))
      return RESSEND(res, {
        statusCode,
        statusText,
        progress: "yet to surname factor digit counts.."
      });

    //RESSEND(res, { statusCode, statusText, data: "before stripe calls" });
    const cus = await /*promiseCatcher(
        r,
        "customer",*/
    stripe.customers
      .create(req.body.customer)
      .catch((e) => standardCatch(res, e, {}, "customer (create callback)"));
    if (!cus.id) {
      return RESSEND(res, {
        statusCode,
        statusText,
        error: "no go customer (create)"
      });
    }

    RESSEND(res, { statusCode, statusText, customer: cus });
  });
//https://stackoverflow.com/questions/31928417/chaining-multiple-pieces-of-middleware-for-specific-route-in-expressjs
app.use(nonbody, attach); //methods on express.Router() or use a scoped instance
app.listen(port, () => console.log(`localhost:${port}`));
process.stdin.resume(); //so the program will not close instantly
function exitHandler(exited, exitCode) {
  if (exited) {
    console.log("clean");
  }
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (exited.mounted) process.exit(); //bind-only not during declaration
} //bind declare (this,update) when listened on:
process.on("uncaughtException", exitHandler.bind(null, { mounted: true }));
process.on("exit", exitHandler.bind(null, { clean: true }));
function errorHandler(err, req, res, next) {
  console.log("Oops", err);
}
app.use(errorHandler);
