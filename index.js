const { Client } = require("./lib/yapople");

const options = {
  hostname: "pop.naver.com",
  port: 995,
  username: "onething2",
  password: "humax2019@!",
  tls: true,
  options: {
    minVersion: "TLSv1",
  },
};

const client = new Client(options);
setInterval(async () => {
  await client.connect();
  await client.disconnect();
}, 1000);
