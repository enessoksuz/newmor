// PM2 Ecosystem Config - YeniMorFikir
// Sunucu: 185.85.189.244

module.exports = {
  apps: [
    {
      // Admin Panel
      name: 'yenimorfikir-admin',
      cwd: '/root/YeniMorFikir/admin-panel',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      error_file: '/root/YeniMorFikir/logs/admin-error.log',
      out_file: '/root/YeniMorFikir/logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
    {
      // Frontend (Public Site)
      name: 'yenimorfikir-frontend',
      cwd: '/root/YeniMorFikir/frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      error_file: '/root/YeniMorFikir/logs/frontend-error.log',
      out_file: '/root/YeniMorFikir/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};

