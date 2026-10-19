// pm2 process config — keeps the live event's single Next.js process running
// across crashes without anyone needing to notice and manually SSH in and
// restart it. Two booth kiosks share this one process; if it goes down,
// both go down, so auto-restart matters more here than it would for a
// typical multi-instance deployment.
//
// Usage on the server (from the project root):
//   npm install -g pm2          # one-time
//   npm run build
//   pm2 start deploy/ecosystem.config.js
//   pm2 save                    # persist across reboots
//   pm2 startup                 # print + run the OS boot-hook command it gives you
//
// After that: `pm2 status`, `pm2 logs mh-markets-expo`, `pm2 restart mh-markets-expo`.
module.exports = {
  apps: [
    {
      name: "mh-markets-expo",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname + "/..",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_restarts: 20,
      min_uptime: "10s",
      restart_delay: 3000,
      out_file: "logs/out.log",
      error_file: "logs/error.log",
      time: true,
    },
  ],
};
