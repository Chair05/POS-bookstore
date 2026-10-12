// PM2 process definition for the LCCB API on a plain VM (no Docker).
//
//   npm install -g pm2
//   pm2 start deploy/ecosystem.config.cjs --env production
//   pm2 save && pm2 startup
//
// Secrets are NOT in this file. Put them in backend/.env (git-ignored) or supply
// them through the shell / a secret manager before starting.

module.exports = {
  apps: [
    {
      name: "lccb-api",
      script: "backend/server.js",
      cwd: __dirname + "/..",

      // One instance per core is usually too many for a DB-backed API; the
      // default of 1 keeps connection-pool pressure predictable. Scale with
      // `pm2 scale` only together with raising MySQL max_connections.
      instances: 1,
      exec_mode: "cluster",

      // Let in-flight requests finish, then stop cleanly so the pool closes.
      kill_timeout: 10000,
      wait_ready: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "20s",

      // Recycle daily to bound any slow leak; logs rotate at 10 MB.
      max_memory_restart: "400M",

      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
};
