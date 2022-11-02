module.exports = {
    apps: [{
        name: 'van',
        script: 'source ~/.nvm/nvm.sh  && node ace serve --watch',
    }],

    // Deployment Configuration
    deploy: {
        stg: {
            "user": "root",
            "host": ["go.radlenk.com"],
            "ref": "origin/master",
            "repo": "git@gitlab.com:ilenkrad/vanguard.git",
            "path": "/root/van",
            "post-deploy": "source ~/.nvm/nvm.sh  && npm ci"
        }
    }
};