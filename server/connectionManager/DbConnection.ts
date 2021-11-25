export interface DbConnection {
  /**
   * Function which provide requested db connection instance.
   * @returns connection instance
   */
  getConnection(): any;
}
