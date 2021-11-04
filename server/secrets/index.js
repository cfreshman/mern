const fs = require('fs');

const SECRETS_PATH = __dirname + '/files';

async function readSecret(relativePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(SECRETS_PATH + relativePath, (error, content) => {
            if (error) {
                let msg = `error loading secret ${relativePath}`
                console.log(msg, error)
                return reject({ msg, error })
            }
            return resolve(JSON.parse(content))
        })
    })
}
async function writeSecret(relativePath, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(SECRETS_PATH + relativePath, JSON.stringify(content), (err) => {
            if (err) {
                console.error(err)
                return reject(err)
            }
            console.log(`wrote secret ${relativePath}`)
            return resolve(true)
        });
    })
}

module.exports = {
    SECRETS_PATH,
    readSecret,
    writeSecret,
}