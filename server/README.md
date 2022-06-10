# Groundx

To run elasticsearch curl commands in powershel/windows run `remove-item alias:\curl` 
Elastic search version should be `7.16.3`.
npm package for elastic search should be `"@elastic/elasticsearch": "^7.13.0"` .
To upgrade/downgrade to 7.13.0 version `npm i @elastic/elasticsearch@7.13.0` .

When you create a new field or want to update the mapping/index, please follow the steps below:-
1. update `elastic_index.json` file inside `serve/bin` folder.
2. create new index: 
    `curl -X PUT "http://localhost:9200/<new index name>" -H "Content-Type: application/json" -d "@bin/elastic_index.json"`
3. migrate the data from previous index to the new one:
    3.1. update the `elastic_data_migration.json` file inside `server/bin`.
    3.2. `curl -H 'Content-Type: application/json' -X POST "http://localhost:9200/_reindex" -d "@bin/elastic_data_migration.json"`.
4. To check the status `curl 'localhost:9200/_cat/indices?v'`.


When setting up a new environemnt, things you need from dev-ops are:
1. domain URL.
2. mongodb `username` and `password`.
3. mongodb `DB` name.
4. ElasticDB url(this should be running on the same machine as UI server).
