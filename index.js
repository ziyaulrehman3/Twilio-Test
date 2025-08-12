import dotenv from "dotenv";
dotenv.config();

import express from "express";
const app = express();

import twilio from "twilio";

const PORT = process.env.PORT || 3000;

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function callTwilio() {
  const call = await twilioClient.calls.create({
    from: process.env.MY_PHONE_NUMBER,
    to: "+919760999879",
    url: "http://demo.twilio.com/docs/voice.xml",
  });

  console.log("Calling to Ziya... ");
}

app.get("/", (req, res) => {
  res.send("Hello from Twilio App");
  callTwilio();
});

app.post("/voice", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say("ello, this is a Ziya test call from Younglabs!");
  res.type("text/xml");
  res.send(twiml.toString());
});

app.listen(PORT, (req, res) => {
  console.log("Server is running on port " + PORT);
});
