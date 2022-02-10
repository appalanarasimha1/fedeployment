import { AppConfig } from "../config/appConfigSelection";
const { Client } = require('@elastic/elasticsearch');

export class ElasticSearchService {
  private client = new Client({ node: AppConfig.Config.elasticDbUrl });
  private indexValue = 'searchindex';

  public async insertData(searchTerm: any) {
    const response = await this.client.index({
      index: this.indexValue,
      body: {
        query: searchTerm,
        date: new Date()
      }
    });
    return;
  }

  public async findMostSearchedTerm() {
    const { body } = await this.client.search({
      index: this.indexValue,
      body: {
        "aggs": {
          "properties": {
            "terms": {
              "field": "query", 
              "order": { "_count": "desc" },
              "size": 10
            }
          }
        }
      }
    });
    return body;
  }

  public async getDocCount() {
    const { body } = await this.client.search({
      index: this.indexValue,
      body: {
        "aggs": {
          "properties": {
            "terms": {
              "field": "query", 
              "order": { "_count": "desc" },
              "size": 10
            }
          }
        }
      }
    });
    return body;
  }

  // public async run() {
  //   // Let's start by indexing some data
  //   await this.client.index({
  //     index: 'game-of-thrones',
  //     body: {
  //       character: 'Ned Stark',
  //       quote: 'Winter is coming.'
  //     }
  //   });
  //   await this.client.index({
  //     index: 'game-of-thrones',
  //     body: {
  //       character: 'Daenerys Targaryen',
  //       quote: 'I am the mother of dragons.'
  //     }
  //   });
  //   await this.client.index({
  //     index: 'game-of-thrones',
  //     // here we are forcing an index refresh,
  //     // otherwise we will not get any result
  //     // in the consequent search
  //     refresh: true,
  //     body: {
  //       character: 'Tyrion Lannister',
  //       quote: 'A mind needs books like a sword needs a whetstone.'
  //     }
  //   });
  //   // Let's search!
  //   const { body } = await this.client.search({
  //     index: 'game-of-thrones',
  //     body: {
  //       query: {
  //         match: {
  //           quote: 'winter'
  //         }
  //       }
  //     }
  //   });
  //   console.log(body.hits.hits);
  // }
}