JScan

用于扫码 JouleVerse 区块链上的交易记录。

## 安装依赖

确保已经安装了Node.js和npm。然后，在项目根目录下运行以下命令以安装依赖：

```bash
npm install
```

或者使用pnpm：

```bash
pnpm install
``` 


## 配置

在项目根目录下创建一个名为`.env`的文件，并添加以下内容：

```
JSCAN_MYSQL_HOST='localhost'
JSCAN_MYSQL_PORT='3306'
JSCAN_MYSQL_DATABASE='jouleverse'
JSCAN_MYSQL_USER='root'
JSCAN_MYSQL_PASSWORD='root'
JSCAN_RPC_URL='https://rpc.jnsdao.com:8503'
```

其中，`JSCAN_RPC_URL`是JouleVerse节点的RPC地址，其他为数据库地址。


## 数据库

在项目根目录下运行以下命令以创建数据库表：

```bash
npm run create-tables
```

或者使用pnpm：

```bash
pnpm run create-tables
```



## 运行

在项目根目录下运行以下命令以启动JScan：

```bash
npm start
```

或者使用pnpm：

```bash
pnpm start
```
