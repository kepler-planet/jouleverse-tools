require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

const dumpSql = fs.readFileSync('./databases/dump.sql', 'utf8');
const sqls = dumpSql.split(';');

// 创建数据库连接
const createConnection = async () => {
  const connection = await mysql.createConnection({
    host: process.env.JSCAN_MYSQL_HOST,
    user: process.env.JSCAN_MYSQL_USER,
    // database: process.env.JSCAN_MYSQL_DATABASE,
    password: process.env.JSCAN_MYSQL_PASSWORD,
  });
  return connection;
};

// 创建数据库
const createDatabase = async (connection, databaseName) => {
  await connection.query(`CREATE DATABASE IF NOT EXISTS ${databaseName} DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci`);
};

// 创建表
const createTable = async (connection, databaseName, tableName, columns) => {
  await connection.query(`USE ${databaseName}`);
  const columnStr = columns.map(column => `${column.name} ${column.type}`).join(', ');
  await connection.query(`CREATE TABLE IF NOT EXISTS ${tableName} (${columnStr})`);
};

const createTableFromSql = async (connection, databaseName, sql) => {
  await connection.query(`USE ${databaseName}`);
  await connection.query(sql);   
}

// 主函数
const main = async () => {
  const connection = await createConnection();
  await createDatabase(connection, process.env.JSCAN_MYSQL_DATABASE);
  for(var i = 0; i < sqls.length; i++) {
    if(sqls[i].indexOf('CREATE TABLE') != -1) {
      await createTableFromSql(connection, process.env.JSCAN_MYSQL_DATABASE, sqls[i]);
    }
  }
  await connection.end();
};

main();

