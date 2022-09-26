const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const cron = require("node-cron");

const postURL = () => {
  //add a small timeout to allow the ngrok server to start
  setTimeout(() => {
    fetch("http://localhost:4040/api/tunnels")
      .then((res) => res.json())
      .then((json) => json.tunnels.find((tunnel) => tunnel.proto === "tcp"))
      .then((secureTunnel) => {
        console.log(secureTunnel.public_url);
        //send url to slack channel
        fetch("https://slack.com/api/chat.postMessage", {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SLACK_TOKEN}`,
          },
          body: JSON.stringify({
            channel: process.env.SLACK_CHANNEL,
            text: `ngrok url:${secureTunnel.public_url}`,
          }),
        });
      })
      .catch((err) => {
        if (err.code === "ECONNREFUSED") {
          fetch("https://slack.com/api/chat.postMessage", {
            method: "post",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.SLACK_TOKEN}`,
            },
            body: JSON.stringify({
              channel: process.env.SLACK_CHANNEL,
              text: "ngrok is not running",
            }),
          });
        }
        console.error(err);
      });
  }, 3000);
};
postURL();
cron.schedule("0 */2 * * *", postURL);
