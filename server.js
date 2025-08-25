import express from "express";

const app = express();

const PORT = process.env.PORT || PORT;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.post("/demoBook", (req, res) => {
  console.log("Something is Come in Server");
  console.log(req.body);
});

app.listen(PORT, () => {
  console.log(`Server is Running ${PORT}`);
});
