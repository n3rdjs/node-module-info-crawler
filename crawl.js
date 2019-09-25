npms crawler

const request = require('request');
const mysql = require('mysql');
const chalk = require('chalk');

const packages = require('./names.json');
const db_config = {
        host : 'localhost',
        user : 'crawler',
        password : '1q2w3e4r!!',
        database : 'npms'
};

let i = 0;
let queue = 0;

(function crawl() {

        if (i >= packages.length) return;
        while (queue++ <= 10) crawl();

        let id = i++;
        let name = encodeURI(packages[id]);

        request(`https://api.npms.io/v2/package/${name}`, (err, response, body) => {

                console.log(`[*] (${id}) ${name}`);


                let data = JSON.parse(body);

                if (data.code) {
                        console.log(chalk.red(`[!] ${name} => ${data.message}`));
                        queue--; crawl(); return;
                }

                let downloads = parseInt(data.evaluation.popularity.downloadsCount);
                let dependents = parseInt(data.evaluation.popularity.dependentsCount);
                let conn = mysql.createConnection(db_config);

                conn.connect();

                console.log(`${name} => ${dependents} / ${downloads}`);
                conn.query(`insert into packages_info values (${id}, '${name}', ${downloads}, ${dependents})`, (error, result, fields) => {
                        if (error && error.errno != 1062) throw error;
                        if (error && error.errno == 1062) console.log(chalk.red(`[!] ${name} already assigned.`));
                        else console.log(chalk.green(`[+] ${name} assigned!`));
                });

                conn.end();
                queue--;

                crawl();
        });
})();
