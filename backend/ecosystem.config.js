module.exports = {
    apps: [
        {
            name: 'webrtc-signaling',
            script: 'index.js',
            instances: 'max', // Scale to all available CPU cores
            exec_mode: 'cluster', // Enables horizontal scaling
            env: {
                NODE_ENV: 'development',
                PORT: 5000
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 5000
            },
            // Logs configuration
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: './logs/error.log',
            out_file: './logs/out.log',
            merge_logs: true
        }
    ]
};
