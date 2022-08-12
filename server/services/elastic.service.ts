import { AppConfig } from "../config/appConfigSelection";
const { Client } = require("@elastic/elasticsearch");
import * as fs from "fs";

export class ElasticSearchService {
  private client = new Client({ node: AppConfig.Config.elasticDbUrl });
  // : new Client({ 
  //     node: AppConfig.Config.elasticDbUrl,
  //     auth: {
  //       username: AppConfig.Config.elsticDbUserName,
  //       password: process.env.ELASTIC_DB_PASSWORD || "changeme"
  //     },
  //     tls: {
  //       ca: fs.readFileSync(AppConfig.Config.elasticCertificatePath),
  //       rejectUnauthorized: false
  //     }
  //   });
  
  private indexValue = "searchindex_v4";

  constructor() {
  }

  public async insertData(searchTerm: any, username: any,sector:any) {
    if (searchTerm.trim() == "") return;
    const response = await this.client.index({
      index: this.indexValue,
      body: {
        query: searchTerm,
        timestamp: new Date(),
        userId: username,
        sector,
        isDeleted: false,
      },
    });
    
    return;
  }

  public async findMostSearchedTerm() {
    const { body } = await this.client.search({
      index: this.indexValue,
      body: {
        aggs: {
          properties: {
            terms: {
              field: "query",
              order: { _count: "desc" },
              size: 11,
            },
          },
        },
      },
    });
    return body;
  }

  public async findUserBySearchCount() {
    const { body } = await this.client.search({
      index: this.indexValue,
      body: {
        aggs: {
          properties: {
            terms: {
              field: "userId",
              order: { _count: "desc" },
              size: 10,
            },
          },
        },
      },
    });
    return body;
  }

  public async fetchSectorByCount() {
    console.log("=========================================== Coming");
    
    const { body } = await this.client.search({
      index: this.indexValue,
      body: {
        aggs: {
          properties: {
            terms: {
              field: "sector",
              order: { _count: "desc" },
              // size: 10
            },
          },
        },
      },
    }).catch((err: any)=> {
      console.log("ERROR = ", err);
    });
    return body;
  }

  public async getTotalSearchCount() {
    const { body } = await this.client.count({
      index: this.indexValue,
    });
    return body;
  }

  public async getUserRecentTags(username: any) {
    const { body } = await this.client.search({
      index: this.indexValue,
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  userId: username,
                },
              },
              // {
              //   match: {
              //     isDeleted: false,
              //   },
              // },
            ],
          },
        },
        sort: [
          {
            timestamp: "desc",
          },
        ],
        size: 7,
      },
    });
    return body?.hits?.hits;
  }

  public async deleteRecentTags(username: any) {
    let res = await this.client.updateByQuery({
      index: this.indexValue,
      body: {
        script: {
          lang: "painless",
          source: "ctx._source['isDeleted'] = true",
        },
        query: {
          match: { userId: username },
        },
      },
    });
    console.log({ res });
   
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
