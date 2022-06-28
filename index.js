const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const jwt = require('jsonwebtoken');
require("dotenv").config();

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hwnnn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});


function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  const token = authHeader.split(" ")[1]; // .split() return a array.
  // verify a token symmetric
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    // console.log(decoded)
    req.decoded = decoded;
    next();
  });
}



async function run() {
  try {
    await client.connect();
    const toolCollection = client
      .db("textile_industrial_tools")
      .collection("tools");
    const orderCollection = client
      .db("textile_industrial_tools")
      .collection("orders");
    const reviewCollection = client
      .db("textile_industrial_tools")
      .collection("reviews");
    const userCollection = client
      .db("textile_industrial_tools")
      .collection("users");
    const profileCollection = client
      .db("textile_industrial_tools")
      .collection("profiles");



      const verifyAdmin = async (req, res, next) => {
        const requester = req.decoded.email;
        const requesterAccount = await userCollection.findOne({
          email: requester,
        });
        if (requesterAccount.role === "admin") {
        } else {
          res.status(403).send({ message: "Forbidden Request" });
        }
        next();
      };



      app.get("/user", async (req, res) => {
        const users = await userCollection.find().toArray();
        res.send(users);
      });

       // find and update user data in database (when user login or Register)
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const option = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, option);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" }
      );
      res.send({ result, token });
    });


    app.delete("/user/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      console.log(filter);
      const result = await userCollection.deleteOne(filter);
      res.send(result);
    });


     // check user (Admin or not)
     app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user?.role === "admin";
      res.send({ admin: isAdmin });
    });

    //  do admin in Dashboard Route (All User) page
    app.put("/user/admin/:email",  async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });




    // Call from home page (Tools and Equipment) section
    app.get("/tools", async (req, res) => {
      const tools = await toolCollection.find().toArray();
      res.send(tools);
    });
    // Call from Purchase Page
    app.get("/tools/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const tool = await toolCollection.findOne(query);
      res.send(tool);
    });

    // Call from (Add New Product) Page
    app.post("/tools", async (req, res) => {
      const tool = req.body;
      const result = await toolCollection.insertOne(tool);
      res.send(result);
    });

    // Call from Purchase Page
    app.put("/tools/:id", async (req, res) => {
      const id = req.params.id;
      const newQuantity = req.body;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updateQuantity = {
        $set: {
          available: newQuantity.available,
        },
      };
      const result = await toolCollection.updateOne(
        filter,
        updateQuantity,
        option
      );
      res.send(result);
    });

    app.delete("/tools/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolCollection.deleteOne(query);
      res.send(result);
    });

      // Call from Manage Order Page
    app.get("/orders", async (req, res) => {
      const orders = await orderCollection.find().toArray();
      res.send(orders);
    });

    // Call from My Order Page
    app.get("/orders/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const order = await orderCollection.find(filter).toArray();
      res.send(order);
    });

    // Call from Purchase Page
    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    // Call from My Order Page
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });


    app.get("/review", async (req, res) => {
      const reviews = await reviewCollection.find().toArray();
      res.send(reviews);
    });

    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });


     // call from my profile route
    app.get("/profile/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const profile = await profileCollection.find(filter).toArray();
      res.send(profile);
    });

    app.post("/profile", async (req, res) => {
      const profile = req.body;
      const result = await profileCollection.insertOne(profile);
      res.send(result);
    });



  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from Textile Industrial Tools and Equipment Server!");
});

app.listen(port, () => {
  console.log(
    `Textile Industrial Tools and Equipment app listening on port: ${port}`
  );
});
